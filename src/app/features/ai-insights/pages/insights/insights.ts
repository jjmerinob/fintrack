import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Card } from '../../../../shared/components/card/card';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { InsightsService } from '../../services/insights.service';

@Component({
  selector: 'app-insights',
  imports: [Card, DatePipe, EmptyState, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './insights.html',
  styleUrl: './insights.scss',
})
export class Insights {
  protected readonly insightsService = inject(InsightsService);

  /** Only a total failure earns the error state; a stale analysis still shows. */
  protected readonly showErrorState = computed(
    () => !!this.insightsService.error() && !this.insightsService.hasInsights(),
  );

  /** A failure while something is already on screen becomes a banner instead. */
  protected readonly showErrorBanner = computed(
    () => !!this.insightsService.error() && this.insightsService.hasInsights(),
  );

  constructor() {
    // Cheap: the function serves the cached row when this month already has one,
    // and only generates the first time in a month.
    void this.insightsService.load();
  }

  protected regenerate(): void {
    void this.insightsService.load(true);
  }

  protected retry(): void {
    void this.insightsService.load();
  }

  protected iconFor(tone: string): string {
    switch (tone) {
      case 'positive':
        return 'trending_up';
      case 'warning':
        return 'warning_amber';
      default:
        return 'insights';
    }
  }

  /** Tint for the observation badge. Classes live in the component stylesheet
   *  rather than inline, so the three tones stay side by side and readable. */
  protected toneClass(tone: string): string {
    switch (tone) {
      case 'positive':
        return 'tone-positive';
      case 'warning':
        return 'tone-warning';
      default:
        return 'tone-neutral';
    }
  }
}
