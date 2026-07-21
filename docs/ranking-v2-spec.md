# Ranking v2 — persona-aware, graded, trust-weighted

Status: **BUILDING — step 1 of 4.** Supersedes the flat weighted sum in
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

## Persona

From the brief's `purchaseType`: **`"Investment"` → investor**; everything else
(First Home, Upgrade, Holiday Home) → **end-user**. No new buyer input needed.

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

## Persona weight tables (sum = 100 → the raw is now an absolute 0..100)

| | Budget | Config | Location | Priorities | Trust | Investor |
|---|---|---|---|---|---|---|
| **End-user** | 28 | 20 | 14 | 18 | 20 | — |
| **Investor** | 24 | 8 | 12 | 12 | 20 | 24 |

`raw = Σ weightᵢ · fitᵢ` — continuous, so ties are rare; sort desc, tie-break on
truthScore then name for determinism.

## Display (step 1: unchanged)

The displayed `matchPct` keeps the existing relative mapping
(`86 + raw/max·12`, clamped 72–99) so numbers stay familiar while **ordering**
improves. The raw is now genuinely absolute (0–100), which sets up:

## Roadmap (approved, in order)

1. **This doc** — persona + graded + trust engine (order improves, display same).
2. **Honest absolute Match %** — surface the raw 0–100 instead of the relative
   clamp (a deliberate, visible UX change; founder reviews the new numbers first).
3. **Diversity pass** (don't return 4 near-identical units) **+ one honest gap**
   per card.
4. **Outcome calibration** — instrument recommend→unlock→consult→convert and
   tune weights with real data; foundation for a learned learning-to-rank model.
5. **Unit-level matching** (floor/facing/sun/vastu/efficiency) once per-unit
   intelligence is queryable — the buyer-side frontier (3D lane).
