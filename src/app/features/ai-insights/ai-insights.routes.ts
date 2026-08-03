import { Routes } from '@angular/router';

export const aiInsightsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/insights/insights').then((m) => m.Insights),
  },
];
