import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  let fixture: ComponentFixture<EmptyState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmptyState] }).compileComponents();
    fixture = TestBed.createComponent(EmptyState);
  });

  it('should render the given icon and title', async () => {
    fixture.componentRef.setInput('icon', 'inbox');
    fixture.componentRef.setInput('title', 'Nothing here');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('inbox');
    expect(fixture.nativeElement.textContent).toContain('Nothing here');
  });

  it('should omit the message paragraph when none is provided', async () => {
    fixture.componentRef.setInput('title', 'Nothing here');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('p').length).toBe(1);
  });

  it('should render the message when provided', async () => {
    fixture.componentRef.setInput('title', 'Nothing here');
    fixture.componentRef.setInput('message', 'Try a different filter.');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Try a different filter.');
  });
});

@Component({
  selector: 'app-host',
  imports: [EmptyState],
  template: `
    <app-empty-state title="Nothing here">
      <button type="button">Retry</button>
    </app-empty-state>
  `,
})
class HostComponent {}

describe('EmptyState content projection', () => {
  it('should project the action content passed by the caller', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Retry');
  });
});
