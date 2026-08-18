-- ════════════════════════════════════════════════════════════════
-- 0023 — BACKFILL: give every orphaned registration a contact_lead
--
-- Auth (chat-signin / Google) writes a user_profiles row; the lead
-- (contact_leads) is a SEPARATE write that some pure-sign-in unlock gates
-- never made — so a person could be "registered" with no lead and no intent
-- (the compare-gate unlock, a phone-only report unlock, any Google sign-in).
--
-- The app now closes this going FORWARD: flushPendingLead() records a lead at
-- every sign-in — the gate's declared intent (e.g. compare-unlock), else a
-- neutral "registered". This one-time backfill recovers the EXISTING orphans.
--
-- Rule: every user_profiles row that has a contact method but NO matching
-- contact_lead (by last-10 phone, or lower(email)) gets one 'registered' lead,
-- stamped with the profile's own signup time. We do NOT guess a per-row intent
-- — 'registered' is honest; the derived signup_intent_v (0020) remains for
-- anyone who wants the inferred "why".
--
-- IDEMPOTENT: once a profile has a lead the NOT EXISTS excludes it, so
-- re-running inserts nothing. Safe to apply more than once.
--
-- This is a DATA migration on production — apply it deliberately (it inserts
-- rows), and only after capture-lead has been redeployed with the 'registered'
-- intent (so the forward path and this backfill agree on the vocabulary).
-- ════════════════════════════════════════════════════════════════

insert into public.contact_leads (name, email, phone, intent, source, message, user_id, created_at)
select
  up.name,
  up.email,
  up.phone,
  'registered',
  'backfill:user_profiles',
  'Recovered registration — signed up before sign-in recorded a lead; intent not captured.',
  up.id::text,
  up.created_at
from public.user_profiles up
where (up.phone is not null or up.email is not null)
  and not exists (
    select 1
    from public.contact_leads cl
    where
      -- same phone (compare last 10 digits; only when the profile has a full number)
      (up.phone is not null and cl.phone is not null
        and length(regexp_replace(up.phone, '[^0-9]', '', 'g')) >= 10
        and right(regexp_replace(cl.phone, '[^0-9]', '', 'g'), 10)
          = right(regexp_replace(up.phone, '[^0-9]', '', 'g'), 10))
      -- or same email (case-insensitive)
      or (up.email is not null and cl.email is not null
        and lower(cl.email) = lower(up.email))
  );

-- Sanity read after applying (run manually; not part of the migration):
--   select intent, count(*) from public.contact_leads group by intent order by 2 desc;
--   select count(*) as still_orphaned
--     from public.user_profiles up
--    where (up.phone is not null or up.email is not null)
--      and not exists (select 1 from public.contact_leads cl
--        where (cl.phone is not null and right(regexp_replace(cl.phone,'[^0-9]','','g'),10)
--                 = right(regexp_replace(up.phone,'[^0-9]','','g'),10))
--           or (cl.email is not null and lower(cl.email) = lower(up.email)));
