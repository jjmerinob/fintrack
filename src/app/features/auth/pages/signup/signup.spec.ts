import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { Signup } from './signup';

describe('Signup', () => {
  let fixture: ComponentFixture<Signup>;
  const authService = { register: vi.fn() };
  const snackBar = { open: vi.fn() };

  /** Password inputs share a selector, so they are addressed by position. */
  async function fillIn(selector: string, value: string, index = 0): Promise<void> {
    const input: HTMLInputElement = fixture.nativeElement.querySelectorAll(selector)[index];
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function fillValidForm(confirmPassword = 'hunter2000'): Promise<void> {
    await fillIn('input[type=text]', 'Ada Lovelace');
    await fillIn('input[type=email]', 'ada@example.com');
    await fillIn('input[type=password]', 'hunter2000', 0);
    await fillIn('input[type=password]', confirmPassword, 1);
  }

  async function submitForm(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    authService.register.mockResolvedValue({ requiresEmailConfirmation: false });

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    await fixture.whenStable();
  });

  it('should not register an account when the form is empty', async () => {
    await submitForm();

    expect(authService.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Name is required');
  });

  it('should reject a password shorter than eight characters', async () => {
    await fillIn('input[type=text]', 'Ada Lovelace');
    await fillIn('input[type=email]', 'ada@example.com');
    await fillIn('input[type=password]', 'short', 0);
    await fillIn('input[type=password]', 'short', 1);
    await submitForm();

    expect(authService.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Use at least 8 characters');
  });

  it('should refuse to register when the two passwords differ', async () => {
    await fillValidForm('something-else');
    await submitForm();

    expect(authService.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match');
  });

  it('should register the account and land on the dashboard when the session is live', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await fillValidForm();
    await submitForm();

    expect(authService.register).toHaveBeenCalledWith(
      'ada@example.com',
      'hunter2000',
      'Ada Lovelace',
    );
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should send the user to sign in with a message when email confirmation is required', async () => {
    authService.register.mockResolvedValue({ requiresEmailConfirmation: true });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await fillValidForm();
    await submitForm();

    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(snackBar.open).toHaveBeenCalledWith(expect.stringContaining('confirm'), 'OK', {
      duration: 8000,
    });
  });

  it('should show the reason when the account cannot be created', async () => {
    authService.register.mockRejectedValue(new Error('User already registered'));

    await fillValidForm();
    await submitForm();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'User already registered',
    );
  });
});
