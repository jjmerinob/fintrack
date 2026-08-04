import { Component, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Transactions', path: '/transactions', icon: 'receipt_long' },
  { label: 'AI Insights', path: '/ai-insights', icon: 'auto_awesome' },
];

@Component({
  selector: 'app-sidenav',
  imports: [MatIconModule, MatListModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav {
  protected readonly links = NAV_LINKS;

  /** Lets the shell close the overlay sidenav on mobile after a navigation. */
  readonly linkClicked = output<void>();
}
