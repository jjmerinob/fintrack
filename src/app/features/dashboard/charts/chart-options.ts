import { EChartsCoreOption } from 'echarts/core';

import { CategoryBreakdown, MonthlySummary } from '@core/models/dashboard.model';
import { fromDateString } from '@shared/utils/date.util';
import {
  AXIS_COLOR,
  CATEGORY_COLOR,
  EXPENSE_COLOR,
  GRID_COLOR,
  INCOME_COLOR,
  RING_GOOD_FILL,
  RING_GOOD_TRACK,
  RING_OVER_FILL,
  RING_OVER_TRACK,
} from './chart-colors';

/** Formats a raw amount for display, e.g. `1234.5` -> `'€1,234.50'`. */
export type AmountFormatter = (value: number) => string;

/** Beyond this the ranking stops being readable; the tail folds into "Other". */
export const MAX_CATEGORY_BARS = 6;

/** Shared mark specs: thin bars with a rounded data-end and hairline axes. */
const BAR_MAX_WIDTH = 24;
const BAR_RADIUS = 4;

const AXIS_LABEL = { color: AXIS_COLOR, fontSize: 11 };
const AXIS_LINE = { lineStyle: { color: GRID_COLOR, width: 1 } };
const SPLIT_LINE = { lineStyle: { color: GRID_COLOR, width: 1, type: 'solid' as const } };

/** `'2026-03-01'` -> `'Mar'`. */
function monthLabel(month: string): string {
  return fromDateString(month).toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Income vs expenses per month, as grouped columns.
 *
 * Two series that must be told apart, so this is the one chart using categorical
 * color — plus a legend, since color alone must never be the only identity cue.
 */
export function buildMonthlyTrendOptions(
  months: MonthlySummary[],
  formatAmount: AmountFormatter,
): EChartsCoreOption {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: unknown) => formatAmount(Number(value)),
    },
    legend: {
      data: ['Income', 'Expenses'],
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: AXIS_COLOR },
    },
    grid: { top: 16, right: 8, bottom: 40, left: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: months.map((month) => monthLabel(month.month)),
      axisLabel: AXIS_LABEL,
      axisLine: AXIS_LINE,
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...AXIS_LABEL, formatter: (value: number) => formatAmount(value) },
      axisLine: { show: false },
      splitLine: SPLIT_LINE,
    },
    series: [
      {
        name: 'Income',
        type: 'bar',
        data: months.map((month) => month.total_income),
        barMaxWidth: BAR_MAX_WIDTH,
        itemStyle: { color: INCOME_COLOR, borderRadius: [BAR_RADIUS, BAR_RADIUS, 0, 0] },
      },
      {
        name: 'Expenses',
        type: 'bar',
        data: months.map((month) => month.total_expense),
        barMaxWidth: BAR_MAX_WIDTH,
        itemStyle: { color: EXPENSE_COLOR, borderRadius: [BAR_RADIUS, BAR_RADIUS, 0, 0] },
      },
    ],
  };
}

/** Folds everything past the top N into a single "Other" row, so the ranking stays readable. */
export function foldCategoryTail(
  categories: CategoryBreakdown[],
  max = MAX_CATEGORY_BARS,
): { name: string; total: number }[] {
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const head = sorted.slice(0, max).map((c) => ({ name: c.category_name, total: c.total }));
  const tail = sorted.slice(max);

  if (tail.length === 0) {
    return head;
  }
  return [...head, { name: 'Other', total: tail.reduce((sum, c) => sum + c.total, 0) }];
}

/**
 * Expenses per category, as a horizontal ranking.
 *
 * One hue for every bar on purpose: the bars are the same measure, and their
 * length already encodes magnitude — coloring them differently would spend the
 * identity channel restating what length says.
 */
export function buildCategoryBreakdownOptions(
  categories: CategoryBreakdown[],
  formatAmount: AmountFormatter,
): EChartsCoreOption {
  // ECharts draws the first category at the bottom, so reverse to put the
  // largest at the top where the eye lands first.
  const rows = foldCategoryTail(categories).reverse();

  return {
    tooltip: {
      trigger: 'item',
      valueFormatter: (value: unknown) => formatAmount(Number(value)),
    },
    grid: { top: 8, right: 72, bottom: 8, left: 8, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: rows.map((row) => row.name),
      axisLabel: { ...AXIS_LABEL, fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Spent',
        type: 'bar',
        data: rows.map((row) => row.total),
        barMaxWidth: BAR_MAX_WIDTH,
        itemStyle: { color: CATEGORY_COLOR, borderRadius: [0, BAR_RADIUS, BAR_RADIUS, 0] },
        // The value rides the tip of its own bar, so no x-axis is needed.
        label: {
          show: true,
          position: 'right',
          color: AXIS_COLOR,
          fontSize: 11,
          formatter: ({ value }: { value: number }) => formatAmount(value),
        },
      },
    ],
  };
}

/**
 * The share of this month's income already spent, as a meter.
 *
 * The fill carries the state (within means / overspent) and the unfilled track is
 * a lighter step of that same ramp, so the whole ring reads at a glance. The
 * number itself is rendered as HTML over the center rather than baked into the
 * canvas, so it can wear normal text tokens.
 */
export function buildSpendingRingOptions(ratio: number): EChartsCoreOption {
  const overspent = ratio >= 1;
  const spent = Math.min(ratio, 1);

  return {
    series: [
      {
        type: 'pie',
        radius: ['74%', '92%'],
        startAngle: 90,
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        data: [
          {
            value: spent,
            name: 'Spent',
            itemStyle: { color: overspent ? RING_OVER_FILL : RING_GOOD_FILL },
          },
          {
            value: 1 - spent,
            name: 'Remaining',
            itemStyle: { color: overspent ? RING_OVER_TRACK : RING_GOOD_TRACK },
          },
        ],
      },
    ],
  };
}
