# Near-real-time publish — Supabase → GitHub → live site

The site is a **static export** (GitHub Pages, zero per-view Supabase egress by
design). "Live data" therefore means **rebuild on change**. This hook makes that
automatic:

```
edit a row in Supabase
      │  Database Webhook (on insert/update/delete)
      ▼
publish-deploy  Edge Function   (auth + debounce)
      │  POST /repos/…/dispatches  (event_type: supabase-data-changed)
      ▼
GitHub Actions "Deploy to GitHub Pages"   (SNAPSHOT_REFRESH=1 → fresh snapshot)
      ▼
site live with the edit in ~3–4 min
```

The **GitHub side is already done and deployed** (the `repository_dispatch:
[supabase-data-changed]` trigger in `.github/workflows/deploy.yml`). You only
need to do the **4 Supabase steps** below (I can't — this environment is
firewalled from your Supabase project).

---

## 1. Create the GitHub token (2 min)

GitHub → **Settings → Developer settings → Fine-grained personal access tokens →
Generate new token**:

- **Resource owner:** `gauravjainstartup-sys`
- **Repository access:** *Only select repositories* → **Truth-Estate**
- **Permissions → Repository → Contents: _Read and write_** *(this is what the
  `dispatches` API requires — nothing else needed)*
- Expiration: your call (set a calendar reminder to rotate).

Copy the `github_pat_…` token.

## 2. Deploy the Edge Function (1 min)

From the repo root (with the Supabase CLI logged in to this project):

```bash
supabase functions deploy publish-deploy --no-verify-jwt
```

`--no-verify-jwt` is required: the DB webhook isn't an authenticated user — we
authenticate it ourselves with the shared secret in step 3.

## 3. Set the function secrets (1 min)

```bash
# the GitHub token from step 1
supabase secrets set GH_DISPATCH_TOKEN=github_pat_xxxxxxxxxxxxxxxx
# any long random string — you'll paste the SAME value into the webhook header
supabase secrets set PUBLISH_HOOK_SECRET=$(openssl rand -hex 24)
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — no
need to set them. Optional overrides: `PUBLISH_DEBOUNCE_SEC` (default 90),
`GH_REPO` (default `gauravjainstartup-sys/Truth-Estate`).

Print the secret you generated so you can paste it in step 4b:
```bash
supabase secrets list   # or echo the value you set above
```

## 4. Create the debounce table + the Database Webhook

**4a. Throttle table** (SQL editor) — lets a bulk pipeline rewrite collapse into
**one** rebuild instead of hundreds:

```sql
create table if not exists public.deploy_throttle (
  id int primary key default 1,
  last_dispatch_at timestamptz not null default 'epoch',
  constraint deploy_throttle_singleton check (id = 1)
);
insert into public.deploy_throttle (id) values (1) on conflict do nothing;
```
*(Optional — if you skip it, the function still works, it just dispatches every
time instead of debouncing.)*

**4b. Database Webhook** — Supabase Dashboard → **Database → Webhooks → Create**:

- **Name:** `publish-deploy`
- **Table:** the base table behind `backlog_listing_public_v3` (the one the
  pipeline writes — e.g. `backlog_listing` / `backlog_projects`). Add one webhook
  per table you want to trigger republishes (you can also add the
  `project_extended_details` / configurations tables so media & 3D-related edits
  publish too).
- **Events:** Insert, Update, Delete
- **Type:** *Supabase Edge Function* → `publish-deploy`  *(or HTTP Request to
  `https://<project-ref>.functions.supabase.co/publish-deploy`)*
- **HTTP Headers:** add
  `x-publish-secret: <the PUBLISH_HOOK_SECRET value from step 3>`

Save.

---

## Test it

Edit any row in the watched table (or run):
```bash
curl -i -X POST "https://<project-ref>.functions.supabase.co/publish-deploy" \
  -H "x-publish-secret: <PUBLISH_HOOK_SECRET>" -H "content-type: application/json" -d '{}'
```
Expect `{"ok":true,"dispatched":true}` (or `202 debounced` if you just fired
one). Within seconds a **"Deploy to GitHub Pages"** run appears in the repo's
Actions tab (event: `repository_dispatch`); ~3–4 min later the edit is live.

## How it behaves

- **Debounced:** bursts within `PUBLISH_DEBOUNCE_SEC` (90 s) collapse to one
  rebuild; changes that land while a build is in flight are captured by that
  build's snapshot step.
- **Backstopped:** the daily 3 AM cron still runs, so nothing is ever more than
  a day stale even if a webhook is missed.
- **Safe:** unauthenticated calls get 401; the token lives only in Supabase
  function secrets (never in the repo or the client bundle); it can only trigger
  a rebuild (Contents: write on one repo), nothing else.
- **Cost:** one Actions run + one Supabase snapshot per (debounced) change —
  code pushes and page views stay at zero Supabase egress.

## Troubleshooting — nothing deployed after a DB edit

pg_net is **asynchronous**: the trigger calls `net.http_post(...)`, which returns a
request id *immediately* and sends the HTTP call from a background worker a few
seconds later. So the SQL editor saying **"Success. No rows returned"** tells you
nothing — the truth is in pg_net's response log. **This one query is the whole
diagnostic:**

```sql
select id, status_code, content, error_msg, created
from net._http_response order by created desc limit 5;
```

Read `status_code` on the newest row (its `id` matches the number `net.http_post`
returned):

| `status_code` | `content` | Meaning → fix |
|---|---|---|
| **200** | `{"ok":true,"dispatched":true}` | Success. A `repository_dispatch` "Deploy to GitHub Pages" run appears in Actions within seconds. |
| **202** | `{"dispatched":false,...debounced}` | **Not an error** — a rebuild fired within `PUBLISH_DEBOUNCE_SEC` (90 s) and covers this edit. |
| **401** | `{"error":"unauthorized"}` | Secret mismatch: the `x-publish-secret` the **trigger** sends ≠ `PUBLISH_HOOK_SECRET` on the **function** (or the function secret isn't set). Fix: set the *same* value in both places (see isolation test below). |
| **502** | `{"github_status":403,...\"Resource not accessible by personal access token\"}` | The GitHub PAT lacks permission. It needs **Contents: Read and write** — see the gotcha below. Also confirm repo access includes `Truth-Estate`, and if the owner is an org, the token is org-approved. |
| **502** | `{"github_status":401}` | PAT is invalid or expired — regenerate it and re-set `GH_DISPATCH_TOKEN`. |
| *(no new row)* / `status_code` null + `error_msg` | — | pg_net never sent it: extension not enabled, wrong URL, or network. Read `error_msg`. |

### Isolate which side owns a 401

To tell "trigger sends the wrong secret" apart from "function has the wrong
secret," call the function **directly** from the SQL editor with a value you
*know*, bypassing the trigger:

```sql
select net.http_post(
  url     := 'https://<project-ref>.functions.supabase.co/publish-deploy',
  headers := jsonb_build_object('Content-Type','application/json','x-publish-secret','A_VALUE_YOU_KNOW'),
  body    := '{}'::jsonb
);
-- wait ~15s, then:
select id, status_code, content from net._http_response order by created desc limit 1;
```

Set `PUBLISH_HOOK_SECRET` to `A_VALUE_YOU_KNOW` first. If this still 401s, the
secret isn't reaching the function (wrong project linked, or set in the wrong
place — it must be **Edge Functions → Secrets**, not Vault). Once this returns
200, re-point the trigger's `notify_publish_deploy()` header at the same value.

### Two gotchas that bit us setting this up

1. **`supabase …` / `curl …` are terminal commands, not SQL.** Pasting them into
   the SQL editor throws `syntax error at or near "supabase"`. Use the **Dashboard
   UI** for secrets (Edge Functions → Secrets) and the SQL editor only for SQL.
2. **The dispatch API needs `Contents: Read and write` — nothing else.** On the
   fine-grained PAT permission list, "Repository advisories: Read and write" looks
   plausible and is easy to pick by mistake; it yields the `403 "Resource not
   accessible by personal access token"` above. The only permission that matters
   here is **Contents** (write).
