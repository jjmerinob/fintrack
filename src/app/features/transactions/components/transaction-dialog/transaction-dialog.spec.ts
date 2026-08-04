import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Category } from '../../../../core/models/category.model';
import { Transaction } from '../../../../core/models/transaction.model';
import { CategoriesService } from '../../services/categories.service';
import { TransactionsService } from '../../services/transactions.service';
import { TransactionDialog, TransactionDialogData } from './transaction-dialog';

describe('TransactionDialog', () => {
  let fixture: ComponentFixture<TransactionDialog>;
  let overlayContainerElement: HTMLElement;

  const dialogRef = { close: vi.fn() };
  const transactionsService = { create: vi.fn(), update: vi.fn() };

  const groceries: Category = {
    id: 'cat-groceries',
    name: 'Groceries',
    type: 'expense',
    icon: 'shopping_cart',
    user_id: null,
    created_at: '',
  };
  const salary: Category = {
    id: 'cat-salary',
    name: 'Salary',
    type: 'income',
    icon: 'payments',
    user_id: null,
    created_at: '',
  };
  const categoriesService = {
    forType: vi.fn((type: 'expense' | 'income') => (type === 'expense' ? [groceries] : [salary])),
  };

  async function setUp(data: TransactionDialogData): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TransactionDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDialog);
    overlayContainerElement = TestBed.inject(OverlayContainer).getContainerElement();
    await fixture.whenStable();
  }

  function typeButton(label: 'Expense' | 'Income'): HTMLButtonElement {
    const buttons: HTMLButtonElement[] = [
      ...fixture.nativeElement.querySelectorAll('[role=radio]'),
    ];
    const button = buttons.find((b) => b.textContent?.trim() === label);
    if (!button) {
      throw new Error(`No type button found for "${label}"`);
    }
    return button;
  }

  async function selectType(label: 'Expense' | 'Income'): Promise<void> {
    typeButton(label).click();
    await fixture.whenStable();
  }

  async function selectCategory(name: string): Promise<void> {
    fixture.nativeElement.querySelector('mat-select').click();
    await fixture.whenStable();
    const option = [...overlayContainerElement.querySelectorAll('mat-option')].find((o) =>
      o.textContent?.includes(name),
    );
    (option as HTMLElement).click();
    await fixture.whenStable();
  }

  async function submitForm(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    transactionsService.create.mockResolvedValue(undefined);
    transactionsService.update.mockResolvedValue(undefined);
    categoriesService.forType.mockImplementation((type: 'expense' | 'income') =>
      type === 'expense' ? [groceries] : [salary],
    );
  });

  describe('creating a transaction', () => {
    beforeEach(() => setUp({}));

    it('should title itself "Add transaction"', () => {
      expect(fixture.nativeElement.textContent).toContain('Add transaction');
    });

    it('should default to expense with today filled in and no category chosen', () => {
      const amount: HTMLInputElement = fixture.nativeElement.querySelector('input[type=number]');

      expect(typeButton('Expense').getAttribute('aria-checked')).toBe('true');
      expect(typeButton('Income').getAttribute('aria-checked')).toBe('false');
      expect(amount.value).toBe('0');
    });

    it('should not submit while the category is empty', async () => {
      await submitForm();

      expect(transactionsService.create).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('Category is required');
    });

    it('should reset the chosen category when the type is switched', async () => {
      await selectCategory('Groceries');
      await selectType('Income');

      // The previous (expense) category must not silently carry over: submitting
      // now should fail validation instead of saving a mismatched category.
      await submitForm();
      expect(transactionsService.create).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('Category is required');
    });

    it('should create the transaction with the selected category and close on success', async () => {
      await selectCategory('Groceries');

      const amount: HTMLInputElement = fixture.nativeElement.querySelector('input[type=number]');
      amount.value = '42.50';
      amount.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      await submitForm();

      expect(transactionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          category_id: 'cat-groceries',
          amount: 42.5,
          description: null,
        }),
      );
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show the server error and keep the dialog open on failure', async () => {
      transactionsService.create.mockRejectedValue(new Error('Network error'));
      await selectCategory('Groceries');

      const amount: HTMLInputElement = fixture.nativeElement.querySelector('input[type=number]');
      amount.value = '10';
      amount.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      await submitForm();

      expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
        'Network error',
      );
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('editing a transaction', () => {
    const existing: Transaction = {
      id: 'txn-1',
      type: 'income',
      category_id: 'cat-salary',
      amount: 1500,
      transaction_date: '2026-03-15',
      description: 'March pay',
      user_id: 'user-1',
      created_at: '',
    };

    beforeEach(() => setUp({ transaction: existing }));

    it('should title itself "Edit transaction" and pre-fill the existing values', () => {
      const amount: HTMLInputElement = fixture.nativeElement.querySelector('input[type=number]');
      const description: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');

      expect(fixture.nativeElement.textContent).toContain('Edit transaction');
      expect(typeButton('Income').getAttribute('aria-checked')).toBe('true');
      expect(amount.value).toBe('1500');
      expect(description.value).toBe('March pay');
    });

    it('should update the existing transaction by id instead of creating a new one', async () => {
      await submitForm();

      expect(transactionsService.update).toHaveBeenCalledWith(
        'txn-1',
        expect.objectContaining({ category_id: 'cat-salary', amount: 1500 }),
      );
      expect(transactionsService.create).not.toHaveBeenCalled();
    });
  });
});
