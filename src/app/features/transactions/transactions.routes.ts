import { provideNativeDateAdapter } from '@angular/material/core';
import { Routes } from '@angular/router';

import { provideFormFieldDefaults } from '@shared/material/form-field.defaults';

export const transactionsRoutes: Routes = [
  {
    path: '',
    title: 'Transactions',
    providers: [provideFormFieldDefaults(), provideNativeDateAdapter()],
    loadComponent: () => import('./pages/list/list').then((m) => m.List),
  },
];
