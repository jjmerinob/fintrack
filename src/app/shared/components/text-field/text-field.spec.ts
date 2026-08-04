import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';

import { TextField } from './text-field';

describe('TextField', () => {
  let fixture: ComponentFixture<TextField>;
  let model: ReturnType<typeof signal<{ name: string }>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TextField] }).compileComponents();

    model = signal({ name: '' });
    const testForm = TestBed.runInInjectionContext(() =>
      form(model, (path) => {
        required(path.name, { message: 'Name is required' });
      }),
    );

    fixture = TestBed.createComponent(TextField);
    fixture.componentRef.setInput('field', testForm.name);
    fixture.componentRef.setInput('label', 'Name');
    await fixture.whenStable();
  });

  it('should render the given label', () => {
    expect(fixture.nativeElement.textContent).toContain('Name');
  });

  it('should not show a validation message before the field is touched', () => {
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });

  it('should show the validation message once touched and invalid', async () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('p')?.textContent).toContain('Name is required');
  });

  it('should write user input back into the form model', async () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Ada';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(model().name).toBe('Ada');
  });
});
