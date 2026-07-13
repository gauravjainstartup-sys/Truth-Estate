---
name: db3d-generate
description: >-
  Generate the complete DB-centric, access-gated 3D model file-set for a
  project from its existing 3D advisor HTML — DB pieces, model bundle,
  seed.sql, the IP-free engine, and a runnable gated demo — with parity
  proven automatically against the original. Use when the user says
  "generate the gated/DB-centric 3D for <project>", "new-approach 3D file",
  "decompose <project>'s 3D into the DB", or wants the whole file-set the
  db3d pipeline produces for a project.
---

# db3d-generate — gated 3D model file-set for a project

One command turns a **current-engine advisor HTML** into everything the
DB-centric approach needs for that project, and proves the result matches the
original before it finishes.

```
node db3d/generate.mjs public/tower-intel/<slug>.html [--name "Exact DB Name"] [--zip] [--skip-parity]
```

## Outputs

| File | What |
|---|---|
| `db3d/projects/<slug>/pieces/*.json` | the 7 DB pieces (site, towers, configs, plates, floorplans, intelligence, vastu_rules) |
| `db3d/projects/<slug>/<slug>.model.json` | the whole model in one file — exactly the gated `model` API's response |
| `db3d/projects/<slug>/seed-<slug>.sql` | idempotent upserts matching `db3d/schema.sql` — run after it in Supabase |
| `db3d/engine/engine-<slug>.html` | the IP-free engine (no geometry, no plates, no scoring — leak-scanned at build) |
| `db3d/projects/<slug>/<slug>-3D-demo.zip` | with `--zip`: one-command runnable gated demo |

## What it proves before finishing (never skip on a real run)

1. **Gate suite 14/14** — origin, entitlement, rate-limit, token forgery/expiry/scope.
2. **Site parity** — topH/floors/FH/lobby/lat/towers/configs identical to the monolith.
3. **Per-flat three-way parity** — every flat's (score, grade) identical across
   new engine ↔ current monolith ↔ stored intelligence. Any mismatch fails the run.

## Rules

- **`--name` must be the DB `project_name`** when the `<title>` differs from it
  (e.g. SPR's title says "Titanium SPR" but the DB name is "Signature Global
  Titanium SPR"). The advisor attaches to the project page by this name.
- **Current-engine advisors only** (FLATW + PLATE + subScores v2 — titanium-spr,
  elan-the-presidential). Pre-v2 files (dlf-arbour) fail extraction loudly by
  design: regenerate them with the add-project skill first, then run this.
- The engine keeps its monolith's cosmetic site dressing (roads/water art) —
  visible on any public siteplan, not IP. The sensitive pieces (towers, FLATW
  traces, plates, scoring) are stripped and served only through the gate.
- Demo: `node db3d/mock-api.mjs` → `http://localhost:8791/` (lists projects;
  `?sub=buyer@demo` is the demo-entitled subject, `stranger@x` shows the refusal).
- Everything stays under `db3d/` (side-by-side prototype). Going live = apply
  `db3d/schema.sql` + `seed-<slug>.sql` on Supabase and deploy the Edge-Function
  ports of `mock-api.mjs` (see `db3d/ARCHITECTURE.md`), then swap the
  `TOWER_INTEL` embed — a separate, founder-approved step.

## Companions
- `db3d/ARCHITECTURE.md` — the full security model and go-live plan.
- `add-project` skill — builds a NEW project's advisor from siteplans (intake →
  contract → monolith); this skill then converts that monolith to the gated form.
- `extract-intelligence` skill — the headless scorer this pipeline reuses.
