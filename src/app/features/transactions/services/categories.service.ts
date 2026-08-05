import { computed, inject, resource, Service } from '@angular/core';

import { AuthService } from '@core/auth/auth.service';
import { Category } from '@core/models/category.model';
import { TransactionType } from '@core/models/transaction.model';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';

@Service()
export class CategoriesService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly auth = inject(AuthService);

  // System categories (user_id null) plus the user's own; RLS enforces the
  // visibility rule, this just avoids fetching before there is a user.
  private readonly categoriesResource = resource({
    params: () => this.auth.user()?.id,
    loader: async () => {
      const { data, error } = await this.supabase.from('categories').select('*').order('name');

      if (error) {
        throw error;
      }
      return data;
    },
  });

  readonly categories = computed<Category[]>(() => this.categoriesResource.value() ?? []);
  private readonly byIdMap = computed(() => new Map(this.categories().map((c) => [c.id, c])));
  readonly isLoading = this.categoriesResource.isLoading;

  /** Categories a transaction of the given type is allowed to use. */
  forType(type: TransactionType): Category[] {
    return this.categories().filter((category) => category.type === type);
  }

  byId(id: string): Category | undefined {
    return this.byIdMap().get(id);
  }
}
