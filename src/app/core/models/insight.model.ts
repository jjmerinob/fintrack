/** How strongly an observation should read. */
export type InsightTone = 'positive' | 'neutral' | 'warning';

export interface InsightObservation {
  readonly title: string;
  readonly detail: string;
  readonly tone: InsightTone;
}

/** The monthly analysis rendered by the AI Insights page. */
export interface Insights {
  readonly summary: string;
  readonly observations: InsightObservation[];
  readonly tips: string[];
}

/** What the `generate-insights` Edge Function returns. */
export interface InsightsResponse {
  readonly content: Insights;
  readonly generatedAt: string;
  readonly cached: boolean;
}

const TONES: InsightTone[] = ['positive', 'neutral', 'warning'];

function isTone(value: unknown): value is InsightTone {
  return typeof value === 'string' && (TONES as string[]).includes(value);
}

function isObservation(value: unknown): value is InsightObservation {
  const observation = value as Partial<InsightObservation> | null;
  return (
    !!observation &&
    typeof observation.title === 'string' &&
    typeof observation.detail === 'string' &&
    isTone(observation.tone)
  );
}

/**
 * Narrows an untrusted payload into `Insights`, or returns `null`.
 *
 * The Edge Function validates the model's output too. Doing it again here is
 * deliberate rather than redundant: this text ultimately comes from a language
 * model, and the page should not be able to render a half-formed object just
 * because something upstream changed. It is also why `tone` is checked against
 * a fixed list — an unexpected value would otherwise reach a CSS class binding.
 */
export function parseInsights(value: unknown): Insights | null {
  const candidate = value as Partial<Insights> | null;

  if (
    !candidate ||
    typeof candidate.summary !== 'string' ||
    !Array.isArray(candidate.observations) ||
    !Array.isArray(candidate.tips)
  ) {
    return null;
  }

  if (!candidate.observations.every(isObservation)) {
    return null;
  }
  if (!candidate.tips.every((tip) => typeof tip === 'string')) {
    return null;
  }

  return {
    summary: candidate.summary,
    observations: candidate.observations,
    tips: candidate.tips,
  };
}
