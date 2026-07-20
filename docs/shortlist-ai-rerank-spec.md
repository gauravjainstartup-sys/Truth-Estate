# Shortlist AI Re-rank — Spec (Path 2)

**Status: spec only — nothing here is built.** The shortlist today is a
deterministic weighted-sum ranking (`rankCore` in `src/lib/journey.ts`) over the
live catalog, with a hard affordability gate. This document specifies the
optional AI layer on top of it, so it can be built without re-deriving the
decisions.

## Architecture — deterministic proposes, Claude disposes

```
brief (localStorage truthEstate.buy)
   │
   ▼
rankCore over match-catalog.json          ← retrieval: gate + score (free, instant)
   │  top ~10 candidates
   ▼
POST /functions/v1/shortlist-rerank       ← Supabase Edge Function (same pattern
   │  { brief, candidates }                  as omni-router: secret-less client
   ▼                                         call, Claude key server-side)
Claude re-ranks top 10 → top 3 + reasons
   │
   ▼
ShortlistCore renders (identical UI — only order + "why" copy change)
```

The deterministic layer is the guardrail: Claude only ever re-orders and
explains candidates that already passed the gate and scored well. It cannot
introduce a project, change a price, or bypass affordability.

## Why this layer earns its cost

1. **It consumes the free-text brief.** Onboarding's "In your own words" notes
   field is currently ignored by the formula. This is where "we need a home
   office and my parents live with us" starts affecting the ranking.
2. **Reasoned trade-offs.** The formula can't weigh "slightly over budget but
   the only low-density option in your corridor" — a model can, and can say so.
3. **Honest marketing.** Only once this ships can the site truthfully call the
   shortlist AI-assisted.

## Request contract

```jsonc
POST /functions/v1/shortlist-rerank
{
  "brief": {            // BuyData verbatim, incl. notes
    "budgetCr": 5, "locations": ["SPR"], "configs": ["3 BHK"],
    "priorities": ["Legal Safety"], "purchaseType": "First Home",
    "timeline": "Within 6 Months", "possession": "under-construction",
    "notes": "parents live with us, need vastu-friendly entry"
  },
  "candidates": [        // top ~10 from rankCore, lean fields only
    { "slug": "…", "name": "…", "market": "…", "entryCr": 4.9,
      "configs": ["3 BHK"], "tags": ["Legal Safety"], "truthScore": 82,
      "matchPct": 94, "strengths": ["…"], "watchouts": ["…"] }
  ]
}
```

## Response contract (strict)

```jsonc
{
  "ranked": [            // MUST be a subset of candidate slugs, length ≤ 3
    { "slug": "…", "why": "≤2 sentences, grounded in supplied fields only",
      "confidence": "High" }
  ]
}
```

Validation on the client, all falling back to the deterministic order:

- any slug not in `candidates` → discard response
- fewer than 1 valid entry → discard response
- timeout > 3 s or non-200 → discard response
- `why` copy is display-only; scores, prices, Truth Scores always render from
  our own data, never from model output

## Model & prompt rules

- Model: `claude-opus-4-8` (default; swappable). Max ~300 output tokens.
- System prompt pins: buyer-side only; use ONLY the supplied fields; never
  invent amenities, prices, or availability; if notes conflict with chips,
  notes win (they're more specific); reply in the site's honest register.
- Est. cost/latency: ~1–2K tokens in / ~300 out, ≪ ₹1 per shortlist; p95 ~2 s.

## Rollout

1. Ship behind a flag (`NEXT_PUBLIC_AI_RERANK=1`); deterministic order is the
   permanent fallback, so the failure mode is "exactly today's behavior".
2. Log `{brief, deterministic_top10, model_top3, unlocked?}` to a Supabase
   table — this is also the training set Path 3 (real ML weights) needs.
3. A/B unlock-rate against deterministic-only before defaulting on.

## Explicitly out of scope

- Unit-level (flat-by-flat) matching — blocked on the per-unit Sun/Vastu
  intelligence landing in a queryable table; owned by the 3D session.
- Learning weights from outcomes (Path 3) — needs the log from Rollout #2 to
  accumulate first.
