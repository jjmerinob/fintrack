import { OverlayContainer } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme/theme.service';
import { UserService } from '../../user/user.service';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let overlayContainerElement: HTMLElement;
  const authService = { logout: vi.fn() };
  const themeService = { isDark: signal(false), toggle: vi.fn() };
  const userService = { displayName: signal('Ada Lovelace') };

  beforeEach(async () => {
    vi.resetAllMocks();
    authService.logout.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ThemeService, useValue: themeService },
        { provide: UserService, useValue: userService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    overlayContainerElement = TestBed.inject(OverlayContainer).getContainerElement();
    await fixture.whenStable();
  });

  it('should emit when the menu button is pressed, so the shell can open the mobile sidenav', () => {
    const emitted = vi.fn();
    fixture.componentInstance.menuButtonClicked.subscribe(emitted);

    fixture.nativeElement.querySelector('button[aria-label="Open navigation menu"]').click();

    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('should offer to switch to dark mode while in light mode', () => {
    const toggle = fixture.nativeElement.querySelector('button[aria-label="Switch to dark theme"]');
    expect(toggle).toBeTruthy();
  });

  it('should toggle the theme service when the theme button is pressed', () => {
    fixture.nativeElement.querySelector('button[aria-label="Switch to dark theme"]').click();

    expect(themeService.toggle).toHaveBeenCalledTimes(1);
  });

  it('should show the signed-in user in the account menu', async () => {
    fixture.nativeElement.querySelector('button[aria-label^="Account menu"]').click();
    await fixture.whenStable();

    expect(overlayContainerElement.textContent).toContain('Ada Lovelace');
  });

  it('should log out and navigate to the login page from the account menu', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.nativeElement.querySelector('button[aria-label^="Account menu"]').click();
    await fixture.whenStable();

    const logoutItem = [...overlayContainerElement.querySelectorAll('button')].find((btn) =>
      btn.textContent?.includes('Log out'),
    );
    logoutItem?.click();
    await fixture.whenStable();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
