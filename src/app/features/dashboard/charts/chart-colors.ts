/**
 * Chart colors, taken from the app's own Material palettes (see
 * `src/styles/_theme-colors.scss`) rather than invented.
 *
 * These are deliberately NOT the `--color-income` / `--color-expense` pair used
 * for figures in the transactions table: that pair (#10b981 / #f87171) collapses
 * under deuteranopia — ΔE 4.9 in OKLab, below the safe floor of 6 — so the two
 * series would look identical to a red-green colorblind reader. Text figures get
 * away with it because a `+`/`−` sign carries the meaning too; chart bars have no
 * such fallback.
 *
 * The steps below are the same hue families pushed apart in lightness, which is
 * the channel that survives CVD: ΔE 9.9 (protanopia), contrast >= 3:1 on the
 * light surface. Verified with the dataviz palette validator.
 */

/** Income series — `tertiary 40` from the generated Material palette. */
export const INCOME_COLOR = '#006c49';

/** Expense series — `error 60`. */
export const EXPENSE_COLOR = '#ea6767';

/** Single hue for the category ranking: bar length already encodes magnitude, so
 *  color is not spent re-encoding it. `primary 40`. */
export const CATEGORY_COLOR = '#515f74';

/** Spending meter, healthy state: fill + a lighter step of the same ramp for the
 *  unfilled track (`tertiary 40` / `tertiary 95`). */
export const RING_GOOD_FILL = '#006c49';
export const RING_GOOD_TRACK = '#beffdb';

/** Spending meter, overspent state (`error 60` / `error 90`). */
export const RING_OVER_FILL = '#ea6767';
export const RING_OVER_TRACK = '#ffdad8';

/** Recessive grid/axis ink, one step off the surface. */
export const AXIS_COLOR = '#8e9197';
export const GRID_COLOR = '#e1e2e9';
