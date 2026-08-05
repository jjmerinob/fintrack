import { computed, inject, resource, Service } from '@angular/core';

import { AuthService } from '@core/auth/auth.service';
import { CategoryBreakdown, MonthlySummary } from '@core/models/dashboard.model';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { toDateString } from '@shared/utils/date.util';

/** How many months the trend chart covers, including the current one. */
const TREND_MONTHS = 6;

@Service()
export class DashboardService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly auth = inject(AuthService);

  // Every aggregate is computed by Postgres (see supabase/dashboard-rpcs.sql):
  // the browser never sums transactions itself. Returning `undefined` while
  // signed out leaves the resources idle instead of querying without a user.
  private readonly monthlyResource = resource({
    params: () => (this.auth.user()?.id ? { months: TREND_MONTHS } : undefined),
    loader: async ({ params }) => {
      const { data, error } = await this.supabase.rpc('dashboard_monthly_summary', params);
      if (error) {
        throw error;
      }
      return data;
    },
  });

  private readonly breakdownResource = resource({
    params: () => (this.auth.user()?.id ? currentMonthRange() : undefined),
    loader: async ({ params }) => {
      const { data, error } = await this.supabase.rpc('dashboard_category_breakdown', params);
      if (error) {
        throw error;
      }
      return data;
    },
  });

  readonly months = computed<MonthlySummary[]>(() => this.monthlyResource.value() ?? []);
  readonly categoryBreakdown = computed<CategoryBreakdown[]>(
    () => this.breakdownResource.value() ?? [],
  );

  readonly isLoading = computed(
    () => this.monthlyResource.isLoading() || this.breakdownResource.isLoading(),
  );
  readonly error = computed(() => this.monthlyResource.error() ?? this.breakdownResource.error());

  /** The month being reported on: the last row the RPC returned. */
  readonly currentMonth = computed<MonthlySummary | null>(() => this.months().at(-1) ?? null);

  /** The month before it, used as the baseline for the deltas on the stat cards. */
  readonly previousMonth = computed<MonthlySummary | null>(() => this.months().at(-2) ?? null);

  readonly income = computed(() => this.currentMonth()?.total_income ?? 0);
  readonly expenses = computed(() => this.currentMonth()?.total_expense ?? 0);
  readonly balance = computed(() => this.income() - this.expenses());

  /**
   * Share of this month's income already spent. `null` with no income recorded —
   * there is no ratio to show, which is not the same as having spent 0%.
   */
  readonly spentRatio = computed(() => {
    const income = this.income();
    return income > 0 ? this.expenses() / income : null;
  });

  reload(): void {
    this.monthlyResource.reload();
    this.breakdownResource.reload();
  }
}

/** First and last day of the current month, as the RPC's `date` arguments. */
function currentMonthRange(): { period_start: string; period_end: string } {
  const now = new Date();
  return {
    period_start: toDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    period_end: toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}
