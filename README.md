# Fintrack

A personal finance tracker: record income and expenses, see where the money goes,
and get a monthly read on what the charts do not show.

**[Live demo →](https://fintrack.jjmerinobrito.workers.dev)**

Built with Angular 22 (standalone, zoneless, signals throughout) and Supabase,
with a Deno Edge Function for the AI analysis.

---

## Features

|                  |                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Auth**         | Email sign-up and sign-in, guarded routes, session restored before first navigation                                 |
| **Transactions** | Full CRUD in a dialog, with filters by type, category, text and date range, plus server-side pagination             |
| **Dashboard**    | Balance, income and expenses with month-on-month deltas, a six-month trend, a spending meter and a category ranking |
| **AI Insights**  | A monthly written analysis: anomalies against your own history, and where the month is heading                      |
| **Profile**      | Account details and preferences                                                                                     |

Dark and light themes, responsive from mobile up.

---

## Running it

```bash
npm install
npm start
```

The app expects a Supabase project. Point `src/environments/environment.ts` at
yours, then apply the SQL in `supabase/migrations/` (in filename order) through
the Supabase SQL editor or `supabase db push`.

```bash
npm test           # 220 unit tests
npm run lint       # includes the architecture rules below
npm run build
```

---

## Architecture

```
src/app/
├── core/       Singletons used across the app: auth, layout, theme, models
├── shared/     Reusable UI with no business logic
└── features/   Lazy-loaded feature areas, one folder each
```

The dependency rules are **enforced by ESLint**, not just documented
([`eslint.config.js`](eslint.config.js) via `eslint-plugin-boundaries`):

- `core` and `shared` are self-contained — neither may import the other, nor a feature.
- A feature may import `core` and `shared`, but **never another feature**.

CI fails on a violation, so the architecture cannot quietly erode. Import
aliases (`@core/…`, `@shared/…`, `@features/…`) make the boundary visible at the
import site: `@features/…` inside `core` is obviously wrong, in a way that
`../../../../` is not.

---

## Decisions worth explaining

Most of what follows is invisible in the code unless someone digs for it.

### Aggregation happens in Postgres, not the browser

The dashboard figures and the insight inputs come from SQL functions
([`supabase/migrations/`](supabase/migrations)), not from summing rows in
Angular. The browser never downloads a year of transactions to add them up.

### Signals only — no NgRx

State lives in services as signals, with `resource()` for async reads. A
finance app of this size does not need a state-management library, and adding
one would have been ceremony rather than architecture.

Every `resource` returns `undefined` from its `params` while signed out, which
leaves it idle rather than querying without a user.

### Chart colours are validated, not chosen by eye

The income/expense pair used for figures (`#10b981` / `#f87171`) **fails a
colour-blindness check**: ΔE 4.9 under deuteranopia, below the safe floor of 6.
For two adjacent bars that means a red-green colourblind reader cannot tell the
series apart — text figures get away with it because a `+`/`−` sign carries the
meaning too.

The charts therefore use different steps of the same hue families, pushed apart
in lightness (`#006c49` / `#ea6767`): ΔE 9.9, contrast ≥ 3:1. Both come from the
app's own Material palettes. See
[`chart-colors.ts`](src/app/features/dashboard/charts/chart-colors.ts).

### The AI feature treats the model as untrusted, and never lets it do maths

- The **API key never reaches the browser**. It is a Supabase secret read only
  inside the Edge Function.
- The function talks to Postgres **as the calling user**, never with the
  `service_role` key, so row-level security still applies.
- **Every figure is computed by SQL** and handed to the model pre-formatted. The
  model's only job is prose. A hallucinated amount in a finance app is a defect,
  not a typo.
- The output is **validated twice** — in the function and again in
  [`parseInsights`](src/app/core/models/insight.model.ts) — and rendered by
  interpolation, never `innerHTML`.
- Category names are user-authored text travelling into a prompt, so they are
  fenced as data with instructions never to treat them as commands.
- Analyses are **cached per user per month**, so the model is called about once
  a month rather than on every page load.

### Testing

220 tests across 34 files. Services are tested against a mock of the Supabase
client rather than a mock of themselves, so the query being built is part of
what is asserted.

Tests were **verified by mutation**: deliberately breaking the code and checking
the right test fails. A test that passes against broken code is worse than no
test, because it buys confidence it has not earned.

---

## Deliberate trade-offs

Things left undone on purpose, rather than overlooked:

- **Charts are not screen-reader accessible.** ECharts draws to `<canvas>`, so
  the three charts are a blank to assistive technology. The fix is a visually
  hidden table carrying the same numbers.
- **Euro only.** Amounts are formatted in one place
  ([`currency.util.ts`](src/app/shared/utils/currency.util.ts)); the profile
  shows the currency as fixed rather than offering a selector that does nothing.

---

## Deployment

Static build on Cloudflare Workers, configured in
[`wrangler.jsonc`](wrangler.jsonc). The `not_found_handling` setting serves
`index.html` for unmatched paths so client-side routing survives a refresh or a
shared link.

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs formatting,
lint, tests and build on every push.
