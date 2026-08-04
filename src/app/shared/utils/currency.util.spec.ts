import { formatAmount, percentChange } from './currency.util';

/** The non-breaking space that joins an amount to its symbol. */
const NBSP = '\xa0';

describe('currency utils', () => {
  describe('formatAmount', () => {
    it('should put the euro symbol after the amount', () => {
      // Deliberately not `Intl`'s currency style, which would render `€1,234.50`.
      expect(formatAmount(1234.5)).toBe(`1,234.50${NBSP}€`);
    });

    it('should join the amount and the symbol with a non-breaking space', () => {
      // A plain space would let the symbol wrap onto a line of its own.
      expect(formatAmount(10)).toContain(NBSP);
      expect(formatAmount(10)).not.toContain(' €');
    });

    it('should always show two decimals', () => {
      expect(formatAmount(10)).toBe(`10.00${NBSP}€`);
      expect(formatAmount(0)).toBe(`0.00${NBSP}€`);
    });

    it('should round to the nearest cent', () => {
      expect(formatAmount(1.005)).toBe(`1.01${NBSP}€`);
    });

    it('should group thousands', () => {
      expect(formatAmount(1000000)).toBe(`1,000,000.00${NBSP}€`);
    });

    it('should keep the sign of a negative balance in front', () => {
      expect(formatAmount(-42)).toBe(`-42.00${NBSP}€`);
    });
  });

  describe('percentChange', () => {
    it('should compute a rise', () => {
      expect(percentChange(150, 100)).toBe(50);
    });

    it('should compute a fall as a negative number', () => {
      expect(percentChange(80, 100)).toBeCloseTo(-20);
    });

    it('should return null when there is no baseline to compare against', () => {
      // Growth from zero is undefined, not "+100%".
      expect(percentChange(500, 0)).toBeNull();
    });

    it('should measure against the magnitude of a negative baseline', () => {
      expect(percentChange(-50, -100)).toBe(50);
    });
  });
});
