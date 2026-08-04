import { computed, inject, resource, Service, signal } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import {
  Transaction,
  TransactionInsert,
  TransactionType,
  TransactionUpdate,
} from '../../../core/models/transaction.model';
import { SupabaseClientService } from '../../../core/supabase/supabase-client.service';

export type TransactionTypeFilter = TransactionType | 'all';

const DEFAULT_PAGE_SIZE = 10;

@Service()
export class TransactionsService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly auth = inject(AuthService);

  private readonly _typeFilter = signal<TransactionTypeFilter>('all');
  private readonly _categoryFilter = signal<string | 'all'>('all');
  private readonly _search = signal('');
  private readonly _dateFrom = signal('');
  private readonly _dateTo = signal('');
  private readonly _pageIndex = signal(0);
  private readonly _pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly typeFilter = this._typeFilter.asReadonly();
  readonly categoryFilter = this._categoryFilter.asReadonly();
  readonly search = this._search.asReadonly();
  readonly dateFrom = this._dateFrom.asReadonly();
  readonly dateTo = this._dateTo.asReadonly();
  readonly pageIndex = this._pageIndex.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  private readonly listResource = resource({
    params: () => ({
      userId: this.auth.user()?.id,
      type: this._typeFilter(),
      categoryId: this._categoryFilter(),
      search: this._search(),
      dateFrom: this._dateFrom(),
      dateTo: this._dateTo(),
      pageIndex: this._pageIndex(),
      pageSize: this._pageSize(),
    }),
    loader: async ({ params }) => {
      const from = params.pageIndex * params.pageSize;
      const to = from + params.pageSize - 1;

      let query = this.supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('transaction_date', { ascending: false })
        .range(from, to);

      if (params.type !== 'all') {
        query = query.eq('type', params.type);
      }
      if (params.categoryId !== 'all') {
        query = query.eq('category_id', params.categoryId);
      }
      if (params.search) {
        query = query.ilike('description', `%${params.search}%`);
      }
      if (params.dateFrom) {
        query = query.gte('transaction_date', params.dateFrom);
      }
      if (params.dateTo) {
        query = query.lte('transaction_date', params.dateTo);
      }

      const { data, count, error } = await query;
      if (error) {
        throw error;
      }
      return { transactions: data, totalCount: count ?? 0 };
    },
  });

  readonly transactions = computed<Transaction[]>(
    () => this.listResource.value()?.transactions ?? [],
  );
  readonly totalCount = computed(() => this.listResource.value()?.totalCount ?? 0);
  readonly isLoading = this.listResource.isLoading;

  setTypeFilter(type: TransactionTypeFilter): void {
    this._typeFilter.set(type);
    this._pageIndex.set(0);
  }

  setCategoryFilter(categoryId: string | 'all'): void {
    this._categoryFilter.set(categoryId);
    this._pageIndex.set(0);
  }

  setSearch(search: string): void {
    this._search.set(search);
    this._pageIndex.set(0);
  }

  setDateRange(from: string, to: string): void {
    this._dateFrom.set(from);
    this._dateTo.set(to);
    this._pageIndex.set(0);
  }

  setPage(pageIndex: number, pageSize: number): void {
    this._pageIndex.set(pageIndex);
    this._pageSize.set(pageSize);
  }

  async create(transaction: Omit<TransactionInsert, 'user_id'>): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      throw new Error('Cannot create a transaction while signed out.');
    }

    const { error } = await this.supabase
      .from('transactions')
      .insert({ ...transaction, user_id: userId });

    if (error) {
      throw error;
    }
    this.listResource.reload();
  }

  async update(id: string, changes: TransactionUpdate): Promise<void> {
    const { error } = await this.supabase.from('transactions').update(changes).eq('id', id);

    if (error) {
      throw error;
    }
    this.listResource.reload();
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('transactions').delete().eq('id', id);

    if (error) {
      throw error;
    }
    this.listResource.reload();
  }
}
