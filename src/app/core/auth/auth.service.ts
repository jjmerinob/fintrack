import { computed, inject, Service, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

import { SupabaseClientService } from '../supabase/supabase-client.service';

@Service()
export class AuthService {
  private readonly supabase = inject(SupabaseClientService).client;

  private readonly _session = signal<Session | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);

  constructor() {
    // Keeps the signal in sync with token refreshes and sign-outs happening in
    // other tabs. The initial restore is handled by `restoreSession()` instead,
    // because this callback fires too late for the first route activation.
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
    });
  }

  /**
   * Reads the persisted session before the app bootstraps, so guards see the
   * real authentication state on the very first navigation.
   */
  async restoreSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this._session.set(data.session);
  }

  async login(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  }

  async register(email: string, password: string, fullName: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }
}
