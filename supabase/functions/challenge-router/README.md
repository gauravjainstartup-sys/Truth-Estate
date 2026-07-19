# challenge-router (Gemini)

Powers **"Challenge our read"** on project pages. Runs Gemini over the
access-scoped knowledge the browser sends, and returns a chat reply.

The chat works **without** this function — the site ships a deterministic
answer engine that already enforces the paywall. This function only upgrades
the language quality. If it's absent, slow, or errors, the client silently
falls back to the built-in engine. So deploying it is safe and reversible.

## The paywall guarantee

Paid report content is **never** placed in any public file. The browser
(`src/lib/challengeChat.ts` → `buildChallengeContext`) assembles the context:

- **public facts** (score, vitals, corridor pricing, pillar summary, method) — always sent;
- **paid facts** — sent **only when the visitor is unlocked**; `null` otherwise;
- **paid topic labels** — sent always, so a locked visitor's paid questions get an honest teaser + gate with zero paid content.

The **client is authoritative on the gate**: it renders the unlock CTA from
its own classification, so nothing the model returns can open a gate that
must stay shut.

> Note: this reflects the site's current *soft* paywall (the report is a
> static export, so data already lives in the client). For a *hard* paywall
> later, move the paid knowledge into a Supabase table read by this function
> with the service role, and stop sending paid facts from the browser.

## Deploy — no command line needed

**1. Set the API key as a secret** (never in the repo, never in the browser):
Supabase Dashboard → your project → **Edge Functions → Secrets → Add new secret**
- Name: `GEMINI_API_KEY`  · Value: your AI Studio key (`AQ.…`)
- (optional) `GEMINI_MODEL` = `gemini-2.5-flash` (the default; change if you use another)

**2. Create the function in the browser:**
Dashboard → **Edge Functions → Create a new function** → name it exactly
`challenge-router` → paste the contents of `index.ts` into the editor →
**Deploy**. (Toggle off "Verify JWT" — this is a public endpoint.)

**3. Copy the function URL** it gives you
(`https://<project-ref>.functions.supabase.co/challenge-router`) and send it
to me. I'll set `NEXT_PUBLIC_CHALLENGE_ROUTER_URL` and redeploy the site —
then the chat is on Gemini.

### Or via CLI (if you have it linked)
```
supabase secrets set GEMINI_API_KEY=<key>
supabase functions deploy challenge-router --no-verify-jwt
```

## Local check
`node scratchpad/challenge-router-test.mjs` exercises the request/response
shape and the wall against a mocked Gemini (no key, no network).
