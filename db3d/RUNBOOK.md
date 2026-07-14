# Go-live runbook — gated 3D on the real Supabase project

Founder-run: the build sandbox cannot reach Supabase, so every step below runs
on **your** machine / the Supabase dashboard. Nothing here touches the live
site — the engines stay side-by-side until the explicit `TOWER_INTEL` swap.

Everything you paste/deploy lives in this folder:

| What | Where |
|---|---|
| Schema (piece tables · RLS · gated read fn) | `db3d/schema.sql` |
| Intake table (pipeline Step 1 source) | `db3d/intake/schema-intake.sql` |
| Model data (idempotent upserts) | `db3d/projects/*/seed-*.sql` |
| Edge Functions (gate + entitlement writer) | `db3d/supabase/functions/{mint-token,model,grant-entitlement}` |
| Proof they match the tested mock | `node --experimental-strip-types db3d/test-edge-parity.mjs` (30/30) |

The end-to-end project flow this backs is `db3d/PIPELINE.md` (intake → generate
→ confirm → dismantle → verify → seed → serve).

---

## 1 · Schema — SQL editor

Dashboard → SQL editor → paste **`db3d/schema.sql`** → Run. Then paste
**`db3d/intake/schema-intake.sql`** → Run (the pipeline's Step-1 intake table +
its `service_role`-only `get_intake` / `set_intake_status`).

Both re-runnable (create-if-not-exists / create-or-replace). schema.sql creates
the seven piece tables + `model_access_grants`; schema-intake.sql adds
`project_3d_intake`. RLS is on for all with **no public policy** (anon/PostgREST
see nothing); `get_model_bundle()` / `get_intake()` are `service_role`-only.

Quick check (still in SQL editor):

```sql
select count(*) from pg_tables where tablename like 'project_3d_%';       -- 7 (6 pieces + intake)
select has_function_privilege('anon', 'get_model_bundle(text)', 'execute'); -- f
select has_function_privilege('anon', 'get_intake(text)', 'execute');       -- f
```

## 2 · Data — SQL editor

Paste and run **both** seeds (order doesn't matter, safe to re-run):

- `db3d/projects/signature-global-titanium-spr/seed-signature-global-titanium-spr.sql`
- `db3d/projects/elan-the-presidential/seed-elan-the-presidential.sql`

Expected rows per slug:

| slug | towers | configs | plates | floorplans | intelligence |
|---|---|---|---|---|---|
| signature-global-titanium-spr | 7 | 2 | 3 | 5 | 16 |
| elan-the-presidential | 8 | 3 | 6 | 9 | 24 |

```sql
select slug, count(*) from project_3d_towers group by slug;
select jsonb_pretty(get_model_bundle('signature-global-titanium-spr')::jsonb -> 'site');
```

## 3 · Secrets — CLI

```bash
supabase login                       # once
supabase link --project-ref <PROJECT_REF>
supabase secrets set MODEL_JWT_SECRET=$(openssl rand -hex 32)
supabase secrets set GRANT_ADMIN_KEY=$(openssl rand -hex 32)   # payment webhook / ops writes real tiers with it
# optional: extra allowed origins beyond https://gauravjainstartup-sys.github.io
# (custom domain, local testing) — comma-separated, no spaces:
supabase secrets set EXTRA_ORIGIN=http://localhost:3000
```

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected into Edge Functions
automatically — nothing to set.

## 4 · Deploy the functions — CLI

The Supabase CLI reads `./supabase/functions/`, and this repo deliberately
keeps the pack inside `db3d/` until the swap — stage a temp copy:

```bash
cd <repo checkout on branch claude/exciting-lamport-9x99ik>
supabase init                                      # once; no-op if supabase/ exists
mkdir -p supabase && cp -r db3d/supabase/functions supabase/   # temp staging (untracked)
supabase functions deploy mint-token        --no-verify-jwt
supabase functions deploy model             --no-verify-jwt
supabase functions deploy grant-entitlement --no-verify-jwt
rm -rf supabase/functions                          # keep the repo clean
```

`--no-verify-jwt` is **required and correct**: these endpoints replace the
platform's Supabase-JWT check with the stronger four-layer gate (origin
allowlist · entitlement row · rate-limit · 5-min HMAC token). Without the
flag, the browser would need the anon key just to reach them.

## 5 · Grants — automatic (the writer) + manual (SQL)

`model_access_grants` is the entitlement source of truth (RLS-hidden). Rows
arrive two ways:

**Automatic — the site's flows.** `src/lib/journey.ts` already calls the
writer at all three unlock moments (lead with a project → `lead` · ₹1,499
unlock → `paid` · membership → `member`, one row per project), through
`src/lib/modelAccess.ts` → the `grant-entitlement` function. The function
**clamps self-service writes to `lead`** — a static site can't hold a secret,
so client-claimed `paid`/`member` only stick when the caller sends
`x-grant-key: $GRANT_ADMIN_KEY` (future payment webhook / ops curl). Any tier
is enough for mint-token, so leads can open the gated 3D the moment they leave
a contact.

The writer is **dormant until you set the gate URL at site build time**
(GitHub Actions → repo variable, or `.env.production`):

```
NEXT_PUBLIC_MODEL_GATE_URL=https://<PROJECT_REF>.supabase.co/functions/v1
```

Until then every call is a no-op and the live site is byte-identical to today.

**Manual — SQL editor** (demo subjects, comps, revokes):

```sql
-- demo subject used by the engines' ?sub= param
insert into model_access_grants (slug, subject, entitlement) values
  ('signature-global-titanium-spr', 'buyer@demo', 'paid'),
  ('elan-the-presidential',         'buyer@demo', 'paid')
on conflict (slug, subject, entitlement) do nothing;

-- a real buyer: their phone/email as captured by the lead flow
-- insert into model_access_grants (slug, subject, entitlement)
--   values ('elan-the-presidential', '+919812345678', 'lead');

-- revoke = delete the row (or set expires_at in the past)
-- delete from model_access_grants where subject = '+919812345678';
```

## 6 · Verify the gate — curl

```bash
REF=<PROJECT_REF>
API="https://$REF.supabase.co/functions/v1"
ORIGIN="https://gauravjainstartup-sys.github.io"
SLUG="signature-global-titanium-spr"

# 6.1 entitled mint → 200 {"token":"…","exp":…}
TOKEN=$(curl -s -X POST "$API/mint-token" -H "origin: $ORIGIN" \
  -H "content-type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"subject\":\"buyer@demo\"}" | jq -r .token)
echo "$TOKEN" | head -c 40; echo

# 6.2 model with the token → 200; towers=7, intelligence=16 (SPR)
curl -s "$API/model?slug=$SLUG" -H "authorization: Bearer $TOKEN" \
  | jq '{towers: (.towers|length), flats: (.intelligence|length), t0: .towers[0].id}'
#   → {"towers": 7, "flats": 16, "t0": "T-6"}   ← "T-6" proves the reshape

# 6.3 bad origin → 403 bad-origin
curl -s -X POST "$API/mint-token" -H "origin: https://evil.example" \
  -H "content-type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"subject\":\"buyer@demo\"}" | jq .

# 6.4 unknown subject → 403 not-entitled
curl -s -X POST "$API/mint-token" -H "origin: $ORIGIN" \
  -H "content-type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"subject\":\"stranger@x\"}" | jq .

# 6.5 garbage token → 401 invalid-or-expired-token
curl -s "$API/model?slug=$SLUG" -H "authorization: Bearer garbage" | jq .

# 6.6 token scoped to another slug → 403 token-scope-mismatch
curl -s "$API/model?slug=elan-the-presidential" -H "authorization: Bearer $TOKEN" | jq .

# 6.7 sixth mint inside a minute → 429 rate-limited
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code} " -X POST \
  "$API/mint-token" -H "origin: $ORIGIN" -H "content-type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"subject\":\"ratelimit@test\"}"; done; echo
#   → six codes ending in 429 (mix of 403s if ratelimit@test has no grant — the
#     rate-limiter sits BEFORE entitlement, exactly like the mock)
```

All seven behave? The gate is live and byte-compatible with everything proven
locally (`db3d/test-gate.mjs` 14/14 · `db3d/test-edge-parity.mjs` 23/23).

## 7 · Point an engine at it (smoke test only — NOT the swap)

Open a locally served engine against the real gate:

```bash
cd db3d/engine && python3 -m http.server 9000
# allow that origin once:  supabase secrets set EXTRA_ORIGIN=http://localhost:9000
#   (then redeploy the two functions — secrets are read at cold start)
```

→ `http://localhost:9000/engine-signature-global-titanium-spr.html?api=https://$REF.supabase.co/functions/v1&sub=buyer@demo`

Full estate renders from the DB, panels live, `?sub=stranger@x` refuses. The
production swap itself (pointing `TOWER_INTEL` at the engine) stays a separate,
founder-approved one-line change with instant rollback.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `{"error":"misconfigured"}` (500) | `MODEL_JWT_SECRET` unset → step 3 |
| `bad-origin` from your own site | origin not in allowlist → `EXTRA_ORIGIN` secret, redeploy |
| `not-entitled` for a real buyer | no `model_access_grants` row (or expired) → step 5 |
| 401 on every `/model` call | secret changed between mint & fetch (redeploy mid-session) — tokens live 5 min, just re-mint |
| Pieces arrive snake_case / towers have numeric ids | you're calling the RPC directly, not through `/model` — the reshape lives in the Edge Function |
