# The 3D-model pipeline — intake → gated 3D live

One repeatable, confirm-gated flow for taking a **new project** from a brief in
a table to a **gated 3D advisor** the UI serves. Founder-directed shape: seven
steps, two human "stop and confirm" gates. Most of it already exists — this doc
is the orchestration that wires the pieces together and names the gates.

`project_3d_intake.status` is the state machine that tracks where a project is.

```
 Step 1        Step 2          gate 3       Step 4          gate 5        Step 6      Step 7
 INTAKE   →   GENERATE   →   ✋CONFIRM   →  DISMANTLE   →  ✋VERIFY   →   SEED   →   SERVE
 (fetch)     (add-project)   (founder)     (db3d-generate) (founder)     (DB)      (UI/API)

 status:  draft → ready → generated → confirmed → dismantled → verified → seeded → live
```

The golden rule: **nothing goes live, and no step advances past a gate, without
an explicit founder OK.** The `TOWER_INTEL` swap (Step 7's tail) stays a
separate one-line change with instant rollback.

---

## Step 1 · Intake — *fetch the details*  → `status: ready`

**Skill:** `project-intake` · **Runs:** `node db3d/intake/intake.mjs <slug>`

The **`project_input_feed` view** is the source of truth: it consolidates the
ops pipeline (`backlog_projects` + `project_extended_details` +
`project_configurations`) into one row per project — `typed_facts`,
`uploaded_assets`, `configurations[]`. `db3d/intake/feed.mjs` maps that row →
the generation contract, applying two site-wide defaults the view leaves null:
**true-north 0°** and **scale 0.45 m/px** (override > view value > default). The
skill validates against the `add-project` Phase-1 checklist and emits
`scratchpad/advisor/<slug>.brief.md` — the generation brief. READY advances
`draft → ready`; BLOCKED lists the exact gaps.

*Source seam:* a fixture mirroring the view now (`db3d/intake/feed/<slug>.feed.json`);
`select … from project_input_feed` via `service_role` in production. The
`project_3d_intake` table is the optional **overrides + status** companion (a
per-project non-default north/scale, plus the pipeline `status`), since the view
is read-only and carries neither. Same mock posture as the rest of `db3d/`.

## Step 2 · Generate — *create the project*  → `status: generated`

**Skill:** `add-project`

Consumes the brief. Traces the siteplan → tower footprints; traces each floor
plan → the room **plate**; locks the `project_geometry` contract; runs the
render-preview loop to tune massing. Its **Phase-2 vastu gate** (facings + room
plates) is internal to generation — "vastu cannot be wrong." Output:
`public/tower-intel/<slug>.html` (the advisor) + `scratchpad/advisor/<slug>.intel.json`.

## ✋ Gate 3 · Confirm the model — *founder sign-off*

**How:** rendered images in chat (overview + near-ortho plan + any close-ups).
The founder approves, or requests changes → **loop back into Step 2's render
loop** until approved. Only on approval: `generated → confirmed`.

This is the "if confirmed continue, else keep working on the 3D model" gate.
Massing/facing changes here are cheap; getting them right *before* dismantling
is the point.

## Step 4 · Dismantle — *towers + intelligence*  → `status: dismantled`

**Skill:** `db3d-generate` (+ `extract-intelligence`)
**Runs:** `node db3d/generate.mjs public/tower-intel/<slug>.html [--name "Exact DB Name"]`

Decomposes the confirmed advisor into DB pieces (site · towers · configs ·
plates · floorplans · intelligence · vastu), the IP-free engine
(`db3d/engine/engine-<slug>.html`), and `db3d/projects/<slug>/seed-<slug>.sql`.
**Parity is proven automatically** as a built-in exit criterion (three-way:
new engine ↔ original file ↔ stored intelligence — every flat, exact).

## ✋ Gate 5 · Verify parity — *founder re-confirm*

**How:** the same rendered views as Gate 3, now from the **dismantled DB-backed
engine**, shown **side-by-side** with the confirmed original — plus the **hard
parity numbers** the harness emits (e.g. *24/24 flats exact, score + grade*).
The question this gate answers is narrow: *is the dismantled version identical
to what you confirmed at Gate 3?* Because parity is machine-proven, this gate is
usually a formality — but it's the founder's explicit "yes, same." Then:
`dismantled → verified`.

## Step 6 · Seed — *save to the DB*  → `status: seeded`

**Runs (founder, real Supabase):** `db3d/schema.sql` → `db3d/intake/schema-intake.sql`
→ the project's `seed-<slug>.sql`. Exact steps + verification cur/SQL in
`db3d/RUNBOOK.md`. Idempotent upserts; RLS keeps every piece table invisible to
anon. `verified → seeded`.

## Step 7 · Serve — *fetched on the UI via APIs*  → `status: live`

The gated engine loads through the Edge Functions (`mint-token` → `model`,
`db3d/supabase/functions/`): origin + entitlement + rate-limit + 5-min token,
then `get_model_bundle(slug)` reshaped to the engine's dialect. Entitlements are
written by `grant-entitlement` from the site's existing unlock flows
(`src/lib/modelAccess.ts`, dormant until `NEXT_PUBLIC_MODEL_GATE_URL` is set).

**The swap** — point the project's `TOWER_INTEL` entry at
`engine-<slug>.html`: one line, instant rollback, **founder-approved only**.
That flips `seeded → live`.

---

## State machine (guarded)

`project_3d_intake.status`, advanced by `set_intake_status(slug, status)`
(`service_role` only). Legal path:

| From | Step / gate | To |
|---|---|---|
| `draft` | Step 1 validates clean | `ready` |
| `ready` | Step 2 generates | `generated` |
| `generated` | **Gate 3** founder OK | `confirmed` |
| `generated` | Gate 3 changes → Step 2 loop | `generated` |
| `confirmed` | Step 4 dismantles (parity auto-proven) | `dismantled` |
| `dismantled` | **Gate 5** founder OK | `verified` |
| `verified` | Step 6 seeds the DB | `seeded` |
| `seeded` | Step 7 `TOWER_INTEL` swap | `live` |

## Constraints every run respects

- **Side-by-side until the swap.** Everything lives in `db3d/` + `scratchpad/`
  on the dev branch; only Step 2's `public/tower-intel/<slug>.html` and the
  Step-7 one-line swap ever touch what ships — and the swap is founder-gated.
- **No UI-component changes** during any of this (founder rule).
- **Vastu cannot be wrong** (Step 2 Phase-2 gate) and **parity must hold**
  (Step 4 auto-proof) — both are hard prerequisites to their following gate.
- **Proof bar unchanged:** `db3d/test-gate.mjs` (14/14) ·
  `db3d/test-edge-parity.mjs` (30/30) · `db3d/intake/test-intake.mjs` (14/14) ·
  `db3d/render-parity.mjs <slug> public/tower-intel/<slug>.html` per project.

## Worked example — Elan The Emperor (backfill)

Already-built project, run through the new front door to prove the loop:
`db3d/intake/projects/elan-the-emperor/intake.json` → `node db3d/intake/intake.mjs
elan-the-emperor` → **READY**, brief at `scratchpad/advisor/elan-the-emperor.brief.md`.
Next real pass: Steps 4–6 to bring Emperor into the DB (Steps 1–3 are effectively
done — it's live and founder-approved).
