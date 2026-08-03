import { Routes } from '@angular/router';

export const transactionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/list/list').then((m) => m.List),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/form/form').then((m) => m.Form),
  },
];
