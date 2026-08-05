import { Component, computed, effect, inject, signal } from '@angular/core';
import { form, FormField, min, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { Transaction, TransactionType } from '@core/models/transaction.model';
import { fromDateString, toDateString } from '@shared/utils/date.util';
import { CategoriesService } from '../../services/categories.service';
import { TransactionsService } from '../../services/transactions.service';

export interface TransactionDialogData {
  /** Omit for creating a new transaction; pass the existing one to edit it. */
  readonly transaction?: Transaction;
}

@Component({
  selector: 'app-transaction-dialog',
  imports: [
    FormField,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './transaction-dialog.html',
  styleUrl: './transaction-dialog.scss',
})
export class TransactionDialog {
  private readonly data = inject<TransactionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TransactionDialog, boolean>);
  private readonly transactionsService = inject(TransactionsService);
  protected readonly categoriesService = inject(CategoriesService);

  protected readonly isEditing = !!this.data.transaction;

  protected readonly typeOptions: { value: TransactionType; label: string }[] = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
  ];

  protected readonly model = signal({
    type: this.data.transaction?.type ?? 'expense',
    categoryId: this.data.transaction?.category_id ?? '',
    amount: this.data.transaction?.amount ?? 0,
    transactionDate: this.data.transaction
      ? fromDateString(this.data.transaction.transaction_date)
      : new Date(),
    description: this.data.transaction?.description ?? '',
  });

  protected readonly transactionForm = form(this.model, (path) => {
    required(path.type, { message: 'Type is required' });
    required(path.categoryId, { message: 'Category is required' });
    min(path.amount, 0.01, { message: 'Amount must be greater than 0' });
    required(path.transactionDate, { message: 'Date is required' });
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  // Narrowed to just `type`, so the effect below only re-runs when the type
  // itself changes rather than on every keystroke elsewhere in the form.
  private readonly type = computed(() => this.model().type);

  constructor() {
    // The category list depends on the transaction type, so a category from
    // the previous type is no longer valid once the type changes.
    let previousType = this.type();
    effect(() => {
      const currentType = this.type();
      if (currentType !== previousType) {
        previousType = currentType;
        this.model.update((value) => ({ ...value, categoryId: '' }));
      }
    });
  }

  protected setType(type: TransactionType): void {
    this.model.update((value) => ({ ...value, type }));
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    submit(this.transactionForm, async () => {
      this.serverError.set(null);
      this.submitting.set(true);

      try {
        const { type, categoryId, amount, transactionDate, description } = this.model();
        const changes = {
          type,
          category_id: categoryId,
          amount,
          transaction_date: toDateString(transactionDate),
          description: description || null,
        };

        if (this.data.transaction) {
          await this.transactionsService.update(this.data.transaction.id, changes);
        } else {
          await this.transactionsService.create(changes);
        }

        this.dialogRef.close(true);
      } catch (error) {
        this.serverError.set(
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        );
      } finally {
        this.submitting.set(false);
      }
    });
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
