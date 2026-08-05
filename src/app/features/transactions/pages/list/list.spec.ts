import { provideNativeDateAdapter } from '@angular/material/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { Category } from '../../../../core/models/category.model';
import { Transaction } from '../../../../core/models/transaction.model';
import { CategoriesService } from '../../services/categories.service';
import { TransactionsService } from '../../services/transactions.service';
import { List } from './list';

describe('List', () => {
  let fixture: ComponentFixture<List>;

  const groceries: Category = {
    id: 'cat-groceries',
    name: 'Groceries',
    type: 'expense',
    icon: 'shopping_cart',
    user_id: null,
    created_at: '',
  };

  const txn: Transaction = {
    id: 'txn-1',
    type: 'expense',
    category_id: 'cat-groceries',
    amount: 25,
    transaction_date: '2026-03-15',
    description: 'Supermarket',
    user_id: 'user-1',
    created_at: '',
  };

  const transactionsService = {
    transactions: vi.fn(() => [] as Transaction[]),
    totalCount: vi.fn(() => 0),
    isLoading: vi.fn(() => false),
    typeFilter: vi.fn(() => 'all' as const),
    categoryFilter: vi.fn(() => 'all' as const),
    search: vi.fn(() => ''),
    dateFrom: vi.fn(() => ''),
    dateTo: vi.fn(() => ''),
    pageIndex: vi.fn(() => 0),
    pageSize: vi.fn(() => 10),
    setTypeFilter: vi.fn(),
    setCategoryFilter: vi.fn(),
    setSearch: vi.fn(),
    setDateRange: vi.fn(),
    setPage: vi.fn(),
    delete: vi.fn(),
  };

  const categoriesService = {
    categories: vi.fn(() => [groceries]),
    forType: vi.fn(() => [groceries]),
    byId: vi.fn((id: string) => (id === groceries.id ? groceries : undefined)),
  };

  const dialog = { open: vi.fn() };

  async function setUp(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [List],
      providers: [
        provideNativeDateAdapter(),
        { provide: TransactionsService, useValue: transactionsService },
        { provide: CategoriesService, useValue: categoriesService },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(List);
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    transactionsService.transactions.mockReturnValue([]);
    transactionsService.totalCount.mockReturnValue(0);
    transactionsService.isLoading.mockReturnValue(false);
    transactionsService.typeFilter.mockReturnValue('all');
    transactionsService.categoryFilter.mockReturnValue('all');
    transactionsService.search.mockReturnValue('');
    transactionsService.dateFrom.mockReturnValue('');
    transactionsService.dateTo.mockReturnValue('');
    transactionsService.pageIndex.mockReturnValue(0);
    transactionsService.pageSize.mockReturnValue(10);
    categoriesService.categories.mockReturnValue([groceries]);
    categoriesService.forType.mockReturnValue([groceries]);
    categoriesService.byId.mockImplementation((id: string) =>
      id === groceries.id ? groceries : undefined,
    );
  });

  it('should show the empty state when there are no transactions', async () => {
    await setUp();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('table')).toBeFalsy();
  });

  it('should render a row per transaction with a signed, colored amount', async () => {
    transactionsService.transactions.mockReturnValue([txn]);
    transactionsService.totalCount.mockReturnValue(1);
    await setUp();

    const amountCell = fixture.nativeElement.querySelector('.text-expense');
    expect(amountCell?.textContent).toContain('−');
    expect(fixture.nativeElement.textContent).toContain('Groceries');
    expect(fixture.nativeElement.textContent).toContain('Supermarket');
  });

  it('should filter by type and reset the category filter when a type pill is clicked', async () => {
    await setUp();

    const expenseButton = [...fixture.nativeElement.querySelectorAll('[role=radio]')].find(
      (btn: HTMLElement) => btn.textContent?.trim() === 'Expenses',
    );
    expenseButton.click();

    expect(transactionsService.setTypeFilter).toHaveBeenCalledWith('expense');
    expect(transactionsService.setCategoryFilter).toHaveBeenCalledWith('all');
  });

  describe('search', () => {
    /** One debounce window plus a margin, so the pending emission has landed. */
    const AFTER_DEBOUNCE_MS = 350;

    function typeSearch(value: string): void {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        'input[matinput]:not([type=number])',
      );
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }

    async function wait(ms: number): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await fixture.whenStable();
    }

    it('should not hit the service on every keystroke', async () => {
      await setUp();
      await wait(AFTER_DEBOUNCE_MS);
      transactionsService.setSearch.mockClear();

      typeSearch('s');
      typeSearch('su');
      typeSearch('sup');
      await fixture.whenStable();

      // Each of those would have been a separate Supabase round-trip before.
      expect(transactionsService.setSearch).not.toHaveBeenCalled();
    });

    it('should send only the final term once typing pauses', async () => {
      await setUp();
      await wait(AFTER_DEBOUNCE_MS);
      transactionsService.setSearch.mockClear();

      typeSearch('s');
      typeSearch('su');
      typeSearch('sup');
      await wait(AFTER_DEBOUNCE_MS);

      expect(transactionsService.setSearch).toHaveBeenCalledTimes(1);
      expect(transactionsService.setSearch).toHaveBeenCalledWith('sup');
    });

    it('should keep showing what was typed while the term is still pending', async () => {
      await setUp();
      typeSearch('coffee');
      await fixture.whenStable();

      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        'input[matinput]:not([type=number])',
      );
      // The field binds to the local signal, not the service's debounced value,
      // so the text must not disappear during the pause.
      expect(input.value).toBe('coffee');
    });
  });

  it('should forward paginator events to the service', async () => {
    transactionsService.transactions.mockReturnValue([txn]);
    transactionsService.totalCount.mockReturnValue(30);
    await setUp();

    fixture.componentInstance['onPage']({ pageIndex: 2, pageSize: 25, length: 30 });

    expect(transactionsService.setPage).toHaveBeenCalledWith(2, 25);
  });

  it('should open the create dialog with no transaction data', async () => {
    await setUp();
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });

    fixture.nativeElement.querySelector('button').click();

    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: {} }),
    );
  });

  it('should open the edit dialog with the clicked transaction', async () => {
    transactionsService.transactions.mockReturnValue([txn]);
    transactionsService.totalCount.mockReturnValue(1);
    await setUp();
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });

    fixture.nativeElement.querySelector('button[aria-label="Edit transaction"]').click();

    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: { transaction: txn } }),
    );
  });

  it('should delete the transaction only after the confirmation dialog resolves true', async () => {
    transactionsService.transactions.mockReturnValue([txn]);
    transactionsService.totalCount.mockReturnValue(1);
    await setUp();
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });

    fixture.nativeElement.querySelector('button[aria-label="Delete transaction"]').click();
    await fixture.whenStable();

    expect(transactionsService.delete).toHaveBeenCalledWith('txn-1');
  });

  it('should not delete the transaction when the confirmation is cancelled', async () => {
    transactionsService.transactions.mockReturnValue([txn]);
    transactionsService.totalCount.mockReturnValue(1);
    await setUp();
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });

    fixture.nativeElement.querySelector('button[aria-label="Delete transaction"]').click();
    await fixture.whenStable();

    expect(transactionsService.delete).not.toHaveBeenCalled();
  });
});
