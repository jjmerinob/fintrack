import { Routes } from '@angular/router';

import { guestGuard } from '../../core/auth/guest.guard';
import { provideFormFieldDefaults } from '../../shared/material/form-field.defaults';

export const authRoutes: Routes = [
  {
    path: '',
    providers: [provideFormFieldDefaults()],
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.Login),
      },
      {
        path: 'signup',
        loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup),
      },
    ],
  },
];
