/* wire-ingest — the ONLY door through which the research pipeline writes
   News & Updates.

   WHY THIS EXISTS. Handing an ingestion partner a Supabase secret key gives
   them service_role: it bypasses RLS on every table, so a key meant for one
   table also reads user_profiles and contact_leads and can delete anything.
   Supabase secret keys cannot be scoped per-table. So the partner gets no
   database credential at all — they get a token for this function, and this
   function is the only thing holding a database key. It has no code path to
   any table but project_intelligence_wire, so the rest of the database is
   unreachable rather than merely forbidden.

   WHAT IT GUARANTEES, regardless of what the caller sends:
     · Only project_intelligence_wire is ever touched.
     · No DELETE exists. Retiring an item flips status to ARCHIVED, so
       history is never destroyed and every change stays reversible.
     · created_at is set once on insert and preserved forever after; only
       updated_at moves on an edit. That is what lets a report's "Updated"
       date mean something (see WIRE_CREATED_AT_EPOCH in src/lib/reportAdapter.ts).
     · The existing-row read is fully paginated, so classification stays
       correct past PostgREST's default page size. Getting this wrong would
       re-insert every unread row with today's created_at and jump every
       report to "updated today" at once.
     · Every field is validated against the table's real CHECK constraints
       before anything is written; a bad batch is rejected item-by-item
       rather than half-applied.

   OPERATIONAL CONTROLS (function secrets, no redeploy needed):
     · WIRE_INGEST_TOKEN   — the caller's shared secret. Rotate to revoke.
     · WIRE_INGEST_ENABLED — set to "false" to stop the pipeline dead.
     · WIRE_INGEST_STATUS  — status new items land in. Defaults to
       PUBLISHED (founder's decision: research goes live automatically).
       Set to DRAFT to switch the whole pipeline to review-first without
       touching code. */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const FUNCTION_NAME = "wire-ingest";
const TABLE = "project_intelligence_wire";
const MAX_ITEMS = 200;
const PAGE = 1000;

/* Mirrors the live CHECK constraints, verified against the deployed table
   on 19 Aug 2026. CRITICAL_FLAG is NOT a valid impact type — the database
   rejects it. */
const IMPACT = new Set(["POSITIVE", "NEUTRAL", "CAUTION", "RISK"]);
const CATEGORY = new Set([
  "REGULATORY",
  "PRICING",
  "CONSTRUCTION",
  "INFRASTRUCTURE",
  "CORPORATE_JV",
  "LEGAL",
]);
const STATUS = new Set(["PUBLISHED", "DRAFT", "ARCHIVED"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function log(level: string, step: string, data: unknown) {
  const line = JSON.stringify({ level, function: FUNCTION_NAME, step, data, timestamp: new Date().toISOString() });
  if (level === "error") console.error(line);
  else console.log(line);
}

/* Length-independent comparison so a wrong token cannot be discovered by
   timing the response. */
function tokenMatches(given: string, expected: string): boolean {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/* verified_facts is bullet TEXT in the table, not an array. Accept either
   shape from the caller and normalise, so a research script emitting a list
   does not fail on a column type it cannot see. */
function facts(v: unknown): string {
  if (Array.isArray(v)) {
    return v.map((x) => (s(x).startsWith("•") ? s(x) : `• ${s(x)}`)).filter((x) => x.length > 2).join("\n");
  }
  return s(v);
}

function naturalKey(slug: string, date: string, headline: string): string {
  return `${slug.toLowerCase()}|${date}|${headline.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

type Clean = Record<string, unknown>;

/* Validates one item completely before anything is written. Returns either
   a normalised row or the reason it was refused — never a partial row. */
function validate(raw: unknown, defaultStatus: string): { ok: true; row: Clean } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "not an object" };
  const it = raw as Record<string, unknown>;

  const project_slug = s(it.project_slug);
  if (!/^[a-z0-9-]{8,160}$/.test(project_slug)) return { ok: false, reason: "project_slug must be a lowercase slug (8-160 chars)" };

  const event_date = s(it.event_date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return { ok: false, reason: "event_date must be YYYY-MM-DD" };
  const t = Date.parse(`${event_date}T00:00:00Z`);
  if (Number.isNaN(t)) return { ok: false, reason: "event_date is not a real date" };
  const year = Number(event_date.slice(0, 4));
  if (year < 2000 || year > new Date().getUTCFullYear() + 6) return { ok: false, reason: "event_date is implausible" };

  const headline = s(it.headline);
  if (headline.length < 8 || headline.length > 200) return { ok: false, reason: "headline must be 8-200 chars" };

  const project_name = s(it.project_name);
  if (!project_name) return { ok: false, reason: "project_name is required" };

  const category = s(it.category).toUpperCase();
  if (!CATEGORY.has(category)) return { ok: false, reason: `category must be one of ${[...CATEGORY].join(", ")}` };

  const forensic_impact_type = s(it.forensic_impact_type).toUpperCase();
  if (!IMPACT.has(forensic_impact_type)) return { ok: false, reason: `forensic_impact_type must be one of ${[...IMPACT].join(", ")}` };

  /* These three are NOT NULL in the table. Rejecting here gives the caller a
     usable message instead of a Postgres 23502. */
  const verified_facts = facts(it.verified_facts);
  if (!verified_facts) return { ok: false, reason: "verified_facts is required" };
  const forensic_impact_summary = s(it.forensic_impact_summary);
  if (!forensic_impact_summary) return { ok: false, reason: "forensic_impact_summary is required" };
  const source_name = s(it.source_name);
  if (!source_name) return { ok: false, reason: "source_name is required" };

  const source_url = s(it.source_url);
  if (source_url && !/^https?:\/\//.test(source_url)) return { ok: false, reason: "source_url must be http(s)" };

  /* DRAFT is accepted so the pipeline can be switched to review-first, and
     ARCHIVED so an item can be retired. Anything else falls back to the
     configured default rather than being trusted. */
  const asked = s(it.status).toUpperCase();
  const status = STATUS.has(asked) ? asked : defaultStatus;

  const display_order = Number.isInteger(it.display_order) ? (it.display_order as number) : 0;

  return {
    ok: true,
    row: {
      project_slug,
      project_name,
      event_date,
      category,
      headline,
      verified_facts,
      forensic_impact_type,
      forensic_impact_summary,
      source_name,
      source_url: source_url || null,
      source_document_ref: s(it.source_document_ref) || null,
      status,
      is_pinned: it.is_pinned === true,
      display_order,
    },
  };
}

/* Fields whose change makes an item genuinely different. category is
   included deliberately: leaving it out silently drops category
   corrections. created_at/updated_at are excluded — they are ours. */
const COMPARED = [
  "project_name",
  "category",
  "verified_facts",
  "forensic_impact_type",
  "forensic_impact_summary",
  "source_name",
  "source_url",
  "source_document_ref",
  "status",
  "is_pinned",
  "display_order",
] as const;

function differs(incoming: Clean, existing: Record<string, unknown>): boolean {
  for (const f of COMPARED) {
    const a = incoming[f] ?? null;
    const b = existing[f] ?? null;
    if (String(a) !== String(b)) return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed. Use POST." }, 405);

  if ((Deno.env.get("WIRE_INGEST_ENABLED") ?? "true").toLowerCase() === "false") {
    log("info", "disabled_by_kill_switch", {});
    return json({ ok: false, error: "Ingestion is disabled." }, 503);
  }

  const expected = Deno.env.get("WIRE_INGEST_TOKEN") ?? "";
  if (!expected) {
    log("error", "token_not_configured", {});
    return json({ ok: false, error: "Ingestion token is not configured." }, 500);
  }
  const given = req.headers.get("x-ingest-token") ?? "";
  if (!tokenMatches(given, expected)) {
    log("error", "unauthorized", { hasToken: Boolean(given) });
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const DB_KEY = Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!DB_URL || !DB_KEY) {
    log("error", "db_not_configured", { hasUrl: Boolean(DB_URL), hasKey: Boolean(DB_KEY) });
    return json({ ok: false, error: "Database is not configured." }, 500);
  }
  const dbHeaders = { apikey: DB_KEY, Authorization: `Bearer ${DB_KEY}`, "Content-Type": "application/json" };

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const batch = s(body.batch) || "unnamed";
  const items = body.items;
  if (!Array.isArray(items)) return json({ ok: false, error: "Body must be { items: [...] }." }, 400);
  if (items.length === 0) return json({ ok: true, batch, inserted: 0, updated: 0, unchanged: 0, rejected: [] });
  if (items.length > MAX_ITEMS) {
    return json({ ok: false, error: `Batch too large: ${items.length} items, limit is ${MAX_ITEMS}.` }, 413);
  }

  const defaultStatus = (Deno.env.get("WIRE_INGEST_STATUS") ?? "PUBLISHED").toUpperCase();
  const rejected: { index: number; reason: string }[] = [];
  const clean: Clean[] = [];
  items.forEach((raw, i) => {
    const v = validate(raw, STATUS.has(defaultStatus) ? defaultStatus : "PUBLISHED");
    if (v.ok === true) clean.push(v.row);
    else rejected.push({ index: i, reason: v.reason });
  });
  if (clean.length === 0) {
    log("error", "all_items_rejected", { batch, rejected });
    return json({ ok: false, batch, inserted: 0, updated: 0, unchanged: 0, rejected }, 400);
  }

  /* Read EVERY existing row, paginated. A truncated read here is the one
     mistake that silently corrupts publication dates at scale. */
  const existing = new Map<string, Record<string, unknown>>();
  const knownSlugs = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(
      `${DB_URL}/rest/v1/${TABLE}?select=id,project_slug,event_date,headline,${COMPARED.join(",")},created_at`,
      { headers: { ...dbHeaders, Range: `${from}-${from + PAGE - 1}`, "Range-Unit": "items" } },
    );
    if (!res.ok) {
      const text = await res.text();
      log("error", "existing_read_failed", { status: res.status, text: text.slice(0, 300) });
      return json({ ok: false, error: "Could not read existing entries." }, 502);
    }
    const rows = (await res.json()) as Record<string, unknown>[];
    for (const r of rows) {
      existing.set(naturalKey(String(r.project_slug), String(r.event_date), String(r.headline)), r);
      knownSlugs.add(String(r.project_slug));
    }
    if (rows.length < PAGE) break;
  }

  const nowIso = new Date().toISOString();
  const toInsert: Clean[] = [];
  const toUpdate: Clean[] = [];
  let unchanged = 0;
  const unknownSlugs = new Set<string>();

  for (const row of clean) {
    const key = naturalKey(String(row.project_slug), String(row.event_date), String(row.headline));
    const prior = existing.get(key);
    if (!knownSlugs.has(String(row.project_slug))) unknownSlugs.add(String(row.project_slug));

    if (!prior) {
      toInsert.push({ ...row, created_at: nowIso, updated_at: nowIso });
    } else if (differs(row, prior)) {
      /* created_at is deliberately re-sent as the ORIGINAL value: this is an
         upsert, and omitting it would let the column default overwrite a
         real publication date with today. */
      toUpdate.push({ ...row, id: prior.id, created_at: prior.created_at, updated_at: nowIso });
    } else {
      unchanged++;
    }
  }

  if (toInsert.length) {
    const res = await fetch(`${DB_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...dbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify(toInsert),
    });
    if (!res.ok) {
      const text = await res.text();
      log("error", "insert_failed", { batch, count: toInsert.length, status: res.status, text: text.slice(0, 400) });
      return json({ ok: false, error: "Insert failed.", detail: text.slice(0, 400), rejected }, 502);
    }
  }

  if (toUpdate.length) {
    /* on_conflict=id with merge-duplicates is an UPDATE of the matched row,
       never a delete-and-replace. */
    const res = await fetch(`${DB_URL}/rest/v1/${TABLE}?on_conflict=id`, {
      method: "POST",
      headers: { ...dbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(toUpdate),
    });
    if (!res.ok) {
      const text = await res.text();
      log("error", "update_failed", { batch, count: toUpdate.length, status: res.status, text: text.slice(0, 400) });
      return json({ ok: false, error: "Update failed.", detail: text.slice(0, 400), rejected }, 502);
    }
  }

  /* Publish trigger. News is baked into the HTML at build time, so a write
     here changes nothing on the live site until something rebuilds. Fire
     that rebuild only when the batch ACTUALLY changed something — an
     unchanged re-run must not cost a deploy.

     Deliberately fails soft: a publish-trigger problem is not an ingestion
     problem. The rows are already written, and the hourly backstop cron
     will pick them up, so we log and report rather than returning an error
     the caller would reasonably retry. */
  let published: string = "not configured";
  if (toInsert.length + toUpdate.length > 0) {
    const ghToken = Deno.env.get("GH_PUBLISH_TOKEN") ?? "";
    const ghRepo = Deno.env.get("GH_PUBLISH_REPO") ?? "gauravjainstartup-sys/Truth-Estate";
    if (!ghToken) {
      published = "skipped — GH_PUBLISH_TOKEN not set (hourly backstop will publish)";
      log("info", "publish_trigger_skipped", { batch });
    } else {
      try {
        const reason = `${batch}: +${toInsert.length} new, ~${toUpdate.length} changed`;
        const res = await fetch(
          `https://api.github.com/repos/${ghRepo}/actions/workflows/publish-wire.yml/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ghToken}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
              "User-Agent": "truth-estate-wire-ingest",
            },
            body: JSON.stringify({ ref: "main", inputs: { reason } }),
          },
        );
        if (res.status === 204) {
          published = "triggered";
          log("info", "publish_triggered", { batch, reason });
        } else {
          const text = await res.text();
          published = `trigger failed (${res.status}) — hourly backstop will publish`;
          log("error", "publish_trigger_failed", { batch, status: res.status, text: text.slice(0, 300) });
        }
      } catch (err) {
        published = "trigger errored — hourly backstop will publish";
        log("error", "publish_trigger_error", { batch, error: String(err).slice(0, 300) });
      }
    }
  } else {
    published = "nothing changed — no rebuild needed";
  }

  const summary = {
    ok: true,
    batch,
    inserted: toInsert.length,
    updated: toUpdate.length,
    unchanged,
    published,
    rejected,
    /* Not an error: a slug we have never seen may be a new project, or a
       typo that would leave the item showing on no report at all. Surfaced
       so the caller can tell which. */
    unknownSlugs: [...unknownSlugs],
    statusApplied: STATUS.has(defaultStatus) ? defaultStatus : "PUBLISHED",
  };
  log("info", "ingest_complete", summary);
  return json(summary);
});
