-- ════════════════════════════════════════════════════════════════
-- 0020 — SIGNUP INTENT (derived, read-only)
--
-- user_profiles has no column that records WHY someone signed up. This
-- derives it from the events funnel instead, with no schema or app change.
--
-- PRIMARY signal: the sign-up sheet's own declared source
--   (sign_up_form_opened.props->>'source'). Live values today:
--   unlock (23) · office-signin (11) · consultation (4) · shortlist-otp (1)
--   · buyer-office (1).
-- FALLBACK signal (for chat / Google sign-ins that skip the sheet): the
--   last high-intent surface the device touched at or before signing in.
--
-- Keyed on anon_id (device) because that is the one id present on every
-- signup event; user_id is exposed where the server stamped it, but it is
-- sparse (the known identity-attribution gap), so per-device is the honest
-- denominator for "why did people sign up".
--
-- INTERNAL ANALYTICS ONLY. security_invoker = on → the view respects the
-- querying role's RLS (service_role, which AI Studio uses, bypasses it and
-- sees all events; anon/authenticated see nothing). Grants are also locked
-- to service_role for defence in depth.
-- ════════════════════════════════════════════════════════════════

create or replace view public.signup_intent_v
with (security_invoker = on) as
with signin as (
  -- The signup moment per device: earliest signed_in per anon_id, carrying
  -- the user_id / session_id where the server-side stamp recorded them.
  select
    anon_id,
    min(created_at) as signed_in_at,
    (array_agg(user_id    order by created_at) filter (where user_id    is not null))[1] as user_id,
    (array_agg(session_id order by created_at) filter (where session_id is not null))[1] as session_id
  from public.events
  where name = 'signed_in' and anon_id is not null
  group by anon_id
),
form as (
  -- Most direct: what the sign-up sheet said opened it (latest per device).
  select distinct on (anon_id)
    anon_id, props->>'source' as source
  from public.events
  where name = 'sign_up_form_opened'
    and anon_id is not null
    and coalesce(props->>'source','') <> ''
  order by anon_id, created_at desc
),
fallback as (
  -- Last high-intent surface at/before signup, for devices with no sheet source.
  select distinct on (e.anon_id)
    e.anon_id,
    case e.name
      when 'deal_room_page_viewed'     then 'deal-room'
      when 'deal_room_mandate_started' then 'deal-room'
      when 'sun_vastu_page_viewed'     then 'sun-vastu'
      when 'sun_vastu_requested'       then 'sun-vastu'
      when 'model_opened'              then 'sun-vastu'
      when 'shortlist_page_reached'    then 'shortlist'
      when 'unlock_full_read_clicked'  then 'unlock-report'
      when 'office_opened'             then 'buyer-office'
      when 'chat_opened'               then 'chat'
      when 'report_viewed'             then 'report'
    end as surface
  from public.events e
  join signin s on s.anon_id = e.anon_id
  where e.created_at <= s.signed_in_at
    and e.name in (
      'deal_room_page_viewed','deal_room_mandate_started','sun_vastu_page_viewed',
      'sun_vastu_requested','model_opened','shortlist_page_reached',
      'unlock_full_read_clicked','office_opened','chat_opened','report_viewed'
    )
  order by e.anon_id, e.created_at desc
)
select
  s.anon_id,
  s.user_id,
  s.session_id,
  s.signed_in_at,
  f.source as form_source,
  coalesce(
    case f.source
      when 'unlock'        then 'unlock-report'
      when 'office-signin' then 'buyer-office'
      when 'buyer-office'  then 'buyer-office'
      when 'consultation'  then 'consultation'
      when 'shortlist-otp' then 'shortlist'
      else f.source
    end,
    fb.surface,
    'unknown'
  ) as signup_intent
from signin s
left join form     f  on f.anon_id  = s.anon_id
left join fallback fb on fb.anon_id = s.anon_id;

revoke all on public.signup_intent_v from anon, authenticated;
grant select on public.signup_intent_v to service_role;

-- ── VERIFY / USE ────────────────────────────────────────────────
-- The dashboard "why did they sign up" tile:
--   select signup_intent, count(*) as signups
--     from public.signup_intent_v
--    group by 1 order by 2 desc;
--
-- Per user (where the id resolved):
--   select user_id, signup_intent, signed_in_at
--     from public.signup_intent_v
--    where user_id is not null order by signed_in_at desc;
-- ════════════════════════════════════════════════════════════════
