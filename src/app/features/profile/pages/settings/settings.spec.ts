import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../../../../core/auth/auth.service';
import { Profile } from '../../../../core/models/profile.model';
import { UserService } from '../../../../core/user/user.service';
import { Settings } from './settings';

describe('Settings', () => {
  let fixture: ComponentFixture<Settings>;
  let profile: WritableSignal<Profile | null>;
  let isLoading: WritableSignal<boolean>;
  const updateProfile = vi.fn();

  const ada: Profile = {
    id: 'user-1',
    full_name: 'Ada Lovelace',
    currency: 'EUR',
    created_at: '2026-01-15T10:00:00Z',
  };

  async function setUp(options: { profile?: Profile | null; loading?: boolean } = {}) {
    profile = signal<Profile | null>(options.profile === undefined ? ada : options.profile);
    isLoading = signal(options.loading ?? false);

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: UserService, useValue: { profile, isLoading, updateProfile } },
        {
          provide: AuthService,
          useValue: { user: signal({ id: 'user-1', email: 'ada@example.com' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
  }

  function nameInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type=text]');
  }

  function text(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  async function type(value: string): Promise<void> {
    const input = nameInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function save(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    updateProfile.mockResolvedValue(undefined);
  });

  it('should show a spinner instead of an empty form while the profile loads', async () => {
    await setUp({ loading: true });

    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('should pre-fill the name from the loaded profile', async () => {
    await setUp();

    expect(nameInput().value).toBe('Ada Lovelace');
  });

  it('should adopt the profile once it arrives after the first render', async () => {
    await setUp({ profile: null });
    expect(nameInput().value).toBe('');

    profile.set(ada);
    await fixture.whenStable();

    expect(nameInput().value).toBe('Ada Lovelace');
  });

  it('should show the email as read-only', async () => {
    const email: HTMLInputElement = (await setUp().then(() =>
      fixture.nativeElement.querySelector('input[type=email]'),
    )) as HTMLInputElement;

    expect(email.value).toBe('ada@example.com');
    expect(email.readOnly).toBe(true);
  });

  it('should state that amounts are euro-only', async () => {
    await setUp();

    expect(text()).toContain('Euro (€)');
  });

  it('should show when the account was created', async () => {
    await setUp();

    expect(text()).toContain('Member since January 15, 2026');
  });

  it('should refuse to save an empty name', async () => {
    await setUp();
    await type('');

    await save();

    expect(updateProfile).not.toHaveBeenCalled();
    expect(text()).toContain('Name is required');
  });

  it('should refuse to save a name longer than the column allows', async () => {
    await setUp();
    await type('a'.repeat(81));

    await save();

    expect(updateProfile).not.toHaveBeenCalled();
    expect(text()).toContain('80 characters or fewer');
  });

  it('should trim surrounding whitespace before saving', async () => {
    await setUp();
    await type('  Ada L.  ');

    await save();

    expect(updateProfile).toHaveBeenCalledWith({ full_name: 'Ada L.' });
  });

  it('should confirm a successful save', async () => {
    await setUp();
    await type('Ada L.');

    await save();

    expect(text()).toContain('Saved');
  });

  it('should report a failed save and not claim it worked', async () => {
    updateProfile.mockRejectedValue(new Error('Network error'));
    await setUp();
    await type('Ada L.');

    await save();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Network error',
    );
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
  });

  it('should clear a previous error when a later save succeeds', async () => {
    updateProfile.mockRejectedValueOnce(new Error('Network error'));
    await setUp();
    await type('Ada L.');
    await save();
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();

    await save();

    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
    expect(text()).toContain('Saved');
  });
});
