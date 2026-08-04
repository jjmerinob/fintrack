import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../auth/auth.service';
import { Profile } from '../models/profile.model';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { UserService } from './user.service';

/**
 * A minimal stand-in for Supabase's chainable, awaitable query builder. Every
 * method (`.select()`, `.eq()`, `.single()`...) is recorded as a spy and returns
 * the same proxy, so a full chain resolves to `{ data, error }` and tests can
 * assert which calls were made.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only chain mock
function createQueryBuilder<T>(data: T, error: unknown = null): any {
  const result = { data, error };
  const spies = new Map<string, ReturnType<typeof vi.fn>>();
  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  const proxy = new Proxy(builder, {
    get: (target, prop) => {
      if (prop in target) return target[prop as string];
      const name = prop as string;
      if (!spies.has(name)) {
        spies.set(
          name,
          vi.fn(() => proxy),
        );
      }
      return spies.get(name);
    },
  });
  return proxy;
}

describe('UserService', () => {
  const profile: Profile = {
    id: 'user-1',
    full_name: 'Ada Lovelace',
    currency: 'EUR',
    created_at: '2026-01-15T10:00:00Z',
  };

  function createService(
    from: ReturnType<typeof vi.fn>,
    user: { id: string; email?: string } | null = { id: 'user-1', email: 'ada@example.com' },
  ) {
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseClientService, useValue: { client: { from } } },
        { provide: AuthService, useValue: { user: signal(user) } },
      ],
    });
    return TestBed.inject(UserService);
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
  }

  it('should load the signed-in user’s profile row', async () => {
    const query = createQueryBuilder(profile);
    const from = vi.fn().mockReturnValue(query);
    const service = createService(from);
    await settle();

    expect(from).toHaveBeenCalledWith('profiles');
    expect(query.eq).toHaveBeenCalledWith('id', 'user-1');
    expect(service.profile()).toEqual(profile);
  });

  it('should not query while signed out', async () => {
    const from = vi.fn();
    const service = createService(from, null);
    await settle();

    expect(from).not.toHaveBeenCalled();
    expect(service.profile()).toBeNull();
  });

  it('should expose the profile currency', async () => {
    const service = createService(vi.fn().mockReturnValue(createQueryBuilder(profile)));
    await settle();

    expect(service.currency()).toBe('EUR');
  });

  it('should fall back to euros before the profile has loaded', () => {
    const service = createService(vi.fn().mockReturnValue(createQueryBuilder(profile)));

    // Read before `settle()`: the loader has not resolved yet.
    expect(service.currency()).toBe('EUR');
  });

  it('should use the full name as the display name', async () => {
    const service = createService(vi.fn().mockReturnValue(createQueryBuilder(profile)));
    await settle();

    expect(service.displayName()).toBe('Ada Lovelace');
  });

  it('should fall back to the email when the profile has no name', async () => {
    const nameless = { ...profile, full_name: null };
    const service = createService(vi.fn().mockReturnValue(createQueryBuilder(nameless)));
    await settle();

    expect(service.displayName()).toBe('ada@example.com');
  });

  it('should update only the signed-in user’s row', async () => {
    const loadQuery = createQueryBuilder(profile);
    const updateQuery = createQueryBuilder({ ...profile, full_name: 'Ada L.' });
    const from = vi.fn().mockReturnValue(loadQuery);
    const service = createService(from);
    await settle();

    from.mockReturnValueOnce(updateQuery);
    await service.updateProfile({ full_name: 'Ada L.' });

    expect(updateQuery.update).toHaveBeenCalledWith({ full_name: 'Ada L.' });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('should reflect the saved profile without refetching it', async () => {
    const loadQuery = createQueryBuilder(profile);
    const updated = { ...profile, full_name: 'Ada L.' };
    const from = vi.fn().mockReturnValue(loadQuery);
    const service = createService(from);
    await settle();

    from.mockReturnValueOnce(createQueryBuilder(updated));
    await service.updateProfile({ full_name: 'Ada L.' });

    expect(service.displayName()).toBe('Ada L.');
    // One call to load, one to update — the row returned by the update is reused.
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('should refuse to update a profile while signed out', async () => {
    const service = createService(vi.fn(), null);
    await settle();

    await expect(service.updateProfile({ full_name: 'Nobody' })).rejects.toThrow('signed out');
  });

  it('should surface a failed update instead of silently keeping the old value', async () => {
    const loadQuery = createQueryBuilder(profile);
    const from = vi.fn().mockReturnValue(loadQuery);
    const service = createService(from);
    await settle();

    from.mockReturnValueOnce(createQueryBuilder(null, new Error('RLS violation')));

    await expect(service.updateProfile({ full_name: 'Ada L.' })).rejects.toThrow('RLS violation');
    expect(service.displayName()).toBe('Ada Lovelace');
  });
});
