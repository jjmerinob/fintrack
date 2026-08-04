import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatCard } from './stat-card';

describe('StatCard', () => {
  let fixture: ComponentFixture<StatCard>;

  async function setUp(inputs: Record<string, unknown>): Promise<void> {
    await TestBed.configureTestingModule({ imports: [StatCard] }).compileComponents();

    fixture = TestBed.createComponent(StatCard);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
  }

  function text(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function deltaElement(): HTMLElement | null {
    return fixture.nativeElement.querySelector('p:last-of-type span');
  }

  it('should show the label and the value it was given', async () => {
    await setUp({ label: 'Income', value: '€2,400.00' });

    expect(text()).toContain('Income');
    expect(text()).toContain('€2,400.00');
  });

  it('should hide the delta row when there is nothing to compare against', async () => {
    await setUp({ label: 'Income', value: '€0.00', delta: null });

    expect(text()).not.toContain('vs last month');
  });

  it('should show a rise with an up arrow and no sign on the number', async () => {
    await setUp({ label: 'Income', value: '€2,400.00', delta: 12.5 });

    expect(text()).toContain('↑ 12.5%');
    expect(text()).toContain('vs last month');
  });

  it('should show a fall with a down arrow and the magnitude only', async () => {
    await setUp({ label: 'Income', value: '€1,000.00', delta: -20 });

    // The arrow carries the direction, so the number itself is never negative.
    expect(text()).toContain('↓ 20.0%');
    expect(text()).not.toContain('-20');
  });

  it('should treat a rise as favorable by default', async () => {
    await setUp({ label: 'Income', value: '€2,400.00', delta: 12.5 });

    expect(deltaElement()?.classList).toContain('text-income-strong');
  });

  it('should treat a rise as unfavorable when a rise is bad', async () => {
    await setUp({
      label: 'Expenses',
      value: '€1,800.00',
      delta: 12.5,
      positiveIsGood: false,
    });

    // Spending 12.5% more is the same number as earning 12.5% more, but it is
    // not the same news.
    expect(deltaElement()?.classList).toContain('text-expense-strong');
  });

  it('should treat a fall in spending as favorable', async () => {
    await setUp({
      label: 'Expenses',
      value: '€900.00',
      delta: -30,
      positiveIsGood: false,
    });

    expect(deltaElement()?.classList).toContain('text-income-strong');
  });

  it('should render an unchanged figure neutrally', async () => {
    await setUp({ label: 'Income', value: '€2,400.00', delta: 0 });

    expect(text()).toContain('→ 0.0%');
    expect(deltaElement()?.classList).toContain('text-on-surface-variant');
  });

  it('should render the value larger when emphasized', async () => {
    await setUp({ label: 'Balance', value: '€600.00', emphasis: true });
    const value: HTMLElement = fixture.nativeElement.querySelectorAll('p')[1];

    expect(value.classList).toContain('text-4xl');
    expect(value.classList).not.toContain('text-2xl');
  });
});
