# Ranking v2 — persona-aware, graded, trust-weighted

Status: **step 1 shipped · step 2 built as opt-in (live on `/test-rank` for user
testing; `/shortlist` still on the clamp until the honest numbers are approved).**
Supersedes the flat weighted sum in
`rankCore` (`src/lib/journey.ts`). The AI re-rank layer (Gemini, Path 2) and the
two hard gates are unchanged; this rewrites only the deterministic score that
orders the survivors.

## Why

The old `rankCore` scored every buyer identically with near-binary
contributions (corridor 30/6, budget 26-or-decay, config +18, priority +9 each,
a small quality nudge). Two problems, both cost us discrimination:

1. **No persona.** An end-user (their home) and an investor (a return) want
   different things, but got the same weights.
2. **Coarse steps → ties.** Many projects landed on the same score, so the
   top-10 ordering was close to arbitrary, and an objectively safer/better
   project didn't reliably rank above a filter-equal but weaker one.

(The full teardown of the Google-AI-Studio variant that prompted this is in the
chat thread; the good ideas — persona split, investor ROI/risk dimensions,
honest absolute score — are folded in below; the bad idea — everything binary —
is explicitly replaced by graded scoring.)

## Architecture (unchanged shape)

```
hard gates (affordability ceiling + must-have config)   ← unchanged
      ↓
persona-weighted GRADED score  (this doc)               ← rewritten
      ↓
AI re-rank of top-N (Gemini, free-text notes)           ← unchanged
      ↓
display Match %                                          ← unchanged in step 1
```

## Persona — one profile per purchase type

Each purchase type IS a persona with its own weight row (`PERSONA_WEIGHTS`) and
its own priority-pill vocabulary (`PRIORITIES_BY_TYPE`). The weights are the
persona's defaults — what this buyer cares about before picking a single pill:

| Persona | Optimises for |
|---|---|
| **First Home** | Safety first — delivery certainty, legal cleanliness, staying affordable. |
| **Upgrade** | Space first — the exact configuration and a better address, built well. |
| **Investment** | Return first — appreciation, liquidity, entry price; config barely matters. |
| **Holiday Home** | Place first — the corridor and the lifestyle carry the weight. |

## Graded dimensions

Every dimension returns a **0..1 fit** (continuous — no cliffs), multiplied by a
persona weight. Missing preference ⇒ the dimension is neutral (does not drag).
Missing project data ⇒ benefit of the doubt (never rewarded or punished on an
absent field).

| Dimension | 0..1 fit |
|---|---|
| **Budget** | 1.0 inside `[entry, top]`; 0.9 if budget comfortably exceeds the range (affordable); linear decay as entry rises above budget toward the +₹2 Cr gate. |
| **Config** | 1.0 exact (tolerant `configMatches`); 0.45 adjacent BHK (±1); 0.5 unknown (`NA`); 0.2 known-mismatch (only reachable via gate fallback). |
| **Location** | 1.0 corridor match (`corridorKey`); 0.25 otherwise. |
| **Priorities** | fraction of chosen priorities the project's tags genuinely serve. |
| **Trust** *(new)* | `0.7 · norm(truthScore) + 0.3 · (trust-tags / 3)` where trust tags = On-Time Delivery, Legal Safety, Developer Reputation. Applied in **both** personas — heaviest for end-users (it's their home). |
| **Investor** *(investor only)* | Capital-Appreciation + Liquidity tags, lightly blended with truthScore. Replaces the weight an end-user spends on config/possession. |

`norm(truthScore) = clamp((truthScore − 60) / 35, 0, 1)`.

## Persona weight tables (sum = 100 → the raw is an absolute 0..100)

| | Budget | Config | Location | Priorities | Trust | Investor |
|---|---|---|---|---|---|---|
| **First Home** | 28 | 20 | 14 | 18 | 20 | — |
| **Upgrade** | 20 | 26 | 16 | 18 | 20 | — |
| **Investment** | 24 | 8 | 12 | 12 | 20 | 24 |
| **Holiday Home** | 24 | 14 | 24 | 20 | 18 | — |

## Hard musts from the buyer's own words

`mustHaveConfigsFrom(notes)` parses "duplex is a must", "must be 4 BHK",
"penthouse only" out of the free-text brief. A parsed must is a **strict
gate with no fallback**: a project whose known configs miss it is out, and so
is a project with no config data (a must-have can't be satisfied by a blank).
This can honestly empty the shortlist — callers show their empty state, which
IS the honest answer, and points at config data needing backfill.

## Corridors (8 Gurugram + Noida)

The buyer vocabulary is the pipeline's: GCR, GCE, SPR, **Sohna Road** (in-city
corridor — distinct from the **Sohna** belt), Dwarka Expressway, New Gurgaon,
**NH-48**, Sohna, + Noida. `corridorKey` folds pipeline spellings onto these
(e.g. "Southern Peripheral Road (SPR Corridor)" → spr, "Northern Peripheral"
→ dwarka); multi-select matching = ANY selected corridor matches → full
location fit, none → 0.25. Timeline and possession are captured for the brief
and the advisor, not scored.

`raw = Σ weightᵢ · fitᵢ` — continuous, so ties are rare; sort desc, tie-break on
truthScore then name for determinism.

## Display

**Step 1** kept the existing relative mapping (`86 + raw/max·12`, clamped
72–99) so numbers stayed familiar while **ordering** improved.

**Step 2 (built, awaiting review)** drops that clamp: the raw is already an
honest 0–100 (weights sum to 100), so `matchPct = min(99, round(raw))`. The old
clamp compressed every shortlist into a ~93–98 band — a can't-afford stretch
pick displayed at 98%. The honest number gives a real spread (top true match
99%, a genuine budget stretch caps the whole shortlist at ~79%, weak fits fall
to the 50s–60s). Cap at 99 = never claim a perfect match; a project the pipeline
hasn't scored yet (no truthScore/tags/price) now honestly reads low (~39%)
rather than being flattered — an honest signal of a **data** gap, not a ranking
one.

## Roadmap (approved, in order)

1. **This doc** — persona + graded + trust engine (order improves, display same).
2. **Honest absolute Match %** — surface the raw 0–100 instead of the relative
   clamp (a deliberate, visible UX change; founder reviews the new numbers
   first). ← **built as `rankCore(items, d, { honestPct: true })` — opt-in, so
   `/shortlist` keeps the clamp. Exercised live on the `/test-rank` console (a
   noindexed QA harness: full brief → RUN → ranked catalog + per-axis breakdown
   + a data-completeness audit of the matchable universe). Flip the default once
   user testing signs off.**
3. **Diversity pass** (don't return 4 near-identical units) **+ one honest gap**
   per card.
4. **Outcome calibration** — instrument recommend→unlock→consult→convert and
   tune weights with real data; foundation for a learned learning-to-rank model.
5. **Unit-level matching** (floor/facing/sun/vastu/efficiency) once per-unit
   intelligence is queryable — the buyer-side frontier (3D lane).
