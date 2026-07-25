-- ════════════════════════════════════════════════════════════════
-- 0010 — EVENT TRAIL
--
-- Answers the question the other tables cannot: what did this person DO,
-- in order. chat_sessions holds what they asked, contact_leads what they
-- requested, user_profiles.unlocked_reports what they own — but nothing
-- records that they read three reports, opened the office, came back
-- twice and only then paid. That sequence is the funnel.
--
-- Anonymous-first, like everything else here. Events are written under
-- anon_id from the first page view, long before a name exists, and are
-- claimed by the account at sign-in. The trail therefore starts at the
-- FIRST visit rather than at signup, which is the half that actually
-- explains why someone converted.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),

  -- Who. anon_id is present from the first page view; user_id is
  -- backfilled by link_verified_phone when they sign in.
  anon_id     text,
  session_id  text,
  user_id     uuid references auth.users(id) on delete set null,

  -- What. A controlled vocabulary — see EVENT NAMES below. Free-form
  -- names would make the funnel unqueryable within a month.
  name        text not null,

  -- Denormalised out of props because almost every funnel question
  -- filters or groups by project, and reaching into jsonb for that in
  -- every query is both slower and easy to get subtly wrong.
  project_slug text,
  project_name text,

  -- Everything else: package id, amount, config, source, position.
  -- jsonb so a new event type never needs a migration.
  props       jsonb,

  -- Context
  path        text,
  referrer    text,
  user_agent  text
);

create index if not exists events_created_idx  on public.events (created_at desc);
create index if not exists events_user_idx     on public.events (user_id, created_at)  where user_id is not null;
create index if not exists events_anon_idx     on public.events (anon_id, created_at)  where anon_id is not null;
create index if not exists events_name_idx     on public.events (name, created_at desc);
create index if not exists events_project_idx  on public.events (project_slug, created_at desc) where project_slug is not null;

-- ── RLS ─────────────────────────────────────────────────────────
-- Writes arrive only via the track Edge Function (service role). anon
-- gets nothing: an event stream readable by the public would leak which
-- projects each visitor is considering.
alter table public.events enable row level security;

drop policy if exists events_select_own on public.events;
create policy events_select_own on public.events
  for select to authenticated
  using (user_id = auth.uid());


-- ── Claim events at sign-in, alongside chats and leads ──────────
create or replace function public.link_verified_phone(
  p_user_id    uuid,
  p_phone      text,
  p_anon_id    text default null,
  p_session_id text default null,
  p_name       text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_chats  integer := 0;
  v_leads  integer := 0;
  v_events integer := 0;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required' using errcode = '22023';
  end if;

  insert into public.user_profiles (id, phone, phone_verified, name)
  values (p_user_id, p_phone, true, nullif(trim(coalesce(p_name, '')), ''))
  on conflict (id) do update
    set phone          = coalesce(excluded.phone, user_profiles.phone),
        phone_verified = true,
        name           = coalesce(excluded.name, user_profiles.name),
        updated_at     = now();

  if p_anon_id is not null and length(p_anon_id) >= 8 then
    update public.chat_sessions
       set user_id = p_user_id
     where anon_id = p_anon_id and user_id is null;
    get diagnostics v_chats = row_count;

    -- The pre-signup browsing. Without this the trail would begin at the
    -- moment they signed in, losing every step that led them there.
    update public.events
       set user_id = p_user_id
     where anon_id = p_anon_id and user_id is null;
    get diagnostics v_events = row_count;
  end if;

  -- contact_leads.user_id is TEXT while the others are UUID.
  update public.contact_leads
     set user_id = p_user_id::text
   where user_id is null
     and (
       (p_anon_id    is not null and session_id = p_anon_id)
       or (p_session_id is not null and session_id = p_session_id)
       or right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10)
        = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
     );
  get diagnostics v_leads = row_count;

  return json_build_object(
    'user_id', p_user_id,
    'chats_claimed', v_chats,
    'leads_claimed', v_leads,
    'events_claimed', v_events
  );
end;
$$;

revoke all on function public.link_verified_phone(uuid, text, text, text, text)
  from public, anon, authenticated;


-- ════════════════════════════════════════════════════════════════
-- EVENT NAMES (keep this list and src/lib/events.ts in step)
--
--   page_viewed        every page, with path
--   report_viewed      a project report opened          → project_slug
--   signed_in          phone verified                   → props.isNew
--   report_unlocked    a paid read unlocked             → project_slug
--   payment_completed  money taken   → props.package, props.amountInr
--   lead_captured      any saveLead  → props.intent
--   office_opened      the Private Buyer's Office
--   chat_opened        TruthGuide opened
--
--
-- THE FUNNEL, once this has run for a while:
--
--   -- one person's story, start to finish:
--   select created_at, name, coalesce(project_name, project_slug) as project, props
--     from public.events
--    where user_id = (select id from public.user_profiles
--                      where right(regexp_replace(phone,'\D','','g'),10) = '9958777312')
--    order by created_at;
--
--   -- how many reports does someone read before paying:
--   with firstpay as (
--     select user_id, min(created_at) as paid_at from public.events
--      where name = 'payment_completed' group by user_id)
--   select f.user_id,
--          count(*) filter (where e.name = 'report_viewed' and e.created_at < f.paid_at) as reports_before_paying
--     from firstpay f join public.events e on e.user_id = f.user_id
--    group by f.user_id;
--
--   -- which project most often precedes a payment:
--   select e.project_name, count(*) from public.events e
--    where e.name = 'report_viewed'
--      and exists (select 1 from public.events p
--                   where p.user_id = e.user_id and p.name = 'payment_completed'
--                     and p.created_at > e.created_at)
--    group by 1 order by 2 desc limit 10;
--
--   -- where anonymous visitors stop:
--   select name, count(*) from public.events
--    where user_id is null group by 1 order by 2 desc;
-- ════════════════════════════════════════════════════════════════
