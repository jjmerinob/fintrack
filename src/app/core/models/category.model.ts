import { Database } from './database.types';

/** A category as stored in the `categories` table. `user_id: null` means a
 *  system-wide category visible to everyone; otherwise it belongs to a user. */
export type Category = Database['public']['Tables']['categories']['Row'];
