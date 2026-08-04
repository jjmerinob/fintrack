import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { Transaction } from '../../../../core/models/transaction.model';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { fromDateString, toDateString } from '../../../../shared/utils/date.util';
import {
  TransactionDialog,
  TransactionDialogData,
} from '../../components/transaction-dialog/transaction-dialog';
import { CategoriesService } from '../../services/categories.service';
import { TransactionsService, TransactionTypeFilter } from '../../services/transactions.service';

// Darker, blurred backdrop than Material's default (~32% black, no blur),
// so the dialog doesn't leave the list clearly readable behind it.
const DIALOG_STYLE = { backdropClass: 'app-dialog-backdrop', panelClass: 'app-dialog-panel' };

@Component({
  selector: 'app-list',
  imports: [
    AmountPipe,
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  protected readonly transactionsService = inject(TransactionsService);
  protected readonly categoriesService = inject(CategoriesService);
  private readonly dialog = inject(MatDialog);

  protected readonly displayedColumns = [
    'date',
    'category',
    'description',
    'amount',
    'actions',
  ] as const;

  protected readonly typeFilterOptions: { value: TransactionTypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'expense', label: 'Expenses' },
    { value: 'income', label: 'Income' },
  ];

  // Only offer categories that match the current type filter, so picking one
  // never contradicts the type toggle above it.
  protected readonly categoryOptions = computed(() => {
    const type = this.transactionsService.typeFilter();
    return type === 'all'
      ? this.categoriesService.categories()
      : this.categoriesService.forType(type);
  });

  protected onTypeFilterChange(type: TransactionTypeFilter): void {
    this.transactionsService.setTypeFilter(type);
    this.transactionsService.setCategoryFilter('all');
  }

  protected onCategoryFilterChange(categoryId: string): void {
    this.transactionsService.setCategoryFilter(categoryId);
  }

  protected onSearchInput(value: string): void {
    this.transactionsService.setSearch(value);
  }

  protected readonly dateFromValue = computed(() => {
    const value = this.transactionsService.dateFrom();
    return value ? fromDateString(value) : null;
  });

  protected readonly dateToValue = computed(() => {
    const value = this.transactionsService.dateTo();
    return value ? fromDateString(value) : null;
  });

  protected onStartDateChange(date: Date | null): void {
    this.transactionsService.setDateRange(
      date ? toDateString(date) : '',
      this.transactionsService.dateTo(),
    );
  }

  protected onEndDateChange(date: Date | null): void {
    this.transactionsService.setDateRange(
      this.transactionsService.dateFrom(),
      date ? toDateString(date) : '',
    );
  }

  protected onPage(event: PageEvent): void {
    this.transactionsService.setPage(event.pageIndex, event.pageSize);
  }

  protected openCreateDialog(): void {
    this.dialog.open<TransactionDialog, TransactionDialogData, boolean>(TransactionDialog, {
      ...DIALOG_STYLE,
      width: '560px',
      data: {},
    });
  }

  protected openEditDialog(transaction: Transaction): void {
    this.dialog.open<TransactionDialog, TransactionDialogData, boolean>(TransactionDialog, {
      ...DIALOG_STYLE,
      width: '560px',
      data: { transaction },
    });
  }

  protected async confirmDelete(transaction: Transaction): Promise<void> {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      ...DIALOG_STYLE,
      width: '400px',
      data: {
        title: 'Delete transaction',
        message: 'This action cannot be undone.',
        confirmLabel: 'Delete',
      },
    });

    const confirmed = await new Promise<boolean>((resolve) => {
      ref.afterClosed().subscribe((result) => resolve(!!result));
    });

    if (confirmed) {
      await this.transactionsService.delete(transaction.id);
    }
  }
}
