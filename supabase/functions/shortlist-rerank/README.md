# shortlist-rerank — Gemini re-rank for the buyer shortlist (Path 2)

The deterministic shortlist (affordability gate + weighted score in
`src/lib/journey.ts` `rankCore`) sends its top candidates plus the buyer's
brief — including the free-text "in your own words" notes the formula cannot
read — and Gemini returns a validated top-3 re-rank. Any failure, timeout, or
rule violation leaves the deterministic order untouched, so the worst case is
exactly the pre-AI behaviour. Spec: `docs/shortlist-ai-rerank-spec.md`.

## Deploy (one time)

```sh
supabase functions deploy shortlist-rerank --no-verify-jwt
# the key is SHARED with challenge-router — if Challenge Chat is already
# live, this is already set and there is nothing more to do:
supabase secrets set GEMINI_API_KEY=<Google AI Studio key>
# optional model override (default gemini-2.5-flash):
supabase secrets set GEMINI_MODEL=gemini-2.5-flash
```

Until the function is deployed, the site works exactly as before: the client
attempts the call, fails fast, and renders the deterministic order. Deploying
the function switches the AI layer on — no site rebuild needed.

## Contract

```
POST { brief: BuyData, candidates: [{slug,name,market,entryCr,configs,tags,
                                     truthScore,matchPct,strengths,watchouts}] }
  →  { ok:true, ranked:[{ slug, why, confidence }] }   (1–3 entries,
                                                        slugs ⊆ candidates)
  |  { ok:false }
```

Validation lives on BOTH sides (core.ts here, `src/lib/rerank.ts` in the
client): a slug outside the candidate set, a duplicate, malformed JSON, or an
empty list all resolve to the deterministic order. The model can re-order and
explain; it can never introduce a project, change a price, or bypass the
affordability gate (candidates are gated before they ever reach it).

## Offline harness (no network, no key)

```sh
node supabase/functions/shortlist-rerank/test-offline.mjs
```

## Cost & latency

gemini-2.5-flash, ~1–2K tokens in / ≤400 out per shortlist; p95 ≈ 1–2 s.
The client waits at most 3 s before falling back.
