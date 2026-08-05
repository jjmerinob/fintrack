// One file for every build. There was a second `environment.development.ts`
// swapped in by `fileReplacements`, but it differed only in a `production` flag
// nothing ever read — so it duplicated the Supabase credentials for nothing.
//
// The key below is Supabase's *publishable* key: it is meant to reach the
// browser, and row-level security is what actually protects the data. Secrets
// (the service_role key) belong in Edge Functions, never here.
export const environment = {
  supabaseUrl: 'https://nqqbaggxsbajakztloyc.supabase.co',
  supabaseKey: 'sb_publishable_Kbg-cQ22WSvfa3Co-H8gkg_IwmV6O5x',
};
