// Fintrack is euro-only for now, so the symbol lives here instead of being
// threaded through every call site. Note this is *not* `Intl`'s currency style:
// that places the symbol per the locale's own convention (`€1,234.50` in en-US),
// and the app shows it on the right instead.
const LOCALE = 'en-US';
const SYMBOL = '€';

/** Non-breaking, so an amount never wraps away from its symbol. */
const NBSP = '\xa0';

/** `1234.5` -> `'1,234.50 €'`. */
export function formatAmount(value: number): string {
  const amount = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${amount}${NBSP}${SYMBOL}`;
}

/**
 * Percent change from `previous` to `current`, or `null` when there is no
 * meaningful baseline — a change from zero is not "+100%", it is undefined.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}
