import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../../core/auth/auth.service';
import { Transaction } from '../../../core/models/transaction.model';
import { SupabaseClientService } from '../../../core/supabase/supabase-client.service';
import { TransactionsService } from './transactions.service';

/**
 * A minimal stand-in for Supabase's chainable, awaitable query builder. Every
 * method call (`.select()`, `.eq()`, `.order()`...) is recorded as a spy and
 * returns the same proxy, so a full chain both resolves to `{ data, error }`
 * (or `{ data, error, count }`) and lets tests assert which filters were
 * applied, e.g. `expect(query.eq).toHaveBeenCalledWith('type', 'expense')`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only chain mock
function createQueryBuilder<T>(data: T, extra: Record<string, unknown> = {}): any {
  const result = { data, error: null, ...extra };
  const spies = new Map<string, ReturnType<typeof vi.fn>>();
  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  const proxy = new Proxy(builder, {
    get: (target, prop) => {
      if (prop in target) return target[prop as string];
      const name = prop as string;
      if (!spies.has(name)) {
        spies.set(
          name,
          vi.fn(() => proxy),
        );
      }
      return spies.get(name);
    },
  });
  return proxy;
}

describe('TransactionsService', () => {
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

  function createService(from: ReturnType<typeof vi.fn>, userId: string | null = 'user-1') {
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseClientService, useValue: { client: { from } } },
        { provide: AuthService, useValue: { user: signal(userId ? { id: userId } : null) } },
      ],
    });
    return TestBed.inject(TransactionsService);
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
  }

  it('should expose the loaded transactions and total count', async () => {
    const query = createQueryBuilder([txn], { count: 7 });
    const from = vi.fn().mockReturnValue(query);
    const service = createService(from);
    await settle();

    expect(service.transactions()).toEqual([txn]);
    expect(service.totalCount()).toBe(7);
  });

  it('should query the first page with the default page size', async () => {
    const query = createQueryBuilder([], { count: 0 });
    const from = vi.fn().mockReturnValue(query);
    createService(from);
    await settle();

    expect(query.range).toHaveBeenCalledWith(0, 9);
  });

  it('should not filter by type, category, search or date range by default', async () => {
    const query = createQueryBuilder([], { count: 0 });
    const from = vi.fn().mockReturnValue(query);
    createService(from);
    await settle();

    expect(query.eq).not.toHaveBeenCalled();
    expect(query.ilike).not.toHaveBeenCalled();
    expect(query.gte).not.toHaveBeenCalled();
    expect(query.lte).not.toHaveBeenCalled();
  });

  it('should apply the type, category, search and date range filters once set', async () => {
    const query = createQueryBuilder([], { count: 0 });
    const from = vi.fn().mockReturnValue(query);
    const service = createService(from);
    await settle();

    service.setTypeFilter('expense');
    service.setCategoryFilter('cat-groceries');
    service.setSearch('coffee');
    service.setDateRange('2026-01-01', '2026-01-31');
    await settle();

    expect(query.eq).toHaveBeenCalledWith('type', 'expense');
    expect(query.eq).toHaveBeenCalledWith('category_id', 'cat-groceries');
    expect(query.ilike).toHaveBeenCalledWith('description', '%coffee%');
    expect(query.gte).toHaveBeenCalledWith('transaction_date', '2026-01-01');
    expect(query.lte).toHaveBeenCalledWith('transaction_date', '2026-01-31');
  });

  it('should reset the page to 0 whenever a filter changes', async () => {
    const query = createQueryBuilder([], { count: 0 });
    const from = vi.fn().mockReturnValue(query);
    const service = createService(from);
    await settle();

    service.setPage(3, 10);
    await settle();
    expect(service.pageIndex()).toBe(3);

    service.setSearch('coffee');
    await settle();

    expect(service.pageIndex()).toBe(0);
  });

  it('should request the correct range for a later page', async () => {
    const query = createQueryBuilder([], { count: 0 });
    const from = vi.fn().mockReturnValue(query);
    const service = createService(from);
    await settle();

    service.setPage(2, 25);
    await settle();

    expect(query.range).toHaveBeenCalledWith(50, 74);
  });

  it('should stamp the current user id when creating a transaction and reload the list', async () => {
    const listQuery = createQueryBuilder([], { count: 0 });
    const insertQuery = createQueryBuilder(null);
    const from = vi.fn().mockReturnValue(listQuery);
    const service = createService(from);
    await settle();

    from.mockReturnValueOnce(insertQuery);
    await service.create({
      type: 'expense',
      category_id: 'cat-groceries',
      amount: 12,
      transaction_date: '2026-03-20',
      description: null,
    });
    // create() reloads the list resource; let that second loader run settle too.
    await settle();

    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 12, user_id: 'user-1' }),
    );
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('should refuse to create a transaction while signed out', async () => {
    const query = createQueryBuilder([], { count: 0 });
    const from = vi.fn().mockReturnValue(query);
    const service = createService(from, null);
    await settle();

    await expect(
      service.create({
        type: 'expense',
        category_id: 'cat-groceries',
        amount: 12,
        transaction_date: '2026-03-20',
        description: null,
      }),
    ).rejects.toThrow('signed out');
  });

  it('should update a transaction by id', async () => {
    const listQuery = createQueryBuilder([], { count: 0 });
    const updateQuery = createQueryBuilder(null);
    const from = vi.fn().mockReturnValue(listQuery);
    const service = createService(from);
    await settle();

    from.mockReturnValueOnce(updateQuery);
    await service.update('txn-1', { amount: 30 });

    expect(updateQuery.update).toHaveBeenCalledWith({ amount: 30 });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'txn-1');
  });

  it('should delete a transaction by id', async () => {
    const listQuery = createQueryBuilder([], { count: 0 });
    const deleteQuery = createQueryBuilder(null);
    const from = vi.fn().mockReturnValue(listQuery);
    const service = createService(from);
    await settle();

    from.mockReturnValueOnce(deleteQuery);
    await service.delete('txn-1');

    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'txn-1');
  });

  it('should surface errors from a failed mutation', async () => {
    const listQuery = createQueryBuilder([], { count: 0 });
    const failingQuery = createQueryBuilder(null, { error: new Error('RLS violation') });
    const from = vi.fn().mockReturnValue(listQuery);
    const service = createService(from);
    await settle();

    from.mockReturnValueOnce(failingQuery);
    await expect(service.delete('txn-1')).rejects.toThrow('RLS violation');
  });
});
