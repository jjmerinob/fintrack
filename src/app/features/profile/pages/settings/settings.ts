import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { form, maxLength, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/auth/auth.service';
import { UserService } from '../../../../core/user/user.service';
import { Card } from '../../../../shared/components/card/card';
import { TextField } from '../../../../shared/components/text-field/text-field';

@Component({
  selector: 'app-settings',
  imports: [Card, MatButtonModule, MatProgressSpinnerModule, TextField],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly user = inject(UserService);
  private readonly auth = inject(AuthService);

  protected readonly isLoading = this.user.isLoading;

  /** Comes from the auth account rather than the profile row, and is read-only
   *  here: changing it is a credential change, which Supabase gates behind its
   *  own confirmation flow. */
  protected readonly email = computed(() => this.auth.user()?.email ?? '');

  protected readonly memberSince = computed(() => {
    const createdAt = this.user.profile()?.created_at;
    return createdAt
      ? new Date(createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
  });

  // A linkedSignal rather than an effect: the form starts empty, adopts the
  // profile the moment the resource resolves, and re-syncs after a save — all
  // without the "have I seeded this already?" bookkeeping an effect would need.
  protected readonly model = linkedSignal(() => ({
    fullName: this.user.profile()?.full_name ?? '',
  }));

  protected readonly profileForm = form(this.model, (path) => {
    required(path.fullName, { message: 'Name is required' });
    maxLength(path.fullName, 80, { message: 'Name must be 80 characters or fewer' });
  });

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onSubmit(event: Event): void {
    event.preventDefault();

    submit(this.profileForm, async () => {
      this.serverError.set(null);
      this.saved.set(false);
      this.saving.set(true);

      try {
        await this.user.updateProfile({ full_name: this.model().fullName.trim() });
        this.saved.set(true);
      } catch (error) {
        this.serverError.set(
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        );
      } finally {
        this.saving.set(false);
      }
    });
  }
}
