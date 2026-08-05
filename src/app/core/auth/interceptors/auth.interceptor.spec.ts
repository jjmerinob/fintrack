import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { environment } from '@env/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth.service';

describe('authInterceptor', () => {
  /** Runs the interceptor and returns the request it actually forwarded to `next`. */
  function run(url: string, accessToken: string | undefined): HttpRequest<unknown> {
    const next = vi.fn((forwarded: HttpRequest<unknown>) => of(forwarded));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { session: () => (accessToken ? { access_token: accessToken } : null) },
        },
      ],
    });

    const req = new HttpRequest('GET', url);
    const handler = next as unknown as HttpHandlerFn;
    TestBed.runInInjectionContext(() => authInterceptor(req, handler));

    return next.mock.calls[0][0];
  }

  it('forwards the request unchanged when there is no session', () => {
    const forwarded = run(`${environment.supabaseUrl}/rest/v1/transactions`, undefined);

    expect(forwarded.headers.has('Authorization')).toBe(false);
  });

  it('forwards the request unchanged for URLs outside the Supabase host, even with a session', () => {
    const forwarded = run('https://example.com/api', 'token-123');

    expect(forwarded.headers.has('Authorization')).toBe(false);
  });

  it('attaches the bearer token for requests to the Supabase host', () => {
    const forwarded = run(`${environment.supabaseUrl}/rest/v1/transactions`, 'token-123');

    expect(forwarded.headers.get('Authorization')).toBe('Bearer token-123');
  });
});
