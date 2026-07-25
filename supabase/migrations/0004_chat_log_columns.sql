-- ════════════════════════════════════════════════════════════════
-- 0004 — CHAT LOG COLUMNS
--
-- The site-wide TruthGuide now records every turn to public.chat_sessions,
-- the table the AI Studio site already writes (2,107 rows). Despite the
-- name it is a MESSAGE log — one row per turn, grouped by session_id.
--
-- Three columns are missing for what we need:
--
--   anon_id    session_id alone cannot link a device's conversations,
--              because starting a fresh chat mints a new one. anon_id is
--              stable per browser, so every conversation from one device
--              can be claimed together when a phone number is verified.
--
--   tier       which access level asked, for funnel analysis.
--
--   latency_ms answer time, measured server-side where it is actually
--              known. Also the cheapest early warning that the model or
--              the context read is degrading.
--
-- All additive and nullable, so the AI Studio writes are unaffected.
-- ════════════════════════════════════════════════════════════════

alter table public.chat_sessions
  add column if not exists anon_id    text,
  add column if not exists tier       text,
  add column if not exists latency_ms integer;

-- anon_id is the join key for the stitch RPC (0005), which will claim a
-- device's whole history in one statement on verification.
create index if not exists chat_sessions_anon_idx
  on public.chat_sessions (anon_id) where anon_id is not null;

create index if not exists chat_sessions_session_idx
  on public.chat_sessions (session_id, created_at);


-- ════════════════════════════════════════════════════════════════
-- VERIFY
--
--   -- turns land after asking TruthGuide something on the live site:
--   select created_at, role, tier, latency_ms, left(content, 80) as preview
--     from public.chat_sessions
--    where anon_id is not null
--    order by created_at desc limit 10;
--
--   -- ROLE CONVENTION CHECK. chatlog.ts writes 'user' / 'assistant'. If the
--   -- 2,107 existing rows use something else (Gemini's 'model', say), the
--   -- two sets will not group together — change ROLE_BOT in chatlog.ts:
--   select role, count(*) from public.chat_sessions group by role order by 2 desc;
--
--   -- what people actually ask:
--   select left(content, 100), created_at from public.chat_sessions
--    where role = 'user' and anon_id is not null
--    order by created_at desc limit 30;
--
--   -- answer latency, p50 / p95:
--   select percentile_cont(0.5)  within group (order by latency_ms) as p50,
--          percentile_cont(0.95) within group (order by latency_ms) as p95
--     from public.chat_sessions where latency_ms is not null;
-- ════════════════════════════════════════════════════════════════
