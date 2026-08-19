# Requirement: News & Updates ingestion must preserve per-event publication time

**To:** Antigravity Engineering (wire ingestion pipeline)
**From:** CTO office, Truth Estate
**Re:** `public.project_intelligence_wire` — switch wipe-and-reload to a true upsert
**Date:** 19 Aug 2026
**Priority:** Medium — nothing is broken today, but a product feature is capped until this lands.

---

## 1. Why this matters now

The report pages now factor News & Updates into the visible **"Updated" date**, and the
Office **"See new update" badge** treats News & Updates as a section. Both need to know
*when an event was first published on our platform* — which is what `created_at` is for.

Today that signal does not exist. Observed on the live table (19 Aug):

- all **453 published rows** have `created_at == updated_at` to the second, and
- both are stamped inside the **same batch second** for the entire table.

That is the signature of a delete-everything-and-reinsert pipeline (the
`scripts/ingest-batch*.mjs` / `comprehensive-batch*.mjs` flow): every run re-creates
every row, so `created_at` means "when the last batch ran", not "when this event was
published". We therefore had to key the report's date logic on `event_date`, which
misses one case the founder explicitly wants covered: **an event added later but dated
in the past** (e.g. a June milestone filed in September) never registers as an update.
Using today's `created_at` instead would be worse — every batch re-run would flip all
107 reports to "Updated today", which is freshness-faking.

## 2. The requirement

**R1 — Upsert, never wipe-and-reload.**
Ingestion must write with `INSERT … ON CONFLICT … DO UPDATE`, keyed on a stable
identity, and must not `DELETE`/`TRUNCATE` the table first.

Recommended natural key (needs the unique index below):

```sql
-- one-time, idempotent
create unique index if not exists project_wire_natural_key
  on public.project_intelligence_wire (project_slug, event_date, headline);
```

Known caveat, accepted: editing a *headline* changes the key and therefore re-publishes
the event with a fresh `created_at`. That is acceptable semantics — a re-headlined
event is effectively a new publication. If your generator can carry a stable per-event
id instead, even better; key on that.

**R2 — Never touch `created_at` on update.**
`created_at` must not appear in the `DO UPDATE SET` list. It is set by the column
default on first insert, once, forever.

**R3 — Bump `updated_at` only when content actually changed.**
`updated_at` feeds the public `NewsArticle` `dateModified` markup on 107 pages, so a
no-op re-save should not move it. Pattern:

```sql
insert into public.project_intelligence_wire as w (project_slug, event_date, headline, …)
values (…)
on conflict (project_slug, event_date, headline) do update
  set verified_facts        = excluded.verified_facts,
      forensic_impact_type  = excluded.forensic_impact_type,
      forensic_impact_summary = excluded.forensic_impact_summary,
      source_name           = excluded.source_name,
      source_url            = excluded.source_url,
      source_document_ref   = excluded.source_document_ref,
      status                = excluded.status,
      is_pinned             = excluded.is_pinned,
      display_order         = excluded.display_order,
      updated_at            = now()
  where (w.verified_facts, w.forensic_impact_type, w.forensic_impact_summary,
         w.source_name, w.source_url, w.source_document_ref,
         w.status, w.is_pinned, w.display_order)
        is distinct from
        (excluded.verified_facts, excluded.forensic_impact_type, excluded.forensic_impact_summary,
         excluded.source_name, excluded.source_url, excluded.source_document_ref,
         excluded.status, excluded.is_pinned, excluded.display_order);
```

**R4 — Retire an event by status, not by deletion.**
If a batch no longer contains an event, set its `status` to `'ARCHIVED'` rather than
deleting the row. History stays auditable and RLS already hides non-PUBLISHED rows
from the public.

## 3. Acceptance — how we will verify

1. Run the full batch twice back-to-back with no content changes:
   `select count(distinct date_trunc('second', created_at)) from project_intelligence_wire;`
   must return **more than 1** after real history accumulates, and the second run must
   change **zero** `created_at` values and **zero** `updated_at` values.
2. Add exactly one new event and re-run: exactly **one** row has `created_at` within
   the run window.
3. Edit one event's `verified_facts` and re-run: exactly **one** row's `updated_at`
   moves; its `created_at` does not.

## 4. What unlocks on our side once this lands

We switch the report's News & Updates date contribution (and the Office badge's `news`
date) from `event_date` to `created_at`. From then on **every** newly published event —
including backdated ones — counts as a report update on its publication day, while
batch re-runs, typo fixes and historical backfills never inflate any date. It is a
two-line change on our side, waiting on this requirement.

## 5. Small aside (doc drift, no action urgency)

Your `NOTE_FOR_CLAUDE_CTO.md` schema block lists impact types
`('POSITIVE','NEUTRAL','RISK','CRITICAL_FLAG')` and omits `LEGAL` from the category
check; the live table enforces `('POSITIVE','NEUTRAL','CAUTION','RISK')` and includes
`LEGAL` (see `supabase/migrations/0024_project_intelligence_wire.sql`, which mirrors
production). Worth aligning the note next time it is touched.
