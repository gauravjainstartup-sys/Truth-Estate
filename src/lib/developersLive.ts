/* ════════════════════════════════════════════════════════════════
   DEVELOPER DOSSIERS — curated prose, filed ledger, ALL of them.

   What a builder is known for is editorial. How many buildings it has
   actually handed over is not, and the hand-written numbers had drifted
   from the pipeline that scores every project on this site:

     developer   dossier said        developers_overview says
     DLF         92% on-time / 38    84% / 31
     Godrej      90% / 22            37% / 1
     M3M         74% / 18            55% / 15
     Birla       85% / 4             22% / 2
     Smartworld  80% / 1             60% / 3
     Emaar       —                   68% / 13

   Every error flattered the builder, and the project reports — which
   read the same filings — contradicted the dossiers on the same site.

   SEVENTEEN, not six. Six carry hand-written dossiers; the rest are
   filed in developers_overview with a computed track record but no desk
   prose yet. Both render through the SAME DeveloperIntel / DeveloperProfile
   — the computed ones simply leave the editorial fields empty (est,
   tagline, about, brand value), which the UI hides, and fill the factual
   ones from the filings + the RERA ledger. So the index lists all 17 and
   every card has a real page behind it.

   One resolver, three consumers: the developers index, each dossier, and
   every developer-vs-developer comparison. Same shape out; backend
   unreachable → the curated six stand and the computed rest drop.
   ════════════════════════════════════════════════════════════════ */

import { DEVELOPERS, type DeveloperIntel, type DevLedgerItem, type FinKey, type FinRating } from "./developers";
import { developerSlugOf } from "./projects";
import { devKey, fetchDeveloperLedger, fetchDevelopersOverview, type LiveDeveloper } from "./supabase";

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

/* the pipeline's band words → the three-level rating the audit meters read */
const FIN_KEYS: FinKey[] = ["leverage", "coverage", "cash", "margin", "inventory"];
function bandRating(b: string | null): FinRating {
  if (b && /strong|exceptional|excellent|good|high/i.test(b)) return "strong";
  if (b && /weak|watch|poor|low|strained/i.test(b)) return "weak";
  return "moderate";
}

/* The public URL for a developer. The pipeline's developer_slug is the
   canonical key (it is what backlog rows reference); fall back to the curated
   registry, then to a slugified name — the same value the index card and the
   detail route must both produce so a card never links to a 404. */
export function liveDeveloperSlug(l: LiveDeveloper): string {
  return (
    (l.slug && l.slug.trim()) ||
    developerSlugOf(l.name) ||
    l.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  );
}

/* A developer filed in developers_overview but not yet given a desk dossier.
   Editorial fields stay empty (the UI hides them); the factual ones come from
   the filings and the RERA ledger. `computed: true` tells the UI this is a
   filings-only profile (so it hides the Listed/Private badge it cannot know). */
function liveOnlyDeveloper(l: LiveDeveloper, ledger: Record<string, DevLedgerItem[]> | null): DeveloperIntel {
  const led = ledger?.[devKey(l.name)] ?? [];
  const delivered = led.filter((p) => p.ocDate || /deliver|complete|ready|occupanc/i.test(p.status ?? ""));
  const ongoing = led.filter((p) => /ongoing|under|progress|launch|new/i.test(p.status ?? "") && !p.ocDate);
  const names = (xs: DevLedgerItem[]) => [...new Set(xs.map((p) => p.name).filter(Boolean))].slice(0, 6);

  const onTimePct = l.delayedPct != null ? Math.round(100 - l.delayedPct) : 0;
  const rating = bandRating(l.financialBand);
  const financials = Object.fromEntries(FIN_KEYS.map((k) => [k, rating])) as Record<FinKey, FinRating>;

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
      onTimePct,
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
  const [live, ledger] = await Promise.all([fetchDevelopersOverview(), fetchDeveloperLedger()]);
  const curated = DEVELOPERS.map((d) => overlayDeveloper(d, live));
  // every filed developer that has no curated dossier → a computed profile
  const curatedNames = new Set(DEVELOPERS.map((d) => d.name.toLowerCase()));
  const curatedSlugs = new Set(DEVELOPERS.map((d) => d.slug.toLowerCase()));
  const seen = new Set<string>();
  const computed: DeveloperIntel[] = [];
  for (const l of live ?? []) {
    if (curatedNames.has(l.name.toLowerCase()) || curatedSlugs.has((l.slug ?? "").toLowerCase())) continue;
    const slug = liveDeveloperSlug(l);
    if (!slug || seen.has(slug) || curatedSlugs.has(slug.toLowerCase())) continue;
    seen.add(slug);
    computed.push(liveOnlyDeveloper(l, ledger));
  }
  // curated dossiers first (hand-reviewed), then the computed rest by delivery
  computed.sort((a, b) => b.performance.delivered - a.performance.delivered);
  cache = [...curated, ...computed];
  console.log(`[developers] resolved ${cache.length} (${curated.length} curated + ${computed.length} computed from filings)`);
  return cache;
}

export async function resolveDeveloperBySlug(slug: string): Promise<DeveloperIntel | undefined> {
  return (await resolveDevelopers()).find((d) => d.slug === slug);
}
