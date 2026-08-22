-- ════════════════════════════════════════════════════════════════
-- 0027 — drop the owned_properties compat view
--
-- 0025 renamed owned_properties → report_stakes and left a compat VIEW
-- named owned_properties so the THEN-deployed prod client kept reading
-- through cutover. Production now runs the new client (reads/writes
-- report_stakes directly), so the view is dead weight.
--
-- Only lingering risk: a browser still holding the OLD JS bundle would hit
-- owned_properties for its portfolio sync; dropping the view 404s that one
-- call, which the client already treats as best-effort and falls back to
-- localStorage (the pre-0012 behaviour). Apply after a short bake so those
-- stale sessions have refreshed. Safe to run more than once.
-- ════════════════════════════════════════════════════════════════

drop view if exists public.owned_properties;

-- rls-guard.mjs still lists owned_properties; that entry becomes a WARN
-- ("not found") rather than a FAIL after this runs, and is removed in the
-- same change that drops this file's sibling guard line.
