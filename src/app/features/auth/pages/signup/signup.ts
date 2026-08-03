import { Component, inject, signal } from '@angular/core';
import { email, form, minLength, required, submit, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PasswordField } from '../../../../shared/components/password-field/password-field';
import { TextField } from '../../../../shared/components/text-field/text-field';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

@Component({
  selector: 'app-signup',
  imports: [
    AuthLayout,
    PasswordField,
    TextField,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly account = signal({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly signupForm = form(this.account, (path) => {
    required(path.fullName, { message: 'Name is required' });

    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email address' });

    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, { message: 'Use at least 8 characters' });

    required(path.confirmPassword, { message: 'Confirm your password' });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(path.password)
        ? undefined
        : { kind: 'mismatch', message: 'Passwords do not match' },
    );
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onSubmit(event: Event): void {
    event.preventDefault();

    submit(this.signupForm, async () => {
      this.serverError.set(null);
      this.submitting.set(true);

      try {
        const { fullName, email: address, password } = this.account();
        await this.auth.register(address, password, fullName);
        await this.router.navigate(['/dashboard']);
      } catch (error) {
        this.serverError.set(
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        );
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
