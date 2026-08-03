import { Database } from './database.types';

/** A user profile as stored in the `profiles` table. */
export type Profile = Database['public']['Tables']['profiles']['Row'];

/** Editable subset of a profile, used when updating account settings. */
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
