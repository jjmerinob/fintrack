import { Component, computed, input, signal } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-password-field',
  imports: [FormField, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './password-field.html',
  styleUrl: './password-field.scss',
})
export class PasswordField {
  readonly field = input.required<Field<string>>();
  readonly label = input.required<string>();
  readonly autocomplete = input<'current-password' | 'new-password'>('new-password');

  /** A field is callable: calling it returns its reactive state. */
  protected readonly state = computed(() => this.field()());
  protected readonly visible = signal(false);
}
