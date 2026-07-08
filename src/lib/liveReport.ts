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
import type { FinRating } from "./developers";
import { developerSlugOf, type ProjectIntel, type ProjectOps, type ScoreInputKey } from "./projects";
import mediaManifest from "./live-media.manifest.json";

/* Media now arrives as Supabase Storage URLs, which pass straight through.
   The manifest only covers any LEGACY base64 rows — decoded to real files
   before the build (scripts/materialize-media.mjs) — and is empty once every
   row has migrated. When present, a materialized path is preferred. */
const MANIFEST = mediaManifest as Record<string, Partial<Record<string, string>>>;

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
  const s = u.trim();
  if (/^data:image\//i.test(s)) return s;
  if (/^data:/i.test(s)) return null; // pdf / other — no image slot for these yet
  if (s.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(s)) {
    if (/^JVBERi/.test(s)) return null; // base64 PDF
    for (const [re, type] of B64_MAGIC) if (re.test(s)) return `data:image/${type};base64,${s.replace(/\s+/g, "")}`;
    return null; // unknown binary — don't guess
  }
  // A Storage/CDN URL. A Storage object key may carry no file extension, so
  // we can't require one — treat any non-PDF http(s) URL as an image; a .pdf
  // URL falls through to pdfSrc for a link instead of an <img>.
  if (isHttpUrl(s)) return isPdfUrl(s) ? null : s;
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
  const s = u.trim();
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
  } else if (!/^data:/i.test(s) && s.includes(",") && !/^[A-Za-z0-9+/=\r\n]+$/.test(s)) {
    parts = s.split(/[,\n]+/);
  }
  const pages = parts.map((p) => mediaSrc(p)).filter((p): p is string => !!p);
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
        renderElevationUrl: mm.render_elevation_url ?? extRaw.renderElevationUrl,
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

  const confidence =
    row.delayChancePct != null
      ? row.delayChancePct <= 25 ? "High" : row.delayChancePct <= 50 ? "Medium" : "Low"
      : row.delayRisk
        ? /low/i.test(row.delayRisk) ? "High" : /high/i.test(row.delayRisk) ? "Low" : "Medium"
        : "Provisional";

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
  const pace = row.constructionPaceNum;
  const anatomy: Record<ScoreInputKey, FinRating> = {
    delivery: bandRating(bands.developer) ?? riskRating(row.delayRisk) ?? "moderate",
    legal: bandRating(bands.legal) ?? "moderate",
    financials: subsAvg != null ? (subsAvg >= 75 ? "strong" : subsAvg >= 45 ? "moderate" : "weak") : bandRating(bands.fundamentals) ?? "moderate",
    liquidity: absorptionPct != null ? (absorptionPct >= 85 ? "strong" : absorptionPct >= 45 ? "moderate" : "weak") : "moderate",
    pricing: bandRating(bands.roi) ?? "moderate",
    construction: pace != null ? (pace >= -1 ? "strong" : pace >= -8 ? "moderate" : "weak") : "moderate",
  };

  /* strengths / watch-outs from the rules engine's own words */
  const primaryRisk = textAt(ruleV, "one_liner_inputs.risk");
  const strengths = dedupe([
    textAt(ruleV, "one_liner_inputs.strength_1") ?? "",
    textAt(ruleV, "one_liner_inputs.strength_2") ?? "",
    ...listAt(ruleV, "key_signals"),
  ]).filter((s) => s !== primaryRisk).slice(0, 5);
  const watchouts = dedupe([
    primaryRisk ?? "",
    ...listAt(riskI, "legal.triggered"),
    ...listAt(riskI, "financials.triggered"),
    ...(pick(riskI, "track_record.delay_triggered") === true ? ["Developer delay rule triggered by the risk engine"] : []),
    ...(pick(riskI, "track_record.lapsed_triggered") === true ? ["Developer lapse rule triggered by the risk engine"] : []),
  ]).slice(0, 5);

  /* priorities served — claimed only where the signal is clearly strong */
  const tags: string[] = [];
  if (row.delayRisk && /low/i.test(row.delayRisk)) tags.push("On-Time Delivery");
  if (absorptionPct != null && absorptionPct >= 90) tags.push("Liquidity");
  if (bandRating(bands.legal) === "strong") tags.push("Legal Safety");
  if ((row.expectedCagrNum ?? 0) >= 12) tags.push("Capital Appreciation");
  if (bandRating(bands.developer) === "strong") tags.push("Developer Reputation");
  if (bandRating(bands.location) === "strong") tags.push("Location");

  /* configurations table (when filled) is richer than the caption string */
  const homes = (cfgs ?? [])
    .filter((c) => (c.carpetArea ?? 0) > 0 && (c.superArea ?? 0) > 0)
    .map((c) => ({
      config: c.bhkType ? normBhk(c.bhkType) : "NA",
      ...(c.areaType ? { variant: c.areaType } : {}),
      carpetSqft: c.carpetArea!,
      superSqft: c.superArea!,
      ...((c.balconyArea ?? 0) > 0 ? { balconySqft: c.balconyArea! } : {}),
      priceCr: 0, // pipeline doesn't publish per-config tickets yet — the UI hides the ticket at 0
    }));
  const cfgNames = dedupe(homes.map((h) => h.config)).filter((c) => c !== "NA");

  const configs = cfgNames.length
    ? cfgNames
    : row.config
      ? row.config.split(/[,·/]+/).map((s) => s.trim()).filter(Boolean).map((c) => normBhk(c))
      : ["NA"];

  const priceLo = row.minPriceCr ?? (row.budget ? parseFloat(row.budget.replace(/[^\d.]/g, "")) : NaN);
  const lo = Number.isFinite(priceLo) ? priceLo : 0;

  const marketName = row.microMarket ?? row.location ?? "Gurugram";
  const market = MARKETS.find((m) => m.name === marketName);

  /* price journey — only when the extended row carries a parseable
     current range AND a launch price; the launch month anchors to the
     RERA registration date (the filing that starts the clock) */
  const range = psfRange(ext?.priceRangeSqft ?? null);
  const launchMonth = row.registrationDate?.match(/([A-Za-z]{3,9})\s+(\d{4})\s*$/);
  const price =
    range && (ext?.launchPrice ?? 0) > 0 && launchMonth
      ? { launchPsf: ext!.launchPrice!, launchDate: `${launchMonth[1].slice(0, 3)} ${launchMonth[2]}`, currentLow: range[0], currentHigh: range[1] }
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
    ...(paymentSrc
      ? { paymentPlan: { src: paymentSrc, read: "From the developer's kit — indicative until countersigned." } }
      : {}),
    ...(paymentPdf ? { paymentPlanPdf: paymentPdf } : {}),
  };

  // build-log record: how each media column resolved (or why it didn't)
  if (ext) {
    const why = (v: string | null | undefined): string =>
      !v ? "null" : v.length > PDF_INLINE_CAP ? "too-big" : "unrecognised";
    console.log(
      `[supabase] media ${row.name} → hero=${heroSrc ? "ok" : why(ext.heroImageUrl)} · brochure=${
        brochurePages ? `${brochurePages.length} page(s)` : brochurePdf ? "pdf-link" : why(ext.brochureUrl)
      } · payment=${paymentSrc ? "ok" : paymentPdf ? "pdf-link" : why(ext.paymentPlanUrl)} · sitemap=${siteMapSrc ? "ok" : why(ext.siteMapImageUrl)}`,
    );
  }

  const ops: ProjectOps = {
    ...(row.location ? { address: row.location } : {}),
    ...(totalUnits != null ? { units: totalUnits } : {}),
    ...(row.promised ? { possession: row.promised } : {}),
    ...(ext?.floorsRange ? { floors: ext.floorsRange } : {}),
    ...(heroDateLabel(ext?.heroDate ?? null) ? { reviewed: heroDateLabel(ext!.heroDate)! } : {}),
    ...(price ? { price } : {}),
    ...(homes.length ? { homes } : {}),
    ...(Object.keys(media).length ? { media } : {}),
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
      textAt(ruleV, "verdict") ??
      `Independently scored ${Math.round(row.truthScore ?? 0)}/100 by our pipeline from RERA filings and public records.`,
    strengths,
    watchouts,
    slug: row.slug,
    devSlug: row.developer ? developerSlugOf(row.developer) : undefined,
    marketSlug: market?.slug,
    marketShort: market?.short ?? marketName,
    psf: market?.psf ?? null,
    sizeBand: ext?.superAreaRange ?? null,
    anatomy,
    ops,
  };
}
