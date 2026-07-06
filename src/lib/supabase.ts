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
  matchScore: number | null;
  delayChancePct: number | null;
  budget: string | null;
  config: string | null;
};

export async function fetchScoredBacklog(): Promise<LiveScoredProject[] | null> {
  const rows = await sbRows(
    "backlog_listing_public",
    'select=name,developer,location,"microMarket","truthScore","delayRisk","delayDelta",cagr,"redFlags","matchScore",delay_chance_pct,listing_red_flags,budget,config&truthScore=not.is.null&order="truthScore".desc&limit=12',
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
      redFlags: n(r.redFlags) ?? n(r.listing_red_flags),
      matchScore: n(r.matchScore),
      delayChancePct: n(r.delay_chance_pct),
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

/* ── full backlog rows — feed the auto-generated live report pages ──
   Flat columns come typed; the module payloads (construction_pace,
   legal_risks, developer_track_record, …) arrive as unknown JSON and
   are parsed defensively in the UI — any absent field renders NA. */

export type LiveBacklogFull = {
  id: string;
  slug: string;
  name: string;
  developer: string | null;
  location: string | null;
  microMarket: string | null;
  truthScore: number | null;
  delayRisk: string | null;
  delayDelta: string | null;
  delayColor: string | null;
  cagr: string | null;
  expectedCagrNum: number | null;
  adjustedRoi: number | null;
  redFlags: number | null;
  matchScore: number | null;
  delayChancePct: number | null;
  budget: string | null;
  minPriceCr: number | null;
  config: string | null;
  minBhk: number | null;
  promised: string | null;
  predicted: string | null;
  deliveryYear: string | null;
  registrationDate: string | null;
  insight: string | null;
  constructionPaceNum: number | null;
  /* module payloads — shapes owned by the pipeline */
  modConstruction: unknown;
  modTrackRecord: unknown;
  modLegal: unknown;
  modFinancial: unknown;
  modRuleVerdict: unknown;
  modRiskIntel: unknown;
  modRiskVerdict: unknown;
};

export function liveSlug(name: string): string {
  return `live-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

export async function fetchBacklogFull(): Promise<LiveBacklogFull[] | null> {
  const rows = await sbRows(
    "backlog_listing_public",
    'select=*&truthScore=not.is.null&order="truthScore".desc&limit=60',
  );
  if (!rows) return null;
  // one-time shape record: the CI build log tells us the pipeline's true shapes
  if (rows[0]) console.log("[supabase] backlog sample:", JSON.stringify(rows[0]).slice(0, 2000));
  const out: LiveBacklogFull[] = [];
  for (const r of rows) {
    const name = s(r.name);
    if (!name) continue;
    out.push({
      id: s(r.id) ?? liveSlug(name),
      slug: liveSlug(name),
      name,
      developer: s(r.developer),
      location: s(r.location),
      microMarket: s(r.microMarket),
      truthScore: n(r.truthScore),
      delayRisk: s(r.delayRisk),
      delayDelta: s(r.delayDelta),
      delayColor: s(r.delayColor),
      cagr: s(r.cagr),
      expectedCagrNum: n(r.expected_cagr_num),
      adjustedRoi: n(r.adjusted_roi),
      redFlags: n(r.redFlags) ?? n(r.listing_red_flags),
      matchScore: n(r.matchScore),
      delayChancePct: n(r.delay_chance_pct),
      budget: s(r.budget),
      minPriceCr: n(r.min_price_cr),
      config: s(r.config),
      minBhk: n(r.min_bhk_num),
      promised: s(r.promised),
      predicted: s(r.predicted),
      deliveryYear: s(r.deliveryYear),
      registrationDate: s(r.registration_date),
      insight: s(r.insight),
      constructionPaceNum: n(r.construction_pace),
      modConstruction: r.construction_pace,
      modTrackRecord: r.developer_track_record,
      modLegal: r.legal_risks,
      modFinancial: r.financial_subscores,
      modRuleVerdict: r.rule_verdict,
      modRiskIntel: r.risk_intelligence,
      modRiskVerdict: r.risk_verdict,
    });
  }
  return out.length ? out : null;
}

/* ── extended details — hero, vitals & document media per project ──
   1-to-1 with backlog_projects via backlog_id; rows arrive as the
   founder fills them, so every field is nullable and the page simply
   keeps its NA/hidden state until data lands. */

export type LiveExtendedDetails = {
  backlogId: string;
  heroImageUrl: string | null;
  heroDate: string | null;
  priceRangeSqft: string | null;
  superAreaRange: string | null;
  launchPrice: number | null;
  floorsRange: string | null;
  brochureUrl: string | null;
  paymentPlanUrl: string | null;
  renderElevationUrl: string | null;
  siteMapImageUrl: string | null;
  siteMap3dHtml: string | null;
};

export async function fetchExtendedDetails(): Promise<Record<string, LiveExtendedDetails> | null> {
  const rows = await sbRows("project_extended_details", "select=*&limit=300");
  if (!rows) return null;
  const out: Record<string, LiveExtendedDetails> = {};
  for (const r of rows) {
    const backlogId = s(r.backlog_id);
    if (!backlogId) continue;
    out[backlogId] = {
      backlogId,
      heroImageUrl: s(r.hero_image_url),
      heroDate: s(r.hero_date),
      priceRangeSqft: s(r.price_range_sqft),
      superAreaRange: s(r.super_area_range),
      launchPrice: n(r.launch_price),
      floorsRange: s(r.floors_range),
      brochureUrl: s(r.brochure_url),
      paymentPlanUrl: s(r.payment_plan_url),
      renderElevationUrl: s(r.render_elevation_url),
      siteMapImageUrl: s(r.site_map_image_url),
      siteMap3dHtml: s(r.site_map_3d_html),
    };
  }
  return Object.keys(out).length ? out : null;
}

/* ── backlog_projects name↔id map — the join bridge ──
   The extended/config tables reference backlog_projects.id. If the
   listing view's own id column is a different id, we can still join
   through the project name. */

export async function fetchBacklogNameIds(): Promise<Record<string, string> | null> {
  const rows = await sbRows("backlog_projects", "select=id,name&limit=2000");
  if (!rows) return null;
  const out: Record<string, string> = {};
  for (const r of rows) {
    const id = s(r.id), name = s(r.name);
    if (id && name && !(name in out)) out[name] = id;
  }
  return Object.keys(out).length ? out : null;
}

/* ── per-BHK configurations — 1-to-many via backlog_id ── */

export type LiveConfiguration = {
  backlogId: string;
  bhkType: string | null;
  areaType: string | null;
  carpetArea: number | null;
  balconyArea: number | null;
  superArea: number | null;
  config3dHtml: string | null;
};

export async function fetchConfigurations(): Promise<Record<string, LiveConfiguration[]> | null> {
  const rows = await sbRows("project_configurations", "select=*&order=super_area.asc.nullslast&limit=1000");
  if (!rows) return null;
  const out: Record<string, LiveConfiguration[]> = {};
  for (const r of rows) {
    const backlogId = s(r.backlog_id);
    if (!backlogId) continue;
    (out[backlogId] ??= []).push({
      backlogId,
      bhkType: s(r.bhk_type),
      areaType: s(r.area_type),
      carpetArea: n(r.carpet_area),
      balconyArea: n(r.balcony_area),
      superArea: n(r.super_area),
      config3dHtml: s(r.config_3d_html),
    });
  }
  return Object.keys(out).length ? out : null;
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
