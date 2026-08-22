-- ════════════════════════════════════════════════════════════════
-- 0025 — REPORT STAKES (the report↔user relationship, one row per pair)
--
-- Consolidates three signals that were scattered across localStorage and
-- the event trail into ONE first-class relationship table:
--   • the self-declared portfolio ("I own this")   — was owned_properties
--   • the unlock-modal stake (invested/considering) — was events only
--   • "opened this report"                          — was events only
-- plus a per-project persona override (investor for THIS one) that the
-- match engine can prefer over the account-level persona.
--
-- This is a RENAME of owned_properties (2 rows in prod — trivially safe),
-- not a new table, so its RLS shape, indexes and (user_id, slug) grain
-- carry over untouched. New columns are all nullable/defaulted, so the
-- rename touches no existing row's data.
--
-- ── ZERO-DOWNTIME on a SHARED database ──
-- Staging and production point at the SAME Supabase project, and the
-- production client deployed right now still reads/writes owned_properties.
-- So a bare rename would 404 the live client the instant this runs.
-- A compatibility VIEW named owned_properties (security_invoker, so the
-- caller's RLS on report_stakes still applies) keeps the old client's
-- READS working through the cutover; its portfolio writes fall back to
-- localStorage in the meantime (the pre-0012 behaviour, already handled
-- as best-effort). Drop the view in a follow-up once prod runs the new
-- client.
--
-- Safe to run more than once.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · rename the table (metadata-only; data and PK preserved) ──
alter table if exists public.owned_properties rename to report_stakes;

-- carry the indexes' names along so nothing dangles (best-effort renames)
alter index if exists owned_properties_pkey     rename to report_stakes_pkey;
alter index if exists owned_properties_user_idx rename to report_stakes_user_idx;

-- ── 2 · new relationship columns (all additive, nullable) ──
alter table public.report_stakes
  add column if not exists stake           text,        -- 'invested' | 'considering' | null
  add column if not exists persona         text,        -- per-project override: 'investor' | 'end-user' | null
  add column if not exists first_viewed_at timestamptz default now(), -- set once on insert, never overwritten (client omits it on later touches); backfill corrects it to the true min(report_viewed)
  add column if not exists last_viewed_at  timestamptz;

-- Every row that existed BEFORE this migration came from owned_properties,
-- which meant exactly "I own / have invested in this". Stamp that so the
-- portfolio (stake = 'invested') keeps showing them.
update public.report_stakes set stake = 'invested' where stake is null;

-- Guard the vocabulary — a typo'd stake would quietly drop out of every
-- 'invested'/'considering' filter. NOT VALID first so the statement can't
-- fail on any legacy row, then validate.
do $$ begin
  alter table public.report_stakes
    add constraint report_stakes_stake_chk
    check (stake is null or stake in ('invested','considering')) not valid;
exception when duplicate_object then null; end $$;
alter table public.report_stakes validate constraint report_stakes_stake_chk;

-- Persona casing matches the EXISTING user_profiles.persona column already
-- live in this database ('Investor' / 'End-User', Title-Case) — the two
-- persona homes share one vocabulary rather than inventing a second.
do $$ begin
  alter table public.report_stakes
    add constraint report_stakes_persona_chk
    check (persona is null or persona in ('Investor','End-User')) not valid;
exception when duplicate_object then null; end $$;
alter table public.report_stakes validate constraint report_stakes_persona_chk;

comment on table public.report_stakes is
  'Report↔user relationship, one row per (user_id, slug): self-declared stake (invested/considering), per-project persona override, and view timestamps. RLS: own rows only.';

-- ── 3 · RLS policies — rename the four own-row policies to match ──
-- (The table already had RLS enabled with owned_* policies; recreate them
--  under report_stakes_* names so the intent reads clearly. Idempotent.)
alter table public.report_stakes enable row level security;

drop policy if exists owned_select_own  on public.report_stakes;
drop policy if exists owned_insert_own  on public.report_stakes;
drop policy if exists owned_update_own  on public.report_stakes;
drop policy if exists owned_delete_own  on public.report_stakes;

drop policy if exists report_stakes_select_own on public.report_stakes;
create policy report_stakes_select_own on public.report_stakes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists report_stakes_insert_own on public.report_stakes;
create policy report_stakes_insert_own on public.report_stakes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists report_stakes_update_own on public.report_stakes;
create policy report_stakes_update_own on public.report_stakes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists report_stakes_delete_own on public.report_stakes;
create policy report_stakes_delete_own on public.report_stakes
  for delete to authenticated using (user_id = auth.uid());

-- ── 4 · backward-compat VIEW for the still-deployed prod client ──
-- security_invoker → the caller's RLS on report_stakes governs, so anon
-- still gets nothing (rls-guard covers both names). Simple single-table
-- projection ⇒ auto-updatable, so the old client's reads work; its
-- upsert may fall back to localStorage during the cutover, which is safe.
create or replace view public.owned_properties
  with (security_invoker = true) as
  select user_id, slug, name, market, seo_slug, note, created_at, updated_at
  from public.report_stakes
  where stake = 'invested';
grant select, insert, update, delete on public.owned_properties to authenticated;
comment on view public.owned_properties is
  'DEPRECATED compat view over report_stakes (stake=invested). Drop once prod runs the new client. See migration 0025.';

-- ── 5 · account-level persona: ALREADY EXISTS ──
-- user_profiles.persona is already live in this database, populated
-- 'Investor'/'End-User' (Title-Case) by an earlier schema. This migration
-- does NOT re-create or constrain it — that column is owned elsewhere and
-- our client simply conforms to its casing (see saveBriefToServer). The
-- earlier draft of this file added a lowercase CHECK here and the run
-- aborted on the existing Title-Case rows; that block is intentionally
-- gone. The backfill (0026) only FILLS its nulls, never rewrites a value.
