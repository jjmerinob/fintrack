import { Component, computed, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxEchartsDirective } from 'ngx-echarts';

import { Card } from '@shared/components/card/card';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { formatAmount, percentChange } from '@shared/utils/currency.util';
import {
  buildCategoryBreakdownOptions,
  buildMonthlyTrendOptions,
  buildSpendingRingOptions,
} from '../../charts/chart-options';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-overview',
  imports: [Card, EmptyState, MatProgressSpinnerModule, NgxEchartsDirective, StatCard],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview {
  protected readonly dashboard = inject(DashboardService);

  protected readonly balance = computed(() => formatAmount(this.dashboard.balance()));
  protected readonly income = computed(() => formatAmount(this.dashboard.income()));
  protected readonly expenses = computed(() => formatAmount(this.dashboard.expenses()));

  protected readonly incomeDelta = computed(() => {
    const previous = this.dashboard.previousMonth();
    return previous ? percentChange(this.dashboard.income(), previous.total_income) : null;
  });

  protected readonly expensesDelta = computed(() => {
    const previous = this.dashboard.previousMonth();
    return previous ? percentChange(this.dashboard.expenses(), previous.total_expense) : null;
  });

  protected readonly spentRatio = this.dashboard.spentRatio;

  protected readonly spentPercent = computed(() => {
    const ratio = this.spentRatio();
    return ratio === null ? '—' : `${Math.round(ratio * 100)}%`;
  });

  protected readonly spentCaption = computed(() => {
    const ratio = this.spentRatio();
    if (ratio === null) {
      return 'No income recorded this month';
    }
    return ratio >= 1 ? 'You spent more than you earned' : 'of this month’s income spent';
  });

  /** True once the RPCs have answered but every month came back empty. */
  protected readonly isEmpty = computed(
    () =>
      !this.dashboard.isLoading() &&
      this.dashboard
        .months()
        .every((month) => month.total_income === 0 && month.total_expense === 0),
  );

  protected readonly trendOptions = computed(() =>
    buildMonthlyTrendOptions(this.dashboard.months(), formatAmount),
  );

  protected readonly breakdownOptions = computed(() =>
    buildCategoryBreakdownOptions(this.dashboard.categoryBreakdown(), formatAmount),
  );

  protected readonly ringOptions = computed(() => buildSpendingRingOptions(this.spentRatio() ?? 0));
}
