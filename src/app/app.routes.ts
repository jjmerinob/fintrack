import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    // Listed before the auth routes on purpose: for an empty URL, this branch
    // resolves via its own `redirectTo` child below. If `auth.routes` (whose
    // children are only 'login'/'signup') were tried first, its empty `path`
    // would "match" zero segments with nothing to render and nothing left to
    // prove it wrong, so the router would stop there instead of backtracking
    // to this branch — leaving the app on a blank page at '/'.
    path: '',
    // Lazy-loaded like every other route, so Material's toolbar/sidenav/menu
    // modules stay out of the initial bundle for users who only ever sign in.
    loadComponent: () => import('./core/layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: 'transactions',
        loadChildren: () =>
          import('./features/transactions/transactions.routes').then((m) => m.transactionsRoutes),
      },
      {
        path: 'ai-insights',
        loadChildren: () =>
          import('./features/ai-insights/ai-insights.routes').then((m) => m.aiInsightsRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.profileRoutes),
      },
    ],
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
];
