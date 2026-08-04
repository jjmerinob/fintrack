import { Pipe, PipeTransform } from '@angular/core';

import { formatAmount } from '../utils/currency.util';

/**
 * Formats a euro amount for templates: `{{ row.amount | amount }}`.
 *
 * Replaces Angular's `CurrencyPipe`, which puts the symbol on the left. Pure, so
 * a table of rows only reformats the cells whose value actually changed.
 */
@Pipe({ name: 'amount' })
export class AmountPipe implements PipeTransform {
  transform(value: number): string {
    return formatAmount(value);
  }
}
