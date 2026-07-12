---
name: extract-intelligence
description: >-
  Pull EVERY flat's Sun · Heat · Vastu intelligence out of a project's 3D advisor
  into DB-ready JSON for the chatbot — per-flat scores, within-project ranks, the
  weakest dimension, and the authoritative Vastu room reasons the engine itself
  emits. Works on any advisor built on the current engine. Use when the user says
  "extract the intelligence", "get me all the intelligence for <project>", "export
  the flat data for the DB / chatbot", or wants a project's unit intelligence saved.
---

# Extract intelligence — a project's flat-by-flat brain

Runs a project's 3D advisor headless, computes the scores exactly as the page does,
and enriches every flat with ranks + the engine's own Vastu reasons. **One engine run
→ the whole project's brain**, in the shape the DB and chatbot expect.

## Run it

```
node .claude/skills/extract-intelligence/extract.mjs <html-path> [out.json]
```
e.g.
```
node .claude/skills/extract-intelligence/extract.mjs \
  public/tower-intel/signature-global-titanium-spr.html \
  scratchpad/advisor/signature-global-titanium-spr.intel.json
```

Output → `scratchpad/advisor/<slug>.intel.json`: a `summary` (tower ranking, best flat,
weights) + one record per flat-line. **Field-by-field shape and the receiving table are
in the companion `unit-intelligence.md`.**

## What each flat carries

- Identity + areas · composite `score`/`grade` · `facing`.
- The six dimensions — `morning, cool, vastu, view, airflow, floor_score` — each with a
  **within-project `rank`** (so "best X" comes with "#N of M").
- Raw drivers — winter sun hours (total/AM/PM), `is_lake`, `is_corner`.
- **`weakest_dim`** — the honest "but…".
- **`vastu_overall` + `vastu_rooms`** — the authoritative per-room reasons (dir, score,
  ideal, reason) the engine emits. These are *quoted* by the chatbot, never re-composed
  — that's how "vastu can't be wrong" is protected.

## Scope & guardrails

- **Targets the CURRENT engine** (`computeScores2`). Older advisor files (e.g.
  `dlf-arbour`, still on `computeScores` v1) are detected and skipped with a clear
  message — regenerate them from the `add-project` template first, then extract.
- **Read-only.** Extraction never modifies the advisor file; it only reads its numbers.
- **Fail-soft enrichment.** The Vastu detail is best-effort per call, so a slightly
  different project file still yields the core scores rather than nothing.
- **This is the same compute that `add-project` Phase 6 runs** — that skill produces a
  new project's file *and* its intelligence in one pass; this skill re-runs the export
  standalone for any existing project.

## Getting it into the DB

The extractor writes the JSON. Loading is a `project`-scoped upsert via a **service-role**
connection (the one open write-path decision — the public site is anon-read-only). Until
that's wired, the JSON is the deliverable; `unit-intelligence.md` has the table DDL and
the chatbot query patterns.

## Companion

- `unit-intelligence.md` — the emitted shape, the `unit_intelligence` table, and how the
  chatbot queries it.
