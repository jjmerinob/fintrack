import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { routes } from './app.routes';

/**
 * Guards the shape of the route table, which is easy to break: two sibling
 * branches both on `path: ''` (the shell and the auth pages) followed by a `**`
 * catch-all. Get the order wrong and either `/` renders nothing — a bug this app
 * has already had once — or the catch-all swallows `/login`.
 *
 * Asserts on the resulting URL rather than on rendered output, using the router
 * without an outlet: matching, guards and redirects all run, but no component is
 * instantiated, so the test stays about routing.
 */
describe('app routes', () => {
  function navigateAs(isAuthenticated: boolean) {
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

    const router = TestBed.inject(Router);
    return {
      go: async (url: string) => {
        await router.navigateByUrl(url);
        return router.url;
      },
    };
  }

  it('should send a signed-in user from an unknown URL to the dashboard', async () => {
    const { go } = navigateAs(true);

    expect(await go('/no-such-page')).toBe('/dashboard');
  });

  it('should land a signed-in user on the dashboard at the root URL', async () => {
    const { go } = navigateAs(true);

    // Regression guard: the two sibling `path: ''` branches once resolved to a
    // blank page here, because the auth branch matched the empty URL and
    // rendered nothing.
    expect(await go('/')).toBe('/dashboard');
  });

  it('should still reach the login page, which the catch-all must not swallow', async () => {
    const { go } = navigateAs(false);

    expect(await go('/login')).toBe('/login');
  });

  it('should still reach the signup page', async () => {
    const { go } = navigateAs(false);

    expect(await go('/signup')).toBe('/signup');
  });

  it('should send an anonymous visitor from a private URL to the login page', async () => {
    const { go } = navigateAs(false);

    expect(await go('/transactions')).toBe('/login');
  });

  it('should keep a signed-in user away from the auth pages', async () => {
    const { go } = navigateAs(true);

    expect(await go('/login')).toBe('/dashboard');
  });
});
