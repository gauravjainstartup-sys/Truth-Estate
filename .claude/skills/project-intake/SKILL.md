---
name: project-intake
description: >-
  STEP 1 of the 3D-model pipeline. Fetch a project's intake row (all the
  details required to generate its Tower & Unit 3D advisor) from the
  project_3d_intake table, validate it against the add-project Phase-1
  checklist, and emit the generation brief the generator starts from —
  instead of interviewing the founder. Use when the user says "intake
  <project>", "start the pipeline for <project>", "fetch the details for
  <project>'s 3D", or kicks off a new project's 3D model.
---

# Project intake — pipeline Step 1

The **front door** of the productized 3D pipeline. Every new project's 3D
advisor begins here: a single row in `project_3d_intake` holds everything a
human must provide (the `add-project` Phase-1 answers) + the source image
URLs. This skill fetches it, checks it's complete, and produces the
**generation brief** so Step 2 (`add-project`) starts from data, not an
interview.

See `db3d/PIPELINE.md` for the full 7-step flow and the two founder gates.

## When to run

At the very start, for one project, given its `slug`. It's the only step that
reads `project_3d_intake`; everything downstream reads the brief + the images.

## Do it

```
node db3d/intake/intake.mjs <slug>
```

- **Source (primary): the `project_input_feed` view** — the founder's view that
  consolidates the ops pipeline (`backlog_projects` + `project_extended_details`
  + `project_configurations`) into one row per project: `typed_facts`,
  `uploaded_assets`, and a `configurations[]` array. `db3d/intake/feed.mjs`
  (`mapFeedRow`) maps that row → the generation contract. Here it reads a
  fixture mirroring the view (`db3d/intake/feed/<slug>.feed.json`, Supabase is
  network-blocked from the sandbox); in production it's one
  `select … from project_input_feed where project_name = $1` via `service_role`.
- **Two site-wide defaults** the view doesn't carry (returns null): **true-north
  offset → 0°** (north-up siteplans) and **scale → 0.45 m/px**. Precedence:
  explicit override > view value > default; the brief flags a defaulted value.
- **Fallback**: a hand-authored `db3d/intake/projects/<slug>/intake.json` (used
  only if no feed row exists). `resolveIntake(slug)` picks feed first.
- **Output**: `scratchpad/advisor/<slug>.brief.md` — the generation brief
  (project facts, resolved site with Tier-2 defaults applied, config table,
  the exact list of images to trace, and any Tier-1 gaps).
- **Exit code**: `0` = READY (all Tier-1 present) · `2` = BLOCKED (gaps
  listed). The brief header says which.

## Field mapping — `project_input_feed` → the contract

| view field | → contract | notes |
|---|---|---|
| `project_name` | `name` + `slug` (slugified) | attaches the advisor |
| `latitude` | `latitude_deg` | from `location_insights` coords |
| `true_north_offset_deg` | `north_offset_deg` | **null → 0°** |
| `no_of_floors` / `floors` | `floors` | int, or max of a range/"G+38" |
| `scale_m_per_px` | `scale_m_per_px` | **null → 0.45** |
| `configurations[]` | `configs[]` (deduped by `bhk_type`) | `beds`=parseInt(`bhk_type`); carpet/super/balcony carried |
| `configurations[].floor_plan_image_url` | `floorplan_urls[]` | one per tower/config row |
| `siteplan_image_url` | `siteplan_url` | the massing trace source |
| `total_towers` + `tower_name` | `tower_hints` | count + config↔tower |

## What the row must carry (Tier-1)

Mirrors `add-project` Phase 1. The validator (`validate()` in `intake.mjs`) is
the source of truth; in short:

**Tier-1 — generation is wrong without these (BLOCK if missing):**
- `latitude_deg` `[tell]` · `north_offset_deg` `[⚠]` · `floors` `[tell]` ·
  `scale_m_per_px` `[tell]`
- `siteplan_url` `[image]` — to trace tower footprints
- `configs[]` — each with `beds` and an area (carpet or super sqft)
- `floorplan_urls[]` — at least one per stated config (to trace the plate)

**Tier-2 — safe defaults, reported not blocked:** `floor_height_m` (3.6) ·
`lobby_height_m` (10.8) · `core_half_width_m` (3.5) · `sky_floor` (30) ·
`prevailing_breeze` (W/NW/N).

**NOT in intake (by design):** exact tower x/z/rotation and the per-config room
**plates** and per-unit facings. Those are *traced from the images* by
`add-project` and locked at its **Phase-2 vastu gate** — never guessed, never
stored as intake. Intake holds answerable facts + hints + image URLs only.

## Status

The row's `status` drives the pipeline state machine
(`draft → ready → generated → confirmed → dismantled → verified → seeded →
live`). This step moves `draft → ready` once the brief validates clean
(production: `set_intake_status(slug,'ready')`). Downstream steps advance it;
the two founder gates guard the `generated → confirmed` and
`dismantled → verified` transitions.

## Hand-off

READY → invoke **`add-project`** with the brief (Step 2). BLOCKED → tell the
founder exactly which Tier-1 fields to add to the intake row, then re-run.

## Companions

- `db3d/intake/schema-intake.sql` — the table + `get_intake` / `set_intake_status`.
- `db3d/intake/intake.mjs` — fetch · `validate()` · `resolveSite()` · `brief()`.
- `db3d/PIPELINE.md` — the whole 7-step flow this skill opens.
