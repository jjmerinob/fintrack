import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { EmptyState } from '@shared/components/empty-state/empty-state';

/**
 * Catch-all for URLs that match no route.
 *
 * Lives in `features/` rather than `core/` for a boundary reason: it reuses the
 * shared `EmptyState`, and `core` is not allowed to import from `shared`.
 */
@Component({
  selector: 'app-not-found',
  imports: [EmptyState, MatButtonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {}
