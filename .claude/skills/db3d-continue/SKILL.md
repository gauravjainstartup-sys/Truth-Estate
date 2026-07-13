---
name: db3d-continue
description: >-
  Resume the DB-centric, access-gated 3D model workstream exactly where it
  left off. Use when the user says "/db3d-continue", "continue the DB-centric
  3D work", "resume the gated 3D", "lets do the go-live pack", or anything
  about continuing yesterday's gated-3D / db3d effort.
---

# db3d-continue — resume the gated-3D workstream

## First actions (cold session)
1. Read `db3d/ARCHITECTURE.md` — the plan of record. Its **Status checklist is
   the source of truth**; continue from the first unchecked item.
2. `git log --oneline -15 -- db3d/` for the slice history (what shipped, in
   what order, with proof notes in each commit body).
3. Everything lives on branch `claude/exciting-lamport-9x99ik` (also the
   designated dev branch). Commit + push every slice there. Do NOT push db3d
   work to `main` — nothing goes live until the founder-approved swap.

## Where this stands (as of 2026-07-13, commit 45e02f6)
Done and proven: pieces decomposition, schema + RLS deny-by-default
(`db3d/schema.sql`), pre-computed intelligence, gated API mock
(`db3d/mock-api.mjs`, gate suite 14/14 in `db3d/test-gate.mjs`), IP-free
engines with built-in leak scan, three-way parity harness, and the
`db3d-generate` skill/tool (one command per project). Two projects generated:
- `signature-global-titanium-spr` — 16/16 flat parity (lossless vs hand-built)
- `elan-the-presidential` — 24/24 flat parity (first tool-only project)
Layout: `db3d/projects/<slug>/{pieces/, <slug>.model.json, seed-<slug>.sql}`,
engines at `db3d/engine/engine-<slug>.html`. Demo: `node db3d/mock-api.mjs` →
http://localhost:8791/ (`?sub=buyer@demo` entitled · `stranger@x` refused).

## Next milestone: the go-live pack (first unchecked status item)
1. **Port the mock to Deno Edge Functions** — `supabase/functions/mint-token/`
   and `supabase/functions/model/` (keep them inside `db3d/` until the swap,
   e.g. `db3d/supabase/functions/…`, so nothing live changes). 1:1 port of
   `db3d/mock-api.mjs` handlers: same four checks (origin allowlist ·
   entitlement from `model_access_grants` · rate-limit · HMAC JWT 5-min TTL),
   `get_model_bundle(slug)` via service_role instead of pieces-from-disk,
   secret from `MODEL_JWT_SECRET` env. CORS for the site origin.
2. **Provisioning runbook** for the founder (Supabase is NETWORK-BLOCKED from
   this sandbox — never try to apply directly; hand exact steps):
   a. SQL editor: run `db3d/schema.sql`
   b. SQL editor: run both `db3d/projects/*/seed-*.sql`
   c. `supabase secrets set MODEL_JWT_SECRET=<random-32B>`
   d. `supabase functions deploy mint-token model`
   e. curl verification block (mint → model → 401/403 negative cases)
3. **Entitlement writer** — wire the existing lead/OTP/payment flow to insert
   `model_access_grants` rows (see `src/lib/journey.ts` + `shortlistAuth.ts`
   seams). The UX gate itself must NOT change (founder rule).
4. **Swap (founder-approved, explicit ask only)** — point the `TOWER_INTEL`
   entry at `engine-<slug>.html` (one line, instant rollback), ship via the
   repo deploy flow (FF push `HEAD:main`, poll Actions green, sync branch).
5. (Phase 2, deferred) server-side rendering — only if bulk theft by
   authorized users becomes real.

## Constraints a fresh session must respect
- **Founder rules**: db3d stays side-by-side until the explicit swap ask; never
  change UI components during DB integration; model-ID string never in
  commits/artifacts (chat only).
- **Sandbox**: Supabase + *.github.io are proxy-blocked (403); api.github.com
  works. Verify against the local mock; provisioning is founder-run.
- **Proof bar**: any engine/pipeline change must re-pass
  `node db3d/test-gate.mjs` (14/14) and `node db3d/render-parity.mjs <slug>
  public/tower-intel/<slug>.html` (mock running; site + per-flat exact).
- New projects: use the `db3d-generate` skill; v1-engine advisors
  (dlf-arbour) need `add-project` regeneration first.
