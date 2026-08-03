import { Component, computed, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-text-field',
  imports: [FormField, MatFormFieldModule, MatInputModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
})
export class TextField {
  readonly field = input.required<Field<string>>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email'>('text');
  readonly autocomplete = input<string>();

  /** A field is callable: calling it returns its reactive state. */
  protected readonly state = computed(() => this.field()());
}
