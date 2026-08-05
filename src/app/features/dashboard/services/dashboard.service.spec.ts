import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '@core/auth/auth.service';
import { MonthlySummary } from '@core/models/dashboard.model';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const months: MonthlySummary[] = [
    { month: '2026-02-01', total_income: 2000, total_expense: 1000 },
    { month: '2026-03-01', total_income: 2400, total_expense: 1800 },
  ];

  /** Answers each RPC by name, so both resources can load from one mock. */
  function createService(
    responses: Record<string, unknown> = {},
    userId: string | null = 'user-1',
  ) {
    const rpc = vi.fn((name: string) =>
      Promise.resolve({ data: responses[name] ?? [], error: null }),
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseClientService, useValue: { client: { rpc } } },
        { provide: AuthService, useValue: { user: signal(userId ? { id: userId } : null) } },
      ],
    });

    return { service: TestBed.inject(DashboardService), rpc };
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
  }

  it('should aggregate through Postgres rather than summing transactions itself', async () => {
    const { rpc } = createService();
    await settle();

    // The browser must never pull raw rows to add them up — the whole point of
    // the RPCs. Only the two aggregate functions may be called.
    expect(rpc.mock.calls.map(([name]) => name).sort()).toEqual([
      'dashboard_category_breakdown',
      'dashboard_monthly_summary',
    ]);
  });

  it('should request the trend for the last six months', async () => {
    const { rpc } = createService();
    await settle();

    expect(rpc).toHaveBeenCalledWith('dashboard_monthly_summary', { months: 6 });
  });

  it('should scope the category breakdown to the current calendar month', async () => {
    // `shouldAdvanceTime` keeps real timers running, so `settle()` still resolves.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 2, 15));
    const { rpc } = createService();
    await settle();

    expect(rpc).toHaveBeenCalledWith('dashboard_category_breakdown', {
      period_start: '2026-03-01',
      period_end: '2026-03-31',
    });
  });

  it('should not query while signed out', async () => {
    const { rpc } = createService({}, null);
    await settle();

    expect(rpc).not.toHaveBeenCalled();
  });

  it('should report the latest month as the current one and the one before as the baseline', async () => {
    const { service } = createService({ dashboard_monthly_summary: months });
    await settle();

    expect(service.currentMonth()).toEqual(months[1]);
    expect(service.previousMonth()).toEqual(months[0]);
  });

  it('should derive the balance from the current month', async () => {
    const { service } = createService({ dashboard_monthly_summary: months });
    await settle();

    expect(service.income()).toBe(2400);
    expect(service.expenses()).toBe(1800);
    expect(service.balance()).toBe(600);
  });

  it('should express the spending rate as a share of income', async () => {
    const { service } = createService({ dashboard_monthly_summary: months });
    await settle();

    expect(service.spentRatio()).toBeCloseTo(0.75);
  });

  it('should report no spending rate when there was no income to spend', async () => {
    const { service } = createService({
      dashboard_monthly_summary: [{ month: '2026-03-01', total_income: 0, total_expense: 300 }],
    });
    await settle();

    // Not 0, and not Infinity: without income the ratio has no meaning.
    expect(service.spentRatio()).toBeNull();
  });

  it('should surface a failing RPC instead of showing empty figures', async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: new Error('RPC missing') }));
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseClientService, useValue: { client: { rpc } } },
        { provide: AuthService, useValue: { user: signal({ id: 'user-1' }) } },
      ],
    });
    const service = TestBed.inject(DashboardService);
    await settle();

    expect(service.error()).toBeDefined();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
