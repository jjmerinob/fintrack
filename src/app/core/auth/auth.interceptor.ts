import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Attaches the Supabase JWT to calls made through `HttpClient` (Edge Functions).
 * Requests handled by the Supabase SDK carry their own token and never reach
 * this interceptor.
 *
 * The header is scoped to our own Supabase host on purpose: sending the user's
 * access token to any other origin would leak their session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).session()?.access_token;

  if (!token || !req.url.startsWith(environment.supabaseUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
