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
import { liveProjectIntel, matchKey } from "./reportAdapter";
import {
  devKey,
  fetchBacklogFull,
  fetchBacklogNameIds,
  fetchConfigurations,
  fetchCorridorPsf,
  fetchDeveloperHealth,
  fetchDeveloperLedger,
  fetchDevelopersOverview,
  fetchExtendedDetails,
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
  const [live, ledger, health, catalog, ext, cfg, nameIds, corridorPsf] = await Promise.all([
    fetchDevelopersOverview(),
    fetchDeveloperLedger(),
    fetchDeveloperHealth(),
    fetchBacklogFull(),
    fetchExtendedDetails(),
    fetchConfigurations(),
    fetchBacklogNameIds(),
    fetchCorridorPsf(),
  ]);

  /* the developer's projects we carry a live report for — keyed both by the
     pipeline's developer_slug and by a normalised name, so a slug OR a name
     match links the report. Each item carries its entry ticket (the SAME
     extended-assets "from ₹X Cr" the report and catalogue quote) so the
     flagship can be chosen strictly by price. Deduped by href per developer. */
  type Track = { name: string; href: string; cr: number };
  const bySlug = new Map<string, Track[]>();
  const byNameKey = new Map<string, Track[]>();
  for (const r of catalog ?? []) {
    if (!r.seoSlug || !r.developer) continue;
    const eKey = matchKey(r.id, r.name, ext, nameIds, r.altIds);
    const cKey = matchKey(r.id, r.name, cfg, nameIds, r.altIds);
    const cr = liveProjectIntel(r, eKey ? ext![eKey] : null, cKey ? cfg![cKey] : null, corridorPsf).budget?.[0] ?? 0;
    const item: Track = { name: r.name, href: `/projects/${r.seoSlug}`, cr };
    if (r.devSlug) (bySlug.get(r.devSlug) ?? bySlug.set(r.devSlug, []).get(r.devSlug)!).push(item);
    const nk = devKey(r.developer);
    (byNameKey.get(nk) ?? byNameKey.set(nk, []).get(nk)!).push(item);
  }
  const trackedFull = (slug: string, name: string): Track[] => {
    const seen = new Set<string>();
    const out: Track[] = [];
    for (const it of [...(bySlug.get(slug) ?? []), ...(byNameKey.get(devKey(name)) ?? [])]) {
      if (seen.has(it.href)) continue;
      seen.add(it.href);
      out.push(it);
    }
    return out;
  };
  const trackedFor = (slug: string, name: string) =>
    trackedFull(slug, name).map((t) => ({ name: t.name, href: t.href }));
  /* Flagship = the developer's most-expensive tracked project, by the filed
     extended-assets price. period. Null when we track none of theirs with a
     price yet — the dossier then keeps its hand-set / delivered fallback. */
  const flagshipFor = (slug: string, name: string): string | null => {
    const priced = trackedFull(slug, name).filter((t) => t.cr > 0).sort((a, b) => b.cr - a.cr);
    return priced[0]?.name ?? null;
  };

  const curated = DEVELOPERS.map((d) => {
    const o = overlayDeveloper(d, live);
    const hf = financialsFromHealth(health?.[devKey(d.name)]);
    const flag = flagshipFor(d.slug, d.name);
    return {
      ...o,
      financials: { ...o.financials, ...hf }, // real per-metric scores win over hand-set
      signature: flag ? [flag] : o.signature, // flagship = most-expensive tracked project, by extended-assets price
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
    const flag = flagshipFor(slug, l.name);
    computed.push({ ...d, signature: flag ? [flag] : d.signature, trackedProjects: trackedFor(slug, l.name) });
  }
  computed.sort((a, b) => b.performance.delivered - a.performance.delivered);

  cache = [...curated, ...computed];
  console.log(`[developers] resolved ${cache.length} (${curated.length} curated + ${computed.length} computed from filings)`);
  return cache;
}

export async function resolveDeveloperBySlug(slug: string): Promise<DeveloperIntel | undefined> {
  return (await resolveDevelopers()).find((d) => d.slug === slug);
}
