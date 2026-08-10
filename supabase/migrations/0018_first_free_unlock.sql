-- ════════════════════════════════════════════════════════════════
-- 0018 — first report free on sign-up
--
-- Every NEW profile gets its first project Full Read free (phone sign-up
-- only, no card); from the second unlock, standard pricing applies. A free
-- unlock is not a Razorpay order (the gateway rejects ₹0), so it is granted
-- directly by the `claim-free-unlock` edge function against the service role.
--
-- This flag is the ATOMIC guard that makes "one free per profile" race-safe:
-- the function claims it with a single conditional UPDATE
--   ... SET first_free_used = true WHERE id = :uid AND first_free_used IS NOT TRUE
-- so two tabs cannot both win the free slot — the loser falls back to paying.
--
-- BACKFILL: anyone who already owns something is marked used, so the change
-- never hands a retroactive freebie to an existing customer. "Owns something"
-- is the same union entitlements/core.ts reads — a grant in unlocked_reports,
-- an all-access plan, or a completed payment. Brand-new / zero-unlock accounts
-- stay false and are therefore eligible, which matches "any account with no
-- prior unlock" (the founder-chosen definition).
--
-- RLS: user_profiles already enforces own-row SELECT/UPDATE (auth.uid() = id).
-- The claim runs as the service role (RLS-exempt); the browser never writes
-- this column, so the existing row policies + grants are sufficient.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS first_free_used boolean NOT NULL DEFAULT false;

-- Existing owners: never eligible for a retroactive free report.
UPDATE public.user_profiles p
SET first_free_used = true
WHERE first_free_used IS NOT TRUE
  AND (
        coalesce(array_length(p.unlocked_reports, 1), 0) > 0
     OR lower(coalesce(p.plan, '')) IN ('premium', 'all-access', 'all', 'unlimited')
     OR EXISTS (
          -- payments.user_id and user_profiles.id can differ in type
          -- (text vs uuid), so compare both as text.
          SELECT 1 FROM public.payments pay
          WHERE pay.user_id::text = p.id::text
            AND lower(coalesce(pay.status, '')) = 'completed'
        )
  );
