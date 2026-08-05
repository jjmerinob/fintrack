import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '@core/auth/auth.service';
import { Category } from '@core/models/category.model';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { CategoriesService } from './categories.service';
import { createQueryBuilder } from '@testing/supabase-mock';

describe('CategoriesService', () => {
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

  function createService(categories: Category[]): CategoriesService {
    const from = vi.fn().mockReturnValue(createQueryBuilder(categories));

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseClientService, useValue: { client: { from } } },
        { provide: AuthService, useValue: { user: signal({ id: 'user-1' }) } },
      ],
    });
    return TestBed.inject(CategoriesService);
  }

  it('should filter categories by type', async () => {
    const service = createService([groceries, salary]);
    // Let the resource's async loader (a microtask chain) settle.
    await new Promise((resolve) => setTimeout(resolve));

    expect(service.forType('expense')).toEqual([groceries]);
    expect(service.forType('income')).toEqual([salary]);
  });

  it('should look up a category by id', async () => {
    const service = createService([groceries, salary]);
    await new Promise((resolve) => setTimeout(resolve));

    expect(service.byId('cat-salary')).toEqual(salary);
    expect(service.byId('missing')).toBeUndefined();
  });
});
