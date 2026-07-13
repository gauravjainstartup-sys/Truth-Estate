# Titanium SPR — gated 3D model demo (the DB-centric approach)

The 3D file (`engine/tower-engine.html`) contains **no project data**. On load it
requests a short-lived signed token from the gate (`/mint-token`) and fetches the
model pieces (`/model`) — exactly the flow production will run against Supabase
Edge Functions. `mock-api.mjs` plays the gate locally so the whole thing works on
one machine.

## Run (needs Node 18+)
    node mock-api.mjs

Then open **http://localhost:8791/** → loads as `buyer@demo` (the demo-entitled
user) — the full 3D advisor.

## See the gate refuse
Open **http://localhost:8791/tower-engine.html?sub=stranger@x** → `403
not-entitled`; the page shows "Unable to load the model." and no data ever moves.

Gate on every request: origin allowlist · entitlement (this subject unlocked this
project) · rate limit (5 tokens/min) · 5-minute HMAC-signed tokens.
