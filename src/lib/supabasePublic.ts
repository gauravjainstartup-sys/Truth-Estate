/* ════════════════════════════════════════════════════════════════
   PUBLIC SUPABASE COORDINATES — safe to ship to the browser.

   The anon key is public by design: Row-Level Security is the boundary,
   not secrecy of the key (the build already reads every public view with
   it, and the old AI-Studio client read the same tables the same way).

   Why its OWN module: the build-time reader (supabase.ts) dynamically
   imports `fs/promises` for the fixture path. Pulling that module into a
   client bundle drags a Node built-in the browser can't resolve. Keeping
   the two constants here — with NO Node-only code — lets a client module
   read Supabase at runtime without importing supabase.ts at all.

   supabase.ts keeps its own copies for the build. If the project ref or
   anon key ever changes, update BOTH (they are the same two values).
   ════════════════════════════════════════════════════════════════ */

export const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_bLpHCRL6Xa0viqYeEuM3NA_U5VvNWwq";
