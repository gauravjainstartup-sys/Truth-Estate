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

import { avgSlippageFromLedger, DEVELOPERS, type DeveloperIntel, type DevLedgerItem, type FinKey, type FinRating } from "./developers";
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

/* Fallback when the analyst's 0–100 metric_scores aren't saved for a developer
   (financials filed & scored in the back-office, but only metrics/raw_financials
   persisted — not the metric_scores/overall_score the meters read). Derive the
   three-level rating straight from the filed raw_financials so each meter still
   reads its own real signal instead of one flat band. Standard corporate-finance
   thresholds computed off the absolute ₹ figures (unit-safe); direction matches
   the analyst's own bands. */
function ratingsFromRawFinancials(raw: Record<string, number> | undefined): Partial<Record<FinKey, FinRating>> {
  const out: Partial<Record<FinKey, FinRating>> = {};
  if (!raw) return out;
  const v = (k: string): number | null => (Number.isFinite(raw[k]) ? raw[k] : null);
  const lower = (x: number, strongMax: number, modMax: number): FinRating => (x <= strongMax ? "strong" : x <= modMax ? "moderate" : "weak"); // lower ratio = healthier
  const higher = (x: number, strongMin: number, modMin: number): FinRating => (x >= strongMin ? "strong" : x >= modMin ? "moderate" : "weak"); // higher ratio = healthier
  const equity = v("equity"), debt = v("total_debt"), cash = v("cash_and_equivalents");
  const ebit = v("ebit"), ebitda = v("ebitda"), revenue = v("revenue");
  const interest = v("interest_expense"), ocf = v("operating_cash_flow"), inventory = v("inventory");
  if (equity != null && equity > 0 && debt != null && cash != null) out.leverage = lower((debt - cash) / equity, 0.5, 1.0);
  if (interest != null && interest > 0 && ebit != null) out.coverage = higher(ebit / interest, 4, 2);
  if (ebitda != null && ebitda > 0 && ocf != null) out.cash = higher(ocf / ebitda, 0.6, 0.2);
  if (revenue != null && revenue > 0 && inventory != null) out.inventory = lower(inventory / revenue, 3, 6);
  if (revenue != null && revenue > 0 && ebitda != null) out.margin = higher(ebitda / revenue, 0.2, 0.1);
  return out;
}

/* per-metric ratings — the analyst's 0–100 scores when saved, else derived from
   the filed raw_financials, so the meters read the real breakdown rather than
   one flat band applied to all five. */
function financialsFromHealth(h: DeveloperHealth | undefined): Partial<Record<FinKey, FinRating>> {
  const out: Partial<Record<FinKey, FinRating>> = {};
  if (!h) return out;
  const fromRaw = ratingsFromRawFinancials(h.rawFinancials);
  for (const k of FIN_KEYS) {
    const r = ratingFromScore(h.financialScores[HEALTH_KEY[k]]) ?? fromRaw[k] ?? null;
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

  const totalCount = l.total ?? 0;
  const deliveredCount = l.delivered ?? 0;
  const ongoingCount = l.ongoing ?? Math.max(0, totalCount - deliveredCount);
  const plural = (n: number) => (n === 1 ? "" : "s");
  const strongFins = FIN_KEYS.filter((k) => financials[k] === "strong").length;
  const weakFins = FIN_KEYS.filter((k) => financials[k] === "weak").length;
  const finPhrase = strongFins >= 3 ? "a strong balance sheet" : weakFins >= 3 ? "a stretched balance sheet" : "a mixed financial profile";
  const verdict = totalCount > 0
    ? `${l.name} is building in Gurugram on ${finPhrase} — ${ongoingCount} project${plural(ongoingCount)} under construction${deliveredCount > 0 ? `, ${deliveredCount} delivered so far` : ", none delivered here yet"}. The full delivery, pricing and financial forensics on each project are inside its report.`
    : `${l.name} is tracked here on delivery, pricing and financial health — the full forensic read on each project is inside its report.`;

  return {
    slug: liveDeveloperSlug(l),
    name: l.name,
    computed: true,
    est: "",
    listed: false,
    listedNote: "",
    tagline: "",
    about: `${l.name} is an active developer in Gurugram with ${totalCount} project${plural(totalCount)} we track. The read below is our own — delivery and delay history from public filings, financial health from published financials. For the full audited numbers and a project-by-project breakdown, open any ${l.name} report.`,
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
    finNote: `A directional read on ${l.name}'s financial health. The full audited financials and the per-project forensics are inside each report — unlock one for the complete numbers.`,
    legal: l.legalBand
      ? `Legal band from public filings: ${l.legalBand}. No project-level defect is implied.`
      : "No developer-level litigation is on record in the tracked filings.",
    verdict,
  };
}

let cache: DeveloperIntel[] | undefined;

/* Editorial overlay for the filings-computed developers — a founding year,
   listed/private, and a one-liner: the facts the pipeline doesn't carry, so
   these cards read like the hand-reviewed dossiers rather than a bare stat
   line. Years are each developer's commonly-cited establishment year, verified
   against public records; Whiteland's is genuinely ambiguous (2021 entity vs a
   2012 founder-legacy) so it carries NO year rather than a guessed one. "listed"
   tracks the entity that actually builds in Gurugram — so Eldeco reads Private
   (the Gurgaon arm, Eldeco Infrastructure & Properties, is unlisted; the listed
   Eldeco Housing is a separate UP company). Matched to the filed developer_name
   by a loose normalise. */
const DEV_EDITORIAL: { name: string; est: string; listed: boolean; tagline: string }[] = [
  { name: "Sobha", est: "1995", listed: true, tagline: "Backward-integrated build quality, at the top of its corridor." },
  { name: "Oberoi Realty", est: "1980", listed: true, tagline: "Mumbai-grade luxury, newly landed in Gurugram." },
  { name: "Experion", est: "2006", listed: false, tagline: "Singapore-backed patient capital on the expressway." },
  { name: "Whiteland", est: "", listed: false, tagline: "Branded-residence luxury on the Southern Peripheral Road." },
  { name: "Ashiana Group", est: "1979", listed: true, tagline: "Kid-centric and senior-living homes across New Gurgaon." },
  { name: "Central Park", est: "1999", listed: false, tagline: "Resort-style, service-led luxury on Sohna Road." },
  { name: "Signature Global", est: "2014", listed: true, tagline: "Affordable-housing scale, now reaching mid-premium." },
  { name: "Tulip", est: "2005", listed: false, tagline: "Value-led volume on Sohna Road and the SPR." },
  { name: "Elan", est: "2013", listed: false, tagline: "Retail-led developer, now building branded residences." },
  { name: "Puri Constructions", est: "1971", listed: false, tagline: "A five-decade Delhi builder — boutique, low-volume." },
  { name: "Max Estates", est: "2016", listed: true, tagline: "Max Group's wellness-led move into grade-A real estate." },
  { name: "ELDECO", est: "1975", listed: false, tagline: "A five-decade township builder, value-focused across the NCR." },
];
const editorialNorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const DEV_EDITORIAL_MAP = new Map(DEV_EDITORIAL.map((e) => [editorialNorm(e.name), e]));

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
  /* A project already shown — and LINKED — under "Projects we track" must not
     also appear as a plain-text bullet under "Recently launched" / "In the
     pipeline". On a new developer every filing is both tracked and "ongoing",
     so pipeline = names(ongoing) simply mirrored the tracked column and read as
     a bug. Flagship is deliberately one of the tracked projects (the priciest),
     so it stays; only the redundant plain lists are trimmed. */
  const nameKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const dropTracked = (names: string[], tracked: { name: string }[], devName: string): string[] => {
    /* Filings carry the BARE project name ("Elaira Residences Phase 2"), while a
       catalogued/tracked project carries the BRANDED one ("Conscient Elaira
       Residences Phase 2"). Strip the leading developer name from both sides
       before comparing, so the same project isn't listed twice under two
       spellings (tracked link + plain pipeline bullet). */
    const dev = nameKey(devName);
    const strip = (k: string) => (dev && (k === dev || k.startsWith(dev + " ")) ? k.slice(dev.length).trim() : k);
    const t = new Set(tracked.map((x) => strip(nameKey(x.name))));
    return names.filter((n) => !t.has(strip(nameKey(n))));
  };

  /* Average delay in months, computed FRESH from the filed per-project
     delay_months (projects.delay_months, via the ledger) — the mean over the
     developer's delayed projects. This is the canonical source and matches the
     back-office portfolio table exactly. The developers_overview rollup columns
     are not read for this: avg_developer_delay drifts stale against the filings
     (Tulip stored 55.5 vs a filed 39.4), computed_avg_delay reads 0 for most,
     and avg_delay_months is null for all (delay_months is filed as text). Null
     when the developer has no delayed project on file — the caller then keeps
     whatever the overview/hand-set carried (0 for a clean record). */
  const avgDelayFor = (name: string): number | null => avgSlippageFromLedger(ledger?.[devKey(name)]);

  const curated = DEVELOPERS.map((d) => {
    const o = overlayDeveloper(d, live);
    const hf = financialsFromHealth(health?.[devKey(d.name)]);
    const flag = flagshipFor(d.slug, d.name);
    const tracked = trackedFor(d.slug, d.name);
    return {
      ...o,
      performance: { ...o.performance, avgDelayMonths: avgDelayFor(d.name) ?? o.performance.avgDelayMonths }, // avg delay from the live filings, not the stale rollup
      financials: { ...o.financials, ...hf }, // real per-metric scores win over hand-set
      signature: flag ? [flag] : o.signature, // flagship = most-expensive tracked project, by extended-assets price
      recent: dropTracked(o.recent, tracked, d.name),
      pipeline: dropTracked(o.pipeline, tracked, d.name),
      trackedProjects: tracked,
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
    const tracked = trackedFor(slug, l.name);
    /* Editorial overlay: a founding year + listed/private + one-liner turns a
       bare filings card into a dossier-style one. `computed: false` lets the
       card and detail header show the est + Listed/Private badge (both gate on
       it); the track-record numbers below stay pipeline-computed as before. */
    const ed = DEV_EDITORIAL_MAP.get(editorialNorm(l.name));
    computed.push({
      ...d,
      ...(ed ? { est: ed.est, listed: ed.listed, tagline: ed.tagline, computed: false } : {}),
      /* "we track N" must be the count we actually catalogue (with reports),
         not the developer's full RERA filing count — a delivered project we
         don't cover otherwise inflates the number past the list below it. */
      about: tracked.length > 0
        ? `${l.name} is an active developer in Gurugram — we track ${tracked.length} of its project${tracked.length === 1 ? "" : "s"} in depth. The read below is our own: delivery and delay history from public filings, financial health from published financials. For the full audited numbers and a project-by-project breakdown, open any ${l.name} report.`
        : d.about,
      performance: { ...d.performance, avgDelayMonths: avgDelayFor(l.name) ?? d.performance.avgDelayMonths }, // avg delay from the live filings, not the stale rollup
      signature: flag ? [flag] : dropTracked(d.signature, tracked, l.name),
      recent: dropTracked(d.recent, tracked, l.name),
      pipeline: dropTracked(d.pipeline, tracked, l.name),
      trackedProjects: tracked,
    });
  }
  computed.sort((a, b) => b.performance.delivered - a.performance.delivered);

  cache = [...curated, ...computed];
  console.log(`[developers] resolved ${cache.length} (${curated.length} curated + ${computed.length} computed from filings)`);
  return cache;
}

export async function resolveDeveloperBySlug(slug: string): Promise<DeveloperIntel | undefined> {
  return (await resolveDevelopers()).find((d) => d.slug === slug);
}
