# News & Updates ingestion API — how your pipeline publishes

**To:** Antigravity Engineering
**From:** CTO office, Truth Estate
**Date:** 19 Aug 2026

Your research pipeline now has a supported, automated path to the live site.
Research you publish through this endpoint appears on the project report and in
its search-engine markup without anyone in the loop.

---

## What changed, and why it is not a database key

You will **not** be given a Supabase key for this. Supabase secret keys are
service_role — they cannot be scoped to a single table, so a key issued for
News & Updates would also read `user_profiles` and `contact_leads` and could
delete anything in the database. That is not a statement about trust; it is
that the credential cannot express the permission we actually want to grant.

Instead you get a token for one endpoint. That endpoint holds the only database
key, and its code can reach exactly one table. Everything else in the database
is unreachable from it, not merely forbidden.

**Please retire the `ag_ingestion` Supabase key** — stop using it and delete
your copies. It will be revoked once you confirm you are off it.

---

## The endpoint

```
POST https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/wire-ingest
Content-Type: application/json
x-ingest-token: <the token the founder sends you separately>
```

Body:

```json
{
  "batch": "comprehensive-batch1-dlf-m3m",
  "items": [ { …dispatch… }, … ]
}
```

Up to **200 items per call**. Send more than that and the whole batch is
refused rather than half-applied — page your batches.

### One dispatch

| Field | Required | Rules |
|---|---|---|
| `project_slug` | yes | lowercase slug, 8–160 chars. Must match the project's slug on the site exactly, or the item shows on no report. |
| `project_name` | yes | non-empty |
| `event_date` | yes | `YYYY-MM-DD`, year 2000 … current+6. **The date the event happened**, not the date you researched it. |
| `headline` | yes | 8–200 chars |
| `verified_facts` | yes | bullet text. An array is accepted and joined into bullets. |
| `forensic_impact_type` | yes | `POSITIVE` · `NEUTRAL` · `CAUTION` · `RISK` |
| `forensic_impact_summary` | yes | non-empty |
| `category` | yes | `REGULATORY` · `PRICING` · `CONSTRUCTION` · `INFRASTRUCTURE` · `CORPORATE_JV` · `LEGAL` |
| `source_name` | yes | e.g. `HARERA QPR` |
| `source_url` | no | must be `http(s)` if present |
| `source_document_ref` | no | free text |
| `status` | no | omit to publish. `ARCHIVED` retires an item. |
| `is_pinned`, `display_order` | no | boolean / integer |

`CRITICAL_FLAG` is **not** a valid impact type — the database rejects it. The
old note that said otherwise was wrong; this table is the live constraint.

---

## How writes are decided

Identity is the natural key **`project_slug` + `event_date` + `headline`**.

- **New key** → inserted, `created_at` stamped now.
- **Known key, content changed** → updated. `created_at` keeps its original
  value; only `updated_at` moves.
- **Known key, nothing changed** → skipped entirely, nothing written.

This is why `created_at` matters: a report's visible "Updated" date is derived
from it. If a re-run re-created rows, every report would claim it was updated
today. The endpoint owns that logic now, so your side does not have to.

**Changing a headline creates a new item** — the headline is part of the
identity. To correct a headline, send the old one with `"status": "ARCHIVED"`
and then send the corrected one.

**Nothing is ever deleted.** There is no delete path. Retire with `ARCHIVED`.

---

## What you get back

```json
{
  "ok": true,
  "batch": "comprehensive-batch1-dlf-m3m",
  "inserted": 12,
  "updated": 3,
  "unchanged": 88,
  "rejected": [ { "index": 4, "reason": "event_date must be YYYY-MM-DD" } ],
  "unknownSlugs": ["gurugram-real-estate-typo-here"],
  "statusApplied": "PUBLISHED"
}
```

- `rejected` — per-item, with the reason. Valid items in the same batch still
  go through, so fix and resend only the rejects.
- `unknownSlugs` — not an error, but **check these**. A slug we have never seen
  is either a genuinely new project or a typo, and a typo means the item
  publishes to no report at all. Silent in the data, visible here.

Status codes: `401` bad token · `413` batch too large · `400` every item
invalid · `503` ingestion disabled · `502` database write failed.

## Please treat these as errors

Your current scripts exit 0 on failure. A run that wrote nothing must not look
like a run that succeeded — check `ok`, and check `rejected` is empty.

---

## Testing

There is no separate sandbox. To test safely, send your item with
`"status": "ARCHIVED"` — it is stored and returned in the counts but never
appears on the site. Then re-send without `status` to publish for real.

Do **not** test with fabricated headlines against a real project slug at
`PUBLISHED`. Your current `test-wire-upsert-acceptance.mjs` does exactly that,
which puts invented news on a live report and into its SEO markup for the
duration of the run — and permanently if the run throws before its cleanup.
Please repoint that test at this endpoint with `ARCHIVED`.

---

## If something goes wrong

The founder can stop the pipeline instantly (`WIRE_INGEST_ENABLED=false`)
without touching code, and rotating the token revokes your access outright.
Both are one-line operations, which is the point: this arrangement is safe to
grant precisely because it is trivial to withdraw.

Every call is logged with its batch name and counts. If a run reports numbers
you did not expect, say so and we will read the logs together rather than
guess.
