import { Routes } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';

import { echarts } from './charts/echarts-core';

export const dashboardRoutes: Routes = [
  {
    path: '',
    // Provided at the route rather than the root config so ECharts stays inside
    // the lazy dashboard chunk.
    providers: [provideEchartsCore({ echarts })],
    loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview),
  },
];
