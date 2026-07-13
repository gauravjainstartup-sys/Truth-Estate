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
  /* extended vitals — present on backlog_listing_public_v2; null on the base view */
  reraId: string | null;
  reraUrl: string | null;
  densityAptPerAcre: number | null;
  openAreaPct: number | null;
  landAcres: number | null;
  /* module payloads — shapes owned by the pipeline */
  modConstruction: unknown;
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
  legalProjectCases: unknown;
  legalDeveloperCases: unknown;
  legalTopRisks: unknown;
  legalWhatThisMeans: unknown;
  legalBuyerChecks: unknown;
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
  // ids of duplicate rows collapsed into this one (same slug) — so the
  // extended-details / configuration join can still find media & vitals that
  // were filed against the dropped row's id
  altIds?: string[];
};

/* THE project URL: /intelligence/projects/<slugified DB name>. The DB name is
   the single source of truth (founder call) — no live-/sample- prefixes. The
   old live-<slug> addresses render as redirect stubs in the [slug] route. */
export function liveSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// The whole tracked universe: no score gate, highest-scored first with any
// unscored rows last, and a cap well above the current corpus so every project
// in the view is returned (list + per-project pages).
const BACKLOG_QUERY = 'select=*&order="truthScore".desc.nullslast&limit=500';

export async function fetchBacklogFull(): Promise<LiveBacklogFull[] | null> {
  // Prefer the richest view (v3 adds developer rollups, financial metrics,
  // construction velocity, legal, location and ROI detail for the project
  // pages); fall back v3 → v2 → base so a missing view never blanks the catalog.
  const rows =
    (await sbRows("backlog_listing_public_v3", BACKLOG_QUERY)) ??
    (await sbRows("backlog_listing_public_v2", BACKLOG_QUERY)) ??
    (await sbRows("backlog_listing_public", BACKLOG_QUERY));
  if (!rows) return null;
  // one-time shape record: the CI build log tells us the pipeline's true shapes
  if (rows[0]) console.log("[supabase] backlog sample:", JSON.stringify(rows[0]).slice(0, 2000));
  // per-row location presence: which live pages will surface the radar section
  {
    const yn = (v: unknown) => (v == null || v === "" ? "0" : "1");
    for (const r of rows) {
      const nm = s(r.name);
      if (!nm) continue;
      console.log(
        `[v3-loc] ${liveSlug(nm)} | geo:${yn(r.latitude)}${yn(r.longitude)} pois:${yn(r.location_hyperlocal_poi_density)} metro:${yn(r.location_connectivity_metro)} roads:${yn(r.location_connectivity_roads)} air:${yn(r.location_connectivity_airport)} biz:${yn(r.location_connectivity_business_districts)} infra:${yn(r.location_planned_infrastructure)} cat:${yn(r.location_upcoming_supply_catalysts)} verdict:${yn(r.location_overall_verdict_headline)}`,
      );
    }
  }
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
      reraId: s(r.rera_id),
      reraUrl: s(r.rera_url),
      densityAptPerAcre: n(r.density_apt_per_acre),
      openAreaPct: n(r.open_area_pct),
      landAcres: n(r.land_acres),
      modConstruction: j(r.construction_pace),
      modTrackRecord: j(r.developer_track_record),
      modLegal: j(r.legal_risks),
      modFinancial: j(r.financial_subscores),
      modRuleVerdict: j(r.rule_verdict),
      modRiskIntel: j(r.risk_intelligence),
      modRiskVerdict: j(r.risk_verdict),
      /* v3 rollups — null wherever an older view served the row */
      devSlug: s(r.developer_slug),
      devTotal: n(r.developer_total_projects),
      devDelivered: n(r.developer_delivered_projects),
      devOngoing: n(r.developer_ongoing_projects),
      devLapsed: n(r.developer_lapsed_projects),
      devDelayedPct: n(r.developer_delayed_pct),
      devAvgDelayMonths: n(r.developer_avg_delay_months),
      devFinancialBand: s(r.developer_financial_band),
      devLegalBand: s(r.developer_legal_band),
      devLegalScore: n(r.developer_legal_score),
      companyType: s(r.company_type_badge),
      finLeverage: n(r.net_debt_to_equity),
      finCoverage: n(r.interest_coverage_ratio),
      finCash: n(r.ocf_to_ebitda),
      finMargin: n(r.ebitda_margin),
      finInventory: n(r.inventory_to_sales_years),
      finMetricScores: j(r.metric_scores),
      sectionTag: s(r.overall_section_tag),
      demandScore: n(r.demand_sales_score),
      paceScore: n(r.construction_pace_score),
      salesVelocityPct: n(r.sales_velocity_pct),
      totalUnits: n(r.total_units),
      soldUnits: n(r.sold_units),
      constructionProgressPct: n(r.construction_progress_pct),
      lastQprDate: s(r.last_updated_qpr_date),
      reraPromiseDate: s(r.rera_promise_date),
      predictedDeliveryDate: s(r.predicted_delivery_date),
      predictedDelayMonths: n(r.predicted_delay_months),
      paceVsScheduleMonths: n(r.pace_vs_schedule_months),
      chancesOfDelayPct: n(r.chances_of_delay_pct),
      legalScore: n(r.legal_score),
      legalHeadline: s(r.legal_assessment_headline),
      legalKeyFlags: j(r.legal_key_flags),
      legalLastUpdated: s(r.legal_last_updated_date),
      legalProjectCases: j(r.legal_project_litigation_cases),
      legalDeveloperCases: j(r.legal_developer_litigation_cases),
      legalTopRisks: j(r.legal_top_risks),
      legalWhatThisMeans: j(r.legal_what_this_means),
      legalBuyerChecks: j(r.legal_buyer_checks),
      locVerdict: s(r.location_overall_verdict_headline),
      locKeyStrengths: j(r.location_key_strengths),
      locPillarTag: s(r.location_score_pillar_tag),
      locPlannedInfra: j(r.location_planned_infrastructure),
      locSupplyCatalysts: j(r.location_upcoming_supply_catalysts),
      locMarketStage: s(r.location_market_stage_insight),
      locGrowthDrivers: j(r.location_growth_drivers),
      locRisks: j(r.location_vulnerabilities_risks),
      locPoiDensity: j(r.location_hyperlocal_poi_density),
      locMetro: j(r.location_connectivity_metro),
      locAirport: j(r.location_connectivity_airport),
      locRoads: j(r.location_connectivity_roads),
      locBusiness: j(r.location_connectivity_business_districts),
      locLastMile: j(r.location_last_mile_access_audit),
      locConnStrengths: j(r.location_connectivity_strengths),
      locConnConstraints: j(r.location_connectivity_constraints),
      uspCards: j(r.x_factor_usp_cards),
      uspConsultants: j(r.x_factor_consultants),
      brandedStatus: s(r.x_factor_branded_status),
      brandedReasoning: s(r.x_factor_branded_reasoning),
      ecosystemStatus: s(r.x_factor_ecosystem_status),
      ecosystemName: s(r.x_factor_ecosystem_name),
      ecosystemReasoning: s(r.x_factor_ecosystem_reasoning),
      roiCostCr: n(r.roi_property_cost_cr),
      roiExitYears: n(r.roi_exit_years_default),
      roiStdTimeline: n(r.roi_standard_timeline_years),
      roiCityCagr: n(r.roi_city_cagr),
      roiIdealCagr: n(r.roi_ideal_cagr),
      roiActualCagr: n(r.roi_actual_cagr),
      roiIdealProfit: n(r.roi_ideal_projected_profit),
      roiAdjProfit: n(r.roi_adjusted_projected_profit),
      roiBleed: n(r.roi_opportunity_bleed),
      riskVerdictCleaned: s(r.risk_verdict_cleaned),
      riskNoActiveFlags: typeof r.risk_no_active_flags === "boolean" ? r.risk_no_active_flags : null,
      faqLocationScore: n(r.faq_location_score),
      faqLocCatScores: j(r.faq_location_category_scores),
      faqLocStrength: s(r.faq_location_primary_strength),
      faqLocGap: s(r.faq_location_primary_gap),
      faqFinancialVerdict: s(r.faq_financial_verdict),
      avgCostSqft: n(r.avg_cost_sqft),
      latitude: n(r.latitude),
      longitude: n(r.longitude),
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
    console.log(`[dedupe] ${r.slug}: kept signal=${signal(keep)} (id ${keep.id}) · absorbed id ${drop.id} signal=${signal(drop)}`);
  }
  const deduped = out.length === bySlug.size ? out : [...bySlug.values()];
  if (collisions) console.log(`[dedupe] ${collisions} slug collision(s) resolved · ${out.length} → ${deduped.length} rows`);
  return deduped.length ? deduped : null;
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
  // the project-name column differs between pipeline versions — probe candidates
  for (const col of ["name", "project_name", '"projectName"', "title"]) {
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
