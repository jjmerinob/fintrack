/**
 * Shared presentation for every `MatDialog` in the app: a darker, blurred
 * backdrop than Material's default (~32% black, no blur), so the page behind a
 * dialog does not stay clearly readable.
 *
 * Deliberately a plain constant spread into each `.open()` call rather than a
 * `MAT_DIALOG_DEFAULT_OPTIONS` provider: `MatDialog` resolves its content
 * through the root injector, so defaults registered in a lazy route's
 * `providers` never reach the dialog. Passing them at the call site is the only
 * placement that actually works.
 *
 * The classes themselves live in `src/styles.scss`, because the backdrop element
 * is appended outside any component's view and cannot be reached by scoped
 * styles.
 */
export const DIALOG_STYLE = {
  backdropClass: 'app-dialog-backdrop',
  panelClass: 'app-dialog-panel',
} as const;
