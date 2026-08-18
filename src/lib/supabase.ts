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

import { corridorKey } from "./journey";
import type { DevLedgerItem } from "./developers";
import { computePillarSet, mapBacklogRowFields, ocFromOverrides, type OcInfo } from "./backlogRow";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

/* Per-row/per-project build logs (presence tables, sample dumps) are useful
   when debugging a shape, but ~4 lines × ~90 projects buries everything else —
   including the prebuild's egress instrumentation — past the CI log-tail cap.
   Off by default; set BUILD_DEBUG=1 to restore them. Aggregate/verification
   logs (per-view row counts, dedupe summary) stay on always. */
const DBG = process.env.BUILD_DEBUG === "1";

type Row = Record<string, unknown>;

async function readFixture(view: string): Promise<Row[] | null> {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import(/* webpackIgnore: true */ "fs/promises");
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
/* jsonb columns can surface as STRINGS depending on the view/driver — parse
   anything that looks like JSON so downstream readers see real structures */
const j = (v: unknown): unknown => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t || (t[0] !== "{" && t[0] !== "[" && t[0] !== '"')) return v;
  try { return JSON.parse(t) as unknown; } catch { return v; }
};
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
  // v3 is a superset of the base view (same columns) and it's the only backlog
  // view the build snapshots — read it so this never depends on a fixture we
  // stopped pulling to save egress.
  const rows = await sbRows(
    "backlog_listing_public_v3",
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
    // 17 developers are filed; a limit of 12 silently dropped five of them.
    // avg_developer_delay is pulled alongside avg_delay_months because the
    // latter is null for EVERY developer in the view (delay_months is filed as
    // text like "4.6 mo", so the view's AVG() can't aggregate it) — the real,
    // parsed average lands in avg_developer_delay instead.
    "select=developer_name,developer_slug,total_projects,delivered,ongoing,delayed_pct,avg_delay_months,avg_developer_delay,financial_band,legal_band&order=delivered.desc.nullslast&limit=50",
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
      // Prefer the intended column; fall back to the parsed per-developer
      // average when it's null (which, today, is always) so a delayed developer
      // never renders "0 mo" beside a non-100% on-time score. NOT
      // computed_avg_delay — that reads 0 even for fully-delayed developers.
      avgDelayMonths: n(r.avg_delay_months) ?? n(r.avg_developer_delay),
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
  /* The internal identifier — events, entitlements and the inferred
     brief are all keyed on this. Not the URL. */
  slug: string;
  /* The public address. See seoSlug(). */
  seoSlug: string;
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
  /* extended vitals — present on backlog_listing_public_v2; null on the base view */
  reraId: string | null;
  reraUrl: string | null;
  densityAptPerAcre: number | null;
  openAreaPct: number | null;
  landAcres: number | null;
  /* module payloads — shapes owned by the pipeline */
  modConstruction: unknown;
  modSales: unknown;
  /* Delivery / OC-CC — from backlog_project_data, with the row's own
     `overrides` JSONB winning over the base columns. Present ⇒ the project
     has its Occupancy/Completion Certificate on record. */
  deliveredOcDate: string | null;
  deliveredCertificateUrl: string | null;
  /* Tower count — lives in backlog_project_data.overrides.max_towers (the
     project_extended_details.total_towers column exists but its rows don't
     join the public listing, so every project read NA). This is the source
     that actually resolves for the catalogue. */
  maxTowers: number | null;
  modTrackRecord: unknown;
  modLegal: unknown;
  modFinancial: unknown;
  modRuleVerdict: unknown;
  modRiskIntel: unknown;
  modRiskVerdict: unknown;
  /* ── backlog_listing_public_v3 — the detail-page rollups (all null on older views) ── */
  /* developer-level rollups from developers_overview */
  devSlug: string | null;
  devTotal: number | null;
  devDelivered: number | null;
  devOngoing: number | null;
  devLapsed: number | null;
  devDelayedPct: number | null;
  devAvgDelayMonths: number | null;
  devFinancialBand: string | null;
  devFinancialScore: number | null;
  devLegalBand: string | null;
  devLegalScore: number | null;
  companyType: string | null;
  /* developer financial metrics (values arrive as text from jsonb) */
  finLeverage: number | null;        // net_debt_to_equity
  finCoverage: number | null;        // interest_coverage_ratio
  finCash: number | null;            // ocf_to_ebitda
  finMargin: number | null;          // ebitda_margin
  finInventory: number | null;       // inventory_to_sales_years
  finMetricScores: unknown;          // pipeline's own per-metric scoring payload
  /* construction & sales velocity */
  sectionTag: string | null;
  demandScore: number | null;
  paceScore: number | null;
  salesVelocityPct: number | null;
  totalUnits: number | null;
  soldUnits: number | null;
  constructionProgressPct: number | null;
  lastQprDate: string | null;
  reraPromiseDate: string | null;
  predictedDeliveryDate: string | null;
  predictedDelayMonths: number | null;
  paceVsScheduleMonths: number | null;
  chancesOfDelayPct: number | null;
  /* legal & compliance */
  legalScore: number | null;
  legalHeadline: string | null;
  legalKeyFlags: unknown;
  legalLastUpdated: string | null;
  locationLastUpdated: string | null;
  legalProjectCases: unknown;
  legalDeveloperCases: unknown;
  legalTopRisks: unknown;
  legalWhatThisMeans: unknown;
  legalBuyerChecks: unknown;
  /* The forensic legal read — backlog_project_data.legal_health, the single
     source of truth for the Legal pillar (headline, flags, risk_breakdown,
     case_entries w/ per-case source_url, sources, retrieval_date). Joined by id;
     the flattened legal_* view columns above are NOT read by the pillar. */
  legalHealth: unknown;
  /* location intelligence */
  locVerdict: string | null;
  locKeyStrengths: unknown;
  locPillarTag: string | null;
  locPlannedInfra: unknown;
  locSupplyCatalysts: unknown;
  locMarketStage: string | null;
  locGrowthDrivers: unknown;
  locRisks: unknown;
  locPoiDensity: unknown;
  locMetro: unknown;
  locAirport: unknown;
  locRoads: unknown;
  locBusiness: unknown;
  locLastMile: unknown;
  locConnStrengths: unknown;
  locConnConstraints: unknown;
  /* project USPs / X-factors */
  uspCards: unknown;
  uspConsultants: unknown;
  brandedStatus: string | null;
  brandedReasoning: string | null;
  ecosystemStatus: string | null;
  ecosystemName: string | null;
  ecosystemReasoning: string | null;
  /* ROI · risk · FAQ rollups */
  roiCostCr: number | null;
  roiExitYears: number | null;
  roiStdTimeline: number | null;
  roiCityCagr: number | null;
  roiIdealCagr: number | null;
  roiActualCagr: number | null;
  roiIdealProfit: number | null;
  roiAdjProfit: number | null;
  roiBleed: number | null;
  riskVerdictCleaned: string | null;
  riskNoActiveFlags: boolean | null;
  faqLocationScore: number | null;
  faqLocCatScores: unknown;
  faqLocStrength: string | null;
  faqLocGap: string | null;
  faqFinancialVerdict: string | null;
  /* corridor pricing — per-project average cost / sq ft from the view */
  avgCostSqft: number | null;
  /* project coordinates — power the map-led Location layout */
  latitude: number | null;
  longitude: number | null;
  geoProvenance: string | null; // build-time coordinate-trust audit: verified|consistent|approximate|suspect|none
  // ids of duplicate rows collapsed into this one (same slug) — so the
  // extended-details / configuration join can still find media & vitals that
  // were filed against the dropped row's id
  altIds?: string[];
};

/* The INTERNAL id: the slugified DB name. The DB name is the single source
   of truth (founder call) — no live-/sample- prefixes. Events, entitlements
   and the inferred brief are all keyed on this; the public URL is seoSlug()
   below. The
   old live-<slug> addresses render as redirect stubs in the [slug] route. */
export function liveSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* ── The public address of a report ──────────────────────────────
   The URL truthestate.in has been serving, and the one Google has
   indexed:

     /projects/gurugram-real-estate-dlf-the-arbour
               -golf-course-road-extension-gcre-sector-63

   name + microMarket + location, each slugified, behind a fixed prefix.
   Verified against every report URL in real traffic — 16 of 16 rebuilt
   exactly, and all 97 projects produce distinct keys with no collisions.

   It cannot be parsed back apart: the project name and the corridor run
   together with no delimiter, so "dlf-the-arbour-golf-course-road..."
   has no findable seam. Everything therefore maps FORWARD from the
   catalogue — build the address from the row, never read the row from
   the address — which is also why liveSlug stays the internal id for
   events, entitlements and the brief. Only the URL changes. */
export function seoSlug(name: string, microMarket: string | null, location: string | null): string {
  return [
    "gurugram-real-estate",
    liveSlug(name),
    liveSlug(microMarket ?? ""),
    liveSlug(location ?? ""),
  ].filter(Boolean).join("-");
}

// The whole tracked universe: no score gate, highest-scored first with any
// unscored rows last, and a cap well above the current corpus so every project
// in the view is returned (list + per-project pages).
const BACKLOG_QUERY = 'select=*&order="truthScore".desc.nullslast&limit=500';

export async function fetchBacklogFull(): Promise<LiveBacklogFull[] | null> {
  // Prefer the richest view (v3 adds developer rollups, financial metrics,
  // construction velocity, legal, location and ROI detail for the project
  // pages); fall back v3 → base so a missing view never blanks the catalog.
  // (There is no backlog_listing_public_v2 — it was superseded by v3; querying
  // it 404s, so it is not in the chain.)
  const rows =
    (await sbRows("backlog_listing_public_v3", BACKLOG_QUERY)) ??
    (await sbRows("backlog_listing_public", BACKLOG_QUERY));
  if (!rows) return null;
  // one-time shape record: the CI build log tells us the pipeline's true shapes
  if (DBG && rows[0]) console.log("[supabase] backlog sample:", JSON.stringify(rows[0]).slice(0, 2000));
  // per-row location presence: which live pages will surface the radar section
  if (DBG) {
    const yn = (v: unknown) => (v == null || v === "" ? "0" : "1");
    for (const r of rows) {
      const nm = s(r.name);
      if (!nm) continue;
      console.log(
        `[v3-loc] ${liveSlug(nm)} | geo:${yn(r.latitude)}${yn(r.longitude)} pois:${yn(r.location_hyperlocal_poi_density)} metro:${yn(r.location_connectivity_metro)} roads:${yn(r.location_connectivity_roads)} air:${yn(r.location_connectivity_airport)} biz:${yn(r.location_connectivity_business_districts)} infra:${yn(r.location_planned_infrastructure)} cat:${yn(r.location_upcoming_supply_catalysts)} verdict:${yn(r.location_overall_verdict_headline)}`,
      );
    }
  }
  /* QPR modules — construction_pace / sales_velocity (JSONB carrying
     expected_pct_at_qpr and the R2 proof PDFs) live in backlog_project_data,
     keyed by the same project id; the listing view only exposes the flattened
     numeric scores. Join them in so the construction & sales report reads the
     FILED expected-% and the proof links instead of a pace-vs-schedule estimate. */
  const bpdById = new Map<string, Row>();
  for (const b of (await sbRows("backlog_project_data", "select=id,construction_pace,sales_velocity,legal_health&limit=2000")) ?? []) {
    const id = s(b.id);
    if (id) bpdById.set(id, b);
  }
  /* OC/CC — the certificate lives INSIDE the `overrides` JSONB on
     backlog_project_data (keys delivered_oc_date / delivered_certificate_url),
     not as top-level columns. Fetched in its own query so it never touches the
     construction/sales join above. A project with delivered_oc_date set is
     delivered. */
  const ocById = new Map<string, OcInfo>();
  for (const b of (await sbRows("backlog_project_data", "select=id,overrides&limit=2000")) ?? []) {
    const id = s(b.id);
    if (id) ocById.set(id, ocFromOverrides(b.overrides));
  }
  const out: LiveBacklogFull[] = [];
  for (const r of rows) {
    /* Collapse internal runs of whitespace, not just the ends. One row
       reads "Birla Navya - Avik  (PHASE-2)" with a double space: HTML
       collapses it on the page, JSON does not, so the <h1> and the
       JSON-LD disagreed about the project's own name. Slugs are
       unaffected — liveSlug already collapses any run of non-alphanumerics
       to a single hyphen — so no URL moves. */
    const name = s(r.name)?.replace(/\s+/g, " ") ?? null;
    if (!name) continue;
    const bpd = bpdById.get(s(r.id) ?? "");
    const oc = ocById.get(s(r.id) ?? "");
    out.push({
      id: s(r.id) ?? liveSlug(name),
      slug: liveSlug(name),
      seoSlug: seoSlug(name, s(r.microMarket), s(r.location)),
      name,
      ...mapBacklogRowFields(r, bpd, oc),
    });
  }
  /* Two view rows can slugify to the same page (a duplicate/enriched pair, or
     two filings of one project). The detail page selects by slug with .find(),
     so a sparse duplicate can shadow the fully-populated row. Collapse per slug
     keeping the RICHEST row — scored on the signal columns that drive the
     report — so the page always renders the most-complete data. */
  const signal = (r: LiveBacklogFull): number => {
    const has = (v: unknown) => (v == null || v === "" ? 0 : 1);
    return (
      has(r.locPoiDensity) + has(r.locMetro) + has(r.locRoads) + has(r.latitude) +
      has(r.constructionProgressPct) + has(r.predictedDeliveryDate) + has(r.reraPromiseDate) +
      has(r.devTotal) + has(r.devDelivered) + has(r.roiIdealCagr) + has(r.legalHeadline) +
      has(r.modLegal) + has(r.totalUnits) + has(r.avgCostSqft) + has(r.salesVelocityPct) +
      has(r.uspCards) + has(r.legalProjectCases)
    );
  };
  const bySlug = new Map<string, LiveBacklogFull>();
  let collisions = 0;
  for (const r of out) {
    const prev = bySlug.get(r.slug);
    if (!prev) { bySlug.set(r.slug, r); continue; }
    collisions++;
    // keep the richer row; carry the loser's id (+ its aliases) so the
    // extended-details / config join still finds media filed against it
    const [keep, drop] = signal(r) >= signal(prev) ? [r, prev] : [prev, r];
    keep.altIds = [...new Set([...(keep.altIds ?? []), ...(drop.altIds ?? []), drop.id])];
    bySlug.set(r.slug, keep);
    if (DBG) console.log(`[dedupe] ${r.slug}: kept signal=${signal(keep)} (id ${keep.id}) · absorbed id ${drop.id} signal=${signal(drop)}`);
  }
  const deduped = out.length === bySlug.size ? out : [...bySlug.values()];
  if (collisions) console.log(`[dedupe] ${collisions} slug collision(s) resolved · ${out.length} → ${deduped.length} rows`);
  return deduped.length ? deduped : null;
}

/* ── corridor psf bands, computed from the live set ──
   Group every tracked project by its corridor (the same corridorKey the adapter
   resolves markets with) and take the 25th / 50th / 75th percentile of its real
   avg_cost_sqft. These replace the hand-set MARKETS reference bands for the
   value/luxury match signals and the report's psf strip — so "below the
   corridor" means below what the tracked projects actually sell for, and the
   bands self-update on every deploy. A corridor with fewer than MIN_FOR_LIVE
   priced projects is omitted; liveProjectIntel falls back to the curated MARKETS
   band there (too thin to trust a computed percentile). */
export type CorridorPsf = Record<string, { low: number; avg: number; high: number }>;

const MIN_FOR_LIVE = 4;
let corridorPsfCache: CorridorPsf | undefined;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/* "15,500 - 25,500" → [15500, 25500]. project_extended_details carries this
   filed rate band on 96 of 96 rows; it is the only per-PROJECT rate the
   pipeline publishes (avg_cost_sqft is per corridor). */
const parseFiledBand = (v: string | null): [number, number] | null => {
  const m = /(\d{4,6})\s*[^\d]{1,6}(\d{4,6})/.exec((v ?? "").replace(/,/g, ""));
  if (!m) return null;
  const lo = Number(m[1]), hi = Number(m[2]);
  return lo > 0 && hi >= lo ? [lo, hi] : null;
};

/* A BAND BUILT FROM ONE NUMBER IS NOT A BAND.
   This took percentiles of avg_cost_sqft, which the pipeline files as a
   single value per corridor — every project in Dwarka carries 18250. The
   25th, 50th and 75th percentiles of one repeated number are that number,
   so the band was a point, and the two tags that read it could not
   discriminate: `psf >= band.high` was true for all 97 projects and
   `psf < band.low` for none. Every report on the site was tagged "Luxury
   Lifestyle" and not one was tagged "Value Buying" on price.

   The projects' own filed rate bands DO vary, so the percentiles are taken
   over each project's mid-rate instead, and avg_cost_sqft is only the
   fallback for a corridor whose projects have filed nothing. */
export async function fetchCorridorPsf(): Promise<CorridorPsf> {
  if (corridorPsfCache !== undefined) return corridorPsfCache;
  const [rows, ext, nameIds] = await Promise.all([fetchBacklogFull(), fetchExtendedDetails(), fetchBacklogNameIds()]);
  const byKey: Record<string, number[]> = {};
  const fallback: Record<string, number[]> = {};
  for (const r of rows ?? []) {
    const key = corridorKey(r.microMarket ?? r.location ?? "");
    if (r.avgCostSqft != null && r.avgCostSqft > 0) (fallback[key] ??= []).push(r.avgCostSqft);
    const id = ext?.[r.id] ? r.id : (r.altIds ?? []).find((a) => ext?.[a]) ?? nameIds?.[r.name];
    const band = id && ext ? parseFiledBand(ext[id]?.priceRangeSqft ?? null) : null;
    if (band) (byKey[key] ??= []).push((band[0] + band[1]) / 2);
  }
  const out: CorridorPsf = {};
  for (const key of new Set([...Object.keys(byKey), ...Object.keys(fallback)])) {
    const arr = (byKey[key]?.length ?? 0) >= MIN_FOR_LIVE ? byKey[key] : fallback[key];
    if (!arr || arr.length < MIN_FOR_LIVE) continue;
    const sorted = [...arr].sort((a, b) => a - b);
    out[key] = {
      low: Math.round(percentile(sorted, 25)),
      avg: Math.round(percentile(sorted, 50)),
      high: Math.round(percentile(sorted, 75)),
    };
  }
  const spread = Object.entries(out).filter(([, b]) => b.high > b.low).length;
  console.log(`[supabase] corridor psf bands for ${Object.keys(out).length} corridor(s) · ${spread} with a real spread`);
  corridorPsfCache = out;
  return out;
}

/* ── the corridor's REAL spread, from what each project files ──
   avg_cost_sqft is one number per corridor — every project in Dwarka
   carries 18250 — so percentiles over it collapse to a point and cannot
   describe a range. project_extended_details.price_range_sqft is the
   per-project filed band ("15,500 - 25,500"), present on 96 of 96 rows,
   and it is what the corridor's low/high should be read from: Dwarka
   spans ₹11,000–37,000, not a single ₹18,250. Joined by project name
   through backlog_projects, the same bridge the report pages use. */
export type CorridorBand = { low: number; high: number; n: number };
let filedPsfCache: Record<string, CorridorBand> | undefined;

export async function fetchCorridorFiledPsf(): Promise<Record<string, CorridorBand>> {
  if (filedPsfCache !== undefined) return filedPsfCache;
  const [rows, ext, nameIds] = await Promise.all([fetchBacklogFull(), fetchExtendedDetails(), fetchBacklogNameIds()]);
  const out: Record<string, CorridorBand> = {};
  if (rows && ext) {
    for (const r of rows) {
      const id = ext[r.id] ? r.id : (r.altIds ?? []).find((a) => ext[a]) ?? nameIds?.[r.name];
      const band = id ? parseFiledBand(ext[id]?.priceRangeSqft ?? null) : null;
      if (!band) continue;
      const key = corridorKey(r.microMarket ?? r.location ?? "");
      const cur = out[key];
      out[key] = cur
        ? { low: Math.min(cur.low, band[0]), high: Math.max(cur.high, band[1]), n: cur.n + 1 }
        : { low: band[0], high: band[1], n: 1 };
    }
  }
  console.log(`[supabase] corridor filed-rate bands for ${Object.keys(out).length} corridor(s)`);
  return (filedPsfCache = out);
}

/* ── CAN THE LISTED PRICE BE TRUE? ────────────────────────────────
   A project files a rate band and a super-area band. The cheapest flat it
   can possibly sell is the lowest rate times the smallest unit, and the
   dearest is the highest times the largest. min_price_cr should sit inside
   that envelope. Seven of the eighty-five projects that file both do not,
   and one is not close:

     Delphine Central Park Estates Phase 2 lists ₹2.8 Cr against a filed
     ₹28,000–32,000/sqft and a smallest unit of 4,242 sqft. The cheapest
     flat that can exist there is ₹11.88 Cr. Its own Phase 1 and Phase 3
     file the same rate and list ₹10.5 Cr, so the ₹2.8 Cr is the number
     that is wrong, by a factor of four.

   That matters because min_price_cr is what the /best-projects/ price
   pages filter on, so the site was offering an ₹11.9 Cr project to someone
   who asked for something under ₹3 Cr — on a site whose entire claim is
   that the numbers are checked.

   This is a SAFETY NET, not a correction. It cannot tell which of the
   three figures is wrong, so it does not pretend to: it reports that they
   cannot all be true, and the price pages decline to make a claim they
   cannot stand behind. The project keeps its report and its place in the
   catalogue, where a reader sees every number and can judge. The real fix
   is upstream, in the pipeline. */
export type PriceEnvelope = { floorCr: number; ceilCr: number; listedCr: number; credible: boolean };

const parseAreaBand = (v: string | null): [number, number] | null => {
  const m = /(\d{3,6})\s*[^\d]{1,6}(\d{3,6})/.exec((v ?? "").replace(/,/g, ""));
  if (!m) return null;
  const lo = Number(m[1]), hi = Number(m[2]);
  return lo > 0 && hi >= lo ? [lo, hi] : null;
};

let envelopeCache: Record<string, PriceEnvelope> | undefined;

/* Keyed by the internal slug. A project that files no rate or no area band
   is ABSENT rather than false — twelve of them, and "we cannot check this"
   is not the same claim as "this is wrong". Callers treat absent as fine.
   The 5% tolerance is there because a listed price is usually the base and
   a filed rate often carries charges; without it, two projects a nickel
   outside their own envelope would be reported as contradictions. */
export async function fetchPriceEnvelopes(): Promise<Record<string, PriceEnvelope>> {
  if (envelopeCache !== undefined) return envelopeCache;
  const [rows, ext, nameIds] = await Promise.all([fetchBacklogFull(), fetchExtendedDetails(), fetchBacklogNameIds()]);
  const out: Record<string, PriceEnvelope> = {};
  for (const r of rows ?? []) {
    if (r.minPriceCr == null || r.minPriceCr <= 0) continue;
    const id = ext?.[r.id] ? r.id : (r.altIds ?? []).find((a) => ext?.[a]) ?? nameIds?.[r.name];
    const e = id ? ext?.[id] : undefined;
    const rate = parseFiledBand(e?.priceRangeSqft ?? null);
    const area = parseAreaBand(e?.superAreaRange ?? null);
    if (!rate || !area) continue;
    const floorCr = (rate[0] * area[0]) / 1e7;
    const ceilCr = (rate[1] * area[1]) / 1e7;
    out[r.slug] = {
      floorCr, ceilCr, listedCr: r.minPriceCr,
      credible: r.minPriceCr >= floorCr * 0.95 && r.minPriceCr <= ceilCr * 1.05,
    };
  }
  const bad = Object.entries(out).filter(([, v]) => !v.credible);
  console.log(`[supabase] price envelopes: ${Object.keys(out).length} checkable · ${bad.length} listed price(s) outside their own filed rate`);
  for (const [slug, v] of bad) {
    console.warn(`[supabase]   ${slug}: lists ₹${v.listedCr}Cr, filings allow ₹${v.floorCr.toFixed(2)}–${v.ceilCr.toFixed(2)}Cr`);
  }
  return (envelopeCache = out);
}

/* ── tracked-universe headline stats, computed from the live set ──
   Retires the hand-set "127 active projects / 6 micro-markets / ₹7K–38K"
   headline (and the site-wide ACTIVE_PROJECT_COUNT) to real numbers: the
   deduped scored universe, the corridors it actually spans, the psf span of the
   tracked projects, and a per-corridor breakdown. Self-updates every deploy. */
export type TrackedOverview = {
  activeProjects: number;
  microMarkets: number;
  psfMin: number | null;
  psfMax: number | null;
  byCorridor: Record<string, number>;
};

let trackedOverviewCache: TrackedOverview | null | undefined;

export async function fetchTrackedOverview(): Promise<TrackedOverview | null> {
  if (trackedOverviewCache !== undefined) return trackedOverviewCache;
  const rows = await fetchBacklogFull();
  if (!rows) return (trackedOverviewCache = null);
  const byCorridor: Record<string, number> = {};
  const psfs: number[] = [];
  for (const r of rows) {
    const key = corridorKey(r.microMarket ?? r.location ?? "");
    byCorridor[key] = (byCorridor[key] ?? 0) + 1;
    if (r.avgCostSqft != null && r.avgCostSqft > 0) psfs.push(r.avgCostSqft);
  }
  /* The headline said "Price range ₹13K–28K" off avg_cost_sqft — which is
     one number per corridor, so that was the range of eight CORRIDOR
     AVERAGES, not of what anything costs. The projects' own filed bands run
     ₹8K–₹48K, and the corridor pages beneath this line already print those.
     A headline narrower than every page under it is the headline that is
     wrong. Falls back to the averages if no band parsed. */
  const filed = Object.values(await fetchCorridorFiledPsf());
  trackedOverviewCache = {
    activeProjects: rows.length,
    microMarkets: Object.keys(byCorridor).length,
    psfMin: filed.length ? Math.min(...filed.map((b) => b.low)) : psfs.length ? Math.min(...psfs) : null,
    psfMax: filed.length ? Math.max(...filed.map((b) => b.high)) : psfs.length ? Math.max(...psfs) : null,
    byCorridor,
  };
  console.log(`[supabase] tracked overview: ${trackedOverviewCache.activeProjects} projects across ${trackedOverviewCache.microMarkets} corridor(s)`);
  return trackedOverviewCache;
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
  totalTowers: number | null;
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
      totalTowers: n(r.total_towers),
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
  // the project-name column differs between pipeline versions — probe candidates.
  // project_name is the current column; the others are kept only as fallbacks for
  // older/renamed pipelines, so the real one is tried FIRST and no 400 is fired on
  // the healthy path (backlog_projects has no `name` column).
  for (const col of ["project_name", "name", '"projectName"', "title"]) {
    const rows = await sbRows("backlog_projects", `select=id,${col}&limit=2000`);
    if (!rows) continue; // HTTP 400 = column doesn't exist; try the next one
    const key = col.replace(/"/g, "");
    const out: Record<string, string> = {};
    for (const r of rows) {
      const id = s(r.id), name = s(r[key]);
      if (id && name && !(name in out)) out[name] = id;
    }
    if (Object.keys(out).length) {
      console.log(`[supabase] backlog_projects name column → ${key}`);
      return out;
    }
  }
  return null;
}

/* ── per-BHK configurations — 1-to-many via backlog_id ── */

export type LiveConfiguration = {
  backlogId: string;
  bhkType: string | null;
  areaType: string | null;
  carpetArea: number | null;
  balconyArea: number | null;
  superArea: number | null;
  floorPlanImageUrl: string | null;
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
      floorPlanImageUrl: s(r.floor_plan_image_url),
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

/* ── the corridor file the pipeline actually keeps ──
   micro_market_data holds far more than the name we were reading off it:
   a corridor average rate, a scored potential out of 100 with its own
   breakdown, a five-year CAGR estimate with a stated confidence, a
   supply-pressure read, and the named growth drivers and risks behind
   both. The location pages were rendering hand-set numbers on top of all
   of it — Dwarka Expressway priced at ₹12,000/sq ft here while the same
   corridor's project reports quoted ₹18,250. Keyed by corridorKey so it
   lines up with the tracked set and the curated registry. */
export type LiveMarketIntel = {
  key: string; // corridorKey(name)
  slug: string;
  name: string;
  avgPsf: number | null;
  potential: number | null; // /100
  cagr5y: number | null; // expected_5yr_cagr_percent
  cagrConfidence: string | null;
  cagrBasis: string | null;
  supplyPressure: string | null;
  supplyReasoning: string | null;
  risks: string[];
  drivers: string[];
  notes: string | null;
  asOf: string | null;
};

const strList = (v: unknown, cap = 3): string[] =>
  Array.isArray(v) ? v.map((x) => s(x)).filter((x): x is string => !!x).slice(0, cap) : [];

let marketIntelCache: Record<string, LiveMarketIntel> | null | undefined;

export async function fetchMarketIntel(): Promise<Record<string, LiveMarketIntel> | null> {
  if (marketIntelCache !== undefined) return marketIntelCache;
  const rows = await sbRows("micro_market_data", "select=slug,name,avg_cost_sqft,mm_potential&limit=24");
  if (!rows) return (marketIntelCache = null);
  const out: Record<string, LiveMarketIntel> = {};
  for (const r of rows) {
    const slug = s(r.slug), name = s(r.name);
    if (!slug || !name) continue;
    const p = (j(r.mm_potential) ?? {}) as Record<string, unknown>;
    const growth = (p.growth_estimate ?? {}) as Record<string, unknown>;
    const analysis = (p.analysis ?? {}) as Record<string, unknown>;
    const sd = (analysis.supply_demand ?? {}) as Record<string, unknown>;
    const score = (p.score ?? {}) as Record<string, unknown>;
    out[corridorKey(name)] = {
      key: corridorKey(name),
      slug,
      name,
      avgPsf: n(r.avg_cost_sqft),
      potential: n(score.final_score),
      cagr5y: n(growth.expected_5yr_cagr_percent),
      cagrConfidence: s(growth.confidence),
      cagrBasis: s(growth.justification),
      supplyPressure: s(sd.supply_pressure),
      supplyReasoning: s(sd.reasoning),
      risks: strList(analysis.key_risks),
      drivers: strList(analysis.key_growth_drivers),
      notes: s(p.notes),
      asOf: s(p.retrieval_date),
    };
  }
  const keys = Object.keys(out);
  console.log(`[supabase] market intel → ${keys.length} corridor(s): ${keys.join(", ")}`);
  return (marketIntelCache = keys.length ? out : null);
}

/* ════════════════════════════════════════════════════════════════
   THE TRUTH SCORE'S OWN PILLARS

   The score is not a single number the pipeline hands down — it is built
   from seven weighted sub-pillars stored per project in
   backlog_project_data.expected_roi -> truth_score, each with its own
   score AND its own weight. This build was inventing the five pillars it
   displayed from a strong/moderate/weak lookup table while that
   breakdown sat unread, which is why the chart never composed to the
   headline it sat under.

   Seven become the five a buyer weighs, per the pipeline's own grouping:
   the developer's record and their balance sheet are one question, and
   build pace and absorption are another. `roi` carries weight 0 and is
   excluded — it feeds the ROI model, not the score.

   Weights come from the row rather than a constant here. They are
   (25, 22, 15, 26, 12) on all 97 today, but the pipeline treats them as
   configurable, so reading them keeps this honest if they ever move.
   ════════════════════════════════════════════════════════════════ */
export type LivePillarSet = Record<"developer" | "construction" | "location" | "legal" | "usps", { score: number; weight: number }>;

export async function fetchProjectPillars(): Promise<Record<string, LivePillarSet> | null> {
  const rows = await sbRows("backlog_project_data", "select=id,expected_roi&limit=2000");
  if (!rows) return null;
  const out: Record<string, LivePillarSet> = {};
  let skipped = 0;
  for (const r of rows) {
    const id = s(r.id);
    if (!id) continue;
    const set = computePillarSet(r.expected_roi); // shared with the live overlay (backlogRow.ts)
    if (set) out[id] = set;
    else skipped++;
  }
  console.log(`[supabase] truth-score pillars → ${Object.keys(out).length} projects (${skipped} without a usable breakdown)`);
  return out;
}

/* ════════════════════════════════════════════════════════════════
   DEVELOPER PROJECT LEDGER — every RERA project a developer has filed,
   grouped by developer, from the `projects` table (the source of truth
   for the track-record counts). The report reads it verbatim; the UI
   does display-only formatting. Keyed by a normalised developer name so
   projects.developer_name joins the report's developer field regardless
   of case / spacing / punctuation.
   ════════════════════════════════════════════════════════════════ */
export const devKey = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "");

export async function fetchDeveloperLedger(): Promise<Record<string, DevLedgerItem[]> | null> {
  const rows = await sbRows(
    "projects",
    "select=project_name,developer_name,location,type,status,oc_cc_available,actual_oc_date,is_delayed,delay_months&limit=2000",
  );
  if (!rows) return null;
  const yn = (v: unknown): boolean | null => (v == null ? null : String(v).trim().toLowerCase() === "yes");
  const out: Record<string, DevLedgerItem[]> = {};
  for (const r of rows) {
    const dev = s(r.developer_name);
    const name = s(r.project_name);
    if (!dev || !name) continue;
    (out[devKey(dev)] ??= []).push({
      name,
      location: s(r.location),
      type: s(r.type),
      status: s(r.status),
      ocDate: s(r.actual_oc_date),
      isDelayed: yn(r.is_delayed),
      delayMonths: n(r.delay_months),
    });
  }
  console.log(`[supabase] developer ledger → ${Object.keys(out).length} developers, ${rows.length} projects`);
  return out;
}

/* ── developer_health — the per-developer forensic financial read, keyed by
   developer_name. financial_health carries the analyst's per-metric 0–100
   scores (metric_scores) and the computed ratios (computed_metrics) behind the
   Financial-health meters. developers_overview.financial_band is a single
   rollup; THIS is the breakdown, so each meter reads its own real signal
   instead of one flat band applied to all five. */
export type DeveloperHealth = {
  name: string;
  financialScores: Record<string, number>; // metric_scores (0–100)
  financialValues: Record<string, number>; // computed_metrics (ratios)
  rawFinancials: Record<string, number>;   // raw_financials (absolute ₹ Cr figures) — the fallback when the analyst's 0–100 scores aren't saved yet
  financialOverall: number | null;         // overall_score
};

export async function fetchDeveloperHealth(): Promise<Record<string, DeveloperHealth> | null> {
  const rows = await sbRows("developer_health", "select=developer_name,financial_health&limit=200");
  if (!rows) return null;
  const numRec = (v: unknown): Record<string, number> => {
    const rec: Record<string, number> = {};
    const o = j(v);
    if (o && typeof o === "object" && !Array.isArray(o))
      for (const [k, val] of Object.entries(o as Record<string, unknown>)) {
        const num = typeof val === "number" ? val : typeof val === "string" ? parseFloat(val) : NaN;
        if (Number.isFinite(num)) rec[k] = num;
      }
    return rec;
  };
  const out: Record<string, DeveloperHealth> = {};
  for (const r of rows) {
    const name = s(r.developer_name);
    if (!name) continue;
    const fh = j(r.financial_health);
    const o = fh && typeof fh === "object" && !Array.isArray(fh) ? (fh as Record<string, unknown>) : {};
    out[devKey(name)] = {
      name,
      financialScores: numRec(o.metric_scores),
      financialValues: numRec(o.computed_metrics),
      rawFinancials: numRec(o.raw_financials),
      financialOverall: n(o.overall_score),
    };
  }
  console.log(`[supabase] developer health → ${Object.keys(out).length} developer(s)`);
  return Object.keys(out).length ? out : null;
}

/* ── project_intelligence_wire — the chronological forensic ground-events log ──
   PUBLISHED dispatches per project (regulatory filings, EPC milestones,
   institutional JVs, corridor infrastructure). Read-only, public: the table's
   RLS exposes only status='PUBLISHED' rows to the anon key; the query pins that
   too, so a DRAFT never leaks even if the policy is ever loosened. */
export type ProjectWireItem = {
  id: string;
  projectSlug: string;
  projectName: string;
  eventDate: string;
  category: "CONSTRUCTION" | "REGULATORY" | "INFRASTRUCTURE" | "CORPORATE_JV" | "LEGAL" | "PRICING";
  headline: string;
  verifiedFacts: string;
  forensicImpactType: "POSITIVE" | "NEUTRAL" | "CAUTION" | "RISK";
  forensicImpactSummary: string;
  sourceName: string;
  sourceUrl?: string | null;
  sourceDocumentRef?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";
  isPinned: boolean;
  displayOrder: number;
};

export async function fetchProjectWire(projectSlug?: string): Promise<ProjectWireItem[]> {
  const rows = await sbRows(
    "project_intelligence_wire",
    "select=*&status=eq.PUBLISHED&order=event_date.desc,display_order.asc&limit=1000",
  );
  if (!rows) return [];

  const items: ProjectWireItem[] = rows
    // The live query pins status=PUBLISHED, but a SNAPSHOT build reads a fixture
    // pulled with select=* (no status filter) — so enforce PUBLISHED here too, or
    // a DRAFT row would bake into the static HTML.
    .filter((r) => (s(r.status) ?? "DRAFT") === "PUBLISHED")
    .map((r) => ({
    id: String(r.id ?? ""),
    projectSlug: s(r.project_slug) ?? "",
    projectName: s(r.project_name) ?? "",
    eventDate: s(r.event_date) ?? "",
    category: (s(r.category) as ProjectWireItem["category"]) || "REGULATORY",
    headline: s(r.headline) ?? "",
    verifiedFacts: s(r.verified_facts) ?? "",
    forensicImpactType: (s(r.forensic_impact_type) as ProjectWireItem["forensicImpactType"]) || "NEUTRAL",
    forensicImpactSummary: s(r.forensic_impact_summary) ?? "",
    sourceName: s(r.source_name) ?? "",
    sourceUrl: s(r.source_url),
    sourceDocumentRef: s(r.source_document_ref),
    status: (s(r.status) as ProjectWireItem["status"]) || "PUBLISHED",
    isPinned: Boolean(r.is_pinned),
    displayOrder: n(r.display_order) ?? 0,
  }));

  if (!projectSlug) return items;
  /* Match the report's slug to the wire row's project_slug: exact, or either a
     sub-slug of the other (a row filed as "…-titanium-spr" still attaches to
     the full "gurugram-real-estate-…-titanium-spr-sector-71" report). Guard the
     containment against trivially short slugs so nothing over-matches. */
  const target = projectSlug.toLowerCase().trim();
  const targetTokens = target.split("-").filter(Boolean);
  const targetSet = new Set(targetTokens);
  return items.filter((it) => {
    const itSlug = it.projectSlug.toLowerCase().trim();
    if (!itSlug) return false;
    if (itSlug === target) return true;
    // contiguous sub-slug, either direction
    if (itSlug.length >= 8 && (target.includes(itSlug) || itSlug.includes(target))) return true;
    // token-subset: a wire slug can COMPRESS the report slug by dropping the
    // corridor segment — "…-titanium-spr-sector-71" vs the report's
    // "…-titanium-spr-southern-peripheral-road-spr-corridor-sector-71". Match
    // when every token of the shorter slug appears in the longer one, guarded
    // to ≥6 tokens so a generic short slug can't fan out across projects.
    const itTokens = itSlug.split("-").filter(Boolean);
    const [small, big] = itTokens.length <= targetTokens.length
      ? [itTokens, targetSet]
      : [targetTokens, new Set(itTokens)];
    return small.length >= 6 && small.every((t) => big.has(t));
  });
}
