import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';

import { PasswordField } from './password-field';

describe('PasswordField', () => {
  let fixture: ComponentFixture<PasswordField>;

  const input = (): HTMLInputElement => fixture.nativeElement.querySelector('input');
  const toggle = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PasswordField] }).compileComponents();

    const model = signal({ password: '' });
    const testForm = TestBed.runInInjectionContext(() => form(model));

    fixture = TestBed.createComponent(PasswordField);
    fixture.componentRef.setInput('field', testForm.password);
    fixture.componentRef.setInput('label', 'Password');
    await fixture.whenStable();
  });

  it('should mask the value by default', () => {
    expect(input().type).toBe('password');
    expect(toggle().getAttribute('aria-label')).toBe('Show password');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('should reveal the value when the toggle is pressed', async () => {
    toggle().click();
    await fixture.whenStable();

    expect(input().type).toBe('text');
    expect(toggle().getAttribute('aria-label')).toBe('Hide password');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
  });

  it('should mask the value again when toggled back', async () => {
    toggle().click();
    await fixture.whenStable();
    toggle().click();
    await fixture.whenStable();

    expect(input().type).toBe('password');
  });

  it('should keep the toggle out of form submission', () => {
    // A suffix button defaulting to type="submit" would submit the form on click.
    expect(toggle().type).toBe('button');
  });
});
