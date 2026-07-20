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

## Brief logging (one-time table)

Every brief that reaches the function is recorded to `shortlist_log` (a
fire-and-forget, service-role insert — logging never delays or fails the
re-rank). Run this once in the Supabase SQL editor so the writes have a home;
without the table the function still works, it just logs an insert error and
moves on.

```sql
create table if not exists public.shortlist_log (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  brief           jsonb       not null,   -- the buyer's full BuyData (incl. free-text notes)
  candidate_slugs text[]      not null    default '{}',  -- what the deterministic screen sent
  ranked_slugs    text[]      not null    default '{}',  -- Gemini's re-rank (empty if it declined)
  model_ok        boolean     not null    default false  -- did the AI layer accept & re-rank?
);
-- Writes come ONLY from the Edge Function via the injected service-role key,
-- which bypasses RLS. Turn RLS on with no policies so nothing else — anon or
-- authenticated — can read or write it.
alter table public.shortlist_log enable row level security;
```

Read your buyers' asks back with e.g.
`select created_at, brief->>'budgetCr' as budget, brief->'locations' as corridors,
brief->'configs' as configs, brief->>'notes' as notes, model_ok
from public.shortlist_log order by created_at desc limit 50;`

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
