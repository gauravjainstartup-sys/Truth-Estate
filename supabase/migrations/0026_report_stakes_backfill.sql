-- ════════════════════════════════════════════════════════════════
-- 0026 — BACKFILL report_stakes + user_profiles.persona from history
--
-- Run AFTER 0025. Idempotent (re-runnable): every write is COALESCE/
-- LEAST/GREATEST-guarded so a second run changes nothing, and no existing
-- portfolio row (the 'invested' rows carried over from owned_properties)
-- is clobbered.
--
-- What is reconstructable, and from where:
--   • report views + declared stakes  →  public.events   (759 report_viewed
--     + 104 stake_declared rows carry user_id, stamped by claim_anonymous_
--     history at sign-in). This is the report↔user graph we never had as a
--     table.
--   • account persona                 →  user_profiles.brief->>'purchaseType'
--     (11 rows). purchaseType was NEVER emitted as an event, so it cannot
--     come from the trail — the brief is the only server-side source.
--     Anonymous-only visitors have no persona anywhere (localStorage only)
--     and no account to attach one to, so there is nothing to backfill for
--     them — expected, not a gap.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · account persona from the stated brief — FILL NULLS ONLY ──
-- user_profiles.persona already exists and is partly populated
-- ('Investor'/'End-User', Title-Case) by an earlier schema; this only fills
-- rows it left null and never rewrites a value. Casing matches that column.
-- 'Investment' → Investor, anything else stated ('First Home','Upgrade',…)
-- → End-User (mirrors personaOf() in src/lib/matchEngine.ts).
update public.user_profiles
   set persona = case
                   when lower(brief->>'purchaseType') = 'investment' then 'Investor'
                   else 'End-User'
                 end
 where persona is null
   and nullif(trim(brief->>'purchaseType'), '') is not null;

-- ── 2 · report↔user rows from the event trail ──
-- One row per (user, project) that ever fired a view or a stake. The stake
-- is the LATEST declared value; the view timestamps are the span.
insert into public.report_stakes
      (user_id, slug, stake, first_viewed_at, last_viewed_at, name, created_at, updated_at)
select e.user_id,
       e.project_slug as slug,
       ( select ev.props->>'stake'
           from public.events ev
          where ev.user_id = e.user_id
            and ev.project_slug = e.project_slug
            and ev.name = 'stake_declared'
            and ev.props->>'stake' is not null
          order by ev.created_at desc
          limit 1 ) as stake,
       min(e.created_at) filter (where e.name = 'report_viewed') as first_viewed_at,
       max(e.created_at) filter (where e.name = 'report_viewed') as last_viewed_at,
       (array_agg(e.project_name order by e.created_at desc)
          filter (where e.project_name is not null))[1] as name,
       min(e.created_at) as created_at,
       now() as updated_at
  from public.events e
 where e.user_id is not null
   and e.project_slug is not null
   and e.name in ('report_viewed','stake_declared')
 group by e.user_id, e.project_slug
on conflict (user_id, slug) do update set
   -- never overwrite an existing declared stake (esp. the 'invested'
   -- portfolio rows carried over from owned_properties)
   stake           = coalesce(public.report_stakes.stake, excluded.stake),
   first_viewed_at = least(public.report_stakes.first_viewed_at, excluded.first_viewed_at),
   last_viewed_at  = greatest(public.report_stakes.last_viewed_at, excluded.last_viewed_at),
   name            = coalesce(public.report_stakes.name, excluded.name),
   updated_at      = now();

-- Sanity (returns counts; not a write):
--   select count(*) filter (where stake='invested')     as invested,
--          count(*) filter (where stake='considering')  as considering,
--          count(*) filter (where last_viewed_at is not null) as viewed
--     from public.report_stakes;
--   select persona, count(*) from public.user_profiles group by persona;
