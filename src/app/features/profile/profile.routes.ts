import { Routes } from '@angular/router';

import { provideFormFieldDefaults } from '../../shared/material/form-field.defaults';

export const profileRoutes: Routes = [
  {
    path: '',
    providers: [provideFormFieldDefaults()],
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
  },
];
