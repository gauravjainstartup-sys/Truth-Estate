-- ════════════════════════════════════════════════════════════════
-- 0002 — LEAD CAPTURE
--
-- Every lead the site has ever taken was written to the visitor's own
-- localStorage and nowhere else. Floor-plan requests, brochure requests,
-- Buyer's Office sign-ups, custom report enquiries, report feedback —
-- ten call sites, none of which the business could see.
--
-- EXTENDS public.contact_leads rather than adding a second table. It
-- already carries name / email / phone / project_name / message / user_id
-- and holds live rows, so a parallel `leads` table would only split lead
-- capture across two places forever.
--
-- Every statement here is ADDITIVE: new nullable columns, new indexes,
-- and RLS. Nothing existing is dropped or rewritten, so whatever writes
-- to contact_leads today keeps working untouched.
-- ════════════════════════════════════════════════════════════════

-- ── New columns ─────────────────────────────────────────────────
alter table public.contact_leads
  -- Controlled vocabulary mirroring the Lead union in src/lib/journey.ts.
  -- Deliberately NOT reusing the existing free-text `context`/`subject`,
  -- whose semantics belong to whatever writes them today.
  add column if not exists intent       text,
  -- Requested documents (intent 'documents').
  add column if not exists docs         text[],
  -- Who is reporting — Developer / Investor / End User / Broker.
  add column if not exists identity     text,
  -- Structured extras: the BuyData profile on buyer-office leads, the brief
  -- on custom-report leads. jsonb so form shapes can evolve without a
  -- migration — this table must never be why a form cannot ship.
  add column if not exists payload      jsonb,
  -- Links to chat_sessions.session_id, so a lead can be read alongside the
  -- conversation that produced it and claimed by the stitch RPC (0003).
  add column if not exists session_id   text,
  add column if not exists source       text,
  add column if not exists referrer     text,
  add column if not exists user_agent   text,
  -- This is a worklist, not just a log.
  add column if not exists status       text not null default 'new',
  add column if not exists contacted_at timestamptz,
  add column if not exists notes        text,
  add column if not exists project_slug text;

-- Constraint added separately so existing rows (which have no status yet,
-- and therefore take the 'new' default) cannot fail the migration.
alter table public.contact_leads
  drop constraint if exists contact_leads_status_check;
alter table public.contact_leads
  add constraint contact_leads_status_check
  check (status in ('new','contacted','qualified','won','lost','spam'));

-- ── Indexes ─────────────────────────────────────────────────────
create index if not exists contact_leads_created_idx on public.contact_leads (created_at desc);
create index if not exists contact_leads_status_idx  on public.contact_leads (status, created_at desc);
create index if not exists contact_leads_phone_idx   on public.contact_leads (phone)      where phone is not null;
create index if not exists contact_leads_email_idx   on public.contact_leads (email)      where email is not null;
create index if not exists contact_leads_session_idx on public.contact_leads (session_id) where session_id is not null;
create index if not exists contact_leads_user_idx    on public.contact_leads (user_id)    where user_id is not null;

-- ── RLS ─────────────────────────────────────────────────────────
-- This table is currently readable with the PUBLIC anon key — names,
-- emails and phone numbers included. Same exposure class as the three
-- tables closed in 0001, just smaller (2 rows).
alter table public.contact_leads enable row level security;

-- A signed-in visitor may read the requests they made; this is what backs
-- "your requests" in the Buyer's Office. Anon gets no policy at all, so it
-- can neither read nor enumerate leads. Inserts arrive only from the
-- capture-lead Edge Function, which runs as service_role and bypasses RLS.
-- contact_leads.user_id is TEXT (probed), like payments.user_id and unlike
-- user_profiles.id / chat_sessions.user_id which are uuid. Cast the RIGHT
-- side so any index on user_id stays usable.
drop policy if exists contact_leads_select_own on public.contact_leads;
create policy contact_leads_select_own on public.contact_leads
  for select to authenticated
  using (user_id = auth.uid()::text);


-- ════════════════════════════════════════════════════════════════
-- COLUMN TYPES across this schema — probed, not assumed. They are NOT
-- consistent, and each mismatch has cost a failed migration run:
--   user_profiles.id        uuid
--   chat_sessions.user_id   uuid
--   payments.user_id        text
--   contact_leads.user_id   text
--   contact_leads.id        uuid
-- Probe technique: filter the column with a non-uuid value —
--   22P02 parse error => uuid      empty result => text
-- Value format cannot distinguish them; PostgREST serialises a uuid as a
-- 36-char JSON string either way.
-- ════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- AFTER APPLYING, list any pre-existing permissive policies — 0001 showed
-- this project carries several, and an "allow all" policy here would keep
-- the table open exactly as allow_all_user_profiles did:
--
--   select policyname, roles::text, cmd, qual::text
--     from pg_policies
--    where schemaname='public' and tablename='contact_leads';
--
-- Anything with USING (true), or scoped to {public} without an auth.uid()
-- test, must be dropped.
--
-- VERIFY — must return [] with the PUBLIC anon key:
--   curl "<URL>/rest/v1/contact_leads?select=email&limit=1" -H "apikey: <ANON_KEY>"
--
-- THE WORKLIST:
--   select created_at, intent, name, coalesce(phone, email) as contact,
--          project_name, status
--     from public.contact_leads order by created_at desc limit 50;
-- ════════════════════════════════════════════════════════════════
