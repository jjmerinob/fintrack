import { vi } from 'vitest';

/**
 * A minimal stand-in for Supabase's chainable, awaitable query builder.
 *
 * Every method call (`.select()`, `.eq()`, `.order()`, `.single()`…) is recorded
 * as a spy and returns the same proxy, so a full chain both resolves to the
 * fixed result and lets a test assert which filters were applied:
 *
 * ```ts
 * const query = createQueryBuilder([row], { count: 1 });
 * const from = vi.fn().mockReturnValue(query);
 * // …
 * expect(query.eq).toHaveBeenCalledWith('type', 'expense');
 * ```
 *
 * Lives outside `src/app` on purpose: it is test scaffolding, not application
 * code, so it sits outside the core/shared/features boundaries entirely and can
 * be imported by any spec without crossing them.
 *
 * @param data  the `data` field the chain resolves to
 * @param extra extra fields to merge into the result, e.g. `{ count: 7 }` for a
 *              counted select or `{ error: new Error(…) }` for a failure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the real builder is chainable and untypeable here
export function createQueryBuilder<T>(data: T, extra: Record<string, unknown> = {}): any {
  const result = { data, error: null, ...extra };
  const spies = new Map<string, ReturnType<typeof vi.fn>>();

  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };

  const proxy = new Proxy(builder, {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop as string];
      }
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
