/**
 * Formats a `Date` using its local calendar day (matches Postgres `date`
 * columns). Deliberately not `toISOString()`, which converts to UTC first and
 * can shift the day by one for users west of UTC around midnight.
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a `'YYYY-MM-DD'` string as local midnight. A bare date string passed
 * to `new Date()` is parsed as UTC midnight per spec, which can display as
 * the previous day in negative UTC-offset timezones.
 */
export function fromDateString(value: string): Date {
  return new Date(`${value}T00:00:00`);
}
