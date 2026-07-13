# DB-centric, access-gated 3D model — architecture (pilot: Titanium SPR)

Built **side-by-side**. Nothing live changes until the founder finalizes and we swap the
`TOWER_INTEL` entry to point at the new engine.

## The problem it fixes
Today the whole model — building geometry, traced floor plans, and the scoring
intelligence — is plaintext inside one static file
(`public/tower-intel/signature-global-titanium-spr.html`, 318 KB) served openly by GitHub
Pages. The UI gates the 3D, but the **file itself has no gate**: open the URL and you have
the entire model to retrace and reuse.

## The end state
The shipped file becomes a **generic engine that contains zero project IP**. All project
data lives in the DB and arrives only through **access-gated Supabase APIs** at runtime.
Download the engine → you get an empty renderer.

Two protection layers, both chosen by the founder ("gated now, server-render later" +
"all of the above" for access):

1. **Geometry must reach the browser to render** → served in gated pieces (token + origin +
   rate-limit + entitlement). Defeats every practical threat: off-site scraping, the
   file-download hole, bulk copying of all projects, anyone without access.
2. **The scoring engine never ships at all** → intelligence is *pre-computed* server-side
   and stored; the client only reads results. The vastu plates, dimension weights, and
   solar maths (the real secret sauce) are never in the client.
3. **Phase 2 (later):** server-side rendering for the geometry too (stream frames, never
   ship vertices) — the only way to stop an *authorized* user capturing the one model they
   can already see. Deferred until bulk theft by logged-in users is a real problem.

## The pieces (decomposed from the SPR file — done, faithful)
| Piece | Rows (SPR) | What | Table |
|---|---|---|---|
| site | 1 | lat, floors, scale, north, lake, boundary | `project_3d_site` |
| towers | 7 | the massing slabs | `project_3d_towers` |
| configs | 2 | per-BHK areas/labels | `project_3d_configs` |
| plates | 3 | per-config vastu offsets (scored layout) | `project_3d_plates` |
| floorplans | 5 | FLATW traced walls per unit | `project_3d_floorplans` |
| intelligence | per-flat | **pre-computed** scores/grades/reasons | `project_3d_intelligence` |
| vastu_rules | 1 | universal shastra (shared, not IP) | `vastu_rules` |

Total client-fetched geometry payload ≈ **42.6 KB** (tiny, cacheable, egress-friendly).
Extractor: `scratchpad/db3d/extract-spr.mjs` → `scratchpad/db3d/pieces/*.json`. Repeatable
for every project.

## Security model (schema.sql)
- Every piece table: **RLS enabled, no public policy** → the anon key / PostgREST see
  nothing. The tables are invisible to the REST API.
- Only read path: `get_model_bundle(slug)` — a `SECURITY DEFINER` function, `execute`
  revoked from anon/authenticated, granted only to `service_role`. An Edge Function that
  has verified the gate calls it.
- Entitlement source of truth: `model_access_grants` (a lead / membership / payment writes
  a row; the token minter checks it).

## API layer (Edge Functions — to build next)
| Function | Does |
|---|---|
| `mint-token` | verify gate (entitlement in `model_access_grants` + origin + rate-limit) → issue a short-lived signed JWT scoped to `{slug, entitlement}` |
| `model` | verify token → return `get_model_bundle(slug)` (or a single piece per call) |

The layered gate = **origin check + short-lived signed token + rate-limit + entitlement**
on every request ("all of the above").

## Client (generic renderer — to build next)
`public/tower-intel/_engine.html` (name TBD): the universal renderer + panels, no project
data. On load: read `?slug=` → `mint-token` (through the existing UX gate) → `model` →
assemble → render. Static-export safe (runtime fetch, nothing baked). Reuses the current
iframe embed seam, so swapping it in later is a one-line `TOWER_INTEL` change.

## Verification plan (sandbox reality)
Supabase is network-blocked from this environment, so I can't provision the real project
here. I verify the engine end-to-end against a **local mock** of the Edge Functions
(serves `pieces/*.json` with the same gate logic) and prove it reproduces the current
model — same towers, same scores. The founder then runs `supabase db push` + deploys the
functions on the real project (exact steps provided).

## What ships vs what's gated (refinement)
The only *secret* maths is the **vastu scoring** (plates → weighted composite). That is
pre-computed and stored, so it never ships. The **sun/astronomy** maths (solar position,
day length, shadow ray-casts) is public knowledge and NOT IP — it stays in the client and
recomputes the sun charts from the already-fetched geometry, so panels keep working without
storing extra derived data. Hence `floor_curve` stays NULL.

## Status
- [x] Decompose SPR → pieces (faithful, counts verified)
- [x] Schema + RLS deny-by-default + gated read function
- [x] Pre-compute intelligence → `intelligence.json` (16 flats, scores+reasons+ranks; scoring engine stays server-side)
- [ ] Edge Functions: `mint-token`, `model`
- [ ] Generic renderer (reuse the proven engine, swap inline data → runtime fetch, strip vastu scoring) + local mock parity harness
- [ ] Apply steps for the real Supabase project
- [ ] (Phase 2) server-side rendering
