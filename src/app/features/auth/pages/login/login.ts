import { Component, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PasswordField } from '../../../../shared/components/password-field/password-field';
import { TextField } from '../../../../shared/components/text-field/text-field';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

@Component({
  selector: 'app-login',
  imports: [
    AuthLayout,
    PasswordField,
    TextField,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly credentials = signal({ email: '', password: '' });

  protected readonly loginForm = form(this.credentials, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email address' });
    required(path.password, { message: 'Password is required' });
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onSubmit(event: Event): void {
    event.preventDefault();

    submit(this.loginForm, async () => {
      this.serverError.set(null);
      this.submitting.set(true);

      try {
        const { email: address, password } = this.credentials();
        await this.auth.login(address, password);
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
