-- ════════════════════════════════════════════════════════════════
-- 0016 — persist the buyer's STATED brief on their account
--
-- The office brief (BuyData: locations, budget, configs, purchase type,
-- priorities, timeline, notes …) lived only in localStorage. Sign-out wipes
-- localStorage, so on the next sign-in the stated brief was gone and the
-- dashboard fell back to the /brief INFERENCE (reconstructed from the event
-- trail keyed on the anon id, which survives sign-out) — i.e. the user's
-- edited requirements silently reverted to an older, activity-derived guess.
--
-- This adds one jsonb column to hold the whole BuyData object, so the client
-- can save it on edit (own-row PATCH, under the session) and rehydrate it on
-- sign-in ahead of the inference. "Stated beats inferred" now survives a
-- sign-out and follows the buyer across devices.
--
-- RLS: user_profiles already enforces own-row SELECT/UPDATE (auth.uid() = id);
-- a new column is covered by the existing row policies + table grants, so
-- nothing else is needed. The pref_* columns from 0014 stay (used by the
-- identity merge); the full brief is kept together here as one object rather
-- than split across the lossy pref_* shape.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS brief jsonb;
