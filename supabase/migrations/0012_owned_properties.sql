-- ════════════════════════════════════════════════════════════════
-- 0012 — OWNED PROPERTIES (My Portfolio, per account)
--
-- The office's "I've invested / I own this" declaration lives only in the
-- browser today (localStorage truthEstate.office.owned), so it does not
-- follow the buyer to a second device. This is the account-backed home for
-- it: one row per (user, report), self-declared, no proof — exactly what
-- the localStorage map holds, moved server-side under RLS.
--
-- The columns mirror the shape the office already renders (OwnedRecord):
-- the report's INTERNAL slug as the key (the same id events and
-- entitlements use — NOT the public URL), plus the name / market / seo_slug
-- needed to link and label it, an optional note, and the marked-at time.
--
-- Safe to run more than once, and safe on a live database: it only ADDS a
-- table and its policies, touching no existing row. Reads and writes are
-- the buyer's OWN rows only, enforced by RLS on auth.uid() — the client
-- writes these directly with its session, the same own-row path Phase 1
-- uses for user_profiles.
--
-- The client wiring (read + write + a local↔server merge on first load)
-- ships only AFTER this table exists and its isolation is proven with the
-- session-mint check, so nothing depends on an unverified write path.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.owned_properties (
  user_id    uuid not null references auth.users(id) on delete cascade,
  slug       text not null,                       -- internal report id (liveSlug), NOT the URL
  name       text,
  market     text,
  seo_slug   text,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)                       -- one declaration per report per person; upsert-friendly
);

create index if not exists owned_properties_user_idx
  on public.owned_properties (user_id, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────
-- Own-row only, all four verbs. In Postgres a policy that fails its
-- auth.uid() test simply matches no rows, and for anon (auth.uid() IS NULL)
-- `NULL = user_id` is NULL — so the table fails closed for the public and
-- opens only to the row's own signed-in owner.
alter table public.owned_properties enable row level security;

drop policy if exists owned_select_own on public.owned_properties;
create policy owned_select_own on public.owned_properties
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists owned_insert_own on public.owned_properties;
create policy owned_insert_own on public.owned_properties
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists owned_update_own on public.owned_properties;
create policy owned_update_own on public.owned_properties
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists owned_delete_own on public.owned_properties;
create policy owned_delete_own on public.owned_properties
  for delete to authenticated
  using (user_id = auth.uid());

comment on table public.owned_properties is
  'Self-declared portfolio (My Portfolio). One row per (user_id, slug). RLS: own rows only.';
