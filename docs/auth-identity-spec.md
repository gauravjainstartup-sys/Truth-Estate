# Auth & Identity — implementation spec (for Antigravity)

**Module:** unified sign-in / sign-up + identity merge
**Branch:** `feature/unified-auth-merge`
**Integrator:** Claude (CTO) reviews & merges to `main`. Do **not** merge to `main` yourself.
**Visual companion:** the flow diagrams for this spec (phone OTP, Google SSO, merge, recover-at-paywall) — ask the founder for the artifact link.

This is a wiring job on top of an existing backbone, **not** a from-scratch auth system. Read
`AGENTS.md` first (this is a modified Next.js; `output: "export"`), then this whole doc before writing code.

---

## 0. The decision (locked — do not re-litigate)

| Region / need | Channel | Status |
| :-- | :-- | :-- |
| Indian numbers (`+91`) | MSG91 SMS OTP | **already live** — reuse |
| International (non-`+91`) | **Twilio Verify** (SMS) | **new** |
| Any region, one-tap | **Google SSO** | **new** (Google + Supabase already configured) |
| International (alt) | WhatsApp OTP | **CUT** — Meta restricted the business account, appeal failed |
| Email OTP from our domain | Supabase + custom SMTP | **Phase 2** — not in this module |

One human can hold **two verified identities** (a Google email and a phone). They must collapse into **one
account** so either login lands in the same office and owns the same paid reports.

---

## 1. Non-negotiables (the security spine)

These are the rules a mistake in this module would violate. They are not style preferences.

1. **RLS is the only wall.** The Supabase anon key ships in every browser (`src/lib/supabase.ts`). Every new
   table **must** ship Row-Level Security policies in the same migration. The CI **RLS Guard**
   (`scripts/rls-guard.mjs`, `.github/workflows/rls-guard.yml`) must stay green — a failing guard blocks merge.
2. **Identity operations run server-side, service-role only.** A browser must never be able to assert
   "I am this phone / this user." Follow the exact pattern already in `supabase/migrations/0009_link_verified_phone.sql`:
   `SECURITY DEFINER` functions, `EXECUTE` granted to **no client role** — only the service role behind an
   Edge Function may call them. Its own header comment states why: *"so a client cannot simply announce 'I verified
   9958777312' and inherit a stranger's history."*
3. **`merge_user_profiles` is the crown jewel** (see §4). It reassigns ownership of **paid** content across
   accounts. If it is client-callable or accepts caller-supplied ids, it is an account-takeover primitive. It is
   **server-only, transactional, idempotent**, and merges **only the two identities the current session has just
   proven** — never ids passed from the client.
4. **No paid item is ever orphaned.** A merge must move *every* per-user row (entitlements, invoices, briefs,
   events, owned, consultations) from source → target atomically. Re-running a merge changes nothing (idempotent).
5. **Don't restyle while wiring data.** Per the founder rule in `AGENTS.md`: wire into the **existing** UI
   components; missing data renders "NA" or hides. UI changes need a separate founder ask.

---

## 2. Identity model

### 2.1 `user_profiles` — capture the schema first
`user_profiles` is the identity of record (read by `chat-signin`, `entitlements`, `phone-known`, `razorpay-verify`,
`claim-events`, and client code) **but it has no migration** — it was created ad-hoc. **First task:** add a migration
that captures its *current* real columns (introspect the live DB), so the schema is version-controlled before you
add constraints to it. Additive only, in the spirit of `0002_leads.sql`.

### 2.2 Phone is stored in mixed formats
`0009` matches phones on the **last 10 digits** on purpose — the table holds `9958777313`, `+917011823963`,
`7768003668`. Therefore:
- Add a **normalized** representation (store E.164 *and/or* a `phone_last10` generated column).
- **Dedup BEFORE any unique index.** Duplicate profiles already exist (see the pending reconciliation task and the
  drafted `supabase/reconcile/0.5a_merge_duplicate_profiles.sql`). A `UNIQUE(phone)` on a dirty table fails to build.
  Order is: **normalize → reconcile/dedup → then** the partial unique indexes.
- The runtime merge must treat "this phone already exists on another profile" as a **merge trigger**, not a
  constraint violation. Constraint and merge are co-designed.

### 2.3 Migration
`supabase/migrations/0014_*.sql` (next free number; 0013 is the latest). Contents: normalized phone/email columns,
partial unique indexes on `email` and normalized `phone` (added **after** dedup), the `merge_user_profiles` RPC,
and RLS on anything new. **Claude authors / co-authors this migration** (see §7).

---

## 3. Verification flows (contracts)

All verification goes through an Edge Function (server side). Reuse the `chat-signin` pattern.

### 3.1 Phone OTP — `+91 → MSG91`, else `→ Twilio Verify`
- **Start:** client posts `{ phone }` → edge fn routes: `+91` → MSG91 send; else → **Twilio Verify** `Start`
  (`channel=sms`). Keep the Twilio Auth Token **server-side** (Supabase secret), never in the client.
- **Check:** client posts `{ phone, code }` → edge fn verifies (MSG91 verify / Twilio Verify `Check`) → on
  `approved`, `SECURITY DEFINER` fn does **find-or-create** user by normalized phone, mints the Supabase session.
- Twilio Verify is a managed service — do **not** build code generation/storage/expiry/rate-limiting; Verify owns
  that. The channel is a parameter: keep it swappable to `whatsapp` behind a flag (dormant — Meta is blocked).
- **4-digit OTP** authorizes inheriting paid content — ensure server-side attempt-limits + expiry (MSG91/Verify
  both provide this; confirm it's enforced).

### 3.2 Google SSO
- Supabase Google provider is **already configured**. Remaining work is the **client-side PKCE callback**
  (`src/app/auth/callback/page.tsx`) — required because the app is a **static export** (no server runtime).
- **Redirect URIs must be allow-listed per environment** in Google Console + Supabase Auth:
  - staging (GitHub Pages): base path `/Truth-Estate`
  - production: base path `""` (`https://www.truthestate.in`)
  - **Vercel branch previews**: each `*.vercel.app` preview is a distinct origin — do **not** wire SSO to
    ephemeral preview origins; test SSO only on a fixed staging URL.
- On success: find-or-create user by **email** → `user_profiles`; attach the anon trail (§5).

### 3.3 Returning sign-in
Either channel resolves to the existing `user_profiles` row (phone via `phone-known` last-10 lookup; email match) →
session. No new profile created.

---

## 4. The merge — `merge_user_profiles(target_uid, source_uid)`

**Trigger:** a session already authenticated as identity B (e.g. Google/email) proves control of identity A (e.g.
verifies a `+91` via MSG91 OTP). The edge function — having proven **both** in this session — calls the RPC.

**Contract:**
- `SECURITY DEFINER`, `EXECUTE` to **service role only** (mirror `0009`).
- Runs in **one transaction**. Reassign every per-user FK from `source → target`: **entitlements, invoices,
  briefs/account, events, owned_properties, consultations (when it lands), contact_leads, ratings/votes** — audit
  the full set; missing one = orphaned data.
- **Idempotent**: a second call with the same pair is a no-op.
- The edge function passes the two proven ids; the **RPC never accepts ids from the client**.
- **Direction:** keep the identity the user is actively using as `target`; but correctness does not depend on
  direction — the invariant is that **no row is left on the losing profile**. Then soft-delete/disable the source
  profile.

**Match-before-create (prevents most merges):** when a Google sign-in's email already matches an existing
`user_profiles` row (e.g. captured earlier via a lead form), **attach to that profile instead of minting a new one**.
Only fall through to the merge when there was no email to match on.

---

## 5. Anonymous trail attach

Before sign-in a device owns an event trail + inferred brief under `truthEstate.tgAnon`. On **every** first sign-in
(any channel), attach that trail to the user via the existing **`claim-events`** edge function. Don't invent a new
path. Interacts with `src/lib/durableKeys.ts` — any new persisted key goes **in that one list**, with intent.

---

## 6. Recover-a-purchase-at-paywall (money-critical)

The single most important UX to get right. A returning buyer on a fresh Google session opens a report they already
paid for on their phone login → without this, they pay twice.

- On the **unlock/paywall** screen, always surface: *"Already unlocked this? Sign in with the phone you used."*
- Buyer verifies `+91` (MSG91) → edge fn proves the phone → checks whether that phone's Profile A **owns this
  report** → if yes, run `merge_user_profiles` → the entitlement is now on the current account → **open the report,
  do not charge**. If no prior entitlement, continue to Razorpay as normal.
- This is `merge_user_profiles` + entitlement lookup wired into the paywall. **Claude authors / co-reviews this**
  (it touches money) — see §7.

---

## 7. Ownership split (who writes what)

**Antigravity owns (build on this branch, Claude reviews the PR):**
- Twilio Verify route inside the phone verify edge function (`+91 → MSG91, else → Twilio`).
- Google SSO client callback (`src/app/auth/callback/page.tsx`) + session hand-off + per-env redirect config.
- SignIn UI wiring (region → channel; the paywall recover prompt UI).
- The `user_profiles` schema-capture migration (§2.1) and phone normalization columns.

**Claude authors or co-authors + reviews line-by-line before merge (the seams a hole hides in):**
- `merge_user_profiles` RPC + its RLS/grants (§4).
- The **entitlement-recovery-at-paywall** server logic (§6).
- RLS policies on any new table.
- The **dedup → unique-index ordering** (§2.2).

This is risk management, not distrust — auth's money/security seams need adversarial review regardless of author.
Flag these four to Claude early; don't ship them to `main` without the review.

---

## 8. Coordination — shared hot files

Antigravity's original doc marked whole files "protected." Two of them can't be whole-file-locked because they're
shared and change often:
- `src/components/office/OfficeApp.tsx` — 1,600-line office portal, actively worked in.
- `src/lib/phoneAuth.ts` — consumed by **8 surfaces** (`UnlockModal`, `BuyerOfficeGate`, `TruthGuideChat`,
  `AccountChip`, `SignIn`, `OfficeApp`, `shortlistAuth`, and itself).

Rule: **function-level ownership, not file-level.** Keep PRs small and single-purpose. If you must touch a shared
file, flag it in the PR so Claude integrates rather than collides. Overlaps with the pending "unify sign-in across
the seven surfaces" work — coordinate; don't build a second competing SignIn.

---

## 9. Branch, deploy, CI

- **Work on `feature/unified-auth-merge`** (this branch — already based on the latest `main`). Rebase onto it if you
  have local commits, so you're not on a stale base.
- **Deploy / preview:** pushing the branch triggers a **Vercel branch preview** automatically — iterate there and
  locally. Do **not** expect the branch to hit the shared Cloud Run candidate; only `main` auto-deploys, and auth
  reaches `main` **only through Claude's review** (so a half-finished auth change can't break the founder's testing
  arena).
- **Never** push to `main` or to `claude/*` branches.
- Green gates for merge: `tsc` clean, `next build` succeeds, **RLS Guard green**, offline tests for any edge
  function (mirror `supabase/functions/*/test-offline.mjs`).

---

## 10. Reuse map (don't reinvent)

| Need | Use what's already here |
| :-- | :-- |
| Server-side phone verify + session mint | `supabase/functions/chat-signin/` + `0009_link_verified_phone.sql` |
| The service-role security boundary | `0009` (`SECURITY DEFINER`, EXECUTE to no client role) |
| Attach anonymous trail | `supabase/functions/claim-events/` |
| Paid-content gate | `supabase/functions/entitlements/` (`core.ts` + `test-offline.mjs`) |
| Phone lookup (last-10) | `supabase/functions/phone-known/` |
| Lead capture worklist | `supabase/functions/capture-lead/` → `contact_leads` |
| RLS baseline + guard | `0001_rls_lockdown.sql`, `scripts/rls-guard.mjs` |
| Session persistence keys | `src/lib/durableKeys.ts` |

---

## 11. Acceptance criteria

- [ ] `user_profiles` schema captured in a migration before any constraint is added.
- [ ] Phone verify works for `+91` (MSG91) and non-`+91` (Twilio Verify) through one edge function.
- [ ] Google SSO completes on staging (correct redirect URI); session lands in `truthEstate.sbSession`; RLS scopes reads.
- [ ] `merge_user_profiles`: server-only, transactional, idempotent, reassigns the **full** per-user row set; a
      pen-test confirms it cannot be called from the client with arbitrary ids.
- [ ] Recover-at-paywall: a report paid under Profile A opens (no charge) after the buyer verifies that phone on a
      fresh Google session.
- [ ] Match-before-create: Google sign-in with an email already on a profile does not mint a duplicate.
- [ ] Anonymous `tgAnon` trail attaches on first sign-in (any channel).
- [ ] RLS Guard green; `tsc` + build clean; edge-function offline tests pass.
- [ ] OTP verification is server-side attempt-limited and time-boxed.
