import { Provider } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

/**
 * Material's default `fill` appearance reads as dated, and its default subscript
 * sizing reserves blank space under every field.
 *
 * Applied through lazy feature routes instead of the root config on purpose:
 * importing this token from `app.config.ts` pulls `@angular/material/form-field`
 * into the initial bundle (~75 kB) for pages that may never show a form.
 */
export function provideFormFieldDefaults(): Provider {
  return {
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
  };
}
