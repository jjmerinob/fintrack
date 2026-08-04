import { Database } from './database.types';

/** One month of pre-aggregated totals, as returned by `dashboard_monthly_summary`.
 *  `month` is the first day of the month (`'YYYY-MM-01'`). */
export type MonthlySummary =
  Database['public']['Functions']['dashboard_monthly_summary']['Returns'][number];

/** Expense total for a single category, as returned by `dashboard_category_breakdown`. */
export type CategoryBreakdown =
  Database['public']['Functions']['dashboard_category_breakdown']['Returns'][number];
