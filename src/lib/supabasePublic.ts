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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";
