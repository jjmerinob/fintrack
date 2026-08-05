import { Routes } from '@angular/router';

import { guestGuard } from '@core/auth/guards/guest.guard';
import { provideFormFieldDefaults } from '@shared/material/form-field.defaults';

export const authRoutes: Routes = [
  {
    path: '',
    providers: [provideFormFieldDefaults()],
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        title: 'Sign in',
        loadComponent: () => import('./pages/login/login').then((m) => m.Login),
      },
      {
        path: 'signup',
        title: 'Create account',
        loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup),
      },
    ],
  },
];
