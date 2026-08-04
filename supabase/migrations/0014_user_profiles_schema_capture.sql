-- ════════════════════════════════════════════════════════════════
-- 0014 — CAPTURE public.user_profiles + Google-SSO columns
--
-- user_profiles was created ad-hoc and never version-controlled. This
-- captures the table EXACTLY as it exists in production (introspected
-- 2026-08-04) so a fresh / CI database matches prod, and adds only the two
-- columns Google SSO needs. Everything here is a no-op on the live table
-- (which already has these columns, the PK, the phone UNIQUE, RLS, and the
-- own-row policies) and correct on a brand-new database.
--
-- Deliberately NOT here:
--   • RLS / policies — already enabled with correct own-row rules
--     (auth.uid() = id); re-declaring them would only stack duplicates.
--   • A UNIQUE(phone) — prod already has one; the real gap is format-variant
--     duplicates, handled by normalize+dedup in 0015.
--   • The identity MERGE + phone normalization + dedup + email uniqueness —
--     those need the dedup to run FIRST, so they ship in 0015 as
--     SECURITY DEFINER routines that can cross the own-row RLS boundary.
--
-- Superseded AG's 0014_google_sso_unified_profiles.sql, which invented a
-- schema (missing the live unlocked_reports / plan columns → a broken table
-- on any fresh DB) and added an on-auth-user-created trigger that would have
-- mislabelled and double-written every phone (MSG91) sign-up.
-- ════════════════════════════════════════════════════════════════

-- ── Faithful capture (no-op where the table already exists) ──────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email                text,
  phone                text,
  name                 text,
  phone_verified       boolean     NOT NULL DEFAULT false,
  onboarding_done      boolean     NOT NULL DEFAULT false,
  plan                 text        NOT NULL DEFAULT 'Free' CHECK (plan IN ('Free', 'Pro', 'Premium')),
  persona              text,
  pref_locations       text[]      NOT NULL DEFAULT '{}',
  pref_budgets         text[]      NOT NULL DEFAULT '{}',
  pref_configs         text[]      NOT NULL DEFAULT '{}',
  pref_target_cagr     text,
  pref_exit_years      text,
  pref_delivery_years  text[]      NOT NULL DEFAULT '{}',
  unlocked_reports     text[]      NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── Google-SSO columns (additive; safe on the live table) ────────
--   avatar_url — the Google profile picture.
--   google_sub — the Google subject id, so a returning SSO user is matched
--                on a stable id, not just a mutable email.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS google_sub text;

-- google_sub is one-account-per-Google — unique when present.
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_google_sub_uniq
  ON public.user_profiles (google_sub)
  WHERE google_sub IS NOT NULL;
