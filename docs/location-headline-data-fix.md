# Location verdict headline — data defect + regeneration spec

**Owner:** whoever authors `location_overall_verdict_headline` (the location-intelligence
generation pipeline — upstream of the Supabase snapshot, not this repo).
**Status:** front-end guard shipped (see below); **source data still needs regeneration.**

## What the field is

`backlog_listing_public_v3.location_overall_verdict_headline` is the one-line
headline under **Pillar III · Location Intelligence → Analyst assessment**
(the bold serif line above the market-stage note). The front end renders it
verbatim — `s(row.location_overall_verdict_headline)` →
`geo.insights.verdict` → `ReportLocation.tsx` `<p>{ins.verdict}</p>`. There is
no truncation or reformatting on the front end, so a broken DB value renders
broken.

## The defect (measured 2026-08-02, live DB)

Of **96** published projects with a headline, only **20 (21%) are usable**.
**76 are broken**, in three modes:

1. **Truncated mid-sentence / mid-word** (majority). Cut at wildly varying
   lengths (32–268 chars), so the *generation* was cut off, not a column limit:
   - `It gains immensely from unparalleled corporate`
   - `The project capitalizes heavily on … the Southern Peripheral Road (SPR)`
   - `Located in the deeply integrated`
2. **Scraped-snippet garbage** — the generator emitted a fragment of some other
   source (looks like a Google Places rating line):
   - `5★, 1,226 reviews) at 0`
3. **Over-long score-essays** (14) — 200–900-char multi-paragraph analyses that
   lead with internal scoring jargon and do **not** belong in a headline slot:
   - `… captures a refactored absolute overall score of 67/100 when properly evaluated on a macro city-wide blueprint …`
   Several also carry the **wrong phase name** (the "Godrej Air Phase-3" essay is
   duplicated verbatim onto Godrej Air Phase-1 and Phase-2 rows; the "Ashiana
   Amarah Phase-4" essay sits on the Phase-3 & 3A row) — i.e. cross-contaminated
   rows, not per-project text.

Broken strings are also **duplicated across phases** (same value x2–x3).

### Related (lower severity)

`location_market_stage_insight` (the body note under the headline) is coherent
but **templated by corridor** — only **8 distinct values across 97 rows** (one
shared by 30 projects). Not broken, just not project-specific. Worth
regenerating in the same pass.

## Regeneration requirements

Each project's `location_overall_verdict_headline` must be:

- **One complete sentence**, ending in terminal punctuation (`. ! ?`). Never
  truncated mid-word.
- **Short** — target ≤ ~200 characters. It is a headline, not the analysis.
- **Project-specific** — no cross-contaminated / duplicated text; the named
  project/phase must match the row.
- **Plain reader language** — NO internal scoring jargon: no "overall score of
  N/100", no "refactored", no "absolute score", no bare rating tuples as the
  point of the line.
- **No scraped fragments** — no review snippets ("N★, … reviews)"), no bare
  "at 0…" distance stubs, no URLs.

The rich multi-paragraph analyses currently mis-filed here are good raw
material — but they belong in a longer field (or should be split into a short
headline + the market-stage note), not the one-line headline.

## Front-end guard now in place (self-clearing)

`src/lib/liveReport.ts` → `coherentHeadline()` accepts the headline only when it
reads as a finished, jargon-free sentence; otherwise it is treated as absent and
the card falls back to its band + market-stage note (the component's existing
hide-when-missing behaviour). This stops the 76 broken values from rendering
today. It is a **display guard, not a rewrite** — it never invents copy, touches
no score or count, and **automatically starts showing each headline again the
moment the regenerated value passes the check.** No front-end change is needed
after the data is fixed.

### Validation query for the pipeline

After regenerating, a row is "clean" for the front end when its headline:
`length ≥ 25` · ends in `.!?` (optionally + one closing quote/paren) · has
balanced parentheses · contains none of `★`, `reviews)`, `http`, `/100`,
`refactored`, `overall score`. Aim for **96/96 clean**, not today's 20/96.
