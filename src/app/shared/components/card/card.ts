import { Component, input } from '@angular/core';

/** A titled surface panel. Layout only — callers project whatever content they need. */
@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  readonly title = input('');
  readonly subtitle = input('');
}
