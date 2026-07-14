-- ════════════════════════════════════════════════════════════════
--  PROJECT 3D INTAKE — the pipeline's STEP 1 source of truth
--
--  One row per project = everything the generator needs BEFORE it can
--  build a 3D advisor: the add-project Phase-1 intake answers (the
--  [tell]/[⚠] facts a human must provide) + the source image URLs +
--  founder geometry hints. The generator reads this instead of asking.
--
--  NOT here (by design — these are OUTPUTS the generator produces by
--  tracing the images, not inputs): exact tower x/z/rotation, the per-
--  config room `plate` offsets, per-flat scores. Those land in the
--  project_3d_* tables (schema.sql) after generation + confirmation.
--
--  This is an OPS table, not a buyer-facing one: RLS denies anon, and
--  only service_role (the pipeline / an ops console) reads or writes.
--  It is the mirror of schema.sql's deny-by-default posture.
--
--  Apply on the real project: paste in the SQL editor (see
--  db3d/RUNBOOK.md → the intake section). Idempotent.
-- ════════════════════════════════════════════════════════════════

create table if not exists project_3d_intake (
  slug              text primary key,            -- file + URL id (matches the advisor slug)
  name              text not null,               -- must match the DB project_name
  status            text not null default 'draft',

  -- ── identity / marketing context (labels only; not scored) ──
  developer         text,
  city              text,
  location          text,                        -- sector / micro-market

  -- ── Tier-1 site — the sun/vastu-critical answers a human must give ──
  latitude_deg      double precision,            -- [tell] city latitude → sun path
  north_offset_deg  double precision,            -- [⚠] plan-up → true north, clockwise+
  floors            int,                         -- [tell] G+? typical tower
  floors_uniform    boolean default true,        -- [tell] same height across towers?
  scale_m_per_px    double precision,            -- [tell] provenance of traced coords

  -- ── Tier-2 site — safe engine defaults; NULL = use the default ──
  floor_height_m    double precision,            -- default 3.6
  lobby_height_m    double precision,            -- default 10.8 (triple-height podium)
  core_half_width_m double precision,            -- default 3.5
  sky_floor         int,                         -- default 30 (premium sky terrace)
  prevailing_breeze jsonb,                       -- default ["W","NW","N"] (Gurugram)
  view_anchors      jsonb,                       -- [{id,x,z,premium}] if already known; else traced

  -- ── configs the founder can state up front (areas/beds/baths) ──
  --    plates + exact facings are traced + confirmed at the vastu gate,
  --    NOT stored here.
  configs           jsonb,                       -- [{config,beds,baths,carpetSqft,superSqft,balconySqft,rooms}]

  -- ── founder geometry guidance (free-form but structured) ──
  --    e.g. {towerCount:5, notes:"T10/11/12 4BHK face NE; T16/17 5BHK face NW",
  --          configByTower:{"T-10":"4 BHK",...}}
  tower_hints       jsonb,

  -- ── source assets (Supabase Storage / live-media URLs) ──
  siteplan_url      text,                        -- the master siteplan image
  floorplan_urls    jsonb,                       -- [{config,unit,label,url}]
  brochure_url      text,
  notes             text,                        -- any extra founder guidance

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- The pipeline state machine (STEP transitions; see db3d/PIPELINE.md).
--  draft      → intake being filled
--  ready      → all Tier-1 present (Step 1 done) — generator may run
--  generated  → 3D built, awaiting founder gate            (Step 3 in)
--  confirmed  → founder approved the model → dismantle      (Step 3 pass → 4)
--  dismantled → pieces + intelligence extracted, awaiting parity gate (Step 5 in)
--  verified   → founder confirmed parity → seed             (Step 5 pass → 6)
--  seeded     → rows loaded into project_3d_* (Step 6 done)
--  live       → TOWER_INTEL swapped to the gated engine     (Step 7)
alter table project_3d_intake drop constraint if exists project_3d_intake_status_chk;
alter table project_3d_intake add constraint project_3d_intake_status_chk
  check (status in ('draft','ready','generated','confirmed','dismantled','verified','seeded','live'));

-- ── deny by default (ops table — no buyer ever reads it) ──
alter table project_3d_intake enable row level security;
-- (no CREATE POLICY … USING (true): anon/PostgREST see nothing.)

-- ── the only read path: service_role, one project at a time.
--    An ops console / the pipeline calls this; anon cannot. ──
create or replace function get_intake(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(i) from project_3d_intake i where i.slug = p_slug;
$$;

revoke all on function get_intake(text) from public, anon, authenticated;
grant execute on function get_intake(text) to service_role;

-- ── the pipeline advances status through this (guards illegal jumps).
--    Callable only by service_role. ──
create or replace function set_intake_status(p_slug text, p_status text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare cur text;
begin
  select status into cur from project_3d_intake where slug = p_slug;
  if cur is null then raise exception 'unknown slug %', p_slug; end if;
  update project_3d_intake set status = p_status, updated_at = now() where slug = p_slug;
  return p_status;
end;
$$;

revoke all on function set_intake_status(text, text) from public, anon, authenticated;
grant execute on function set_intake_status(text, text) to service_role;
