-- ════════════════════════════════════════════════════════════════
-- 0003 — CLOSE PUBLIC WRITE ACCESS  ⚠️ MOST SERIOUS OF THE THREE
--
-- Nine tables carry a policy granting cmd=ALL with USING(true) to the
-- {public} role. In Postgres, `public` means every role, so the anon key
-- shipped in the site's JS bundle could INSERT, UPDATE and DELETE the
-- entire product database.
--
-- Verified non-destructively: an empty INSERT with the public anon key
-- returns 23502 (not-null violation) rather than 42501 (RLS denial), on
-- projects, developers, micro_market_data and cagr_defaults. RLS let the
-- write through; only a column constraint stopped it.
--
-- Worst case was not a leak but silent corruption:
--   delete from projects;                      -- 312 rows
--   update backlog_projects set truth_score=100;
--   update micro_market_data set avg_cost_sqft=1;
-- The static build reads these tables, so a malicious write would
-- propagate to the live site on the next deploy and the scores the whole
-- product rests on would be someone else's.
--
-- The fix is only about WRITES. Public SELECT on these tables is correct
-- and required — the build reads them at build time with the anon key.
-- Seven of the nine already have a companion public_read_* SELECT policy
-- doing exactly that, so dropping the ALL policy costs them nothing.
-- Two do not, and get an explicit read policy here first.
--
-- After this, writes to these tables happen only via the service role
-- (the pipeline, and Edge Functions), which bypasses RLS.
-- ════════════════════════════════════════════════════════════════

-- ── Step 1: the two tables whose ONLY policy is the ALL one ─────
-- Create the replacement read policy BEFORE dropping, so public read
-- access never lapses even for an instant.
drop policy if exists public_read_project_configurations on public.project_configurations;
create policy public_read_project_configurations
  on public.project_configurations
  for select to anon, authenticated
  using (true);

drop policy if exists public_read_project_extended_details on public.project_extended_details;
create policy public_read_project_extended_details
  on public.project_extended_details
  for select to anon, authenticated
  using (true);

drop policy if exists "Enable all operations for anon" on public.project_configurations;
drop policy if exists "Enable all operations for anon" on public.project_extended_details;

-- ── Step 2: the seven that already have a public_read_* companion ──
drop policy if exists allow_all_backlog_project_data on public.backlog_project_data;
drop policy if exists allow_all_backlog_projects     on public.backlog_projects;
drop policy if exists allow_all_cagr_defaults        on public.cagr_defaults;
drop policy if exists allow_all_developer_health     on public.developer_health;
drop policy if exists allow_all_developers           on public.developers;
drop policy if exists allow_all_micro_market_data    on public.micro_market_data;
drop policy if exists allow_all_projects             on public.projects;

-- ── Step 3: contact_leads read ──────────────────────────────────
-- Named "service role only" but scoped to {public} with USING(true), so
-- it granted SELECT to everyone. service_role never needs a policy — it
-- bypasses RLS — so this only ever exposed names, emails and phones.
drop policy if exists "Enable read access for service role only" on public.contact_leads;


-- ── DELIBERATELY LEFT ───────────────────────────────────────────
-- Public INSERT on audit_requests, contact_messages and contact_leads.
-- These are form-submission endpoints for anonymous visitors; removing
-- them would break the live forms. They allow junk rows but no reads, so
-- the exposure is spam, not disclosure — filter with status='spam'.
-- Revisit once every form writes through an Edge Function.
--
-- All public_read_* SELECT policies stay. The static build reads these
-- tables with the anon key at build time; removing them breaks deploys.


-- ════════════════════════════════════════════════════════════════
-- VERIFY — with the PUBLIC anon key.
--
-- 1. Writes must now be REFUSED with 42501 (not 23502):
--   curl -X POST "<URL>/rest/v1/projects" -H "apikey: <ANON>" \
--        -H "content-type: application/json" -d '{}'
--   An empty body writes nothing either way; the CODE is the signal.
--     42501 = RLS denied  ✅        23502 = RLS allowed the write  ❌
--
-- 2. Reads must still WORK — these back every deploy:
--   backlog_listing_public_v3, backlog_projects, backlog_project_data,
--   micro_market_data, project_configurations, project_extended_details,
--   projects, developers
--
-- 3. Re-run the audit; only INSERT rows should remain:
--   select tablename, policyname, roles::text, cmd from pg_policies
--    where schemaname='public' and (qual='true' or with_check='true')
--      and 'public' = any(roles) order by tablename;
-- ════════════════════════════════════════════════════════════════
