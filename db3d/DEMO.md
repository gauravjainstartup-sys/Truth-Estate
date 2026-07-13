# Gated 3D model demo (the DB-centric approach)

The engine files (`engine/engine-<slug>.html`) contain **no project data**. On
load they request a short-lived signed token from the gate (`/mint-token`) and
fetch the model pieces (`/model`) — exactly the flow production will run against
Supabase Edge Functions. `mock-api.mjs` plays the gate locally.

## Run (needs Node 18+)
    node mock-api.mjs

Then open **http://localhost:8791/** — one project redirects straight in; more
than one shows the list. `?sub=buyer@demo` is the demo-entitled user.

## See the gate refuse
Append `?sub=stranger@x` to any engine URL → `403 not-entitled`; the page shows
"Unable to load the model." and no data ever moves.

Gate on every request: origin allowlist · entitlement (this subject unlocked
this project) · rate limit (5 tokens/min) · 5-minute HMAC-signed tokens.

## Generate a new project's file-set
    node db3d/generate.mjs public/tower-intel/<slug>.html [--name "Exact DB Name"] [--zip]
(see .claude/skills/db3d-generate/SKILL.md)
