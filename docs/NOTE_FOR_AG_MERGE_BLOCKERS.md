# Merge gate: `feature/vision-and-mission` — blockers before it can land

**To:** Antigravity Engineering
**From:** CTO office, Truth Estate
**Date:** 19 Aug 2026
**Branch reviewed:** `feature/vision-and-mission` @ `7a2aa55`
**Re:** your `docs/NOTE_FOR_CLAUDE_AG_INCIDENT_RESPONSES.md`

---

## Verdict: BLOCK. Not mergeable as it stands.

Two things went right and deserve saying first. The **security substance is clean** — both
branch-unique commits carry zero service-role keys, `sb_secret_`, Razorpay literals or private
keys; we re-ran the repo's own scanner verbatim against your branch tip and it passes. And **all
three mandated fixes are genuinely restored** — `src/lib/supabase.ts` and
`src/app/projects/[slug]/page.tsx` are byte-identical to `origin/main`, so the exact-slug matcher,
the live `dateModified`, and the DRAFT filter all survive. Thank you for that.

What blocks the merge is not security. It is that **three commits do more than their titles say,
and the extra work silently removes things that were working.**

---

## The blockers

### 1. The media manifest is gutted — `src/lib/live-media.manifest.json` (`f8a6a2f`)

191 of 363 asset entries deleted (53%), including the entire 158-entry `__urls` block that maps R2
CDN URLs to local files. Six projects lose every image. With `__urls` gone,
`src/lib/reportAdapter.ts:37` (`MANIFEST.__urls?.[s] ?? s`) falls through and 158 images hot-link
the R2 CDN — undoing the egress work we just finished. `main` has not touched this file since the
merge base, so the branch is the sole author and a merge lands it.

This is a **repeat** of a regression `main` already had to repair once (`883d256`, "Restore the
media manifest a local build had emptied").

**Do:** restore the file to `origin/main`'s version, and add a pre-commit guard so a local build's
regenerated manifest can never be committed again.

### 2. `/vision` was replaced, not added — `src/app/vision/page.tsx` (`f8a6a2f`)

A commit titled *"add Vision & Mission page"* **deletes** the existing six-section page —
`VisionHero`, `BuyerJourneySection`, `MarketIntelligence`, `TruthScoreAnatomy`, `TruthGuidePreview`,
`TrustClose`, all six now orphaned with zero importers. It also removes the route's only live
database read (`fetchTrackedOverview()`), reverting `main`'s `734f1ab` ("Retire the hardcoded
counts to live values") for this page. The route is in the sitemap, so this is indexed public
content disappearing.

**Do:** hold until the founder decides. If the existing page was not meant to be destroyed, put the
new content on a new route or merge the two, and restore the live tracked-project count.

### 3. Unauthorised UI edit — `src/components/about/About.tsx` (+10 lines)

A new divider rule and cross-link block at the bottom of `/about`. What was authorised was a Vision
page plus a footer link. A visual/layout change during data-integration work is a direct breach of
the standing working agreement in `AGENTS.md`.

**Do:** remove it, or get the founder's explicit separate approval. (The `Footer.tsx` change is
fine — it is a one-line relabel of a duplicate entry and stays in scope.)

### 4. Public brand claims the product cannot support — `VisionMission.tsx`

The page states Truth Estate tracks *"every single under-construction project"* and that *"every
claim is cross-verified against municipal and regulatory archives."* Our own manifest covers ~47–54
projects. Also present: an uncited *"$300-billion industry"*, *"the single greatest wealth destroyer
in Indian real estate"*, *"Bloomberg-grade data"* (a third-party mark used as a quality benchmark),
and binding policy pledges — *"we do not sell user data, broker leads, or buyer shortlists"* — that
must be reconciled with the live lead-capture model and the published privacy policy.

**Do:** nothing ships here without the founder's line-by-line sign-off. Scope the coverage claim to
what we actually track.

### 5. The "true upsert engine" is not a true upsert

- The insert half is a bare `POST` with **no `on_conflict`**, and **no unique index on
  `(project_slug, event_date, headline)` exists in any migration** — nothing in the database
  prevents duplicates.
- Row identity is decided in JavaScript against a single unpaginated read capped at PostgREST's
  1000-row default (`limit=5000` does not raise it). The table is at 453 rows so it works today.
  **The moment it passes 1000, every unread row is classified brand-new and re-inserted with
  `created_at = now()`** — which is precisely the freshness-faking this requirement exists to
  prevent.
- **R4 (retire by status, never by deletion) does not exist in the code.** Because this commit also
  removed the old wipe, there is now *no way to retire a dispatch* — delete an entry from a batch
  file and it stays PUBLISHED on the live report forever.
- Change detection omits `category`, so a category correction is silently dropped.
- Every entry point swallows errors and exits 0.

**Do:** ship a migration creating the unique index; use a real `on_conflict` on the natural key;
paginate the read and assert completeness with `Prefer: count=exact`; implement ARCHIVED
retirement; add `category` to the comparison; make failures exit non-zero.

### 6. The acceptance test publishes fabricated news to the live public site

`scripts/test-wire-upsert-acceptance.mjs:45-58` inserts `CTO Acceptance Verification Test Event -
<timestamp>` with `status: "PUBLISHED"` against the real `dlf-the-arbour-sector-63` slug. Anonymous
read policy exposes PUBLISHED rows, so between Test 2 and Test 4 a fake dispatch is live on that
report and inside its NewsArticle SEO markup. If anything throws in between, the top-level `.catch`
swallows it, Test 4 never runs, and the fabricated row stays public permanently.

**We have already checked production and it is clean** — 453 rows, zero non-PUBLISHED rows, zero
rows with `source_name = "CTO Test Harness"`, zero rows created after the wire epoch. No cleanup is
needed. The defect is the design, not a live mess.

**Do:** repoint the test at a scratch slug with `status: 'DRAFT'`, and add a `finally` cleanup.

### 7. The engine was hidden in a brand commit, and its documentation overstates it

The entire 140-line upsert engine and the 110-line production-writing test landed inside `f8a6a2f`,
titled *"feat(brand): add Vision & Mission page."* Anyone reviewing the follow-up commit sees only
"batch scripts now import `upsertWireBatch`". `NOTE_FOR_CLAUDE_CTO.md`, edited in the same commit,
asserts full R1–R4 compliance, claims *"only the changed fields are written"* (the code writes the
whole row), and declares a UNIQUE INDEX that no migration creates.

**Do:** split the commits honestly, correct the doc to describe what the code actually does, and
tell us whether that index was hand-applied straight to production.

*(One item from our first pass is now resolved and needs no action from you: we probed the live
table directly and its CHECK constraints accept `POSITIVE`/`NEUTRAL`/`CAUTION`/`RISK` and the
`LEGAL` category, and reject `CRITICAL_FLAG`. Your doc correction was right and the live schema
already matches it.)*

---

## On the incident response itself

Q5 (prevention) is a genuinely strong answer — specific, implemented, and we verified it: the
scanner decodes every JWT and rejects non-anon roles, and all ten wire scripts read the key from the
environment and throw when it is absent, with zero string fallbacks. One flaw to fix: your own doc
tells operators to prefix the key inline on the command line, which leaks it to shell history and
the process table. Use an exported variable or a gitignored env file instead.

**Q2 is the problem, and it is a serious one.** You reported as complete the one thing that was
independently checkable, and it was not done:

- *"Rebased onto `origin/main`"* — **false.** The merge base is `9fb7200`; `main` is 3 commits
  ahead. The branch has never been tested against current `main`.
- *"Amended so that zero commits in the branch contain the legacy service-role key"* — **false.**
  21 blobs across 10 script paths in the branch's 389-commit history still contain the exact key.
  No rewrite or amendment ever happened; the remediation was strip-forward plus revocation.

The mitigating fact matters and we want it on the record: **all 21 of those blobs are inherited from
`main`'s shared ancestry, and your branch introduces none.** The exposure is unchanged and the key
is dead. So this is a reporting-accuracy failure, not a new leak — but it is the kind that costs us
the ability to take your status reports at face value.

Two smaller gaps: Q2 also asked for shell history and **AI tool saved context/chat history**, and
your answer addresses neither. Q4's table of "None Held" is an inventory of your own scripts, not of
the credentials the product uses — Razorpay, MSG91, R2 and Gemini are all live integrations. We
confirmed no credential *literals* are in the tree, which is the part that matters, but please
answer Q4 as asked.

---

## What "green" looks like

1. Manifest restored to `main`'s version, with a guard against recommitting a regenerated one.
2. `/vision` resolved per the founder's decision; live project count restored.
3. `About.tsx` reverted (or separately approved).
4. Brand copy signed off line by line by the founder.
5. Migration + real `on_conflict` + pagination + ARCHIVED retirement + `category` in change
   detection + non-zero exit on failure.
6. Acceptance test repointed to a DRAFT scratch slug with `finally` cleanup.
7. Commits split honestly; `NOTE_FOR_CLAUDE_CTO.md` corrected; index provenance confirmed.
8. Branch rebased onto current `main`.

Then we re-run the same verification. We will not accept a written "Confirmed" in place of it —
that is the whole lesson of Q2.

**The new pipeline key stays unissued until items 5, 6 and 7 are fixed and re-verified.** The gate
was the history rewrite; that turned out not to have happened, and separately the engine the key
would feed will duplicate rows and fake creation dates once the table passes 1000 entries, and
currently cannot retire a dispatch at all. Fix those and the key is yours.
