/* ════════════════════════════════════════════════════════════════
   SUPABASE — read-only, build-time bridge to the data pipeline.

   The anon key is public by design (Row-Level Security is the
   boundary); pages call these getters inside `next build`, so the
   exported site stays fully static and SEO-complete while the data
   refreshes on every deploy.

   Every getter fails SOFT: a backend hiccup returns null and the
   dependent section simply doesn't render — a deploy can never be
   broken by the database. Row counts are logged so the CI build log
   doubles as the integration's verification record.

   Local/sandboxed builds: set SUPABASE_FIXTURES=<dir> to read
   <dir>/<view>.json instead of the network.
   ════════════════════════════════════════════════════════════════ */

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

type Row = Record<string, unknown>;

async function readFixture(view: string): Promise<Row[] | null> {
  try {
    const fs = await import("fs/promises");
    const raw = await fs.readFile(`${process.env.SUPABASE_FIXTURES}/${view}.json`, "utf8");
    const rows = JSON.parse(raw) as Row[];
    console.log(`[supabase] fixtures · ${view} → ${rows.length} rows`);
    return rows;
  } catch {
    console.warn(`[supabase] fixtures · ${view} → none`);
    return null;
  }
}

async function sbRows(view: string, query: string): Promise<Row[] | null> {
  if (process.env.SUPABASE_FIXTURES) return readFixture(view);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${view}?${query}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      console.warn(`[supabase] ${view} → HTTP ${res.status} — section hidden`);
      return null;
    }
    const rows = (await res.json()) as Row[];
    console.log(`[supabase] ${view} → ${rows.length} rows`);
    return rows;
  } catch (e) {
    console.warn(`[supabase] ${view} unreachable (${e instanceof Error ? e.message : "error"}) — section hidden`);
    return null;
  }
}

async function sbCount(view: string, filter = ""): Promise<number | null> {
  if (process.env.SUPABASE_FIXTURES) {
    const rows = await readFixture(`${view}.count${filter ? ".filtered" : ""}`);
    return rows && typeof rows[0]?.count === "number" ? (rows[0].count as number) : null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${view}?select=*${filter ? `&${filter}` : ""}&limit=1`, {
      method: "HEAD",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: "count=exact" },
      signal: AbortSignal.timeout(12000),
    });
    const range = res.headers.get("content-range"); // e.g. "0-0/1214"
    const total = range?.split("/")[1];
    const n = total && total !== "*" ? Number(total) : NaN;
    if (Number.isNaN(n)) return null;
    console.log(`[supabase] count ${view}${filter ? ` [${filter}]` : ""} → ${n}`);
    return n;
  } catch {
    return null;
  }
}

const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const n = (v: unknown): number | null => {
  const x = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(x) ? x : null;
};

/* ── the scored backlog — real Truth Scores from the pipeline ── */

export type LiveScoredProject = {
  name: string;
  developer: string | null;
  location: string | null;
  microMarket: string | null;
  truthScore: number;
  delayRisk: string | null;
  delayDelta: string | null;
  cagr: string | null;
  redFlags: number | null;
  budget: string | null;
  config: string | null;
};

export async function fetchScoredBacklog(): Promise<LiveScoredProject[] | null> {
  const rows = await sbRows(
    "backlog_listing_public",
    'select=name,developer,location,"microMarket","truthScore","delayRisk","delayDelta",cagr,"redFlags",budget,config&truthScore=not.is.null&order="truthScore".desc&limit=12',
  );
  if (!rows) return null;
  const out: LiveScoredProject[] = [];
  for (const r of rows) {
    const name = s(r.name);
    const score = n(r.truthScore);
    if (!name || score == null) continue;
    out.push({
      name,
      developer: s(r.developer),
      location: s(r.location),
      microMarket: s(r.microMarket),
      truthScore: Math.round(score),
      delayRisk: s(r.delayRisk),
      delayDelta: s(r.delayDelta),
      cagr: s(r.cagr),
      redFlags: n(r.redFlags),
      budget: s(r.budget),
      config: s(r.config),
    });
  }
  return out.length ? out : null;
}

/* ── the tracked universe — headline numbers from the RERA corpus ── */

export type TrackedStats = { tracked: number; delayed: number | null };

export async function fetchTrackedStats(): Promise<TrackedStats | null> {
  const tracked = await sbCount("projects_basic_public");
  if (tracked == null || tracked <= 0) return null;
  const delayed = await sbCount("projects_basic_public", "computed_is_delay=is.true");
  return { tracked, delayed };
}

/* ── developer track records, computed from filings ── */

export type LiveDeveloper = {
  name: string;
  slug: string | null;
  total: number | null;
  delivered: number | null;
  ongoing: number | null;
  delayedPct: number | null;
  avgDelayMonths: number | null;
  financialBand: string | null;
  legalBand: string | null;
};

export async function fetchDevelopersOverview(): Promise<LiveDeveloper[] | null> {
  const rows = await sbRows(
    "developers_overview",
    "select=developer_name,developer_slug,total_projects,delivered,ongoing,delayed_pct,avg_delay_months,financial_band,legal_band&order=delivered.desc.nullslast&limit=12",
  );
  if (!rows) return null;
  const out: LiveDeveloper[] = [];
  for (const r of rows) {
    const name = s(r.developer_name);
    if (!name) continue;
    out.push({
      name,
      slug: s(r.developer_slug),
      total: n(r.total_projects),
      delivered: n(r.delivered),
      ongoing: n(r.ongoing),
      delayedPct: n(r.delayed_pct),
      avgDelayMonths: n(r.avg_delay_months),
      financialBand: s(r.financial_band),
      legalBand: s(r.legal_band),
    });
  }
  return out.length ? out : null;
}

/* ── micro-markets under live coverage ── */

export type LiveMicroMarket = { slug: string; name: string };

export async function fetchMicroMarkets(): Promise<LiveMicroMarket[] | null> {
  const rows = await sbRows("micro_market_data", "select=slug,name&order=name.asc&limit=24");
  if (!rows) return null;
  const out: LiveMicroMarket[] = [];
  for (const r of rows) {
    const slug = s(r.slug), name = s(r.name);
    if (slug && name) out.push({ slug, name });
  }
  return out.length ? out : null;
}
