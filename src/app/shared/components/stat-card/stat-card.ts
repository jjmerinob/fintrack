import { Component, computed, input } from '@angular/core';

/**
 * A headline figure: label, value, and an optional change against a baseline.
 *
 * Presentation only — `value` arrives already formatted, so the card carries no
 * currency or business logic.
 */
@Component({
  selector: 'app-stat-card',
  imports: [],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();

  /** Percent change against the baseline; `null` hides the row entirely. */
  readonly delta = input<number | null>(null);
  readonly comparisonLabel = input('vs last month');

  /**
   * Whether a rise is a good thing. True for income, false for spending — the
   * same `+12%` is encouraging on one card and a warning on the other.
   */
  readonly positiveIsGood = input(true);

  /** Renders the value at hero size. At most one card per view should set it. */
  readonly emphasis = input(false);

  protected readonly hasDelta = computed(() => this.delta() !== null);
  protected readonly isRising = computed(() => (this.delta() ?? 0) > 0);
  protected readonly isFlat = computed(() => this.delta() === 0);

  protected readonly isFavorable = computed(
    () => this.isRising() === this.positiveIsGood() && !this.isFlat(),
  );

  /** Always shown unsigned: the arrow carries the direction. */
  protected readonly formattedDelta = computed(() => {
    const delta = this.delta();
    return delta === null ? '' : `${Math.abs(delta).toFixed(1)}%`;
  });
}
