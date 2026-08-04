import { CategoryBreakdown, MonthlySummary } from '../../../core/models/dashboard.model';
import { EXPENSE_COLOR, INCOME_COLOR, RING_GOOD_FILL, RING_OVER_FILL } from './chart-colors';
import {
  buildCategoryBreakdownOptions,
  buildMonthlyTrendOptions,
  buildSpendingRingOptions,
  foldCategoryTail,
  MAX_CATEGORY_BARS,
} from './chart-options';

/** Narrow view of the option objects, enough to assert on without `any`. */
interface SeriesLike {
  name?: string;
  data: (number | { value: number; itemStyle: { color: string } })[];
  itemStyle?: { color: string };
}
function seriesOf(options: unknown): SeriesLike[] {
  return (options as { series: SeriesLike[] }).series;
}
function categoryAxisData(options: unknown, axis: 'xAxis' | 'yAxis'): string[] {
  return (options as Record<string, { data: string[] }>)[axis].data;
}

const format = (value: number) => `€${value}`;

function category(name: string, total: number): CategoryBreakdown {
  return { category_id: `cat-${name}`, category_name: name, total };
}

describe('chart options', () => {
  describe('buildMonthlyTrendOptions', () => {
    const months: MonthlySummary[] = [
      { month: '2026-02-01', total_income: 2000, total_expense: 1500 },
      { month: '2026-03-01', total_income: 2400, total_expense: 1800 },
    ];

    it('should plot income and expenses as two separate series', () => {
      const series = seriesOf(buildMonthlyTrendOptions(months, format));

      expect(series.map((s) => s.name)).toEqual(['Income', 'Expenses']);
      expect(series[0].data).toEqual([2000, 2400]);
      expect(series[1].data).toEqual([1500, 1800]);
    });

    it('should label the x-axis with short month names in chronological order', () => {
      const options = buildMonthlyTrendOptions(months, format);

      expect(categoryAxisData(options, 'xAxis')).toEqual(['Feb', 'Mar']);
    });

    it('should use the colorblind-safe income and expense colors', () => {
      const series = seriesOf(buildMonthlyTrendOptions(months, format));

      expect(series[0].itemStyle?.color).toBe(INCOME_COLOR);
      expect(series[1].itemStyle?.color).toBe(EXPENSE_COLOR);
    });
  });

  describe('foldCategoryTail', () => {
    it('should sort categories from largest to smallest', () => {
      const folded = foldCategoryTail([category('Rent', 500), category('Food', 900)]);

      expect(folded.map((row) => row.name)).toEqual(['Food', 'Rent']);
    });

    it('should leave a short list untouched', () => {
      const folded = foldCategoryTail([category('Food', 900)]);

      expect(folded).toEqual([{ name: 'Food', total: 900 }]);
    });

    it('should fold everything past the cap into a single summed "Other" row', () => {
      const many = Array.from({ length: MAX_CATEGORY_BARS + 3 }, (_, i) =>
        category(`Cat ${i}`, 100 - i),
      );

      const folded = foldCategoryTail(many);

      expect(folded).toHaveLength(MAX_CATEGORY_BARS + 1);
      const other = folded.at(-1);
      expect(other?.name).toBe('Other');
      // The three smallest: 100-6, 100-7, 100-8.
      expect(other?.total).toBe(94 + 93 + 92);
    });

    it('should not mutate the array it was given', () => {
      const input = [category('Rent', 500), category('Food', 900)];

      foldCategoryTail(input);

      expect(input.map((c) => c.category_name)).toEqual(['Rent', 'Food']);
    });
  });

  describe('buildCategoryBreakdownOptions', () => {
    it('should put the largest category at the top of the axis', () => {
      const options = buildCategoryBreakdownOptions(
        [category('Rent', 500), category('Food', 900)],
        format,
      );

      // ECharts draws the first y-axis entry at the bottom, so the largest
      // category must come last for it to render at the top.
      expect(categoryAxisData(options, 'yAxis')).toEqual(['Rent', 'Food']);
      expect(seriesOf(options)[0].data).toEqual([500, 900]);
    });

    it('should draw every bar in one hue, since length already encodes the amount', () => {
      const series = seriesOf(
        buildCategoryBreakdownOptions([category('Rent', 500), category('Food', 900)], format),
      );

      expect(series).toHaveLength(1);
      expect(series[0].itemStyle?.color).toBeDefined();
    });
  });

  describe('buildSpendingRingOptions', () => {
    it('should split the ring into spent and remaining shares', () => {
      const [spent, remaining] = seriesOf(buildSpendingRingOptions(0.25))[0].data as {
        value: number;
      }[];

      expect(spent.value).toBeCloseTo(0.25);
      expect(remaining.value).toBeCloseTo(0.75);
    });

    it('should use the healthy color while spending stays under income', () => {
      const [spent] = seriesOf(buildSpendingRingOptions(0.4))[0].data as {
        itemStyle: { color: string };
      }[];

      expect(spent.itemStyle.color).toBe(RING_GOOD_FILL);
    });

    it('should switch to the overspent color once spending reaches income', () => {
      const [spent] = seriesOf(buildSpendingRingOptions(1.3))[0].data as {
        itemStyle: { color: string };
      }[];

      expect(spent.itemStyle.color).toBe(RING_OVER_FILL);
    });

    it('should cap the arc at a full ring when overspent', () => {
      const [spent, remaining] = seriesOf(buildSpendingRingOptions(2.5))[0].data as {
        value: number;
      }[];

      // Without the cap the pie would rescale and the ring would look under-filled.
      expect(spent.value).toBe(1);
      expect(remaining.value).toBe(0);
    });
  });
});
