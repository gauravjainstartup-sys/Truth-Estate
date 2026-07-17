# omni-router — the Claude layer of Truth Intelligence

Phase 2 of the omnibox: free-text asks (English / Hindi / Hinglish) are parsed
by Claude into the same chip/canvas contract the deterministic Phase-1 parser
emits, plus a ≤2-sentence verdict composed **only** from index rows. The
frontend calls this function in the background and silently falls back to the
deterministic path whenever it is unreachable — the site never depends on it.

```
browser (canvas)
   │  POST { q, chips?, project? }
   ▼
omni-router (this function, Deno)
   │  fetches https://gauravjainstartup-sys.github.io/Truth-Estate/omni-index.json
   │  (the build-published index — the EXACT rows the canvas renders)
   ▼
Claude claude-opus-4-8 · adaptive thinking · tool-use loop
   tools: screen_projects · find_project · top_units · respond (terminal)
   │
   ▼
{ ok:true, intent, chips[], projectSlug, verdict, note, refs[] }
```

The model never returns a number the tools didn't — cards, scores and dials
are still rendered client-side by the deterministic `screen()` / `topUnits()`.

## Deploy (one time, ~2 minutes)

Prereqs: [Supabase CLI](https://supabase.com/docs/guides/cli) logged in, and an
Anthropic API key from https://console.anthropic.com/settings/keys.

```bash
# from the repo root
supabase link --project-ref lyetvabfgaidvqrbmaoy   # once per machine

supabase secrets set ANTHROPIC_API_KEY=sk-ant-XXXXXXXX

supabase functions deploy omni-router --no-verify-jwt
```

`--no-verify-jwt` lets the public site call it without a Supabase session
(the browser still sends the anon key, so it also works if the flag is
forgotten). CORS is locked to `gauravjainstartup-sys.github.io` + localhost.

## Smoke test

```bash
curl -s -X POST \
  'https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/omni-router' \
  -H 'content-type: application/json' \
  -d '{"q":"3 bhk under 5 cr on dwarka expressway with morning sun"}' | python3 -m json.tool
```

Expect `"ok": true`, `"intent": "screen"`, chips for bhk/budget/area/sun and a
one-line verdict. `{"ok": false}` means: check `supabase functions logs
omni-router` — usually the missing `ANTHROPIC_API_KEY` secret.

## Config

| Env / secret        | Default                                           | Meaning                          |
| ------------------- | ------------------------------------------------- | -------------------------------- |
| `ANTHROPIC_API_KEY` | — (required)                                      | Claude API key                   |
| `OMNI_INDEX_URL`    | the GitHub Pages `/omni-index.json`               | override for staging/local index |

Index is cached in-function for 10 min; a fetch failure serves the stale copy.

## Files

- `index.ts` — Deno entry: CORS, index cache, Anthropic SDK wiring.
- `core.ts` — runtime-agnostic Claude loop + tools + contract (offline-testable).
- `omni.ts` — vendored copy of `src/lib/omni.ts` (the CLI bundles only this
  directory). After editing the source file, re-copy it — keep the header:
  `cp src/lib/omni.ts supabase/functions/omni-router/omni.ts`
- `test-offline.mjs` — offline harness: drives `core.ts` with scripted Claude
  transcripts and asserts the whole contract (no network or key needed).
  Run after any change here: `node supabase/functions/omni-router/test-offline.mjs`

## Cost & limits

One ask ≈ 2–4 model turns of a few hundred tokens — fractions of a cent on
`claude-opus-4-8`. Everything is free/ungated for now (founder call,
2026-07); when gating lands, add rate limiting here (per-IP KV bucket) before
the model call.
