-- ════════════════════════════════════════════════════════════════
-- 0022 — CHAT LOG: which project a "Challenge our read" chat was about
--
-- The per-project TruthGuide ("Challenge our read") now logs to
-- public.chat_sessions like the site-wide one — but a project chat needs to
-- record WHICH project it was scoped to. One nullable, additive column:
-- null for the site-wide TruthGuide, the project name for a project chat.
--
-- Additive and nullable, so existing rows and the AI Studio writes are
-- unaffected. chatlog.ts writes this column with a strip-and-retry fallback,
-- so deploying the edge function BEFORE or AFTER this migration is safe:
-- until the column exists, project chats still log (without the tag); once it
-- exists the tag starts populating on its own, with no further deploy.
-- ════════════════════════════════════════════════════════════════

alter table public.chat_sessions
  add column if not exists project text;

-- Read pattern: "show me every turn about M3M Elie Saab, newest first."
create index if not exists chat_sessions_project_idx
  on public.chat_sessions (project, created_at) where project is not null;

-- ════════════════════════════════════════════════════════════════
-- VERIFY
--   -- project chats, after asking "Challenge our read" something live:
--   select created_at, project, role, left(content, 80) as preview
--     from public.chat_sessions
--    where project is not null
--    order by created_at desc limit 20;
--
--   -- most-discussed projects:
--   select project, count(*) filter (where role = 'user') as questions
--     from public.chat_sessions where project is not null
--    group by project order by questions desc;
-- ════════════════════════════════════════════════════════════════
