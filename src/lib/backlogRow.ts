/* ════════════════════════════════════════════════════════════════
   BACKLOG ROW MAPPER — pure, browser-safe (shared build ⇄ runtime).

   The single source of truth for turning a raw backlog_listing_public_v3
   row (+ its backlog_project_data join: construction/sales/legal_health,
   the OC overrides, and the Truth-Score pillar breakdown) into the
   LiveBacklogFull the report reads.

   Extracted from supabase.ts so BOTH places use ONE mapper:
     · the build (supabase.ts fetchBacklogFull / fetchProjectPillars), and
     · the browser (supabaseBrowser.ts fetchBacklogRowLive — the live overlay
       that refreshes the WHOLE report on the next page view).
   A second copy would silently drift the moment the pipeline adds a column,
   so the live view would lag the baked one — exactly the bug this avoids.

   Node-free ON PURPOSE: imports only the TYPE from supabase.ts (erased at
   compile), never its runtime (whose fixture path pulls in `fs`). The
   identity fields (id / slug / seoSlug / name) stay with the caller, which
   owns the slug helpers — so this module needs none of them.
   ════════════════════════════════════════════════════════════════ */

import type { LiveBacklogFull, LivePillarSet } from "./supabase";

type Row = Record<string, unknown>;

/* the same soft readers supabase.ts uses on the way in */
const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
/* jsonb columns can surface as STRINGS depending on the view/driver — parse
   anything that looks like JSON so downstream readers see real structures */
const j = (v: unknown): unknown => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t || (t[0] !== "{" && t[0] !== "[" && t[0] !== '"')) return v;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return v;
  }
};
const n = (v: unknown): number | null => {
  const x = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(x) ? x : null;
};

export type OcInfo = { ocDate: string | null; ocUrl: string | null; maxTowers: number | null };

/* OC/CC lives INSIDE the `overrides` JSONB on backlog_project_data
   (delivered_oc_date / delivered_certificate_url / max_towers), not as
   top-level columns. A project with delivered_oc_date set is delivered. */
export function ocFromOverrides(overrides: unknown): OcInfo {
  const o = j(overrides);
  const ovr: Record<string, unknown> = o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : {};
  return {
    ocDate: s(ovr.delivered_oc_date),
    ocUrl: s(ovr.delivered_certificate_url),
    maxTowers: n(ovr.max_towers),
  };
}

/* Truth-Score pillar breakdown ← backlog_project_data.expected_roi.truth_score
   .pillars, composed into the five report groups. A group with no weight, or a
   set missing one of the five, falls back (null) rather than compose to
   something other than the headline. */
const PILLAR_GROUPS: Record<keyof LivePillarSet, string[]> = {
  developer: ["past_record", "developer_financial"],
  construction: ["construction_pace", "demand"],
  location: ["location"],
  legal: ["legal"],
  usps: ["x_factors"],
};
export function computePillarSet(expectedRoi: unknown): LivePillarSet | null {
  const roi = j(expectedRoi) as { truth_score?: { pillars?: unknown } } | null;
  const raw = roi?.truth_score?.pillars;
  if (!Array.isArray(raw)) return null;
  const byKey = new Map<string, { score: number; weight: number }>();
  for (const p of raw as { key?: unknown; score?: unknown; weight?: unknown }[]) {
    const k = s(p.key);
    const sc = n(p.score);
    const w = n(p.weight);
    if (k && sc != null && w != null) byKey.set(k, { score: sc, weight: w });
  }
  const set = {} as LivePillarSet;
  for (const [group, keys] of Object.entries(PILLAR_GROUPS) as [keyof LivePillarSet, string[]][]) {
    const members = keys.map((k) => byKey.get(k)).filter(Boolean) as { score: number; weight: number }[];
    const weight = members.reduce((t, m) => t + m.weight, 0);
    if (!members.length || weight <= 0) return null;
    set[group] = { score: members.reduce((t, m) => t + m.score * m.weight, 0) / weight, weight };
  }
  return set;
}

/* Every LiveBacklogFull field EXCEPT the identity four (id / slug / seoSlug /
   name), which the caller sets from its own slug helpers. `r` is the v3 row;
   `bpd` its backlog_project_data join (construction/sales/legal_health); `oc`
   the parsed overrides. */
export type BacklogRowFields = Omit<LiveBacklogFull, "id" | "slug" | "seoSlug" | "name">;
export function mapBacklogRowFields(r: Row, bpd: Row | null | undefined, oc: OcInfo | null | undefined): BacklogRowFields {
  return {
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
    modConstruction: j(bpd?.construction_pace),
    modSales: j(bpd?.sales_velocity),
    legalHealth: j(bpd?.legal_health),
    deliveredOcDate: oc?.ocDate ?? null,
    deliveredCertificateUrl: oc?.ocUrl ?? null,
    maxTowers: oc?.maxTowers ?? null,
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
    devFinancialScore: n(r.developer_financial_score),
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
    locationLastUpdated: s(r.location_last_updated_date),
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
    geoProvenance: s(r.geo_provenance),
  };
}
