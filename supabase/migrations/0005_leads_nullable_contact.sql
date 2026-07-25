-- ════════════════════════════════════════════════════════════════
-- 0005 — ALLOW LEADS WITHOUT A NAME OR PHONE
--
-- Every lead capture was failing with 23502:
--   null value in column "name" ... violates not-null constraint
--   null value in column "phone" ... violates not-null constraint
--
-- contact_leads was built for a contact form where both are mandatory.
-- Most of the site's lead sources have neither. Of the ten saveLead call
-- sites, the majority pass an empty name, and roughly half capture only
-- one contact channel:
--
--   ReportHomes    floor-plan request   → email only, no name
--   ProjectProfile document request     → email only, no name
--   ReportFeedback report error         → email only, no name
--   TowerIntel     early access         → phone only, no name
--   BuyerOfficeGate / SignIn            → name + ONE of email/phone
--
-- capture-lead normalises an empty string to null, because "" is not a
-- name and storing it as one makes every future query lie. The honest
-- representation of "not provided" is null, so the constraint has to go
-- rather than the null.
--
-- The product rule still holds and is enforced in capture-lead: a lead
-- must carry at least ONE of email or phone. A lead with no way to reach
-- them is rejected before it reaches the database — that check simply
-- belongs in the function, where it can know that either will do, rather
-- than in a column constraint that can only demand both.
-- ════════════════════════════════════════════════════════════════

alter table public.contact_leads alter column name  drop not null;
alter table public.contact_leads alter column phone drop not null;


-- ── Remove the verification rows written while diagnosing this ──
delete from public.contact_leads
 where name in ('ZZ', 'ZZ-TEST', 'ZZ-TEST-DELETE-ME')
    or email = 't@example.invalid'
    or phone = '+910000000000';


-- ════════════════════════════════════════════════════════════════
-- VERIFY — submit a floor-plan or brochure request on any project page:
--
--   select created_at, intent, name, coalesce(phone, email) as contact,
--          project_name, docs, source, session_id, status
--     from public.contact_leads
--    where intent is not null
--    order by created_at desc limit 10;
--
-- `intent is not null` isolates rows written through capture-lead; the two
-- pre-existing June 2026 rows predate every column this project added.
-- ════════════════════════════════════════════════════════════════
