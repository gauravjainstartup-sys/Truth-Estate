/* ════════════════════════════════════════════════════════════════
   LIVE → REPORT ADAPTER — maps a scored pipeline row onto the
   existing ProjectIntel shape so live projects render through the
   ORIGINAL Project Report UI, untouched. Fields the pipeline hasn't
   extracted yet become "NA" (or stay absent so the report's own
   hide-when-missing behaviour applies). Pure data — no UI here.

   Working agreement: during DB integration we never add or restyle
   UI components; the data adapts to the UI, not the other way round.
   ════════════════════════════════════════════════════════════════ */

import type { LiveBacklogFull, LiveConfiguration, LiveExtendedDetails } from "./supabase";
import { MARKETS } from "./markets";
import type { DeveloperIntel, FinKey, FinRating, LegalCase } from "./developers";
import { developerSlugOf, type ProjectIntel, type ProjectOps, type RoiModel, type ScoreInputKey } from "./projects";
import mediaManifest from "./live-media.manifest.json";

/* Media now arrives as Supabase Storage URLs, which pass straight through.
   The manifest only covers any LEGACY base64 rows — decoded to real files
   before the build (scripts/materialize-media.mjs) — and is empty once every
   row has migrated. When present, a materialized path is preferred. */
const MANIFEST = mediaManifest as Record<string, Partial<Record<string, string>>> & { __urls?: Record<string, string> };
/* remote URL → same-origin materialized path (floor plans, brochure pages);
   unmapped URLs pass through untouched */
const viaUrls = (s: string): string => MANIFEST.__urls?.[s] ?? s;

/* Per-project media/config/parse records are handy for debugging one project
   but fire ~90× during static export and bury the prebuild's egress numbers
   past the CI log-tail cap. Off by default (BUILD_DEBUG=1 restores them); an
   actual media leak still logs as a warning regardless. */
const DBG = process.env.BUILD_DEBUG === "1";

/* tiny defensive readers over the pipeline-owned JSON payloads */
const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
function pick(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const key of path.split(".")) {
    const o = obj(cur);
    if (!o || !(key in o)) return undefined;
    cur = o[key];
  }
  return cur;
}
const textAt = (root: unknown, path: string): string | null => {
  const v = pick(root, path);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const numAt = (root: unknown, path: string): number | null => {
  const v = pick(root, path);
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};
const listAt = (root: unknown, path: string): string[] => {
  const v = pick(root, path);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];
};

/* ── v3 payload readers — the view emits jsonb whose inner keys the
   pipeline owns; read by alias, never assume, drop what doesn't parse ── */
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
/* an array that may hold strings OR objects carrying the text under a known key */
function strList(v: unknown, keys: string[] = ["text", "title", "name", "risk", "point"]): string[] {
  const out: string[] = [];
  for (const it of asArr(v)) {
    if (typeof it === "string" && it.trim()) out.push(it.trim());
    else {
      const o = obj(it);
      if (o) for (const k of keys) { const t = typeof o[k] === "string" && (o[k] as string).trim(); if (t) { out.push(t as string); break; } }
    }
  }
  return out;
}
const tIn = (o: unknown, keys: string[]): string | null => {
  const r = obj(o); if (!r) return null;
  for (const k of keys) { const v = r[k]; if (typeof v === "string" && v.trim()) return v.trim(); if (typeof v === "number" && Number.isFinite(v)) return String(v); }
  return null;
};
const nIn = (o: unknown, keys: string[]): number | null => {
  const r = obj(o); if (!r) return null;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") { const x = parseFloat(v); if (Number.isFinite(x)) return x; }
  }
  return null;
};
const kmLabel = (o: unknown): string | null => {
  const km = nIn(o, ["distance_km", "dist_km", "km", "distance"]);
  if (km != null) return `${Math.round(km * 10) / 10} km`;
  return tIn(o, ["distance", "dist"]);
};
const minLabel = (o: unknown): string | null => {
  const min = nIn(o, ["time_min", "travel_time_min", "minutes", "min", "drive_time_min"]);
  if (min != null) return `${Math.round(min)} min`;
  return tIn(o, ["time", "travel_time"]);
};

/* pipeline dates arrive as "2027-06-30", "30/06/2027", "Jun 2027", "30 Jun 2027" … */
const MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseAnyDate(sv: string | null): { y: number; m: number } | null {
  if (!sv) return null;
  const t = sv.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);                    // 2027-06-30
  if (m) return { y: +m[1], m: +m[2] - 1 };
  m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);                       // 30/06/2027
  if (m) return { y: +m[3], m: +m[2] - 1 };
  m = t.match(/([A-Za-z]{3,9})\s+(\d{4})/);                                // Jun 2027 / 30 Jun 2027
  if (m) { const mi = MON3.findIndex((x) => m![1].toLowerCase().startsWith(x.toLowerCase())); if (mi >= 0) return { y: +m[2], m: mi }; }
  return null;
}
const monthLabel = (sv: string | null): string | null => {
  const d = parseAnyDate(sv);
  return d ? `${MON3[d.m]} ${d.y}` : sv; // an unparseable date still reads as text
};
const quarterLabel = (sv: string | null): string | null => {
  const d = parseAnyDate(sv);
  return d ? `Q${Math.floor(d.m / 3) + 1} ${d.y}` : null;
};
const monthsBetween = (a: string | null, b: string | null): number | null => {
  const da = parseAnyDate(a), db = parseAnyDate(b);
  return da && db ? (db.y - da.y) * 12 + (db.m - da.m) : null;
};

/* financial-metric ratings from the audited values (same thresholds the
   flagship registry was graded on; conservative middles) */
const FIN_THRESHOLDS: Record<FinKey, (v: number) => FinRating> = {
  leverage:  (v) => (v <= 0.5 ? "strong" : v <= 1.2 ? "moderate" : "weak"),
  coverage:  (v) => (v >= 4 ? "strong" : v >= 2 ? "moderate" : "weak"),
  cash:      (v) => (v >= 0.8 ? "strong" : v >= 0.4 ? "moderate" : "weak"),
  margin:    (v) => (v >= 20 ? "strong" : v >= 12 ? "moderate" : "weak"),
  inventory: (v) => (v <= 2 ? "strong" : v <= 4 ? "moderate" : "weak"),
};
const FIN_TOP: Record<FinKey, (v: number) => boolean> = {
  leverage: (v) => v <= 0.2, coverage: (v) => v >= 8, cash: (v) => v >= 1,
  margin: (v) => v >= 30, inventory: (v) => v <= 1.2,
};
const FIN_FMT: Record<FinKey, (v: number) => string> = {
  leverage: (v) => `${Math.round(v * 100) / 100}×`,
  coverage: (v) => `${Math.round(v * 10) / 10}×`,
  cash: (v) => `${Math.round(v * 100) / 100}×`,
  margin: (v) => `${Math.round(v * 10) / 10}%`,
  inventory: (v) => `${Math.round(v * 10) / 10} yrs`,
};

/* pipeline bands (strong / good / moderate / weak) → the report's
   three-level rating vocabulary. "good" maps to the conservative
   middle — we'd rather under-claim than over-promise. */
function bandRating(b: string | null): FinRating | null {
  if (!b) return null;
  if (/strong|exceptional|excellent/i.test(b)) return "strong";
  if (/weak|watch|poor/i.test(b)) return "weak";
  return "moderate";
}
const riskRating = (r: string | null): FinRating | null =>
  !r ? null : /low/i.test(r) ? "strong" : /high/i.test(r) ? "weak" : "moderate";

const dedupe = (xs: string[]): string[] => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

/* Media columns now hold a Supabase Storage PUBLIC URL — the founder's
   current upload path, e.g.
     https://<ref>.supabase.co/storage/v1/object/public/project_assets/general/<file>
   Older rows may still carry a data: URI or RAW base64. Everything must
   resolve to something an <img> can render — PDFs and unknown binaries keep
   the slot in its request/hidden state. Raw base64 is sniffed by magic
   prefix and wrapped as a data: URI. */
const imageish = (u: string): boolean => /\.(webp|jpe?g|png|avif|gif)(\?.*)?$/i.test(u);
const isHttpUrl = (u: string): boolean => /^https?:\/\//i.test(u);
const isPdfUrl = (u: string): boolean => /\.pdf(\?.*)?$/i.test(u);
const B64_MAGIC: [RegExp, string][] = [
  [/^\/9j\//, "jpeg"],   // JPEG
  [/^iVBOR/, "png"],     // PNG
  [/^UklGR/, "webp"],    // WebP (RIFF)
  [/^R0lGOD/, "gif"],    // GIF
];
function mediaSrc(u: string | null | undefined): string | null {
  if (!u) return null;
  const s = viaUrls(u.trim());
  if (/^data:image\//i.test(s)) return s;
  if (/^data:/i.test(s)) return null; // pdf / other — no image slot for these yet
  if (s.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(s)) {
    if (/^JVBERi/.test(s)) return null; // base64 PDF
    for (const [re, type] of B64_MAGIC) if (re.test(s)) return `data:image/${type};base64,${s.replace(/\s+/g, "")}`;
    return null; // unknown binary — don't guess
  }
  // A bare http(s) URL reaching here means materialization was skipped —
  // viaUrls already remapped anything pulled same-origin. NEVER hand the
  // browser a raw Storage image: an inline <img> to Storage is cached egress
  // on every page view. Return null so the component renders its stand-in
  // (founder rule: missing data hides, it never leaks). PDFs are unaffected —
  // pdfSrc links them, and an over-cap brochure's click-gated Storage link is
  // intentional (paid only when a reader actually opens it).
  if (isHttpUrl(s)) return null;
  // A relative/materialized path — keep the extension gate.
  return imageish(s) ? s : null;
}

/* PDFs can't render in the report's <img> slots, but they CAN be
   linked. Accepts a .pdf URL, a data:application/pdf URI or raw
   base64 (JVBERi = "%PDF"); inline payloads are capped so a heavy
   file can't bloat the static page. */
const PDF_INLINE_CAP = 2_000_000; // ~1.5 MB decoded
function pdfSrc(u: string | null | undefined): string | null {
  if (!u) return null;
  const s = viaUrls(u.trim());
  if (/^data:application\/pdf/i.test(s)) return s.length <= PDF_INLINE_CAP ? s : null;
  if (/^JVBERi/.test(s) && /^[A-Za-z0-9+/=\r\n]+$/.test(s))
    return s.length <= PDF_INLINE_CAP ? `data:application/pdf;base64,${s.replace(/\s+/g, "")}` : null;
  // A Storage/CDN URL (or relative path) that ends in .pdf — link it as-is.
  if ((isHttpUrl(s) || /^[\w./-]+$/.test(s)) && isPdfUrl(s)) return s;
  return null;
}

/* a brochure column may hold several page images — JSON array or a
   comma/newline separated list — feeding the report's page-turner */
function mediaPages(u: string | null | undefined): string[] | null {
  if (!u) return null;
  const s = u.trim();
  let parts: string[] = [];
  if (s.startsWith("[")) {
    try { const j: unknown = JSON.parse(s); if (Array.isArray(j)) parts = j.filter((x): x is string => typeof x === "string"); } catch { /* fall through */ }
  } else if (!/^data:/i.test(s) && /[,\n]/.test(s) && !/^[A-Za-z0-9+/=\r\n]+$/.test(s)) {
    // a plain-text list of URLs/paths — comma OR newline separated. (A base64
    // blob, even multi-line, is excluded by the pure-base64 guard above.)
    parts = s.split(/[,\n]+/);
  }
  const pages = parts.map((p) => mediaSrc(viaUrls(p.trim()))).filter((p): p is string => !!p);
  return pages.length ? pages : null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function heroDateLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/* "₹17,000–19,500" / "17000-19500" / "₹17k–19.5k" → [17000, 19500] */
function psfRange(s: string | null): [number, number] | null {
  if (!s) return null;
  const nums = (s.match(/\d+(?:[.,]\d+)?\s*k?/gi) ?? []).map((t) => {
    const k = /k\s*$/i.test(t);
    const v = parseFloat(t.replace(/,/g, "").replace(/k/i, ""));
    return k || v < 100 ? v * 1000 : v;
  }).filter((v) => Number.isFinite(v) && v > 0);
  if (nums.length < 2) return null;
  const lo = Math.min(nums[0], nums[1]), hi = Math.max(nums[0], nums[1]);
  return lo > 0 && hi >= lo ? [lo, hi] : null;
}

const normBhk = (s: string): string => s.replace(/(\d(?:\.\d)?)\s*BHK/i, "$1 BHK").trim();

export function liveProjectIntel(
  row: LiveBacklogFull,
  extRaw?: LiveExtendedDetails | null,
  cfgs?: LiveConfiguration[] | null,
): ProjectIntel {
  /* prefer materialized files over inline blobs */
  const mm = extRaw ? MANIFEST[extRaw.backlogId] : undefined;
  const ext: LiveExtendedDetails | null | undefined = extRaw && mm
    ? {
        ...extRaw,
        heroImageUrl: mm.hero_image_url ?? extRaw.heroImageUrl,
        brochureUrl: mm.brochure_url ?? extRaw.brochureUrl,
        paymentPlanUrl: mm.payment_plan_url ?? extRaw.paymentPlanUrl,
        siteMapImageUrl: mm.site_map_image_url ?? extRaw.siteMapImageUrl,
        // render feeds the brochure-vs-site slider directly: only a
        // materialized same-origin file is safe — a raw value that failed
        // materialization (dead URL, oversized, odd format) would ship a
        // broken <img>; absent means the branded stand-in renders instead
        renderElevationUrl: mm.render_elevation_url ?? null,
      }
    : extRaw;
  const ruleV = row.modRuleVerdict;
  const riskI = row.modRiskIntel;
  const fin = row.modFinancial;

  /* the pipeline packs signal into its caption strings — parse, don't drop */
  const um = row.insight?.match(/(\d+)\s*\/\s*(\d+)\s*units sold/i) ?? null;
  const totalUnits = um ? Number(um[2]) : null;
  const absorptionPct = um && Number(um[2]) > 0 ? Math.round((Number(um[1]) / Number(um[2])) * 100) : null;

  const recoMatch = row.insight?.match(/^\s*([A-Za-z][A-Za-z ]{2,22}?)\s+project\b/i);
  const recommendation = recoMatch ? recoMatch[1].trim() : "Under Review";

  const delayPct = row.chancesOfDelayPct ?? row.delayChancePct;
  /* Confidence = audit coverage: how many of the 17 pipeline-audited inputs
     are actually on file for this row (the same fields the dedupe's signal()
     weighs in supabase.ts). Delivery risk is NOT confidence — it has its own
     home in the Construction section's delay ring. */
  const auditInputs = [
    row.locPoiDensity, row.locMetro, row.locRoads, row.latitude,
    row.constructionProgressPct, row.predictedDeliveryDate, row.reraPromiseDate,
    row.devTotal, row.devDelivered, row.roiIdealCagr, row.legalHeadline,
    row.modLegal, row.totalUnits, row.avgCostSqft, row.salesVelocityPct,
    row.uspCards, row.legalProjectCases,
  ];
  const coverage = auditInputs.reduce((n: number, v) => n + (v == null || v === "" ? 0 : 1), 0);
  const confidence = coverage === 0 ? "Provisional" : coverage >= 13 ? "High" : coverage >= 8 ? "Medium" : "Low";

  /* six audited inputs, derived from real pipeline signals only;
     no signal → the neutral middle (the honest NA of a 3-level scale) */
  const bands = {
    legal: textAt(ruleV, "pillar_bands.legal"),
    developer: textAt(ruleV, "pillar_bands.developer"),
    location: textAt(ruleV, "pillar_bands.location"),
    roi: textAt(ruleV, "pillar_bands.roi"),
    fundamentals: textAt(ruleV, "pillar_bands.fundamentals"),
  };
  const subs = ["ebitda_margin", "ocf_to_ebitda", "net_debt_to_equity", "interest_coverage_ratio", "inventory_to_sales_years"]
    .map((k) => numAt(fin, k))
    .filter((v): v is number => v != null);
  const subsAvg = subs.length ? subs.reduce((a, b) => a + b, 0) / subs.length : null;
  const pace = row.paceVsScheduleMonths ?? row.constructionPaceNum;

  /* v3 audited metric values → per-metric ratings (preferred over module JSON) */
  const finVals: Partial<Record<FinKey, number>> = {};
  if (row.finLeverage != null) finVals.leverage = row.finLeverage;
  if (row.finCoverage != null) finVals.coverage = row.finCoverage;
  if (row.finCash != null) finVals.cash = row.finCash;
  if (row.finMargin != null) finVals.margin = row.finMargin;
  if (row.finInventory != null) finVals.inventory = row.finInventory;
  const finKeys = Object.keys(finVals) as FinKey[];
  const finRatings: Partial<Record<FinKey, FinRating>> = {};
  for (const k of finKeys) finRatings[k] = FIN_THRESHOLDS[k](finVals[k]!);
  const finAvg = finKeys.length
    ? finKeys.reduce((a, k) => a + (finRatings[k] === "strong" ? 3 : finRatings[k] === "moderate" ? 2 : 1), 0) / finKeys.length
    : null;
  const finRatingOverall: FinRating | null =
    finAvg != null && finKeys.length >= 2 ? (finAvg >= 2.6 ? "strong" : finAvg >= 1.9 ? "moderate" : "weak") : null;

  const velocityPct =
    row.salesVelocityPct ??
    (row.soldUnits != null && (row.totalUnits ?? 0) > 0 ? Math.round((row.soldUnits / row.totalUnits!) * 1000) / 10 : null) ??
    absorptionPct;
  const legalRatingV3: FinRating | null =
    row.legalScore != null
      ? row.legalScore >= 80 ? "strong" : row.legalScore >= 60 ? "moderate" : "weak"
      : bandRating(row.devLegalBand);
  const deliveryRatingV3: FinRating | null =
    row.devDelayedPct != null ? (row.devDelayedPct <= 15 ? "strong" : row.devDelayedPct <= 35 ? "moderate" : "weak") : null;

  const anatomy: Record<ScoreInputKey, FinRating> = {
    delivery: deliveryRatingV3 ?? bandRating(bands.developer) ?? riskRating(row.delayRisk) ?? "moderate",
    legal: legalRatingV3 ?? bandRating(bands.legal) ?? "moderate",
    financials:
      finRatingOverall ??
      (subsAvg != null ? (subsAvg >= 75 ? "strong" : subsAvg >= 45 ? "moderate" : "weak") : bandRating(bands.fundamentals) ?? "moderate"),
    liquidity: velocityPct != null ? (velocityPct >= 85 ? "strong" : velocityPct >= 45 ? "moderate" : "weak") : "moderate",
    pricing: bandRating(bands.roi) ?? "moderate",
    construction: pace != null ? (pace >= -1 ? "strong" : pace >= -8 ? "moderate" : "weak") : "moderate",
  };

  /* strengths / watch-outs — the rules engine's words first, then the v3
     location & legal intelligence (dedupe keeps the count honest) */
  const primaryRisk = textAt(ruleV, "one_liner_inputs.risk");
  const strengths = dedupe([
    textAt(ruleV, "one_liner_inputs.strength_1") ?? "",
    textAt(ruleV, "one_liner_inputs.strength_2") ?? "",
    ...listAt(ruleV, "key_signals"),
    ...strList(row.locKeyStrengths),
    ...(row.faqLocStrength ? [row.faqLocStrength] : []),
    ...strList(row.locGrowthDrivers),
  ]).filter((s) => s !== primaryRisk).slice(0, 5);
  const watchouts = dedupe([
    primaryRisk ?? "",
    ...listAt(riskI, "legal.triggered"),
    ...listAt(riskI, "financials.triggered"),
    ...(pick(riskI, "track_record.delay_triggered") === true ? ["Developer delay rule triggered by the risk engine"] : []),
    ...(pick(riskI, "track_record.lapsed_triggered") === true ? ["Developer lapse rule triggered by the risk engine"] : []),
    ...strList(row.legalTopRisks, ["risk", "title", "text", "name"]),
    ...strList(row.locRisks),
    ...(row.faqLocGap ? [row.faqLocGap] : []),
    ...strList(row.locConnConstraints),
  ]).slice(0, 5);

  /* priorities served — claimed only where the signal is clearly strong */
  const tags: string[] = [];
  if (row.delayRisk && /low/i.test(row.delayRisk)) tags.push("On-Time Delivery");
  if (absorptionPct != null && absorptionPct >= 90) tags.push("Liquidity");
  if (bandRating(bands.legal) === "strong" || (row.legalScore ?? 0) >= 80 || row.riskNoActiveFlags === true) tags.push("Legal Safety");
  if ((row.expectedCagrNum ?? 0) >= 12 || (row.roiIdealCagr ?? 0) >= 12) tags.push("Capital Appreciation");
  if (bandRating(bands.developer) === "strong") tags.push("Developer Reputation");
  if (bandRating(bands.location) === "strong" || /Prime Advantage|Strong Access/i.test(row.locPillarTag ?? "")) tags.push("Location");
  if (/High Momentum/i.test(row.sectionTag ?? "")) tags.push("Construction Progress");

  /* configurations table (when filled) is richer than the caption string */
  /* One physical unit can arrive as several configuration rows — a duplex with
     a plan per level, or the same plan filed on a super- vs carpet-area basis.
     Collapse rows that describe the same unit (same config + carpet + super)
     into ONE home that carries every distinct floor-plan image, so the UI shows
     a single card with a plan toggle rather than a fake multi-size picker.
     Genuinely different sizes (different areas) stay as separate homes. */
  const levelWord = /lower|upper|level|ground|first|second|third|floor|duplex/i;
  const rawHomes = (cfgs ?? [])
    .filter((c) => (c.carpetArea ?? 0) > 0 && (c.superArea ?? 0) > 0)
    .map((c) => ({
      config: c.bhkType ? normBhk(c.bhkType) : "NA",
      areaType: c.areaType,
      carpetSqft: c.carpetArea!,
      superSqft: c.superArea!,
      balconySqft: (c.balconyArea ?? 0) > 0 ? c.balconyArea! : undefined,
      // a floor-plan cell may hold ONE Storage URL or SEVERAL (a duplex filed
      // with a plan per level, comma/newline/JSON-joined in a single field).
      // Split so each resolves to its own <img> — never one malformed
      // multi-URL src ("url1,url2" → a 400 that falls back to the schematic).
      plans: mediaPages(c.floorPlanImageUrl) ?? (mediaSrc(c.floorPlanImageUrl) ? [mediaSrc(c.floorPlanImageUrl)!] : []),
    }));
  const homeKeys: string[] = [];
  const homeGroups: Record<string, typeof rawHomes> = {};
  for (const rh of rawHomes) {
    const key = `${rh.config}|${rh.carpetSqft}|${rh.superSqft}`;
    if (!homeGroups[key]) { homeGroups[key] = []; homeKeys.push(key); }
    homeGroups[key].push(rh);
  }
  const homes = homeKeys.map((key) => {
    const g = homeGroups[key];
    const first = g[0];
    // collect every distinct plan image for the unit, in order, remembering the
    // row each came from and whether that row contributed it alone — so a plan
    // filed on its own row can be named by its area_type, while two plans that
    // share one cell (a duplex) can't be told apart that way.
    const seen = new Set<string>();
    const planRefs: { src: string; at: string | null; solo: boolean }[] = [];
    for (const r of g)
      for (const src of r.plans) {
        if (seen.has(src)) continue;
        seen.add(src);
        planRefs.push({ src, at: r.areaType ?? null, solo: r.plans.length === 1 });
      }
    // >1 image for one unit → a labelled toggle (Lower/Upper for a 2-level
    // duplex, unless a per-row area_type already names the level)
    const plans =
      planRefs.length > 1
        ? planRefs.map((p, idx) => {
            const label =
              p.solo && p.at && levelWord.test(p.at) ? p.at
              : planRefs.length === 2 ? (idx === 0 ? "Lower level" : "Upper level")
              : `Plan ${idx + 1}`;
            return { src: p.src, label };
          })
        : null;
    return {
      config: first.config,
      // area-basis text ("Super Area" / "Carpet Area") is not a size — keep a
      // variant chip only for a lone row that names a real one
      ...(g.length === 1 && first.areaType ? { variant: first.areaType } : {}),
      carpetSqft: first.carpetSqft,
      superSqft: first.superSqft,
      ...(first.balconySqft != null ? { balconySqft: first.balconySqft } : {}),
      priceCr: 0, // pipeline doesn't publish per-config tickets yet — the UI hides the ticket at 0
      ...(planRefs.length ? { plan: planRefs[0].src } : {}),
      ...(plans ? { plans } : {}),
    };
  });
  /* Order the tabs small → large by home size. Raw project_configurations rows
     arrive in DB insertion order (which put a penthouse ahead of the 3.5/4.5
     BHK). Rank each configuration by its smallest carpet, then order the sizes
     within a configuration ascending — so regular flats precede the larger
     penthouses instead of leading with one. ReportHomes renders tabs in this
     array's first-seen order, so sorting here fixes the tab order with no UI
     change. */
  const cfgMinCarpet = new Map<string, number>();
  for (const h of homes) {
    const prev = cfgMinCarpet.get(h.config);
    if (prev == null || h.carpetSqft < prev) cfgMinCarpet.set(h.config, h.carpetSqft);
  }
  homes.sort(
    (a, b) =>
      (cfgMinCarpet.get(a.config)! - cfgMinCarpet.get(b.config)!) ||
      (a.carpetSqft - b.carpetSqft) ||
      (a.superSqft - b.superSqft),
  );
  const cfgNames = dedupe(homes.map((h) => h.config)).filter((c) => c !== "NA");

  const configs = cfgNames.length
    ? cfgNames
    : row.config
      ? row.config.split(/[,·/]+/).map((s) => s.trim()).filter(Boolean).map((c) => normBhk(c))
      : ["NA"];

  const marketName = row.microMarket ?? row.location ?? "Gurugram";
  const market = MARKETS.find((m) => m.name === marketName);
  const range = psfRange(ext?.priceRangeSqft ?? null);

  /* Hero ticket = the lowest psf we can cite × the smallest super area on
     offer — the honest "from ₹X Cr" for the ENTRY configuration (it pairs
     with the entry-BHK chip). Prefer the project's own filed psf range, then
     the corridor floor; only when neither a psf nor a super area is known do
     we fall back to the pipeline's min ticket. Rounded to a clean 0.1 Cr. */
  const psfLo = range?.[0] ?? market?.psf.low ?? null;
  const superAreas = homes.map((h) => h.superSqft).filter((n) => n > 0);
  const smallestSuper = superAreas.length ? Math.min(...superAreas) : null;
  const fallbackCr = row.minPriceCr ?? row.roiCostCr ?? (row.budget ? parseFloat(row.budget.replace(/[^\d.]/g, "")) : NaN);
  const lo =
    psfLo && smallestSuper
      ? Math.round(((psfLo * smallestSuper) / 1e7) * 10) / 10
      : Number.isFinite(fallbackCr) ? fallbackCr : 0;

  /* price journey — only when the extended row carries a parseable
     current range AND a launch price; the launch month anchors to the
     RERA registration date (the filing that starts the clock) */
  const launchMonth = row.registrationDate?.match(/([A-Za-z]{3,9})\s+(\d{4})\s*$/);
  // "Jan 2023" from the RERA registration date — the filing that starts the clock.
  const launchLabel = launchMonth ? `${launchMonth[1].slice(0, 3)} ${launchMonth[2]}` : null;
  const price =
    range && (ext?.launchPrice ?? 0) > 0 && launchMonth
      ? { launchPsf: ext!.launchPrice!, launchDate: launchLabel!, currentLow: range[0], currentHigh: range[1] }
      : null;

  const heroSrc = mediaSrc(ext?.heroImageUrl);
  const renderSrc = mediaSrc(ext?.renderElevationUrl);
  const siteMapSrc = mediaSrc(ext?.siteMapImageUrl);
  const brochurePages = mediaPages(ext?.brochureUrl) ?? (mediaSrc(ext?.brochureUrl) ? [mediaSrc(ext?.brochureUrl)!] : null);
  const brochurePdf = brochurePages ? null : pdfSrc(ext?.brochureUrl);
  const paymentSrc = mediaSrc(ext?.paymentPlanUrl);
  const paymentPdf = paymentSrc ? null : pdfSrc(ext?.paymentPlanUrl);
  const media: NonNullable<ProjectOps["media"]> = {
    ...(heroSrc ? { heroImage: heroSrc } : {}),
    ...(renderSrc ? { render: renderSrc } : {}),
    ...(siteMapSrc
      ? { masterplan: { src: siteMapSrc, read: "The site layout as filed — tap to enlarge. Verify the RERA-approved siteplan before signing." } }
      : {}),
    ...(brochurePages ? { brochure: brochurePages } : {}),
    ...(brochurePdf ? { brochurePdf } : {}),
    ...(extRaw && MANIFEST[extRaw.backlogId]?.brochure_thumb ? { brochureThumb: MANIFEST[extRaw.backlogId]!.brochure_thumb! } : {}),
    ...(paymentSrc
      ? { paymentPlan: { src: paymentSrc, read: "From the developer's kit — indicative until countersigned." } }
      : {}),
    ...(paymentPdf ? { paymentPlanPdf: paymentPdf } : {}),
    ...(extRaw && MANIFEST[extRaw.backlogId]?.payment_plan_thumb ? { paymentPlanThumb: MANIFEST[extRaw.backlogId]!.payment_plan_thumb! } : {}),
  };

  // build-log record — and the egress guardrail: classify how each column
  // resolved so any Storage-pointing INLINE asset (per-view cached egress)
  // is loud in CI. same-origin = materialized file · miss→hidden = a remote
  // URL that failed materialization and was correctly hidden (investigate the
  // skip, but no leak) · storage-pdf = the intended click-gated over-cap
  // brochure · ⚠INLINE-STORAGE = an inline <img> slipped the mediaSrc gate.
  if (ext) {
    const img = (src: string | null | undefined, raw?: string | null): string =>
      src ? (isHttpUrl(src) ? "STORAGE" : "same-origin")
          : raw && isHttpUrl(String(raw).trim()) ? "miss→hidden" : "–";
    const pdf = (src: string | null): string | null => (!src ? null : isHttpUrl(src) ? "storage-pdf" : "same-origin-pdf");
    const brochureState = brochurePages ? `${brochurePages.length}img·same-origin` : pdf(brochurePdf) ?? img(null, ext.brochureUrl);
    const paymentState = paymentSrc ? img(paymentSrc, ext.paymentPlanUrl) : pdf(paymentPdf) ?? img(null, ext.paymentPlanUrl);
    const inlineLeak = [heroSrc, siteMapSrc, renderSrc, ...(brochurePages ?? [])].some((s) => s && isHttpUrl(s));
    // a leak means visitors would hit Storage on every view — always surface it;
    // the all-clear line is per-project noise, so keep it behind BUILD_DEBUG
    if (inlineLeak || DBG)
      (inlineLeak ? console.warn : console.log)(
        `[supabase] media ${row.name} →${inlineLeak ? " ⚠INLINE-STORAGE" : ""} hero=${img(heroSrc, ext.heroImageUrl)} sitemap=${img(siteMapSrc, ext.siteMapImageUrl)} render=${img(renderSrc, ext.renderElevationUrl)} brochure=${brochureState} payment=${paymentState}`,
      );
  }
  // build-log record: configurations → homes, and how many carry a 2D floor plan
  if (DBG && cfgs?.length) {
    const withPlan = homes.filter((h) => h.plan).length;
    console.log(`[supabase] configs ${row.name} → ${homes.length}/${cfgs.length} home(s) rendered · ${withPlan} with 2D floor plan`);
  }

  /* extended vitals (backlog_listing_public_v2): density & open area read as
     whole numbers, land keeps one decimal — matching the flagship convention */
  const density = row.densityAptPerAcre != null ? Math.round(row.densityAptPerAcre) : null;
  const openAreaPct = row.openAreaPct != null ? Math.round(row.openAreaPct) : null;
  const landAcres = row.landAcres != null ? Math.round(row.landAcres * 10) / 10 : null;

  /* ════════ backlog_listing_public_v3 → the detail page's own slots ════════ */

  /* ── developer dossier — lights up Pillar I, Legal history & the FAQs
     through developerOf(); built only when the rollup actually has a ledger ── */
  const mapCases = (v: unknown, scope: "project" | "developer"): LegalCase[] =>
    asArr(v)
      .map((c): LegalCase | null => {
        const title = tIn(c, ["title", "case_title", "name", "case", "matter"]);
        if (!title) return null;
        const impactRaw = tIn(c, ["impact_level", "impact", "severity"]) ?? "";
        return {
          title,
          court: tIn(c, ["court", "forum", "authority"]) ?? "On public record",
          status: tIn(c, ["status", "case_status", "stage", "outcome"]) ?? "Tracked",
          relevance: tIn(c, ["relevance_to_project", "relevance"]) ?? (scope === "project" ? "Direct" : "Contextual"),
          impact: /high/i.test(impactRaw) ? "High" : /low/i.test(impactRaw) ? "Low" : "Medium",
          scope,
          summary: tIn(c, ["summary", "details", "description", "note"]) ?? "",
          buyerImpact: tIn(c, ["buyer_impact", "buyerImpact", "what_this_means", "implication"]) ?? "",
          ...(tIn(c, ["ref", "link", "url", "case_no", "case_number"]) ? { ref: tIn(c, ["ref", "link", "url", "case_no", "case_number"])! } : {}),
        };
      })
      .filter((c): c is LegalCase => !!c);
  const legalCases = [...mapCases(row.legalProjectCases, "project"), ...mapCases(row.legalDeveloperCases, "developer")];

  const finValues: Partial<Record<FinKey, string>> = {};
  const finBand: Partial<Record<FinKey, "exceptional" | "strong" | "moderate" | "watch">> = {};
  for (const k of finKeys) {
    finValues[k] = FIN_FMT[k](finVals[k]!);
    if (FIN_TOP[k](finVals[k]!)) finBand[k] = "exceptional";
  }
  const devLedger = row.devTotal != null && row.devDelivered != null;
  const liveDeveloper: DeveloperIntel | undefined =
    row.developer && devLedger
      ? {
          slug: row.devSlug ?? developerSlugOf(row.developer) ?? row.developer.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: row.developer,
          est: "",
          listed: false,
          listedNote: "",
          tagline: "",
          about: "",
          signature: [],
          brandValue: "",
          recent: [],
          pipeline: [],
          performance: {
            launched: row.devTotal!,
            delivered: row.devDelivered!,
            ongoing: row.devOngoing ?? Math.max(0, row.devTotal! - row.devDelivered!),
            onTimePct: row.devDelayedPct != null ? Math.round(100 - row.devDelayedPct) : 0,
            avgDelayMonths: row.devAvgDelayMonths != null ? Math.round(row.devAvgDelayMonths * 10) / 10 : 0,
            ...(row.devLapsed != null ? { lapsed: row.devLapsed } : {}),
          },
          financials: {
            leverage: finRatings.leverage ?? bandRating(row.devFinancialBand) ?? "moderate",
            coverage: finRatings.coverage ?? bandRating(row.devFinancialBand) ?? "moderate",
            cash: finRatings.cash ?? bandRating(row.devFinancialBand) ?? "moderate",
            margin: finRatings.margin ?? bandRating(row.devFinancialBand) ?? "moderate",
            inventory: finRatings.inventory ?? bandRating(row.devFinancialBand) ?? "moderate",
          },
          ...(Object.keys(finValues).length ? { finValues } : {}),
          ...(Object.keys(finBand).length ? { finBand } : {}),
          finNote:
            row.faqFinancialVerdict ??
            (row.companyType || row.devFinancialBand
              ? `${row.companyType ? `${row.companyType} · ` : ""}financial band from filings: ${row.devFinancialBand ?? "tracked"}.`
              : "Assessed from public filings by the scoring pipeline."),
          legal: row.devLegalBand ?? "tracked",
          ...(legalCases.length ? { legalCases } : {}),
          verdict:
            row.faqFinancialVerdict ??
            `Track record computed from ${row.devTotal} RERA filings: ${row.devDelivered} delivered, ${row.devOngoing ?? 0} ongoing${
              row.devDelayedPct != null ? `, ${Math.round(row.devDelayedPct)}% delayed` : ""
            }${row.devAvgDelayMonths != null ? ` (avg ${Math.round(row.devAvgDelayMonths)} mo slippage)` : ""}.`,
        }
      : undefined;

  /* ── the pipeline's legal read — analyst headline, key flags, as-of date
     and the per-category risk breakdown (from the legal_risks payload) ── */
  const legalUpdated = (() => {
    const sv = row.legalLastUpdated;
    if (!sv) return undefined;
    const dm = sv.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dm) return `${+dm[3]} ${MON3[+dm[2] - 1]} ${dm[1]}`;
    return monthLabel(sv) ?? undefined;
  })();
  /* The v3 legal_risks column holds the breakdown FLAT at the root —
     {"title_risk":"LOW","developer_risk":"MODERATE",…} — with nested
     risk_breakdown shapes accepted as fallbacks. */
  const SEV_RE = /^(critical|high|medium|moderate|low)$/i;
  const rbNested = obj(pick(row.modLegal, "risk_breakdown")) ?? obj(pick(row.modLegal, "score.risk_breakdown"));
  let rbEntries: [string, unknown][] = rbNested ? Object.entries(rbNested) : [];
  if (!rbEntries.length) {
    const root = obj(row.modLegal);
    if (root) rbEntries = Object.entries(root).filter(([, v]) => typeof v === "string" && SEV_RE.test(v.trim()));
  }
  const legalRisks: NonNullable<ProjectIntel["liveLegal"]>["risks"] = [];
  for (const [k, v] of rbEntries.slice(0, 8)) {
    const sev = typeof v === "string" ? v : tIn(v, ["level", "severity", "risk"]);
    if (!sev) continue;
    const level =
      /critical/i.test(sev) ? "Critical"
      : /high/i.test(sev) ? "High"
      : /moderate/i.test(sev) ? "Moderate"
      : /medium/i.test(sev) ? "Medium"
      : /low/i.test(sev) ? "Low" : null;
    if (!level) continue;
    const label = k.replace(/_/g, " ").replace(/^\w/, (ch) => ch.toUpperCase());
    legalRisks.push({ label, level });
  }
  const legalKeyFlags = strList(row.legalKeyFlags, ["flag", "text", "title", "point"]);
  const liveLegal: ProjectIntel["liveLegal"] =
    row.legalHeadline || legalKeyFlags.length || legalRisks.length
      ? {
          ...(row.legalHeadline ? { headline: row.legalHeadline } : {}),
          keyFlags: legalKeyFlags.slice(0, 6),
          ...(legalUpdated ? { lastUpdated: legalUpdated } : {}),
          risks: legalRisks,
        }
      : undefined;

  /* ── ROI model — the pipeline's own projection replaces the corridor
     approximation wherever the view has computed it ── */
  const crFromAbs = (abs: number | null): number | null => (abs != null ? Math.round((abs / 1e7) * 100) / 100 : null);
  const liveRoi: RoiModel | undefined =
    row.roiIdealCagr != null && row.roiActualCagr != null && row.roiCostCr != null
      ? (() => {
          const ticketCr = Math.round(row.roiCostCr! * 10) / 10;
          const horizonYears = row.roiExitYears ?? 5;
          const grow = (r: number) => Math.round(ticketCr * Math.pow(1 + r / 100, horizonYears) * 100) / 100;
          const benchValueCr = crFromAbs(row.roiIdealProfit) != null ? Math.round((ticketCr + crFromAbs(row.roiIdealProfit)!) * 100) / 100 : grow(row.roiIdealCagr!);
          const adjValueCr = crFromAbs(row.roiAdjProfit) != null ? Math.round((ticketCr + crFromAbs(row.roiAdjProfit)!) * 100) / 100 : grow(row.roiActualCagr!);
          return {
            horizonYears,
            corridor3Y: row.roiCityCagr != null ? `~${Math.round(row.roiCityCagr * 10) / 10}% CAGR (city benchmark)` : "the tracked city benchmark",
            benchCagr: Math.round(row.roiIdealCagr! * 10) / 10,
            adjCagr: Math.round(row.roiActualCagr! * 10) / 10,
            ticketCr,
            benchValueCr,
            adjValueCr,
            deltaCr: Math.round((adjValueCr - benchValueCr) * 100) / 100,
          };
        })()
      : undefined;

  /* ── construction & sales — the QPR read; expectedPct is derived from the
     pace-vs-schedule months at the project's own observed build rate ── */
  const actualPct = row.constructionProgressPct != null ? Math.round(row.constructionProgressPct) : null;
  const reraDate = monthLabel(row.reraPromiseDate) ?? row.promised;
  const predictedDate = monthLabel(row.predictedDeliveryDate) ?? row.predicted;
  const behindMonths = row.paceVsScheduleMonths != null ? -row.paceVsScheduleMonths : row.predictedDelayMonths;
  let expectedPct: number | null = null;
  if (actualPct != null) {
    if (behindMonths == null || behindMonths === 0) expectedPct = actualPct;
    else {
      const elapsed = monthsBetween(row.registrationDate, row.lastQprDate);
      const rate = elapsed && elapsed > 3 ? actualPct / elapsed : 1.5; // %-points per month, observed else a conservative build norm
      expectedPct = Math.max(0, Math.min(100, Math.round(actualPct + behindMonths * rate)));
    }
  }
  const conAbsorption = velocityPct != null ? Math.round(velocityPct) : absorptionPct;
  const construction: ProjectOps["construction"] =
    actualPct != null && expectedPct != null && conAbsorption != null && reraDate && predictedDate
      ? {
          actualPct,
          expectedPct,
          absorptionPct: conAbsorption,
          reraDate,
          predictedDate,
          qpr: quarterLabel(row.lastQprDate) ?? "latest QPR",
          ...(delayPct != null ? { delayChancePct: Math.round(delayPct) } : {}),
        }
      : undefined;

  /* ── location intelligence → the report's own POI / connectivity / infra rows ── */
  const poiGroups: [string, string][] = [
    ["hospitals", "Hospital"],
    ["schools_colleges", "School / college"],
    ["office_spaces", "Offices"],
    ["malls_shopping", "Retail & dining"],
  ];
  const pois: NonNullable<NonNullable<ProjectOps["location"]>["pois"]> = [];
  for (const [key, label] of poiGroups) {
    const groupRows = asArr(pick(row.locPoiDensity, key));
    groupRows.forEach((it, i) => {
      const name = tIn(it, ["name", "title"]);
      if (!name) return;
      pois.push({
        name,
        sub: tIn(it, ["sub_category", "type", "sub", "descriptor"]) ?? tIn(it, ["category"]) ?? label,
        ...(nIn(it, ["rating", "google_rating"]) != null ? { rating: nIn(it, ["rating", "google_rating"])! } : {}),
        dist: kmLabel(it) ?? "nearby",
        ...(i === 0 ? { key: true } : {}),
      });
    });
  }
  const connectivity: NonNullable<NonNullable<ProjectOps["location"]>["connectivity"]> = [];
  if (obj(row.locMetro) && tIn(row.locMetro, ["station_name", "name", "station", "nearest_station"]))
    connectivity.push({
      icon: "◇",
      name: tIn(row.locMetro, ["station_name", "name", "station", "nearest_station"])!,
      sub: tIn(row.locMetro, ["line", "corridor"]) ?? "metro station",
      dist: kmLabel(row.locMetro) ?? "—",
      tag: minLabel(row.locMetro) ?? "metro",
    });
  for (const rd of asArr(row.locRoads).slice(0, 3)) {
    const name = tIn(rd, ["name", "road", "title"]);
    if (!name) continue;
    const direct = /direct/i.test(tIn(rd, ["connectivity_type", "type", "access"]) ?? "");
    connectivity.push({
      icon: "▤", name, sub: direct ? "direct frontage" : "arterial road",
      dist: kmLabel(rd) ?? "—", tag: direct ? "Direct" : minLabel(rd) ?? "road", ...(direct ? { direct: true } : {}),
    });
  }
  if (obj(row.locAirport) && (kmLabel(row.locAirport) || minLabel(row.locAirport)))
    connectivity.push({
      icon: "✈",
      name: tIn(row.locAirport, ["name", "airport"]) ?? "IGI Airport",
      sub: tIn(row.locAirport, ["via", "route"]) ?? "airport",
      dist: kmLabel(row.locAirport) ?? "—",
      tag: minLabel(row.locAirport) ?? "airport",
    });
  for (const b of asArr(row.locBusiness).slice(0, 3)) {
    const name = tIn(b, ["name", "district", "title"]);
    if (!name) continue;
    connectivity.push({ icon: "▦", name, sub: tIn(b, ["type", "class"]) ?? "business district", dist: kmLabel(b) ?? "—", tag: minLabel(b) ?? "hub" });
  }
  /* the pipeline emits taxonomy categories ("NH / Expressways / Major Roads")
     and raw date codes ("2028-10") — normalise both so the ledger's chips
     never wrap and its dates read like an analyst wrote them */
  const normCat = (raw: string | null | undefined): string => {
    const s = (raw ?? "").toLowerCase();
    if (/metro|rrts|\brail/.test(s)) return "Metro";
    if (/airport|aviation/.test(s)) return "Airport";
    if (/road|expressway|highway|corridor|\bnh\b/.test(s)) return "Roads";
    if (/office|business|commercial|sez|it park/.test(s)) return "Business";
    if (/real estate|residential|housing|township|supply/.test(s)) return "Real estate";
    if (/hospital|school|college|social|civic|drain|water|sewer|utilit|power/.test(s)) return "Civic";
    const w = (raw ?? "").split(/[\s/|·]+/).filter(Boolean)[0];
    return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "Infra";
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtEta = (raw: string): string => {
    const t = raw.trim();
    let m = /^(\d{4})[-/](\d{1,2})$/.exec(t); // 2028-10 → Oct 2028
    if (m && +m[2] >= 1 && +m[2] <= 12) return `${MONTHS[+m[2] - 1]} ${m[1]}`;
    m = /^(\d{4})\s*(?:[-–—]|to)+\s*(?:\d{2})?(\d{2})$/.exec(t); // 2027-2028 / 2027-28 → 2027–28
    if (m) return `${m[1]}–${m[2]}`;
    return t || "—";
  };
  const etaKey = (raw: string): number => { // sortable (year·month); unknown sinks last
    const m = /(\d{4})(?:[-/](\d{1,2}))?/.exec(raw);
    return m ? +m[1] * 100 + (m[2] ? Math.min(+m[2], 12) : 0) : Number.MAX_SAFE_INTEGER;
  };

  const infraRaw: { sort: number; item: NonNullable<NonNullable<ProjectOps["location"]>["infra"]>[number] }[] = [];
  for (const it of asArr(row.locPlannedInfra).slice(0, 6)) {
    const title = tIn(it, ["name", "title", "project"]);
    if (!title) continue;
    const rawEta = tIn(it, ["expected_completion", "timeline", "eta", "completion", "year"]) ?? "—";
    infraRaw.push({
      sort: etaKey(rawEta),
      item: {
        cat: normCat(tIn(it, ["category", "type", "cat"])),
        status: tIn(it, ["status"]) ?? "Under Construction",
        title,
        body: textAt(it, "impact.description") ?? tIn(it, ["details", "description", "body", "summary", "impact_reasoning"]) ?? "",
        impact: /high/i.test(textAt(it, "impact.level") ?? tIn(it, ["impact", "importance"]) ?? "") ? "High" : "Medium",
        eta: fmtEta(rawEta),
      },
    });
  }
  for (const it of asArr(row.locSupplyCatalysts).slice(0, 3)) {
    const title = tIn(it, ["project_name", "name", "title", "project"]);
    if (!title || title === row.name || infraRaw.some((x) => x.item.title === title)) continue;
    const scale = tIn(it, ["scale_indicator"]);
    const marketImpact = textAt(it, "impact_on_market.description") ?? tIn(it, ["details", "description", "body", "summary"]);
    const rawEta = tIn(it, ["expected_completion", "timeline", "eta", "completion", "year"]) ?? "—";
    infraRaw.push({
      sort: etaKey(rawEta),
      item: {
        cat: "Real estate",
        status: tIn(it, ["status", "stage"]) ?? "Announced",
        title,
        body: [scale, marketImpact].filter(Boolean).join(" — "),
        impact: "Medium",
        eta: fmtEta(rawEta),
      },
    });
  }
  // what lands first, first — the ledger reads as a delivery pipeline
  const infra = infraRaw.sort((a, b) => a.sort - b.sort).map((x) => x.item);
  /* ── map-led geo layout — only when the view carries the project's own
     coordinates; POI pins keep their real lat/lng, nothing is approximated ── */
  const GEO_CAT: Record<string, "schools" | "offices" | "hospitals" | "retail"> = {
    hospitals: "hospitals", schools_colleges: "schools", office_spaces: "offices", malls_shopping: "retail",
  };
  const centerLat = row.latitude, centerLng = row.longitude;
  const centerOk = centerLat != null && centerLng != null && Math.abs(centerLat) <= 90 && Math.abs(centerLng) <= 180 && (centerLat !== 0 || centerLng !== 0);
  let geo: NonNullable<ProjectOps["location"]>["geo"];
  if (centerOk) {
    const nearby: NonNullable<NonNullable<ProjectOps["location"]>["geo"]>["nearby"] = [];
    let maxKm = 0;
    for (const [key, cat] of Object.entries(GEO_CAT)) {
      for (const it of asArr(pick(row.locPoiDensity, key))) {
        const name = tIn(it, ["name", "title"]);
        const lat = nIn(it, ["latitude", "lat"]), lng = nIn(it, ["longitude", "lng", "lon"]);
        if (!name || lat == null || lng == null) continue;
        const imp = tIn(it, ["importance"]);
        maxKm = Math.max(maxKm, nIn(it, ["distance_km"]) ?? 0);
        nearby.push({
          cat, name,
          sub: tIn(it, ["sub_category", "type", "sub", "descriptor"]) ?? tIn(it, ["category"]) ?? cat,
          lat, lng,
          ...(nIn(it, ["google_rating", "rating"]) != null ? { rating: nIn(it, ["google_rating", "rating"])! } : {}),
          ...(imp && /^(High|Medium|Low)$/i.test(imp) ? { importance: (imp[0].toUpperCase() + imp.slice(1).toLowerCase()) as "High" | "Medium" | "Low" } : {}),
        });
      }
    }
    const metroKm = nIn(row.locMetro, ["distance_km"]), metroMin = nIn(row.locMetro, ["travel_time_min", "time_min"]);
    const airKm = nIn(row.locAirport, ["distance_km"]), airMin = nIn(row.locAirport, ["travel_time_min", "time_min"]);
    const geoRoads = asArr(row.locRoads)
      .map((rd) => {
        const name = tIn(rd, ["name", "road", "title"]), km = nIn(rd, ["distance_km", "km"]);
        if (!name || km == null) return null;
        return { name, km, type: (/direct/i.test(tIn(rd, ["connectivity_type", "type", "access"]) ?? "") ? "Direct" : "Indirect") as "Direct" | "Indirect" };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    const geoBiz = asArr(row.locBusiness)
      .map((b) => {
        const name = tIn(b, ["name", "district", "title"]), km = nIn(b, ["distance_km", "km"]), min = nIn(b, ["travel_time_min", "time_min"]);
        return name && km != null && min != null ? { name, km, min } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    const lm = row.locLastMile;
    const lastMile = obj(lm)
      ? {
          ...(tIn(lm, ["road_width"]) ? { roadWidth: tIn(lm, ["road_width"])! } : {}),
          ...(tIn(lm, ["road_quality", "surface"]) ? { surface: tIn(lm, ["road_quality", "surface"])! } : {}),
          ...(tIn(lm, ["auto_cab_availability"]) ? { autoCab: tIn(lm, ["auto_cab_availability"])! } : {}),
          ...(tIn(lm, ["bus_connectivity"]) ? { bus: tIn(lm, ["bus_connectivity"])! } : {}),
          ...(tIn(lm, ["walkability"]) ? { walkability: tIn(lm, ["walkability"])! } : {}),
          ...(tIn(lm, ["traffic_congestion"]) ? { traffic: tIn(lm, ["traffic_congestion"])! } : {}),
          ...(tIn(lm, ["bottlenecks"]) ? { bottlenecks: tIn(lm, ["bottlenecks"])! } : {}),
        }
      : undefined;
    const catScore = (k: string): number | null => {
      const v = pick(row.faqLocCatScores, k);
      return typeof v === "number" && Number.isFinite(v) ? v : nIn(v, ["score", "value"]);
    };
    const byCat = {
      ...(catScore("schools") != null ? { schools: catScore("schools")! } : {}),
      ...(catScore("office_spaces") != null ? { offices: catScore("office_spaces")! } : {}),
      ...(catScore("hospitals") != null ? { hospitals: catScore("hospitals")! } : {}),
      ...(catScore("malls_shopping") != null ? { retail: catScore("malls_shopping")! } : {}),
      ...(catScore("real_estate") != null ? { realEstate: catScore("real_estate")! } : {}),
    };
    const insightsStrengths = strList(row.locKeyStrengths).concat(strList(row.locConnStrengths)).slice(0, 5);
    const insightsGaps = strList(row.locConnConstraints).concat(strList(row.locRisks)).slice(0, 4);
    geo = {
      center: { lat: centerLat!, lng: centerLng! },
      radiusKm: Math.min(4, Math.max(1.5, Math.ceil(maxKm * 2) / 2)),
      nearby,
      connectivity: {
        ...(tIn(row.locMetro, ["station_name", "name", "station"]) && metroKm != null && metroMin != null
          ? { metro: { name: tIn(row.locMetro, ["station_name", "name", "station"])!, line: tIn(row.locMetro, ["line", "corridor"]) ?? "metro", km: metroKm, min: metroMin } }
          : {}),
        roads: geoRoads,
        ...(airKm != null && airMin != null
          ? { airport: { name: tIn(row.locAirport, ["name", "airport"]) ?? "IGI Airport", km: airKm, min: airMin } }
          : {}),
        business: geoBiz,
        ...(lastMile && Object.keys(lastMile).length ? { lastMile } : {}),
      },
      ...(row.faqLocationScore != null || Object.keys(byCat).length
        ? { scores: { ...(row.faqLocationScore != null ? { overall: Math.round(row.faqLocationScore) } : {}), ...(Object.keys(byCat).length ? { byCat } : {}) } }
        : {}),
      ...(row.locVerdict || row.locMarketStage || insightsStrengths.length || insightsGaps.length
        ? {
            insights: {
              ...(row.locVerdict ? { verdict: row.locVerdict } : {}),
              ...(row.locMarketStage ? { marketStage: row.locMarketStage } : {}),
              ...(insightsStrengths.length ? { strengths: insightsStrengths } : {}),
              ...(insightsGaps.length ? { gaps: insightsGaps } : {}),
            },
          }
        : {}),
    };
  }

  // parse-outcome record: pairs with the [v3-loc] presence log in supabase.ts —
  // presence 1s with zero counts here means a shape the readers don't recognise
  if (DBG)
    console.log(
      `[locparse] ${row.slug} pois:${pois.length} conn:${connectivity.length} infra:${infra.length} geo:${geo ? geo.nearby.length : "none"}`,
    );
  const location: ProjectOps["location"] =
    pois.length || connectivity.length || infra.length || geo
      ? {
          ...(pois.length ? { pois: pois.slice(0, 9) } : {}),
          ...(connectivity.length ? { connectivity: connectivity.slice(0, 6) } : {}),
          ...(infra.length ? { infra } : {}),
          ...(geo ? { geo } : {}),
        }
      : undefined;

  /* ── project USPs — the pipeline's substantiated differentiators ── */
  const usps: NonNullable<ProjectOps["usps"]> = [];
  for (const c of asArr(row.uspCards).slice(0, 6)) {
    const title = tIn(c, ["title"]);
    const body = tIn(c, ["insight", "body", "deep_insight"]);
    if (title && body && !usps.some((u) => u.title === title)) usps.push({ title, body });
  }
  if (row.brandedStatus === "Branded" && row.brandedReasoning) usps.push({ title: "Branded development", body: row.brandedReasoning });
  if (/Township/i.test(row.ecosystemStatus ?? "") && row.ecosystemReasoning)
    usps.push({ title: row.ecosystemName ? `Part of ${row.ecosystemName}` : "Part of a township ecosystem", body: row.ecosystemReasoning });
  const consultants = strList(row.uspConsultants, ["name", "title", "consultant"]);
  if (consultants.length >= 2) usps.push({ title: "Marquee consultants on record", body: consultants.slice(0, 6).join(" · ") });

  const ops: ProjectOps = {
    ...(row.location ? { address: row.location } : {}),
    ...(row.totalUnits != null ? { units: Math.round(row.totalUnits) } : totalUnits != null ? { units: totalUnits } : {}),
    ...(ext?.totalTowers != null && ext.totalTowers > 0 ? { towers: Math.round(ext.totalTowers) } : {}),
    ...(landAcres != null ? { landAcres } : {}),
    ...(density != null ? { density } : {}),
    ...(openAreaPct != null ? { openAreaPct } : {}),
    ...(row.promised ? { possession: row.promised } : reraDate ? { possession: reraDate } : {}),
    ...(launchLabel ? { launch: launchLabel } : {}),
    ...(ext?.floorsRange ? { floors: ext.floorsRange } : {}),
    ...(heroDateLabel(ext?.heroDate ?? null) ? { reviewed: heroDateLabel(ext!.heroDate)! } : {}),
    ...(row.reraId ? { reraId: row.reraId } : {}),
    ...(row.reraUrl ? { reraUrl: row.reraUrl } : {}),
    ...(row.legalHeadline ? { reraNote: row.legalHeadline } : {}),
    ...(price ? { price } : {}),
    ...(homes.length ? { homes } : {}),
    ...(Object.keys(media).length ? { media } : {}),
    ...(construction ? { construction } : {}),
    ...(location ? { location } : {}),
    ...(usps.length ? { usps: usps.slice(0, 8) } : {}),
  };

  return {
    name: row.name,
    developer: row.developer ?? "",
    market: marketName,
    configs: configs.length ? configs : ["NA"],
    budget: [lo, lo],
    truthScore: Math.round(row.truthScore ?? 0),
    recommendation,
    confidence,
    tags,
    reason:
      row.insight ??
      row.riskVerdictCleaned ??
      textAt(ruleV, "verdict") ??
      `Independently scored ${Math.round(row.truthScore ?? 0)}/100 by our pipeline from RERA filings and public records.`,
    strengths,
    watchouts,
    slug: row.slug,
    devSlug: row.devSlug ?? (row.developer ? developerSlugOf(row.developer) : undefined),
    marketSlug: market?.slug,
    marketShort: market?.short ?? marketName,
    psf:
      row.avgCostSqft != null && row.avgCostSqft > 0
        ? { low: market?.psf.low ?? row.avgCostSqft, avg: Math.round(row.avgCostSqft), high: market?.psf.high ?? row.avgCostSqft }
        : market?.psf ?? null,
    sizeBand: ext?.superAreaRange ?? null,
    anatomy,
    ops,
    ...(liveDeveloper ? { liveDeveloper } : {}),
    ...(liveRoi ? { liveRoi } : {}),
    ...(liveLegal ? { liveLegal } : {}),
  };
}
