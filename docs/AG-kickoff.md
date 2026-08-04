# Antigravity kick-off — Auth & Identity module

Copy-paste this to Antigravity to start the module. The full detail lives in
[`auth-identity-spec.md`](./auth-identity-spec.md); this is the orientation + the non-negotiables.

**Founder pre-step — put the Twilio creds in Supabase secrets (never in the repo/client):**
in the Twilio console create a **Verify Service** (Verify → Services), then:

```
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxx TWILIO_AUTH_TOKEN=xxxx TWILIO_VERIFY_SERVICE_SID=VAxxxx
```

---

## Task — build the unified Auth & Identity module for Truth Estate

Repo: Truth Estate (Next.js `output:"export"` static site + Supabase). You are the builder;
Claude (CTO) reviews and merges to main. Do NOT merge to main yourself.

### Start here
- Branch: `feature/unified-auth-merge` (already based on latest main).
  Run: `git fetch && git checkout feature/unified-auth-merge` — rebase any local work onto it (don't build on stale main).
- READ, in order:
  1. `AGENTS.md` — this is a MODIFIED Next.js; read `node_modules/next/dist/docs` before writing framework code.
     Founder rule: wire data into EXISTING UI components; don't restyle. UI changes need a separate founder ask.
  2. `docs/auth-identity-spec.md` — the FULL spec and source of truth. Follow it exactly.
  3. Flow diagrams (phone OTP / Google SSO / merge / recover-at-paywall): _(founder shares the artifact link)_

### What you're building (v1 — locked, do not re-litigate)
- `+91` → MSG91 SMS OTP (already live — REUSE, don't rewrite)
- non-`+91` → Twilio Verify (SMS) — NEW (Twilio account is configured)
- Google SSO, one-tap, any region — NEW (Google + Supabase provider already configured)
- Profile merge so one human = one account
- Recover-a-purchase-at-paywall (money-critical; spec §6)

WhatsApp is CUT (Meta blocked the business account). Email-from-domain is Phase 2. Build NEITHER.

### Non-negotiables (violate any and the module is rejected — spec §1)
- RLS is the only wall (anon key ships in the browser). Every new table ships RLS in the same migration.
  The CI "RLS Guard" (`scripts/rls-guard.mjs`) must stay GREEN.
- All identity ops are server-side, SERVICE-ROLE ONLY — copy the boundary in
  `supabase/migrations/0009_link_verified_phone.sql` (SECURITY DEFINER, EXECUTE granted to NO client role).
  A browser must never assert "I am this phone/user".
- `merge_user_profiles` is server-only, one transaction, IDEMPOTENT, and merges only the two identities the current
  session has just proven — it NEVER accepts ids passed from the client. (Account-takeover primitive otherwise.)
- No paid item is ever orphaned: a merge moves EVERY per-user row (entitlements, invoices, briefs, events, owned,
  consultations, contact_leads) source→target atomically.
- `user_profiles` has NO migration today — FIRST capture its current real schema in a migration, THEN add anything.
  Phone is stored in mixed formats (0009 matches last-10): normalize → DEDUP → then unique index. Order matters.

### Twilio (configured — read from Supabase secrets, never hardcode / never client-side)
Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`.
Use Twilio Verify (managed): Start(channel=sms) + Check. Do NOT build OTP generation/expiry/rate-limit yourself.
Keep the channel swappable to `whatsapp` behind a dormant flag (Meta blocked; do not enable).

### Ownership split (spec §7)
YOU build: the Twilio route in the phone verify edge fn (`+91→MSG91, else→Twilio`); Google callback
(`src/app/auth/callback/page.tsx`) + per-env redirect config; SignIn + paywall-recover UI; the `user_profiles`
schema-capture migration + phone normalization.
CLAUDE authors/co-reviews BEFORE these touch main (flag them early, small PRs): `merge_user_profiles` RPC;
the recover-at-paywall entitlement logic; RLS on new tables; the dedup→unique ordering.

### Reuse (don't reinvent — spec §10)
`chat-signin` + `0009` (phone verify + session), `claim-events` (attach anon tgAnon trail), `entitlements`,
`phone-known`, `capture-lead` → `contact_leads`, `0001_rls_lockdown` + `scripts/rls-guard.mjs`.

### Branch / deploy / merge gates (spec §9)
- Work ONLY on `feature/unified-auth-merge`. NEVER push to `main` or `claude/*` branches.
- Push → a Vercel branch preview builds automatically; iterate there + locally. The branch does NOT deploy to the
  shared Cloud Run candidate — auth reaches main only via Claude's review, so a half-finished change can't break the
  founder's testing arena. (Don't wire Google SSO to ephemeral `*.vercel.app` preview origins; test SSO on staging.)
- Small, single-purpose PRs. If you must touch a shared hot file (`OfficeApp.tsx`, or `phoneAuth.ts` — 8 consumers),
  say so in the PR so Claude integrates rather than collides.
- Green to merge: `tsc` clean, `next build` passes, RLS Guard green, edge-fn offline tests (mirror
  `supabase/functions/*/test-offline.mjs`).

### Definition of done — work the acceptance checklist in `docs/auth-identity-spec.md` §11.

Start with: (1) the `user_profiles` schema-capture migration, then (2) the Twilio Verify route in the phone verify
edge function. Open a PR against main for each cohesive piece and tag it for Claude's review.
