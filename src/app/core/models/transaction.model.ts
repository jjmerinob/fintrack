import { Database } from './database.types';

export type TransactionType = Database['public']['Enums']['transaction_type'];

/** A transaction as stored in the `transactions` table. */
export type Transaction = Database['public']['Tables']['transactions']['Row'];

/** Fields required to record a new transaction. */
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

/** Editable subset of a transaction, used when updating an existing one. */
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
