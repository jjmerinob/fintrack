import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Card } from './card';

@Component({
  imports: [Card],
  template: `<app-card [title]="title" [subtitle]="subtitle">
    <p class="projected">Chart goes here</p>
  </app-card>`,
})
class HostComponent {
  title = '';
  subtitle = '';
}

describe('Card', () => {
  let fixture: ComponentFixture<HostComponent>;

  async function setUp(title = '', subtitle = ''): Promise<void> {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.title = title;
    fixture.componentInstance.subtitle = subtitle;
    await fixture.whenStable();
  }

  it('should project the content it wraps', async () => {
    await setUp('Income vs expenses');

    expect(fixture.nativeElement.querySelector('.projected')?.textContent).toContain(
      'Chart goes here',
    );
  });

  it('should render the title as a heading', async () => {
    await setUp('Income vs expenses');

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Income vs expenses');
  });

  it('should render the subtitle under the title', async () => {
    await setUp('Income vs expenses', 'Last 6 months');

    expect(fixture.nativeElement.textContent).toContain('Last 6 months');
  });

  it('should omit the header entirely when there is no title', async () => {
    await setUp();

    // An empty header would still take up its gap in the layout.
    expect(fixture.nativeElement.querySelector('header')).toBeNull();
  });

  it('should omit the subtitle when only a title is given', async () => {
    await setUp('Income vs expenses');

    expect(fixture.nativeElement.querySelector('header p')).toBeNull();
  });
});
