-- ════════════════════════════════════════════════════════════════
-- 0024 — PROJECT INTELLIGENCE WIRE (chronological forensic ground-events log)
--
-- The feature (Antigravity handoff) created this table directly in the prod DB
-- with no migration, so the schema was untracked and its RLS unverifiable from
-- the repo. This migration reconciles it: it is IDEMPOTENT — CREATE ... IF NOT
-- EXISTS is a no-op where the table already exists, and the RLS enable + policy
-- + indexes are (re)asserted so the security is correct and reproducible in a
-- fresh environment either way.
--
-- Read model: PUBLIC, read-only, PUBLISHED rows only. The anon key may SELECT a
-- row only when status = 'PUBLISHED'; DRAFT / ARCHIVED / DELETED are invisible.
-- No INSERT/UPDATE/DELETE policy exists, so anon/authenticated cannot write;
-- service_role (the editor/pipeline) bypasses RLS. The client query pins
-- status=eq.PUBLISHED too — defence in depth against a loosened policy.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.project_intelligence_wire (
  id                      uuid primary key default gen_random_uuid(),
  project_id              text,
  project_slug            text not null,
  project_name            text not null,
  event_date              date not null,
  category                text not null
                            check (category in ('CONSTRUCTION','REGULATORY','INFRASTRUCTURE','CORPORATE_JV','LEGAL','PRICING')),
  headline                text not null,
  verified_facts          text not null default '',
  forensic_impact_type    text not null default 'NEUTRAL'
                            check (forensic_impact_type in ('POSITIVE','NEUTRAL','CAUTION','RISK')),
  forensic_impact_summary text not null default '',
  source_name             text not null default '',
  source_url              text,
  source_document_ref     text,
  status                  text not null default 'DRAFT'
                            check (status in ('DRAFT','PUBLISHED','ARCHIVED','DELETED')),
  is_pinned               boolean not null default false,
  display_order           integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Indexes: lookup by project, newest-first ordering, and the status filter.
create index if not exists project_wire_slug_idx    on public.project_intelligence_wire (project_slug);
create index if not exists project_wire_date_idx    on public.project_intelligence_wire (event_date desc);
create index if not exists project_wire_status_idx  on public.project_intelligence_wire (status);

-- Row-level security: public reads PUBLISHED only; writes are service_role.
alter table public.project_intelligence_wire enable row level security;

drop policy if exists "wire_public_read_published" on public.project_intelligence_wire;
create policy "wire_public_read_published"
  on public.project_intelligence_wire
  for select
  using (status = 'PUBLISHED');
