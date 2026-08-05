import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { Insights, InsightsResponse, parseInsights } from '@core/models/insight.model';

const FUNCTION_URL = `${environment.supabaseUrl}/functions/v1/generate-insights`;

@Service()
export class InsightsService {
  private readonly http = inject(HttpClient);

  private readonly _insights = signal<Insights | null>(null);
  private readonly _generatedAt = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly insights = this._insights.asReadonly();
  readonly generatedAt = this._generatedAt.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasInsights = computed(() => this._insights() !== null);

  /**
   * Asks the Edge Function for this month's analysis.
   *
   * Safe to call on page load: the function answers from the `ai_insights` cache
   * whenever a row exists for the current month, and only reaches the model the
   * first time in a given month. That is what keeps usage at roughly one API
   * call per user per month.
   *
   * @param refresh regenerate even when a cached analysis exists — the only path
   *                that always costs a call, so it stays behind a button
   */
  async load(refresh = false): Promise<void> {
    // The service outlives the page, so returning to it should not ask again for
    // something already in memory. Only an explicit refresh goes back out.
    if (!refresh && this._insights() !== null) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      // The JWT is attached by `authInterceptor`, which scopes it to the
      // Supabase host so the token never leaks to another origin.
      const response = await firstValueFrom(
        this.http.post<InsightsResponse>(FUNCTION_URL, { refresh }),
      );

      const parsed = parseInsights(response?.content);
      if (!parsed) {
        this._error.set('The analysis came back in an unexpected format.');
        return;
      }

      this._insights.set(parsed);
      this._generatedAt.set(response.generatedAt ?? null);
    } catch (error) {
      this._error.set(messageFor(error));

      // A rate-limited refresh still carries the previous analysis, which is
      // more useful to show than nothing.
      if (error instanceof HttpErrorResponse) {
        const fallback = parseInsights(error.error?.content);
        if (fallback) {
          this._insights.set(fallback);
          this._generatedAt.set(error.error?.generatedAt ?? null);
        }
      }
    } finally {
      this._loading.set(false);
    }
  }
}

function messageFor(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }
    if (error.status === 0) {
      return 'Could not reach the insights service. Check your connection.';
    }
  }
  return 'Something went wrong. Please try again.';
}
