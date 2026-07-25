-- ════════════════════════════════════════════════════════════════
-- 0002 — LEADS
--
-- Every lead the site has ever captured lives in the visitor's own
-- localStorage and has never reached the business. Floor-plan requests,
-- brochure requests, Buyer's Office sign-ups, custom report enquiries,
-- report feedback — all of it written to `truthEstate.leads` in the
-- browser and nowhere else. If someone requested a brochure last week,
-- that request exists only on their phone.
--
-- This table is where they land. Writes go exclusively through the
-- capture-lead Edge Function (service_role); the anon key gets no grant
-- at all, so the public bundle can never read or forge leads.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Who. All optional individually, but capture-lead rejects a row with
  -- neither email nor phone — a lead with no way to reach them is noise.
  name          text,
  email         text,
  phone         text,
  -- Null while anonymous. Backfilled by the stitch RPC (0003) when the
  -- visitor verifies a phone number, so pre-signup requests join the account.
  user_id       uuid references auth.users(id) on delete set null,
  -- Links to chat_sessions.session_id, so a lead can be read alongside the
  -- conversation that produced it.
  session_id    text,

  -- What they asked for. `intent` mirrors the Lead union in src/lib/journey.ts.
  intent        text not null,
  project       text,
  project_slug  text,
  docs          text[],
  identity      text,
  message       text,
  -- Structured extras: the BuyData profile on buyer-office leads, the brief
  -- on custom-report leads. Kept as jsonb so the shape can evolve without a
  -- migration — this table must never be the reason a form cannot ship.
  payload       jsonb,

  -- Provenance
  source        text,
  referrer      text,
  user_agent    text,

  -- Ops — this is a worklist, not just a log.
  status        text not null default 'new'
                check (status in ('new','contacted','qualified','won','lost','spam')),
  contacted_at  timestamptz,
  notes         text
);

create index if not exists leads_created_idx  on public.leads (created_at desc);
create index if not exists leads_status_idx   on public.leads (status, created_at desc);
create index if not exists leads_phone_idx    on public.leads (phone)      where phone is not null;
create index if not exists leads_email_idx    on public.leads (email)      where email is not null;
create index if not exists leads_session_idx  on public.leads (session_id) where session_id is not null;
create index if not exists leads_user_idx     on public.leads (user_id)    where user_id is not null;

-- ── RLS ─────────────────────────────────────────────────────────
-- Deny by default. No policy for anon means the public key cannot read
-- leads, cannot forge them, and cannot enumerate them. Inserts arrive
-- only from capture-lead, which runs as service_role and bypasses RLS.
alter table public.leads enable row level security;

-- A signed-in visitor may see the requests they made — this is what backs
-- "your requests" in the Buyer's Office. Nothing else is exposed.
drop policy if exists leads_select_own on public.leads;
create policy leads_select_own on public.leads
  for select to authenticated
  using (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- VERIFY
--   -- must return [] with the PUBLIC anon key:
--   curl "<URL>/rest/v1/leads?select=*&limit=1" -H "apikey: <ANON_KEY>"
--
--   -- the worklist:
--   select created_at, intent, name, coalesce(phone, email) as contact,
--          project, status
--     from public.leads order by created_at desc limit 50;
--
--   -- what people ask for most:
--   select intent, count(*) from public.leads group by 1 order by 2 desc;
-- ════════════════════════════════════════════════════════════════
