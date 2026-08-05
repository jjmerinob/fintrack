import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'Fintrack';

/**
 * Turns a route's `title` into the document title, suffixed with the app name:
 * `'Transactions'` becomes `'Transactions · Fintrack'`.
 *
 * Beyond the browser tab, this is what makes screen readers announce that the
 * page changed — a client-side navigation swaps the DOM without any of the
 * cues a full page load would give.
 */
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(routeTitle ? `${routeTitle} · ${APP_NAME}` : APP_NAME);
  }
}
