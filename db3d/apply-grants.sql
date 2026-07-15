-- ════════════════════════════════════════════════════════════════
--  APPLY GRANTS + STATUS — the finishing "data saved" script.
--  Run AFTER db3d/schema.sql, db3d/intake/schema-intake.sql and the
--  three seed-*.sql. Idempotent; safe to re-run.
--
--  1. demo entitlement so the engines' ?sub=buyer@demo unlocks the gate.
--  2. pipeline status in project_3d_intake (the overrides + status
--     companion) — after the seeds run, all three are 'seeded'; Emperor
--     additionally passed the Gate-5 verify. No override rows are needed:
--     every project takes its facts from project_input_feed with the
--     true-north=0° / scale=0.45 m/px defaults.
-- ════════════════════════════════════════════════════════════════

insert into model_access_grants (slug, subject, entitlement) values
  ('signature-global-titanium-spr', 'buyer@demo', 'paid'),
  ('elan-the-presidential',         'buyer@demo', 'paid'),
  ('elan-the-emperor',              'buyer@demo', 'paid'),
  ('m3m-residences-by-elie-saab',   'buyer@demo', 'paid')
on conflict (slug, subject, entitlement) do nothing;

insert into project_3d_intake (slug, name, status) values
  ('signature-global-titanium-spr', 'Signature Global Titanium SPR', 'seeded'),
  ('elan-the-presidential',         'Elan The Presidential',         'seeded'),
  ('elan-the-emperor',              'Elan The Emperor',              'seeded')
on conflict (slug) do update set status = excluded.status, updated_at = now();

-- M3M carries a true-north override (90°): its project_input_feed row nulls
-- true_north_offset_deg, so the override lives here (the overrides companion).
insert into project_3d_intake (slug, name, status, north_offset_deg) values
  ('m3m-residences-by-elie-saab', 'M3M Residences by Elie Saab', 'seeded', 90)
on conflict (slug) do update set status = excluded.status, north_offset_deg = excluded.north_offset_deg, updated_at = now();

-- verification (optional):
--   select slug, count(*) from project_3d_towers group by slug;
--   select slug, status from project_3d_intake order by slug;
--   select slug, subject, entitlement from model_access_grants order by slug;
