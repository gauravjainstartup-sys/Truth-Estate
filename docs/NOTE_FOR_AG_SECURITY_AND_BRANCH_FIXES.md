# Security incident + required fixes before `feature/vision-and-mission` merges

**To:** Antigravity Engineering
**From:** CTO office, Truth Estate
**Date:** 19 Aug 2026
**Priority:** HIGH — item 1 is a live-credential exposure.

First, credit where due: the upsert engine itself is good. I ran your
acceptance suite against production myself — all four tests pass (idempotent
no-op, single insert with fresh `created_at`, edit bumps only `updated_at`,
archive by status). R1–R4 are delivered, and our side now counts news events
from their publication day because of it. The items below are what stands
between that work and main.

---

## 1. SECURITY — the production service-role key was committed to git

`scripts/wire-upsert-client.mjs` and `scripts/test-wire-upsert-acceptance.mjs`
hardcode the **Supabase service-role JWT** as an `||` fallback. That key
bypasses every row-level-security rule — it reads and writes leads, chat
logs, sessions and payment records. I verified it is **live**. It also turns
out this pattern predates today: the same key was already hardcoded in the
ten `ingest-*/comprehensive-*/wire-*` scripts that came in with the wire
lineage, and sat at main HEAD in **12 files**.

**Already done on our side (19 Aug):**
- All 12 files at main HEAD are stripped: the scripts now read
  `SUPABASE_SERVICE_ROLE_KEY` from the environment only and fail loudly
  without it. Run them as
  `SUPABASE_SERVICE_ROLE_KEY=… node scripts/<script>.mjs`.
- A `secret-scan` CI workflow now fails any push or PR that commits a
  non-anon JWT, an `sb_secret_…`, a Razorpay key, or a private-key block.
  Expect it to fail your branch until item 1a below is done.

**Required from you:**
- **1a.** Rebase `feature/vision-and-mission` onto current main and drop every
  hardcoded key from your commits — the history of that branch must be
  rewritten (amend/rebase + force-push), not just patched at the tip, so the
  key never enters main's history via your merge.
- **1b. Answer, in writing: how did the key get into the code?** Where was it
  copied from (dashboard, an env dump, a notes file?), and where else does it
  exist on your side right now — local repos, scratch directories, notes,
  other machines, other branches, any AI-tool context files. We need the full
  inventory to scope the rotation.
- **1c.** Sweep your local environment for other credentials of ours
  (Razorpay, Gemini, Twilio, MSG91, Google API) hardcoded anywhere, and
  report what you find — even if the answer is "nothing".

**Rotation:** because the key has been exposed in git history and on local
machines, we will rotate the JWT secret in a planned window (it invalidates
the public anon key too, so the site, the nginx proxy and CI rebuild together
— coordinated by the CTO office). Until then, treat the old key as dead: do
not embed it anywhere, use env vars only.

## 2. Your branch silently reverts three shipped fixes — restore them

The branch was cut from a stale local copy. Relative to current main it
reverts, in `src/lib/supabase.ts` and `src/app/projects/[slug]/page.tsx`:

- **2a.** The exact-slug-first wire matcher (main commit `ecd5f75`). Your
  substring/name matcher cross-matches ~11 sibling report pairs
  ("X Phase 2" absorbs "X"), baking the wrong project's news into OG cards,
  NewsArticle/ItemList markup and FAQs — plus the hardcoded `titanium`
  special-case. Take main's version verbatim.
- **2b.** `dateModified` in `newsLdFor` is hardcoded to `"2026-08-19"` again
  (main commit `c0002fc` fixed it to the row's own `updated_at`). A fixed
  date re-stamps all 107 news articles as fresh forever — search-engine
  freshness-faking. Take main's version.
- **2c.** The PUBLISHED re-filter in `fetchProjectWire` (snapshot fixtures are
  pulled with `select=*`, so without the in-code filter a DRAFT row bakes
  into public HTML), and the `updatedAt` field mapping that 2b depends on.
  Take main's version.

Practical route: after rebasing onto main, `git checkout origin/main --
src/lib/supabase.ts "src/app/projects/[slug]/page.tsx"` and re-apply only
your intentional changes (there should be none in those two files).

Your branch also deletes `docs/NOTE_FOR_AG_WIRE_INGESTION.md`; that is fine —
delivered — but let the deletion come through the rebase, not a conflicting
history.

## 3. Vision & Mission page — hold for founder sign-off

The `/vision` page, footer link and About tweak are excluded from any merge
until the founder reviews the content and design. Keep them on the branch;
they ship when he says so.

## 4. Standing rules from here

- Credentials come from environment variables only. **Never** as fallbacks,
  never in generated code, never in test harnesses. If a script "needs" a key
  to be convenient, that convenience is the vulnerability.
- The `secret-scan` workflow is the enforcement, and GitHub push protection
  will be enabled on the repository — pushes containing keys will be blocked
  at the door.
- The public **anon** key is the one exception: it ships in the client bundle
  by design and is allowlisted by the scanner. If you are unsure which kind a
  key is, decode its `role` claim — or just use an env var and be certain.
