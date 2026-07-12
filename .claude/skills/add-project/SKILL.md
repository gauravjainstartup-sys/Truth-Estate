---
name: add-project
description: >-
  Generate the Tower & Unit 3D advisor (Sun · Heat · Vastu) for a NEW real-estate
  project from its siteplan and floor plans. Walks the geometry intake, locks the
  project_geometry contract, renders a preview to verify the massing, then emits
  the 3D HTML advisor plus the per-flat intelligence JSON for the database. Use
  when the user says "add a project", "new project 3D", "generate the tower
  advisor / unit intelligence", or drops a siteplan / floor-plan image to model.
---

# Add a project — Tower & Unit 3D advisor generator

Turn a project's **siteplan + floor plans** into a working 3D advisor and its
per-flat intelligence. The reference implementation is
`public/tower-intel/signature-global-titanium-spr.html` — every new project is
the **same engine** driven by a different `project_geometry`. Nothing about the
sun/heat/vastu maths changes per project; only the geometry does.

## Outputs (two files)

| File | What it is | Consumer |
|---|---|---|
| `public/tower-intel/<slug>.html` | the 3D advisor (Three.js) | the website / brokers |
| `scratchpad/advisor/<slug>.intel.json` | every flat's scores + reasons | the DB / chatbot |

## Three golden rules (non-negotiable)

1. **Vision first, questions second.** Read the images and pre-fill everything you
   can before asking. Ask only the gaps and the confirmations.
2. **Vastu cannot be wrong.** Facing and room-direction are the only inputs where a
   wrong value is unacceptable. They pass through the confirmation gate (Phase 2)
   before anything is generated. Never invent a facing — derive it or confirm it.
3. **The sun benchmark is winter.** Scoring uses the winter-solstice day on purpose
   (honest worst case). Morning-light uses equinox, heat uses summer. This is fixed
   methodology — never a question.

---

## Phase 0 · Ingest & analyse

Collect the siteplan and one floor plan per configuration. From the images, draft
as much of the geometry as you can read: tower count/labels/footprints, the north
arrow, a scale bar, the amenity (lagoon/green) positions, and each config's room
layout, entrance, and areas. Present the draft; then ask only what's missing.

## Phase 1 · Intake

Tags: `[read]` you took it from the image · `[tell]` the user must provide ·
`[⚠]` sun/vastu-critical — propose, but the user must confirm.

**Tier 1 — required (output is wrong without these)**
- `[tell]` City / location → latitude for the sun path.
- `[⚠]` True north on the siteplan (the angle).
- `[tell]` Scale — a scale bar, plot acres + rough L×W, or one tower's length in m.
- `[tell]` Total floors (G+?), and whether uniform across towers.
- `[read]` Tower count + labels; each tower's footprint (position, rotation, slab L×D).
- `[read+⚠]` Core type per tower — straight slab (2 units/floor) or L-shape with a
  protruding nose/corner unit (3 units).
- `[tell]` Which configs exist **and which towers have which**.
- `[provide]` A floor-plan image per config.
- `[read]` Bedroom count per config (decides which rooms get vastu-scored).
- `[read+⚠]` The room-direction **plate** per config — facing of living, master,
  kitchen, bed-2, bed-3, pooja, bathroom, entrance relative to the facade. Confirm
  the high-weight rooms: entrance, kitchen, master, pooja.
- `[read+⚠]` Corner/nose unit = its **own** plate + facing.
- `[read]` Areas per config — carpet, super, balcony.
- `[read]` Units per floor + numbering (101/102/103…).
- `[read+⚠]` Handedness — which units are mirror-image plates of each other.
- `[⚠]` Each unit's primary (deck/balcony) facing.
- `[⚠]` Facing **override** — when the simplified box massing can't represent the real
  deck direction (e.g. two wings both facing east), the user's facing wins over the
  geometry for scoring.
- `[read+tell]` View anchors (lagoon/green/road) — positions, and which is *premium*.
- `[confirm]` Prevailing breeze (default W–NW for Gurugram) — drives airflow.

**Tier 2 — optional (safe defaults; ask only to sharpen)**
Floor-to-floor height (3.6 m), lobby/podium height (triple-height), lift-core width
(3.5 m), sky/amenity floor (30), per-tower height variation, regional haze/climate
(the low-winter-sun usability curve is Gurugram-tuned).

**Tier 3 — fixed, never ask (the universal spine)**
The Vastu Shastra directional rules and each room's ideal/good/ok/bad directions
(only the *building's* room layout is the input); the winter/equinox/summer season
model; the 6-dimension composite weights (morning 25 · cool 20 · vastu 25 · view 15
· airflow 10 · floor 5) and room-importance weights.

## Phase 2 · Confirmation gate (vastu lock)

Before generating **anything**, present this table and get an explicit sign-off. This
is where "vastu cannot be wrong" is enforced.

| Tower | Unit | Config | Primary (deck) facing | Nose/corner | Mirror of |
|---|---|---|---|---|---|

…plus the per-config room plates. Do not proceed until the user confirms.

## Phase 3 · Build the contract

Write `project_geometry` per **`project-geometry.md`** (this skill's companion). It is
the single source of truth: everything project-specific lives here, nothing else.

## Phase 4 · Generate the 3D file

- **Target state (once the engine is a generic module):** drop the contract in; the
  engine renders from it. One file, no edits.
- **Interim (until that port lands):** clone the reference advisor and replace the
  project-specific values. They live in four places — consolidate them from the
  contract:
  1. the `DATA` block (`const LAT / FLOORS / LAKE / towers[] / CONFIGS`),
  2. north calibration (`NORTH_CAL` / `northOff`),
  3. the vastu **PLATE** offsets (inside `vastuRoomScore`),
  4. any facing overrides (the `vfacing` / `primL` per-unit conditionals).

  Extract the `<script>` and run `node --check` after editing — this file has no build
  step, so a syntax slip ships broken.

## Phase 5 · Render-preview loop (verify the massing)

Render headless and screenshot; show the user; iterate on rotations/spacing. Massing
precision matters because tower spacing changes the inter-tower **shadowing**, which
changes the sun numbers.

```
node scratchpad/advisor/golden.mjs   # pattern: chromium + swiftshader, file:// load,
                                     # waitForFunction on bare `computeScores2`/`towers`
```

Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, args
`--no-sandbox --use-gl=swiftshader`. NB the engine's globals are top-level `const`/`let`
— reachable by **bare name** in `page.evaluate`, never as `window.*`.

## Phase 6 · Extract the intelligence

Run `computeScores2()` in the rendered page and serialise every flat: composite score
+ grade + facing, the six sub-scores (morning, cool, vastu, view, airflow, floor), the
raw winter sun hours, flags (lake, corner), and the authoritative reason strings.
Write `scratchpad/advisor/<slug>.intel.json` in the shape the DB table expects (see the
intelligence-persistence plan). This is the same run that verified the massing — one
compute, two outputs.

## Phase 7 · Handoff

- 3D file in `public/tower-intel/<slug>.html`; wire its `TOWER_INTEL` entry (keyed by
  the DB `project_name`) so it attaches to the project page.
- Intelligence JSON ready to load into the DB.
- Follow the repo's deploy flow to ship; verify green.

## Guardrails

- **Never generate before the Phase-2 confirmation.** Vastu and facing are gated.
- **Winter benchmark stays winter** — don't "improve" sun numbers by changing the season.
- **Don't invent geometry.** Every tower position/rotation is read from the plan or
  given; the render loop confirms it. Unknowns are asked, never guessed.
- **Marketing data is out of scope here** — price, total units, possession, RERA ID come
  from the Supabase v3 pipeline, not this intake.
- **~90% deterministic; the last 10% is the render loop.** Say so — don't claim pixel-
  perfect massing from words.

## Companion

- `project-geometry.md` — the contract this skill produces (fields + Titanium worked example).
