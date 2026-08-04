import { Directive, input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';

import { CategoryBreakdown, MonthlySummary } from '../../../../core/models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { Overview } from './overview';

/**
 * Stands in for the real ECharts directive: jsdom has no canvas, so letting
 * ECharts initialise would throw. The chart options themselves are covered by
 * `chart-options.spec.ts`; this file is about what the page renders around them.
 */
// eslint-disable-next-line @angular-eslint/directive-selector -- must match the real directive's selector
@Directive({ selector: 'echarts, [echarts]' })
class EchartsStub {
  readonly options = input<unknown>();
}

interface DashboardStub {
  months: WritableSignal<MonthlySummary[]>;
  categoryBreakdown: WritableSignal<CategoryBreakdown[]>;
  isLoading: WritableSignal<boolean>;
  error: WritableSignal<unknown>;
  currentMonth: WritableSignal<MonthlySummary | null>;
  previousMonth: WritableSignal<MonthlySummary | null>;
  income: WritableSignal<number>;
  expenses: WritableSignal<number>;
  balance: WritableSignal<number>;
  spentRatio: WritableSignal<number | null>;
}

describe('Overview', () => {
  let fixture: ComponentFixture<Overview>;
  let dashboard: DashboardStub;

  const february: MonthlySummary = {
    month: '2026-02-01',
    total_income: 2000,
    total_expense: 1500,
  };
  const march: MonthlySummary = { month: '2026-03-01', total_income: 2400, total_expense: 1800 };

  async function setUp(overrides: Partial<Record<keyof DashboardStub, unknown>> = {}) {
    dashboard = {
      months: signal<MonthlySummary[]>([february, march]),
      categoryBreakdown: signal<CategoryBreakdown[]>([
        { category_id: 'cat-rent', category_name: 'Rent', total: 900 },
      ]),
      isLoading: signal(false),
      error: signal<unknown>(undefined),
      currentMonth: signal<MonthlySummary | null>(march),
      previousMonth: signal<MonthlySummary | null>(february),
      income: signal(2400),
      expenses: signal(1800),
      balance: signal(600),
      spentRatio: signal<number | null>(0.75),
    };
    for (const [key, value] of Object.entries(overrides)) {
      dashboard[key as keyof DashboardStub].set(value as never);
    }

    await TestBed.configureTestingModule({
      imports: [Overview],
      providers: [{ provide: DashboardService, useValue: dashboard }],
    })
      .overrideComponent(Overview, {
        remove: { imports: [NgxEchartsDirective] },
        add: { imports: [EchartsStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Overview);
    await fixture.whenStable();
  }

  function text(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  it('should show a spinner while the aggregates are loading', async () => {
    await setUp({ isLoading: true });

    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-stat-card')).toBeNull();
  });

  it('should show an error state instead of empty figures when an RPC fails', async () => {
    await setUp({ error: new Error('RPC missing') });

    expect(text()).toContain('Couldn’t load your dashboard');
    expect(fixture.nativeElement.querySelector('app-stat-card')).toBeNull();
  });

  it('should invite the user to record transactions when every month is empty', async () => {
    await setUp({
      months: [{ month: '2026-03-01', total_income: 0, total_expense: 0 }],
      categoryBreakdown: [],
    });

    expect(text()).toContain('Nothing to chart yet');
  });

  it('should format the headline figures with the euro symbol on the right', async () => {
    await setUp();

    expect(text()).toContain('600.00 €');
    expect(text()).toContain('2,400.00 €');
    expect(text()).toContain('1,800.00 €');
  });

  it('should compare each figure against the previous month', async () => {
    await setUp();

    // Income 2000 -> 2400 is +20%, expenses 1500 -> 1800 is +20% too.
    expect(text()).toContain('↑ 20.0%');
  });

  it('should drop the deltas when there is no earlier month to compare with', async () => {
    await setUp({ months: [march], previousMonth: null });

    expect(text()).not.toContain('vs last month');
  });

  it('should show the spending rate as a rounded percentage', async () => {
    await setUp();

    expect(text()).toContain('75%');
    expect(text()).toContain('of this month’s income spent');
  });

  it('should call out spending that outran income', async () => {
    await setUp({ spentRatio: 1.3 });

    expect(text()).toContain('130%');
    expect(text()).toContain('You spent more than you earned');
  });

  it('should not claim a spending rate when there was no income', async () => {
    await setUp({ spentRatio: null });

    expect(text()).toContain('No income recorded this month');
  });

  it('should render all three charts once there is data', async () => {
    await setUp();

    expect(fixture.nativeElement.querySelectorAll('[echarts]')).toHaveLength(3);
  });

  it('should replace the category chart with a note when nothing was spent', async () => {
    await setUp({ categoryBreakdown: [] });

    expect(text()).toContain('No expenses recorded this month');
    expect(fixture.nativeElement.querySelectorAll('[echarts]')).toHaveLength(2);
  });
});
