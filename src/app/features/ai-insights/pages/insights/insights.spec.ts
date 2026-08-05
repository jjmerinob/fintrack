import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Insights as InsightsContent } from '../../../../core/models/insight.model';
import { InsightsService } from '../../services/insights.service';
import { Insights } from './insights';

describe('Insights page', () => {
  let fixture: ComponentFixture<Insights>;
  let insights: WritableSignal<InsightsContent | null>;
  let loading: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let generatedAt: WritableSignal<string | null>;
  const load = vi.fn();

  const content: InsightsContent = {
    summary: 'You are on track this month.',
    observations: [
      { title: 'Transport is up', detail: 'Three times your usual.', tone: 'warning' },
      { title: 'Savings held', detail: 'You kept 25% of your income.', tone: 'positive' },
    ],
    tips: ['Review your transport spending.'],
  };

  async function setUp(
    state: {
      insights?: InsightsContent | null;
      loading?: boolean;
      error?: string | null;
      generatedAt?: string | null;
    } = {},
  ) {
    insights = signal<InsightsContent | null>(
      state.insights === undefined ? content : state.insights,
    );
    loading = signal(state.loading ?? false);
    error = signal<string | null>(state.error ?? null);
    generatedAt = signal<string | null>(state.generatedAt ?? '2026-08-05T10:00:00Z');

    await TestBed.configureTestingModule({
      imports: [Insights],
      providers: [
        {
          provide: InsightsService,
          useValue: {
            insights,
            loading,
            error,
            generatedAt,
            hasInsights: () => insights() !== null,
            load,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Insights);
    await fixture.whenStable();
  }

  function text(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    load.mockResolvedValue(undefined);
  });

  it('should ask for the analysis on open, without forcing a regeneration', async () => {
    await setUp();

    // The function answers from cache when the month already has one, so this
    // costs nothing; passing `true` here would spend an API call every visit.
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith();
  });

  it('should render the summary, the observations and the tips', async () => {
    await setUp();

    expect(text()).toContain('You are on track this month.');
    expect(text()).toContain('Transport is up');
    expect(text()).toContain('Three times your usual.');
    expect(text()).toContain('Review your transport spending.');
  });

  it('should say the text was machine-written and is not advice', async () => {
    await setUp();

    expect(text()).toContain('not financial advice');
  });

  it('should show a spinner on the first load only', async () => {
    await setUp({ insights: null, loading: true });

    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('should offer to retry when nothing could be loaded', async () => {
    await setUp({ insights: null, error: 'Not enough activity this month to analyse.' });

    expect(text()).toContain('Not enough activity this month to analyse.');
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
  });

  it('should keep the analysis on screen and demote the error to a banner', async () => {
    await setUp({ error: 'Please wait 4 more minutes.' });

    // A rate-limited refresh must not wipe out a perfectly good analysis.
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Please wait 4 more minutes.',
    );
    expect(text()).toContain('You are on track this month.');
  });

  it('should render each observation as its own card', async () => {
    await setUp();

    expect(fixture.nativeElement.querySelectorAll('app-card').length).toBeGreaterThanOrEqual(3);
  });

  it('should tint each observation badge by tone', async () => {
    await setUp();
    const badges = fixture.nativeElement.querySelectorAll('.tone-badge');

    // Both the static class and the bound tone class must survive.
    expect(badges[0].classList).toContain('tone-warning');
    expect(badges[1].classList).toContain('tone-positive');
  });

  it('should show a spinner inside the regenerate button while it works', async () => {
    await setUp({ loading: true });

    const header = fixture.nativeElement.querySelector('header');
    expect(header.querySelector('mat-spinner')).not.toBeNull();
    expect(header.querySelector('button').disabled).toBe(true);
  });

  it('should keep the previous analysis visible while regenerating', async () => {
    await setUp({ loading: true });

    // Dimmed rather than replaced by a spinner: the page reads as refreshing.
    expect(text()).toContain('You are on track this month.');
    expect(fixture.nativeElement.querySelector('.refreshing')).not.toBeNull();
  });

  it('should force a regeneration only from the button', async () => {
    await setUp();
    load.mockClear();

    const regenerate = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Regenerate'),
    );
    regenerate.click();

    expect(load).toHaveBeenCalledWith(true);
  });

  it('should not offer regeneration before there is anything to regenerate', async () => {
    await setUp({ insights: null });

    const regenerate = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Regenerate'),
    );
    expect(regenerate).toBeUndefined();
  });
});
