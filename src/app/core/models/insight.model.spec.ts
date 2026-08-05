import { parseInsights } from './insight.model';

describe('parseInsights', () => {
  const valid = {
    summary: 'You are on track this month.',
    observations: [
      { title: 'Transport is up', detail: 'Three times your usual.', tone: 'warning' },
    ],
    tips: ['Review your transport spending.'],
  };

  it('should accept a well-formed analysis', () => {
    expect(parseInsights(valid)).toEqual(valid);
  });

  it('should accept an analysis with nothing to report', () => {
    expect(parseInsights({ summary: 'A quiet month.', observations: [], tips: [] })).not.toBeNull();
  });

  it('should reject null and undefined', () => {
    expect(parseInsights(null)).toBeNull();
    expect(parseInsights(undefined)).toBeNull();
  });

  it('should reject a missing summary', () => {
    expect(parseInsights({ observations: [], tips: [] })).toBeNull();
  });

  it('should reject observations that are not an array', () => {
    expect(parseInsights({ ...valid, observations: 'up a lot' })).toBeNull();
  });

  it('should reject an observation missing its detail', () => {
    expect(
      parseInsights({ ...valid, observations: [{ title: 'Hm', tone: 'neutral' }] }),
    ).toBeNull();
  });

  it('should reject a tone outside the known set', () => {
    // A stray value would otherwise reach a CSS class binding in the template.
    expect(
      parseInsights({ ...valid, observations: [{ title: 'A', detail: 'B', tone: 'panic' }] }),
    ).toBeNull();
  });

  it('should reject tips that are not all strings', () => {
    expect(parseInsights({ ...valid, tips: ['fine', { text: 'not fine' }] })).toBeNull();
  });
});
