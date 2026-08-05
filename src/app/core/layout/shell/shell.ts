import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { Header } from '../header/header';
import { Sidenav } from '../sidenav/sidenav';

/** Matches Tailwind's `lg` breakpoint, so the hamburger button in the header
 *  and the sidenav's permanent/overlay mode switch at the same width. */
const DESKTOP_QUERY = '(min-width: 1024px)';

@Component({
  selector: 'app-shell',
  imports: [Header, MatSidenavModule, RouterOutlet, Sidenav],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe(DESKTOP_QUERY)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly sidenavMode = computed(() => (this.isDesktop() ? 'side' : 'over'));
  protected readonly sidenavOpened = signal(false);

  constructor() {
    // Keeps the sidenav permanently open once there is room for it, and
    // closed by default on mobile where it would otherwise cover the content.
    // Re-runs whenever the breakpoint is crossed, e.g. by resizing the window.
    effect(() => this.sidenavOpened.set(this.isDesktop()));
  }

  /** Navigating from a nav link should only auto-close the overlay sidenav on mobile. */
  protected closeOnMobileNavigation(): void {
    if (!this.isDesktop()) {
      this.sidenavOpened.set(false);
    }
  }
}
