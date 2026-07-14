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
- [x] Gated API mock (mint-token + model, Deno-portable) + gate proof 14/14
- [x] Generic renderer increment 1 — geometry DB-driven, renders identical estate (numeric site parity asserted)
- [x] Generic renderer increment 2 — vastu scoring stripped (PLATE, room weights, plate router, v1 formula,
      shastra tables all out of the shell; IP-leak scan built into the build). Per-flat three-way parity
      asserted: new engine ↔ current file ↔ stored intelligence, 16/16 exact (score + grade). Priorities
      sliders keep working — the six dims recombine client-side; only the vastu dim arrives pre-computed.
- [x] db3d-generate tool + skill: ONE command produces a project's whole file-set (pieces, bundle,
      seed.sql, IP-free engine, demo zip) with the gate suite + three-way parity as built-in exit
      criteria. Proven on SPR (lossless regression, 16/16) and Elan the Presidential (first
      never-hand-migrated project: 8 towers · 3 configs · 9 floorplans · 24/24 flat parity).
      Layout: db3d/projects/<slug>/ per project; engines at db3d/engine/engine-<slug>.html.
- [x] Real-Supabase apply pack: Deno Edge Functions at db3d/supabase/functions/{mint-token,model} —
      Web-API-only port of the mock, proven by db3d/test-edge-parity.mjs (30/30 under Node
      --experimental-strip-types): same gate matrix through the deployable handlers, byte-identical
      JWTs, and reshapeBundle() restoring the exact pieces dialect from to_jsonb rows (tower ids,
      carpetSqft, floorplan rails — the raw RPC would have half-broken the engine). Seeds already
      generated per project; exact founder steps in db3d/RUNBOOK.md (schema → seeds → secrets →
      deploy --no-verify-jwt → grants → 7-case curl proof → real-gate engine smoke via ?api=).
- [x] Entitlement writer: grant-entitlement Edge Function + src/lib/modelAccess.ts (fire-and-forget,
      DORMANT until NEXT_PUBLIC_MODEL_GATE_URL is set at build — live site unchanged until then).
      journey.ts writes grants at its three unlock moments (project lead → 'lead' · ₹1,499 unlock →
      'paid' · membership → 'member' per project); the function clamps self-service to 'lead' —
      real tiers require x-grant-key (GRANT_ADMIN_KEY), which only the future payment webhook/ops
      hold. UX gate untouched (founder rule).
- [ ] Founder finalizes → swap the TOWER_INTEL embed to the new engine (one line, instant rollback)
- [ ] (Phase 2) server-side rendering
