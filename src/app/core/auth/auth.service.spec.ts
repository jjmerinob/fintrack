import { TestBed } from '@angular/core/testing';
import { Session } from '@supabase/supabase-js';

import { SupabaseClientService } from '../supabase/supabase-client.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };

  const session = { access_token: 'token-123', user: { id: 'user-1' } } as Session;

  function createService(): AuthService {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseClientService, useValue: { client: { auth } } }],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    vi.resetAllMocks();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInWithPassword.mockResolvedValue({ error: null });
    auth.signUp.mockResolvedValue({ data: { session }, error: null });
    auth.signOut.mockResolvedValue({ error: null });
  });

  it('should start signed out', () => {
    const service = createService();

    expect(service.session()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should expose the persisted session after restoring it', async () => {
    auth.getSession.mockResolvedValue({ data: { session }, error: null });
    const service = createService();

    await service.restoreSession();

    expect(service.session()).toBe(session);
    expect(service.user()?.id).toBe('user-1');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should forward credentials to Supabase on login', async () => {
    const service = createService();

    await service.login('ada@example.com', 'hunter2');

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'hunter2',
    });
  });

  it('should surface login failures to the caller', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: new Error('Invalid login credentials') });
    const service = createService();

    await expect(service.login('ada@example.com', 'wrong')).rejects.toThrow(
      'Invalid login credentials',
    );
  });

  it('should send the full name as user metadata on register', async () => {
    const service = createService();

    await service.register('ada@example.com', 'hunter2', 'Ada Lovelace');

    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'hunter2',
      options: { data: { full_name: 'Ada Lovelace' } },
    });
  });

  it('should report no confirmation needed when Supabase returns a live session', async () => {
    const service = createService();

    const result = await service.register('ada@example.com', 'hunter2', 'Ada Lovelace');

    expect(result).toEqual({ requiresEmailConfirmation: false });
  });

  it('should report confirmation needed when "Confirm email" is on and no session comes back', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const service = createService();

    const result = await service.register('ada@example.com', 'hunter2', 'Ada Lovelace');

    expect(result).toEqual({ requiresEmailConfirmation: true });
  });

  it('should surface logout failures to the caller', async () => {
    auth.signOut.mockResolvedValue({ error: new Error('Network error') });
    const service = createService();

    await expect(service.logout()).rejects.toThrow('Network error');
  });

  it('should track sessions ended elsewhere, such as another tab', async () => {
    auth.getSession.mockResolvedValue({ data: { session }, error: null });
    const service = createService();
    await service.restoreSession();

    // The service subscribes on construction; replay what Supabase would emit.
    const notify = auth.onAuthStateChange.mock.calls[0][0] as (
      event: string,
      session: Session | null,
    ) => void;
    notify('SIGNED_OUT', null);

    expect(service.isAuthenticated()).toBe(false);
  });
});
