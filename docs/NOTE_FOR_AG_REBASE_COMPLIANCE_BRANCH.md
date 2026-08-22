# NOTE FOR AG — rebase `fix/google-ads-compliance-and-clean-routing` onto the live prod build

**From:** CTO review · **Status:** changes requested before merge/review

## Why this is blocked

The branch was handed over as a **2-file Google Ads compliance fix**. In reality it is
**57 commits / 124 files**. Two problems make it un-shippable as-is:

1. **It branches from stale `main`, not from prod.** It is **missing everything that is
   live on production right now**, so deploying it whole would silently **roll back** the
   current site. Absent from the branch:
   - Mobile header product ticker (`Hero.tsx`)
   - Compare-gate balance glimpse (`CompareGlimpse.tsx`, `ComparePage.tsx`)
   - Per-section red-flag chips (`redFlags.ts`, `backlogRow.ts`, `supabase.ts`,
     `reportAdapter.ts`, `projects.ts`, `ReportDossier.tsx`, `ProjectProfile.tsx`)
   - Mobile sticky unlock CTA (`UnlockCtaLabel.tsx`, `UnlockDesk.tsx`, `ProjectProfile.tsx`)
   - `report_stakes` relationship table + backfill + per-project persona + portfolio
   - Negotiation-figure gating, fairly-priced FAQ gating, 10-year ROI copy, owner headline
   - CLP–XIRR config selector + payment calendar + year table (Chapter III "answer-first")

2. **It re-does work already on prod, and conflicts with it.**
   - `a7dc63a` (match relevance gating) and `e87d6d4` (strict reverse-chronology wire) are
     **already live** — prod carries reviewed re-implementations, NOT these commits. Replaying
     them will conflict. **Drop them.**
   - `94f1bbb` ("Wealth Terminal" Price & XIRR redesign) is a **competing** Chapter III
     redesign against the one already live. This needs an explicit decision, not a blind
     overwrite (see below).

## What to do

**Base the branch on the current production build, not `main`:**

```
prod branch : claude/database-schema-summary-fhhb3k
prod commit : 216a062   (deployed to truthestate.in, deploy run #340)
```

Rebase/rebuild `fix/google-ads-compliance-and-clean-routing` on top of `216a062` so it is
**additive to prod**, then:

1. **Drop the already-shipped duplicates** (`a7dc63a`, `e87d6d4`). Verify prod's live behaviour
   already matches; if your version differs and is better, raise it as its own separate change.
2. **Resolve the Chapter III overlap.** Decide: keep the live "answer-first" Price/XIRR section,
   or replace it with "Wealth Terminal" (`94f1bbb`). Whichever wins, reconcile deliberately —
   do not let a rebase silently clobber the live one. Same for any other overlap on `Hero.tsx`,
   `ComparePage.tsx`, `ProjectProfile.tsx`, `ReportPrice.tsx`, `matchEngine.ts`.
3. **Make the scope honest, and split it.** A 124-file branch cannot be reviewed against a
   2-line summary. Please break it into separately-reviewable PRs, e.g.:
   - (a) Google Ads compliance + canonical routing  ← the `abce27e` fix; this one is good and
     can land first
   - (b) Deal Room rebuild
   - (c) Programmatic apartments SEO suite + `/apartments` routes
   - (d) Wire data refresh (107 projects) + ingestion scripts
   - (e) Perf (LCP/TBT) + SEO metadata
   - (f) Security (service-role-key stripping, secret-scan CI) — **flag this one explicitly;**
     it touches all `supabase/functions/*` and needs its own careful review.
4. **Green gate before re-review:** `SUPABASE_FIXTURES=.data-snapshot next build` must pass, and
   the branch must deploy cleanly to the `dev` staging tag.

## The compliance fix itself — approved on merits

`abce27e` is sound: replacing the client-side `location.replace()` stub with a static
`<meta http-equiv="refresh">` + real crawlable content + CTA is a legitimate fix for the Ads
cloaking scanner, and the extended row lookup (`seoSlug` / `slug` / `live-` prefix) rendering the
report directly with a canonical → `seoSlug` is good for SEO. Once it's rebased on prod (ideally as
PR (a) above), it's ready to ship.

## Next

Once the branch is rebased on `216a062` with the above resolved, I'll re-review — starting with
PR (a), which can go to prod immediately.
