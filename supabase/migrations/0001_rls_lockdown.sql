-- ════════════════════════════════════════════════════════════════
-- 0001 — RLS LOCKDOWN  (APPLIED — this file records what actually ran)
--
-- Closed a live exposure. The anon key ships in the public JS bundle,
-- and three permissive policies let anyone holding it read 43 customer
-- emails and read AND REWRITE 2,107 chat conversations.
--
-- The tables already had RLS enabled and mostly-correct policies. The
-- breach was not missing RLS — it was four specific bad policies.
-- ════════════════════════════════════════════════════════════════

-- ── The four dangerous policies ─────────────────────────────────
--
-- 1. allow_all_user_profiles — role {public}, cmd ALL, USING (true).
--    Blanket read/write/delete on every profile. This was the email leak.
drop policy if exists "allow_all_user_profiles" on public.user_profiles;

-- 2/3. chat_sessions read + update — USING (auth.uid() = user_id
--      OR user_id IS NULL). Every one of the 2,107 rows has a NULL
--      user_id, so the OR branch matched all of them for everyone. The
--      intent was "let anonymous users see their own chats", but with no
--      session scoping it exposed (and allowed rewriting of) all chats.
drop policy if exists "Allow users to read own chat_sessions"   on public.chat_sessions;
drop policy if exists "Allow users to update own chat_sessions" on public.chat_sessions;

-- 4. payments insert — role {public}. Anyone could forge payment rows,
--    which becomes a paywall bypass the moment entitlement derives from
--    this table. Payments must only ever be written server-side.
drop policy if exists "Enable insert for payments" on public.payments;


-- ── Replacement read policy for chat_sessions ───────────────────
-- The only policy from this migration that is still installed. Anonymous
-- history now has NO client read path; it moves server-side through the
-- Edge Function (service_role), scoped by session_id.
alter table public.chat_sessions enable row level security;
drop policy if exists cs_select_own on public.chat_sessions;
create policy cs_select_own on public.chat_sessions
  for select to authenticated
  using (user_id = auth.uid());


-- ── Deliberately LEFT IN PLACE ──────────────────────────────────
--
-- "Allow public insert to chat_sessions"  — keeps the live AI Studio
--   chatbot logging. Insert-only is the correct grant for a chat logger.
--
-- "Users can view/insert/update own profile" and users_*_own
--   — role {public} but correctly scoped with auth.uid() = id. In
--   Postgres `public` means "all roles"; for anon auth.uid() is NULL, so
--   `NULL = id` is NULL, which fails closed. These are safe.
--
-- "Users can view own payments" — correctly scoped, same reasoning.
--
-- NOT TOUCHED — the static build reads these with the anon key at build
-- time (scripts/snapshot-supabase.mjs); locking them breaks every deploy:
--   backlog_listing_public, _v2, _v3, backlog_projects, backlog_project_data,
--   micro_market_data, project_configurations, project_extended_details,
--   projects, developers


-- ════════════════════════════════════════════════════════════════
-- COLUMN TYPES — probed, not assumed. Two earlier attempts at this
-- migration failed on type mismatches, so they are recorded here:
--   user_profiles.id       uuid   (no cast)
--   chat_sessions.user_id  uuid   (no cast)
--   payments.user_id       text   (needs auth.uid()::text) <-- odd one out
--
-- Probe technique: filter the column with a non-uuid value.
--   22P02 parse error => uuid      empty result => text
-- Value format alone cannot distinguish them, since PostgREST serialises
-- a uuid column as a 36-char JSON string either way.
-- ════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- VERIFIED AFTER APPLYING (with the PUBLIC anon key)
--   user_profiles.email      0 rows   (was 43)
--   user_profiles.phone      0 rows
--   chat_sessions.content    0 rows   (was 2,107)
--   payments                 0 rows
--   all 8 build tables       still readable
--
-- Re-run any time:
--   curl "<SUPABASE_URL>/rest/v1/user_profiles?select=email&limit=1" -H "apikey: <ANON_KEY>"
--   curl "<SUPABASE_URL>/rest/v1/chat_sessions?select=content&limit=1" -H "apikey: <ANON_KEY>"
-- Both must return [].
--
-- KNOWN REGRESSION: anonymous history-on-reload in the live AI Studio
-- site. Accepted deliberately — those rows were publicly writable, and
-- tampering outweighs a cosmetic regression. Phase 1 restores it properly.
-- ════════════════════════════════════════════════════════════════
