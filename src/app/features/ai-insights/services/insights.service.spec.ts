import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';
import { InsightsService } from './insights.service';

describe('InsightsService', () => {
  const url = `${environment.supabaseUrl}/functions/v1/generate-insights`;

  const content = {
    summary: 'You are on track this month.',
    observations: [
      { title: 'Transport is up', detail: 'Three times your usual.', tone: 'warning' },
    ],
    tips: ['Review your transport spending.'],
  };

  let service: InsightsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InsightsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should ask the Edge Function rather than any AI provider directly', async () => {
    const pending = service.load();

    // The API key lives only on the server; the browser must never talk to the
    // model provider.
    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    request.flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await pending;
  });

  it('should not ask for a regeneration by default', async () => {
    const pending = service.load();

    const request = http.expectOne(url);
    expect(request.request.body).toEqual({ refresh: false });
    request.flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await pending;
  });

  it('should ask for a regeneration when told to', async () => {
    const pending = service.load(true);

    const request = http.expectOne(url);
    expect(request.request.body).toEqual({ refresh: true });
    request.flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: false });
    await pending;
  });

  it('should expose the analysis and when it was generated', async () => {
    const pending = service.load();
    http.expectOne(url).flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await pending;

    expect(service.insights()).toEqual(content);
    expect(service.generatedAt()).toBe('2026-08-05T10:00:00Z');
    expect(service.hasInsights()).toBe(true);
    expect(service.error()).toBeNull();
  });

  it('should report loading while the request is in flight', async () => {
    const pending = service.load();
    expect(service.loading()).toBe(true);

    http.expectOne(url).flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await pending;

    expect(service.loading()).toBe(false);
  });

  it('should refuse a malformed analysis instead of rendering it', async () => {
    const pending = service.load();
    http.expectOne(url).flush({ content: { summary: 'oops' }, generatedAt: null, cached: false });
    await pending;

    expect(service.hasInsights()).toBe(false);
    expect(service.error()).toContain('unexpected format');
  });

  it('should surface the message the function sent', async () => {
    const pending = service.load();
    http
      .expectOne(url)
      .flush(
        { error: 'Not enough activity this month to analyse.' },
        { status: 422, statusText: '' },
      );
    await pending;

    expect(service.error()).toBe('Not enough activity this month to analyse.');
    expect(service.hasInsights()).toBe(false);
  });

  it('should keep showing the previous analysis when a refresh is rate-limited', async () => {
    const pending = service.load(true);
    http.expectOne(url).flush(
      {
        error: 'Please wait 4 more minutes.',
        content,
        generatedAt: '2026-08-05T10:00:00Z',
      },
      { status: 429, statusText: '' },
    );
    await pending;

    // A stale analysis is more useful than an empty page.
    expect(service.error()).toBe('Please wait 4 more minutes.');
    expect(service.insights()).toEqual(content);
  });

  it('should not ask again for an analysis it already holds', async () => {
    const first = service.load();
    http.expectOne(url).flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await first;

    // Returning to the page must not re-fetch what is already in memory.
    // `http.verify()` in afterEach fails if a second request was made.
    await service.load();

    expect(service.insights()).toEqual(content);
  });

  it('should still go out when a regeneration is asked for', async () => {
    const first = service.load();
    http.expectOne(url).flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await first;

    const second = service.load(true);
    const request = http.expectOne(url);
    expect(request.request.body).toEqual({ refresh: true });
    request.flush({ content, generatedAt: '2026-08-05T11:00:00Z', cached: false });
    await second;

    expect(service.generatedAt()).toBe('2026-08-05T11:00:00Z');
  });

  it('should retry after a failure rather than treating it as loaded', async () => {
    const failed = service.load();
    http.expectOne(url).flush({ error: 'Nope' }, { status: 500, statusText: '' });
    await failed;

    // Nothing was stored, so the guard must not block a second attempt.
    const retried = service.load();
    http.expectOne(url).flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await retried;

    expect(service.hasInsights()).toBe(true);
  });

  it('should explain a network failure in plain terms', async () => {
    const pending = service.load();
    http.expectOne(url).error(new ProgressEvent('error'), { status: 0, statusText: '' });
    await pending;

    expect(service.error()).toContain('Could not reach');
  });

  it('should clear a previous error once a later load succeeds', async () => {
    const failed = service.load();
    http.expectOne(url).flush({ error: 'Nope' }, { status: 500, statusText: '' });
    await failed;
    expect(service.error()).not.toBeNull();

    const pending = service.load();
    http.expectOne(url).flush({ content, generatedAt: '2026-08-05T10:00:00Z', cached: true });
    await pending;

    expect(service.error()).toBeNull();
    expect(service.hasInsights()).toBe(true);
  });
});
