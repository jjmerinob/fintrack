-- Everything the insights feature needs, in one call.
--
-- This is where the actual analysis lives. The language model that consumes this
-- payload only turns it into prose: it is never asked to calculate anything, and
-- never to format anything either — every figure travels with a pre-formatted
-- twin for it to copy verbatim. In a finance app a hallucinated amount would be
-- a serious defect, not a typo.
--
-- Like the dashboard functions, this is SECURITY DEFINER and filters on
-- auth.uid() itself — that filter is what replaces RLS, so it must never be
-- removed.
--
-- Two rules here exist because the first version got them wrong, and it only
-- showed once real output was read:
--
--   * The projection is compared against LAST month's income, never against
--     income-to-date. On the 5th of a month the salary has usually not arrived,
--     so the old comparison made every month look like a disaster.
--   * Category baselines divide by the months that actually had activity, not by
--     a fixed six. Dividing a single month of history by six produced baselines
--     six times too low and deviations in the hundreds of percent.

-- Matches the app's own formatting (`shared/utils/currency.util.ts`): symbol on
-- the right, two decimals, grouped thousands.
create or replace function public.format_eur(value numeric)
returns text
language sql
immutable
as $$
  select to_char(coalesce(value, 0), 'FM999,999,990.00') || ' €';
$$;

create or replace function public.dashboard_insight_inputs(baseline_months integer default 6)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with settings as (
    select
      -- Below this many days a straight-line projection is noise, not a heading.
      5 as min_days_for_projection,
      -- And below this many observed months, a "baseline" is one data point
      -- wearing a percentage sign.
      2 as min_baseline_months
  ),
  bounds as (
    select
      date_trunc('month', current_date)::date as month_start,
      (date_trunc('month', current_date) + interval '1 month - 1 day')::date as month_end,
      (date_trunc('month', current_date) - interval '1 month')::date as prev_start,
      (date_trunc('month', current_date) - interval '1 day')::date as prev_end,
      -- The baseline excludes the current month: comparing a month against an
      -- average that already contains it would flatten the signal.
      (date_trunc('month', current_date) - (baseline_months || ' months')::interval)::date
        as baseline_start,
      (current_date - date_trunc('month', current_date)::date + 1) as days_elapsed,
      ((date_trunc('month', current_date) + interval '1 month - 1 day')::date
        - date_trunc('month', current_date)::date + 1) as days_total
  ),
  current_totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as income,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as expense
    from transactions, bounds
    where user_id = auth.uid()
      and transaction_date between bounds.month_start and bounds.month_end
  ),
  previous_totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as income,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as expense
    from transactions, bounds
    where user_id = auth.uid()
      and transaction_date between bounds.prev_start and bounds.prev_end
  ),
  category_baseline as (
    select
      c.name,
      coalesce(sum(t.amount) filter (
        where t.transaction_date between bounds.month_start and bounds.month_end
      ), 0)::numeric as total,
      coalesce(sum(t.amount) filter (
        where t.transaction_date >= bounds.baseline_start
          and t.transaction_date < bounds.month_start
      ), 0)::numeric as baseline_total,
      -- Months this category actually saw spending, not months in the window.
      count(distinct date_trunc('month', t.transaction_date)) filter (
        where t.transaction_date >= bounds.baseline_start
          and t.transaction_date < bounds.month_start
      ) as baseline_months_observed
    from categories c
    cross join bounds
    left join transactions t
      on t.category_id = c.id
     and t.user_id = auth.uid()
     and t.type = 'expense'
    where c.type = 'expense'
      and (c.user_id is null or c.user_id = auth.uid())
    group by c.id, c.name
  ),
  category_stats as (
    select
      cb.name,
      cb.total,
      cb.baseline_months_observed,
      case
        when cb.baseline_months_observed > 0
          then cb.baseline_total / cb.baseline_months_observed
        else null
      end as baseline_avg
    from category_baseline cb
  ),
  projection as (
    select
      case
        when bounds.days_elapsed >= settings.min_days_for_projection
          then round(current_totals.expense / bounds.days_elapsed * bounds.days_total, 2)
        else null
      end as projected_expense
    from bounds, settings, current_totals
  )
  select jsonb_build_object(
    'period', jsonb_build_object(
      'start', bounds.month_start,
      'end', bounds.month_end,
      'days_elapsed', bounds.days_elapsed,
      'days_total', bounds.days_total
    ),
    'totals', jsonb_build_object(
      'income', current_totals.income,
      'income_formatted', format_eur(current_totals.income),
      'expense', current_totals.expense,
      'expense_formatted', format_eur(current_totals.expense),
      'balance', current_totals.income - current_totals.expense,
      'balance_formatted', format_eur(current_totals.income - current_totals.expense)
    ),
    'previous_month', jsonb_build_object(
      'income', previous_totals.income,
      'income_formatted', format_eur(previous_totals.income),
      'expense', previous_totals.expense,
      'expense_formatted', format_eur(previous_totals.expense)
    ),
    'projection', jsonb_build_object(
      'projected_expense', projection.projected_expense,
      'projected_expense_formatted', case
        when projection.projected_expense is null then null
        else format_eur(projection.projected_expense)
      end,
      'reference_income', previous_totals.income,
      'reference_income_formatted', format_eur(previous_totals.income),
      'reference_income_note', 'last month''s income, used because this month''s may not have arrived yet'
    ),
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', cs.name,
          'total', cs.total,
          'total_formatted', format_eur(cs.total),
          'baseline_avg', round(cs.baseline_avg, 2),
          'baseline_avg_formatted', case
            when cs.baseline_avg is null then null
            else format_eur(cs.baseline_avg)
          end,
          'baseline_months_observed', cs.baseline_months_observed,
          'deviation_pct', case
            when cs.baseline_months_observed >= settings.min_baseline_months
             and cs.baseline_avg > 0
              then round((cs.total - cs.baseline_avg) / cs.baseline_avg * 100)
            else null
          end
        )
        order by cs.total desc
      )
      from category_stats cs, settings
      where cs.total > 0 or cs.baseline_avg > 0
    ), '[]'::jsonb)
  )
  from bounds, current_totals, previous_totals, projection;
$$;

revoke all on function public.dashboard_insight_inputs(integer) from public, anon;
grant execute on function public.dashboard_insight_inputs(integer) to authenticated;

-- One analysis per user per month. This is also what the Edge Function's upsert
-- conflicts on, so without it a regeneration would insert a duplicate row
-- instead of replacing the old one.
create unique index if not exists ai_insights_user_period_idx
  on public.ai_insights (user_id, period_start);

-- The Edge Function talks to Postgres as the signed-in user (never with the
-- service_role key), so without these policies its cache lookup silently returns
-- nothing and its write is rejected — which means paying for a fresh analysis on
-- every single page load.
--
-- An upsert needs both insert and update: the first generation of a month
-- inserts, a regeneration updates.
alter table public.ai_insights enable row level security;

drop policy if exists "Users read their own insights" on public.ai_insights;
create policy "Users read their own insights"
  on public.ai_insights for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert their own insights" on public.ai_insights;
create policy "Users insert their own insights"
  on public.ai_insights for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own insights" on public.ai_insights;
create policy "Users update their own insights"
  on public.ai_insights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
