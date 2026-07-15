-- ════════════════════════════════════════════════════════════════
--  DB-CENTRIC 3D MODEL — schema (pilot: Signature Global Titanium SPR)
--
--  The monolithic advisor HTML is decomposed into these tables. The
--  SHIPPED engine holds no project data; it fetches the pieces at
--  runtime through gated Edge Functions.
--
--  SECURITY MODEL — deny by default:
--   · Every piece table has RLS ENABLED and NO anon/public policy, so
--     PostgREST + the public anon key return NOTHING. The tables are
--     invisible to the REST API.
--   · The ONLY read path is a SECURITY DEFINER function called by an
--     Edge Function that has already verified a short-lived signed
--     token (origin + entitlement + rate-limit). No token → no data.
--   · The scoring ENGINE never ships: intelligence is pre-computed and
--     stored in project_3d_intelligence, so the vastu plates/weights/
--     solar maths stay server-side. The client only reads results.
--
--  Apply on the real project with: supabase db push  (or paste in SQL
--  editor). Nothing here touches the existing live tables.
-- ════════════════════════════════════════════════════════════════

-- ── 1. SITE — one row per project (the estate shell) ──────────────
create table if not exists project_3d_site (
  slug              text primary key,
  name              text not null,          -- must match DB project_name
  latitude_rad      double precision not null,
  floors            int  not null,
  floor_height_m    double precision not null,
  lobby_height_m    double precision not null,
  north_cal_rad     double precision not null,
  sun_benchmark_h   double precision not null,
  west_weight       double precision not null,
  sun_ray_len_m     double precision not null,
  lake              jsonb   not null,        -- {x,z}
  scale_m_per_px    double precision not null,
  px_origin_x       double precision not null,
  px_origin_y       double precision not null,
  boundary_px       jsonb   not null,        -- [[px,py],…] site boundary
  amenities         jsonb   default '[]',    -- roads/water/blocks (site dressing) — filled when the engine is data-driven
  updated_at        timestamptz default now()
);

-- ── 2. TOWERS — the massing ───────────────────────────────────────
create table if not exists project_3d_towers (
  id        bigint generated always as identity primary key,
  slug      text not null references project_3d_site(slug) on delete cascade,
  tower_id  text not null,                   -- 'T-7'
  x double precision, z double precision, rot double precision,
  hw double precision, hd double precision,  -- slab half-width / half-depth
  core int not null,                         -- 2 = straight slab · 3 = L-shape w/ nose · 4 = quad core
  cfg  text not null,                        -- config key (tower default)
  q    jsonb,                                -- core:4 only: per-corner config map {101:cfg,102:cfg,103:cfg,104:cfg}
  unique (slug, tower_id)
);

-- ── 3. CONFIGS — per-BHK areas & labels ───────────────────────────
create table if not exists project_3d_configs (
  id          bigint generated always as identity primary key,
  slug        text not null references project_3d_site(slug) on delete cascade,
  config      text not null,                 -- '4.5 BHK'
  beds int, baths int,
  saleable int, carpet_sqft int, balcony_sqft int,
  deck text, rooms text, extra text, col text,
  unique (slug, config)
);

-- ── 4. PLATES — per-config vastu room offsets (the scored layout) ──
create table if not exists project_3d_plates (
  id      bigint generated always as identity primary key,
  slug    text not null references project_3d_site(slug) on delete cascade,
  config  text not null,                     -- '3.5 BHK|103' (corner has its own)
  offsets jsonb not null,                    -- {living,masterBed,kitchen,…} 45° steps
  unique (slug, config)
);

-- ── 5. FLOORPLANS — FLATW traced interior walls per unit ───────────
create table if not exists project_3d_floorplans (
  id      bigint generated always as identity primary key,
  slug    text not null references project_3d_site(slug) on delete cascade,
  config  text not null,
  unit    text not null,                     -- '101'
  key     text not null,                     -- '3.5 BHK|101'
  iw int, ih int,                            -- plan image px dims
  walls   jsonb not null,                    -- [[x,y,w,h],…]
  extra   jsonb default '{}',                -- rails/spawn/deck if present
  unique (slug, key)
);

-- ── 6. INTELLIGENCE — pre-computed per-flat results (engine stays server-side) ──
create table if not exists project_3d_intelligence (
  id         bigint generated always as identity primary key,
  slug       text not null references project_3d_site(slug) on delete cascade,
  tower_id   text not null,
  unit       text not null,
  composite  int,
  grade      text,
  facing     text,
  sub_scores jsonb,                          -- {morning,cool,vastu,view,airflow,floor}
  reasons    jsonb,                          -- {overall, rooms{room:{dir,score,ideal,reason}}}
  flags      jsonb,                          -- {lake,corner}
  metrics    jsonb,                          -- {sun_winter_h,sun_am_h,sun_pm_h,rank,weakest_dim}
  floor_curve jsonb,                         -- optional: per-floor sun hours. Left NULL — the
                                             -- client recomputes it from fetched geometry using
                                             -- public astronomy (not IP), so it need not be stored.
  computed_at timestamptz default now(),
  unique (slug, tower_id, unit)
);

-- ── 7. VASTU RULES — universal shastra (shared, NOT project IP) ────
create table if not exists vastu_rules (
  id          int primary key default 1,
  generic_offsets jsonb not null,
  direction   jsonb not null,                -- per-compass auspiciousness
  room        jsonb not null,                -- per-room ideal/good/ok/bad + reason
  updated_at  timestamptz default now(),
  constraint vastu_rules_singleton check (id = 1)
);

-- ── 8. ACCESS GRANTS — who unlocked what (entitlement source of truth) ──
--  A lead capture / membership / payment writes a row here; the mint-token
--  Edge Function checks it before issuing a short-lived model token.
create table if not exists model_access_grants (
  id          bigint generated always as identity primary key,
  slug        text not null,
  subject     text not null,                 -- phone/email/lead id (the gated identity)
  entitlement text not null check (entitlement in ('lead','member','paid')),
  granted_at  timestamptz default now(),
  expires_at  timestamptz,                   -- null = no expiry
  unique (slug, subject, entitlement)
);

-- ════════════════════════════════════════════════════════════════
--  RLS — enable on every piece table, add NO public policy.
--  Result: the anon key sees nothing. Edge Functions read via the
--  SECURITY DEFINER function below (or the service role), never the
--  client directly.
-- ════════════════════════════════════════════════════════════════
alter table project_3d_site          enable row level security;
alter table project_3d_towers        enable row level security;
alter table project_3d_configs       enable row level security;
alter table project_3d_plates        enable row level security;
alter table project_3d_floorplans    enable row level security;
alter table project_3d_intelligence  enable row level security;
alter table vastu_rules              enable row level security;
alter table model_access_grants      enable row level security;
-- (no CREATE POLICY … USING (true) anywhere — that is the point.)

-- ── gated read: one call returns the whole model for a slug, but ONLY
--    from inside an Edge Function that passes the verified entitlement.
--    SECURITY DEFINER lets it bypass RLS; it is NOT exposed to anon
--    because we REVOKE execute from anon/authenticated and grant only
--    to service_role. ──
create or replace function get_model_bundle(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  -- order by id = seed insert order = the pieces order the engine was proven
  -- against (identity columns increment in insert order; seeds insert in
  -- pieces order). Keeps tower/floorplan ordering deterministic in production.
  select jsonb_build_object(
    'site',        (select to_jsonb(s) from project_3d_site s where s.slug = p_slug),
    'towers',      (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') from project_3d_towers t where t.slug = p_slug),
    'configs',     (select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]') from project_3d_configs c where c.slug = p_slug),
    'plates',      (select coalesce(jsonb_agg(to_jsonb(p) order by p.id), '[]') from project_3d_plates p where p.slug = p_slug),
    'floorplans',  (select coalesce(jsonb_agg(to_jsonb(f) order by f.id), '[]') from project_3d_floorplans f where f.slug = p_slug),
    'intelligence',(select coalesce(jsonb_agg(to_jsonb(i) order by i.id), '[]') from project_3d_intelligence i where i.slug = p_slug),
    'vastu',       (select to_jsonb(v) from vastu_rules v where v.id = 1)
  );
$$;

revoke all on function get_model_bundle(text) from public, anon, authenticated;
grant execute on function get_model_bundle(text) to service_role;

-- Per-piece variants (building / floorplans / intelligence) can wrap the
-- same pattern so an Edge Function serves one piece per request — no single
-- response returns everything unless the caller is fully entitled.
