import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  const authService = { login: vi.fn() };

  async function fillIn(selector: string, value: string): Promise<void> {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submitForm(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    authService.login.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
  });

  it('should not attempt to sign in when the form is empty', async () => {
    await submitForm();

    expect(authService.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Email is required');
    expect(fixture.nativeElement.textContent).toContain('Password is required');
  });

  it('should reject a malformed email before reaching the server', async () => {
    await fillIn('input[type=email]', 'not-an-email');
    await fillIn('input[type=password]', 'hunter2');
    await submitForm();

    expect(authService.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address');
  });

  it('should sign in with the typed credentials and land on the dashboard', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await fillIn('input[type=email]', 'ada@example.com');
    await fillIn('input[type=password]', 'hunter2');
    await submitForm();

    expect(authService.login).toHaveBeenCalledWith('ada@example.com', 'hunter2');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show the reason when the server rejects the credentials', async () => {
    authService.login.mockRejectedValue(new Error('Invalid login credentials'));

    await fillIn('input[type=email]', 'ada@example.com');
    await fillIn('input[type=password]', 'wrong');
    await submitForm();

    const alert = fixture.nativeElement.querySelector('[role=alert]');
    expect(alert.textContent).toContain('Invalid login credentials');
  });
});
