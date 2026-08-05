import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
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
import { debounceTime, firstValueFrom } from 'rxjs';

import { Transaction } from '../../../../core/models/transaction.model';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { DIALOG_STYLE } from '../../../../shared/material/dialog.defaults';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { fromDateString, toDateString } from '../../../../shared/utils/date.util';
import {
  TransactionDialog,
  TransactionDialogData,
} from '../../components/transaction-dialog/transaction-dialog';
import { CategoriesService } from '../../services/categories.service';
import { TransactionsService, TransactionTypeFilter } from '../../services/transactions.service';

/** Long enough to swallow a burst of typing, short enough to still feel live. */
const SEARCH_DEBOUNCE_MS = 300;

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

  /**
   * What the user has typed so far. Kept local and pushed to the service only
   * after a pause, because every change of the service's filter re-runs the
   * query: without this, typing "supermarket" fired eleven requests whose
   * results were all thrown away.
   *
   * The input binds to this signal rather than to the service's debounced value,
   * so the field always shows the keystrokes immediately.
   */
  protected readonly searchTerm = signal(this.transactionsService.search());

  constructor() {
    toObservable(this.searchTerm)
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe((value) => this.transactionsService.setSearch(value));
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
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

    if (await firstValueFrom(ref.afterClosed())) {
      await this.transactionsService.delete(transaction.id);
    }
  }
}
