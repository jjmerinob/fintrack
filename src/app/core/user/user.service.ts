import { computed, inject, resource, Service } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { Profile, ProfileUpdate } from '../models/profile.model';
import { SupabaseClientService } from '../supabase/supabase-client.service';

@Service()
export class UserService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly auth = inject(AuthService);

  // Returning `undefined` while signed out leaves the resource idle, so the
  // profile is fetched only once there is a user to fetch it for.
  private readonly profileResource = resource({
    params: () => this.auth.user()?.id,
    loader: async ({ params: userId }) => {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
  });

  readonly profile = computed<Profile | null>(() => this.profileResource.value() ?? null);
  readonly isLoading = this.profileResource.isLoading;
  readonly currency = computed(() => this.profile()?.currency ?? 'EUR');
  readonly displayName = computed(() => this.profile()?.full_name ?? this.auth.user()?.email ?? '');

  async updateProfile(changes: ProfileUpdate): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      throw new Error('Cannot update a profile while signed out.');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update(changes)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    this.profileResource.value.set(data);
  }
}
