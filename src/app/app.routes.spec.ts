import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthService } from './core/auth/auth.service';
import { routes } from './app.routes';

/**
 * Guards the shape of the route table, which is easy to break: two sibling
 * branches both on `path: ''` (the shell and the auth pages) followed by a `**`
 * catch-all. Get the order wrong and either `/` renders nothing — a bug this app
 * has already had once — or the catch-all swallows `/login`.
 */
describe('app routes', () => {
  function setUp(isAuthenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(isAuthenticated),
            session: signal(null),
            user: signal(null),
          },
        },
      ],
    });
  }

  it('should render the not-found page for an unknown URL', async () => {
    setUp(true);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/no-such-page');

    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });

  it('should keep an unknown URL as not-found even for a signed-in user', async () => {
    setUp(true);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/dashboardd');

    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });

  it('should still reach the login page, which the catch-all must not swallow', async () => {
    setUp(false);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/login');

    expect(harness.routeNativeElement?.textContent).not.toContain('Page not found');
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('should still reach the signup page', async () => {
    setUp(false);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/signup');

    expect(TestBed.inject(Router).url).toBe('/signup');
  });

  it('should send an anonymous visitor from a private URL to the login page', async () => {
    setUp(false);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/transactions');

    // Not the not-found page: the URL is real, the visitor just is not allowed.
    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
