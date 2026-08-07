/* ════════════════════════════════════════════════════════════════
   DEVELOPER DOSSIERS — curated prose, filed ledger, real financials.

   What a builder is known for is editorial. How many buildings it has
   handed over, and how healthy its balance sheet is, are not — and the
   hand-written numbers had drifted from the pipeline that scores every
   project on this site. So the numbers come from the filings:

     · performance  ← developers_overview (delivery, delays)
     · financials   ← developer_health.financial_health (per-metric 0–100
                       scores behind the five meters — NOT the single
                       financial_band, which flattened all five to one band)
     · projects      ← the live catalogue, linked to each report

   SEVENTEEN of them (developers filed with ZERO projects are hidden). Six
   carry hand-written dossiers; the rest render the same DeveloperProfile
   from the filings, leaving the editorial fields empty (the UI hides them).

   One resolver, three consumers: the developers index, each dossier, and
   every developer-vs-developer comparison. Backend unreachable → the
   curated six stand on their hand-set values and the computed rest drop.
   ════════════════════════════════════════════════════════════════ */

import { DEVELOPERS, type DeveloperIntel, type DevLedgerItem, type FinKey, type FinRating } from "./developers";
import { developerSlugOf } from "./projects";
import {
  devKey,
  fetchBacklogFull,
  fetchDeveloperHealth,
  fetchDeveloperLedger,
  fetchDevelopersOverview,
  type DeveloperHealth,
  type LiveDeveloper,
} from "./supabase";

export function overlayDeveloper(curated: DeveloperIntel, live: LiveDeveloper[] | null | undefined): DeveloperIntel {
  const l = (live ?? []).find(
    (d) =>
      d.name.toLowerCase() === curated.name.toLowerCase() ||
      (d.slug ?? "").toLowerCase() === curated.slug.toLowerCase(),
  );
  if (!l) return curated;
  return {
    ...curated,
    performance: {
      ...curated.performance,
      launched: l.total ?? curated.performance.launched,
      delivered: l.delivered ?? curated.performance.delivered,
      ongoing: l.ongoing ?? curated.performance.ongoing,
      onTimePct: l.delayedPct != null ? Math.round(100 - l.delayedPct) : curated.performance.onTimePct,
      avgDelayMonths:
        l.avgDelayMonths != null ? Math.round(l.avgDelayMonths * 10) / 10 : curated.performance.avgDelayMonths,
    },
  };
}

const FIN_KEYS: FinKey[] = ["leverage", "coverage", "cash", "margin", "inventory"];

/* the pipeline's band words → the three-level rating (fallback only, when
   developer_health has no per-metric score for a developer) */
function bandRating(b: string | null): FinRating {
  if (b && /strong|exceptional|excellent|good|high/i.test(b)) return "strong";
  if (b && /weak|watch|poor|low|strained/i.test(b)) return "weak";
  return "moderate";
}

/* the five audit meters ← developer_health.financial_health.metric_scores keys */
const HEALTH_KEY: Record<FinKey, string> = {
  leverage: "net_debt_to_equity",
  coverage: "interest_coverage_ratio",
  cash: "ocf_to_ebitda",
  margin: "ebitda_margin",
  inventory: "inventory_to_sales_years",
};
const ratingFromScore = (sc: number | undefined): FinRating | null =>
  sc == null ? null : sc >= 70 ? "strong" : sc >= 45 ? "moderate" : "weak";

/* per-metric ratings from the analyst's 0–100 scores — the real breakdown the
   meters should read, instead of one flat band applied to all five. */
function financialsFromHealth(h: DeveloperHealth | undefined): Partial<Record<FinKey, FinRating>> {
  const out: Partial<Record<FinKey, FinRating>> = {};
  if (!h) return out;
  for (const k of FIN_KEYS) {
    const r = ratingFromScore(h.financialScores[HEALTH_KEY[k]]);
    if (r) out[k] = r;
  }
  return out;
}

/* The public URL for a developer. The pipeline's developer_slug is the
   canonical key; fall back to the curated registry, then a slugified name —
   the same value the index card and the detail route must both produce so a
   card never links to a 404. */
export function liveDeveloperSlug(l: LiveDeveloper): string {
  return (
    (l.slug && l.slug.trim()) ||
    developerSlugOf(l.name) ||
    l.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  );
}

/* A developer filed in developers_overview but not given a desk dossier.
   Editorial fields stay empty (the UI hides them); the factual ones come from
   the filings, its financials from developer_health, and its projects from the
   catalogue. `computed: true` tells the UI this is a filings-only profile. */
function liveOnlyDeveloper(
  l: LiveDeveloper,
  ledger: Record<string, DevLedgerItem[]> | null,
  health: Record<string, DeveloperHealth> | null,
): DeveloperIntel {
  const led = ledger?.[devKey(l.name)] ?? [];
  const delivered = led.filter((p) => p.ocDate || /deliver|complete|ready|occupanc/i.test(p.status ?? ""));
  const ongoing = led.filter((p) => /ongoing|under|progress|launch|new/i.test(p.status ?? "") && !p.ocDate);
  const names = (xs: DevLedgerItem[]) => [...new Set(xs.map((p) => p.name).filter(Boolean))].slice(0, 6);

  const rating = bandRating(l.financialBand);
  const financials = {
    ...(Object.fromEntries(FIN_KEYS.map((k) => [k, rating])) as Record<FinKey, FinRating>),
    ...financialsFromHealth(health?.[devKey(l.name)]),
  };

  const verdict =
    l.total != null
      ? `Track record computed from ${l.total} RERA filing${l.total === 1 ? "" : "s"}: ${l.delivered ?? 0} delivered${
          l.ongoing != null ? `, ${l.ongoing} ongoing` : ""
        }${l.delayedPct != null ? `, ${Math.round(l.delayedPct)}% delayed` : ""}${
          l.avgDelayMonths != null ? ` (avg ${Math.round(l.avgDelayMonths)} mo slippage)` : ""
        }. A full editorial dossier is in review.`
      : "Track record is being computed from public RERA filings. A full editorial dossier is in review.";

  return {
    slug: liveDeveloperSlug(l),
    name: l.name,
    computed: true,
    est: "",
    listed: false,
    listedNote: "",
    tagline: "",
    about: `${l.name}'s record below is computed directly from public RERA filings — delivery, delays and financial signals. A full editorial dossier is in review.`,
    signature: names(delivered),
    brandValue: "",
    recent: [],
    pipeline: names(ongoing),
    performance: {
      launched: l.total ?? 0,
      delivered: l.delivered ?? 0,
      ongoing: l.ongoing ?? Math.max(0, (l.total ?? 0) - (l.delivered ?? 0)),
      onTimePct: l.delayedPct != null ? Math.round(100 - l.delayedPct) : 0,
      avgDelayMonths: l.avgDelayMonths != null ? Math.round(l.avgDelayMonths * 10) / 10 : 0,
    },
    financials,
    finNote: l.financialBand
      ? `Financial band from public filings: ${l.financialBand}. Signals, not audited figures.`
      : "Financial signals are computed from public filings as they are filed.",
    legal: l.legalBand
      ? `Legal band from public filings: ${l.legalBand}. No project-level defect is implied.`
      : "No developer-level litigation is on record in the tracked filings.",
    verdict,
  };
}

let cache: DeveloperIntel[] | undefined;

export async function resolveDevelopers(): Promise<DeveloperIntel[]> {
  if (cache !== undefined) return cache;
  const [live, ledger, health, catalog] = await Promise.all([
    fetchDevelopersOverview(),
    fetchDeveloperLedger(),
    fetchDeveloperHealth(),
    fetchBacklogFull(),
  ]);

  /* the developer's projects we carry a live report for — keyed both by the
     pipeline's developer_slug and by a normalised name, so a slug OR a name
     match links the report. Deduped by href per developer. */
  const bySlug = new Map<string, { name: string; href: string }[]>();
  const byNameKey = new Map<string, { name: string; href: string }[]>();
  for (const r of catalog ?? []) {
    if (!r.seoSlug || !r.developer) continue;
    const item = { name: r.name, href: `/projects/${r.seoSlug}` };
    if (r.devSlug) (bySlug.get(r.devSlug) ?? bySlug.set(r.devSlug, []).get(r.devSlug)!).push(item);
    const nk = devKey(r.developer);
    (byNameKey.get(nk) ?? byNameKey.set(nk, []).get(nk)!).push(item);
  }
  const trackedFor = (slug: string, name: string): { name: string; href: string }[] => {
    const seen = new Set<string>();
    const out: { name: string; href: string }[] = [];
    for (const it of [...(bySlug.get(slug) ?? []), ...(byNameKey.get(devKey(name)) ?? [])]) {
      if (seen.has(it.href)) continue;
      seen.add(it.href);
      out.push(it);
    }
    return out;
  };

  const curated = DEVELOPERS.map((d) => {
    const o = overlayDeveloper(d, live);
    const hf = financialsFromHealth(health?.[devKey(d.name)]);
    return {
      ...o,
      financials: { ...o.financials, ...hf }, // real per-metric scores win over hand-set
      trackedProjects: trackedFor(d.slug, d.name),
    };
  });

  const curatedNames = new Set(DEVELOPERS.map((d) => d.name.toLowerCase()));
  const curatedSlugs = new Set(DEVELOPERS.map((d) => d.slug.toLowerCase()));
  const seen = new Set<string>();
  const computed: DeveloperIntel[] = [];
  for (const l of live ?? []) {
    if (curatedNames.has(l.name.toLowerCase()) || curatedSlugs.has((l.slug ?? "").toLowerCase())) continue;
    if ((l.total ?? 0) < 1) continue; // hide developers filed with zero projects
    const slug = liveDeveloperSlug(l);
    if (!slug || seen.has(slug) || curatedSlugs.has(slug.toLowerCase())) continue;
    seen.add(slug);
    const d = liveOnlyDeveloper(l, ledger, health);
    computed.push({ ...d, trackedProjects: trackedFor(slug, l.name) });
  }
  computed.sort((a, b) => b.performance.delivered - a.performance.delivered);

  cache = [...curated, ...computed];
  console.log(`[developers] resolved ${cache.length} (${curated.length} curated + ${computed.length} computed from filings)`);
  return cache;
}

export async function resolveDeveloperBySlug(slug: string): Promise<DeveloperIntel | undefined> {
  return (await resolveDevelopers()).find((d) => d.slug === slug);
}
