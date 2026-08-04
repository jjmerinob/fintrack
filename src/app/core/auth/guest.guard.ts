import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** The inverse of `authGuard`: keeps a signed-in user off /login and /signup. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return !auth.isAuthenticated() || router.createUrlTree(['/dashboard']);
};
