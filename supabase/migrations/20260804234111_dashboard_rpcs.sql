-- Dashboard aggregates.
--
-- The dashboard never sums transactions in the browser: both figures and charts
-- read from these two functions, so the aggregation happens in Postgres.
--
-- Both are SECURITY DEFINER, which means they run with the owner's rights and
-- bypass row-level security. That is safe only because each one filters on
-- auth.uid() itself — that filter is what replaces RLS here, so it must never be
-- removed. The grants at the bottom keep them callable by signed-in users only.
--
-- After changing this file, regenerate the typed client:
--   npx supabase gen types typescript --linked > src/app/core/models/database.types.ts

-- Income and expense totals per month, oldest first, with empty months filled in
-- as zeros so the chart's x-axis has no gaps.
create or replace function public.dashboard_monthly_summary(months integer default 6)
returns table (
  month date,
  total_income numeric,
  total_expense numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with series as (
    select generate_series(
      date_trunc('month', current_date)::date - ((months - 1) || ' months')::interval,
      date_trunc('month', current_date)::date,
      '1 month'::interval
    )::date as month
  )
  select
    s.month,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric as total_income,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric as total_expense
  from series s
  left join public.transactions t
    on date_trunc('month', t.transaction_date)::date = s.month
   and t.user_id = auth.uid()
  group by s.month
  order by s.month;
$$;

-- Expense totals per category for a date range, largest first. Only expenses:
-- the breakdown answers "where did my money go".
create or replace function public.dashboard_category_breakdown(
  period_start date,
  period_end date
)
returns table (
  category_id uuid,
  category_name text,
  total numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as category_id,
    c.name as category_name,
    sum(t.amount)::numeric as total
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.user_id = auth.uid()
    and t.type = 'expense'
    and t.transaction_date between period_start and period_end
  group by c.id, c.name
  order by total desc;
$$;

-- Callable by signed-in users only; the functions scope their own rows via auth.uid().
revoke all on function public.dashboard_monthly_summary(integer) from public, anon;
revoke all on function public.dashboard_category_breakdown(date, date) from public, anon;
grant execute on function public.dashboard_monthly_summary(integer) to authenticated;
grant execute on function public.dashboard_category_breakdown(date, date) to authenticated;
