import { AmountPipe } from './amount.pipe';

const NBSP = '\xa0';

describe('AmountPipe', () => {
  const pipe = new AmountPipe();

  it('should render the amount with the euro symbol on the right', () => {
    expect(pipe.transform(1234.5)).toBe(`1,234.50${NBSP}€`);
  });

  it('should render zero rather than an empty cell', () => {
    expect(pipe.transform(0)).toBe(`0.00${NBSP}€`);
  });

  it('should keep a negative amount signed', () => {
    expect(pipe.transform(-42)).toBe(`-42.00${NBSP}€`);
  });
});
