-- ════════════════════════════════════════════════════════════════
-- 0011 — SHORTLIST RE-RANK LOG
--
-- The shortlist-rerank Edge Function (Gemini) records every re-rank it
-- performs: the buyer's brief, the candidate slugs it was handed, the
-- order it returned, and whether the model answered cleanly. It is a
-- fire-and-forget analytics write — without this table the POST 404s on
-- every re-rank (harmless to the feature, but noisy and lossy).
--
-- Column shapes mirror the function's insert body
-- (supabase/functions/shortlist-rerank/index.ts):
--   brief            → the Brief object, JSON        → jsonb
--   candidate_slugs  → string[] of candidate slugs   → text[]
--   ranked_slugs     → string[] the model returned    → text[]
--   model_ok         → did the model answer cleanly   → boolean
-- ════════════════════════════════════════════════════════════════

create table if not exists public.shortlist_log (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  brief           jsonb,
  candidate_slugs text[],
  ranked_slugs    text[],
  model_ok        boolean
);

create index if not exists shortlist_log_created_idx on public.shortlist_log (created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────
-- Writes arrive only from the shortlist-rerank Edge Function, which runs
-- as service_role and bypasses RLS. Nothing reads this over the API, so
-- no policy is granted: RLS enabled with zero policies denies anon and
-- authenticated by default — exactly right for an internal analytics log.
alter table public.shortlist_log enable row level security;
