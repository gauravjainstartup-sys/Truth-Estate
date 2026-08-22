import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectFaqs, trackedRankOf } from "@/lib/projects";
import { sampleProjectIntel } from "@/lib/sampleProject";
import {
  fetchBacklogFull,
  fetchBacklogNameIds,
  fetchConfigurations,
  fetchCorridorPsf,
  fetchProjectPillars,
  fetchExtendedDetails,
  fetchDeveloperLedger,
  fetchProjectWire,
  devKey,
  type LiveBacklogFull,
  type LiveConfiguration,
  type LiveExtendedDetails,
} from "@/lib/supabase";
import ProjectProfile from "@/components/intelligence/ProjectProfile";
import LiveProjectProfile from "@/components/intelligence/LiveProjectProfile";
import { getProjectSeoMeta } from "@/lib/seoCategoryGrowth";
import { liveProjectIntel } from "@/lib/liveReport";
import { latestWireUpdate } from "@/lib/reportAdapter";
import { breadcrumbLd, ldJson } from "@/lib/seo";
import { relatedProjects } from "@/lib/relatedProjects";
import { avgSlippageFromLedger } from "@/lib/developers";
import { basePath as BASE, SITE_URL } from "@/lib/site";

/* ONE URL per project: /projects/<seo slug>, the address truthestate.in
   has been serving and Google has indexed — see seoSlug() in lib/supabase.
   Moved here from /intelligence/projects/<db name> so the domain can
   migrate to this build without every ranking URL 404ing; the old
   address survives as a redirect stub, the same device already used for
   the retired curated URLs below. The DB-name slug remains the internal
   id for events, entitlements and the brief — only the URL changed. Every
   page here is the pipeline file for a v3 row (the DB name is the source
   of truth), rendered through the original report UI with hide/NA covering
   whatever the pipeline hasn't extracted yet. Around that single structure:
   · legacy addresses (the old live-<slug> form and the two retired curated
     URLs) render as tiny redirect stubs — canonical + instant client
     redirect — because GitHub Pages cannot 301;
   · the one curated SAMPLE dossier stays at its noindexed sample-… slug.
   The backlog is fetched once per build; a fetch failure means only the
   sample page exists in that deploy. */

let backlogCache: LiveBacklogFull[] | null | undefined;
async function backlog(): Promise<LiveBacklogFull[] | null> {
  if (backlogCache === undefined) backlogCache = await fetchBacklogFull();
  return backlogCache;
}

/* extended details + configurations join the backlog rows on
   backlog_id = backlog row id; fetched once per build, fail-soft */
let extCache: Record<string, LiveExtendedDetails> | null | undefined;
async function extended(): Promise<Record<string, LiveExtendedDetails> | null> {
  if (extCache === undefined) extCache = await fetchExtendedDetails();
  return extCache;
}
let cfgCache: Record<string, LiveConfiguration[]> | null | undefined;
/* The Truth Score's own pillar breakdown, keyed by backlog id. Fetched
   once per build like the other seams. */
let pillarCache: Record<string, import("@/lib/supabase").LivePillarSet> | null | undefined;
async function truthPillars() {
  if (pillarCache === undefined) pillarCache = await fetchProjectPillars();
  return pillarCache;
}
/* The developer's full project ledger, keyed by normalised developer name.
   Fetched once per build like the other seams; attached to the developer on
   each report so Developer DNA can list the whole RERA portfolio. */
let ledgerCache: Record<string, import("@/lib/developers").DevLedgerItem[]> | null | undefined;
async function developerLedger() {
  if (ledgerCache === undefined) ledgerCache = await fetchDeveloperLedger();
  return ledgerCache;
}

async function configurations(): Promise<Record<string, LiveConfiguration[]> | null> {
  if (cfgCache === undefined) cfgCache = await fetchConfigurations();
  return cfgCache;
}
let nameIdCache: Record<string, string> | null | undefined;
async function backlogNameIds(): Promise<Record<string, string> | null> {
  if (nameIdCache === undefined) nameIdCache = await fetchBacklogNameIds();
  return nameIdCache;
}

/* every scored live row — the honest basis for the hero card's
   "Top N% / Ranks N of M tracked projects" line (founder call: the live
   set only, never the curated dossiers) */
async function liveScores(): Promise<number[]> {
  const rows = await backlog();
  return (rows ?? [])
    .map((r) => r.truthScore)
    .filter((s): s is number => typeof s === "number" && s > 0);
}

/* the extended/config tables key on backlog_projects.id; join directly
   on the view row's id, else bridge through the project name — resolved
   per table so one table's match never masks the other's */
function lookupKey<T>(
  rowId: string,
  name: string,
  table: Record<string, T> | null,
  nameIds: Record<string, string> | null,
  altIds: string[] = [],
): string | null {
  if (!table) return null;
  if (table[rowId] !== undefined) return rowId;
  // a duplicate row's data may be filed under a collapsed sibling's id
  for (const a of altIds) if (table[a] !== undefined) return a;
  const alt = nameIds?.[name];
  return alt && table[alt] !== undefined ? alt : null;
}

/* A fully-populated SAMPLE file — the curated DLF Arbour dossier (all media:
   brochure, site map, payment plan, floor plans, construction, USPs) hosted at
   a distinct slug so it can sit beside the sparse live-… pipeline file as a
   "this is what a complete file looks like" reference. It renders with the
   `sample` flag: watermarked "sample read" and never paywalled — the free
   showcase reached from the locked report's "check a sample read" CTA. */
const SAMPLE_SLUG = "sample-read";
const SAMPLE_LEGACY = "sample-dlf-the-arbour"; // the old address → redirect stub
/* An invented project — see lib/sampleProject.ts. It used to be DLF The
   Arbour with the paywall switched off, which published one real
   developer's entire forensic audit, litigation read included, at a free
   URL. A sample is a marketing asset; it should not be an unpriced
   verdict on a named company. */
function sampleIntel() {
  return sampleProjectIntel();
}

/* ── legacy addresses ──
   Retired curated URLs → their pipeline twin, resolved against the actual
   rows so a DB rename self-heals; null = no twin (the stub points at the
   projects index). The other two curated slugs (dlf-privana-south,
   godrej-aristocrat) match their DB names exactly, so those URLs simply
   BECAME the pipeline pages — no stub needed. */
const RETIRED_CURATED: Record<string, string | null> = {
  "dlf-arbour": "dlf-the-arbour",
  "m3m-golf-estate-ii": null,
};
/* undefined = not a legacy address · null = stub to the index · string = new slug */
async function legacyTarget(slug: string): Promise<string | null | undefined> {
  const rows = await backlog();
  /* Legacy addresses were written against the internal slug, so they
     resolve through it and hand back the row's PUBLIC address. */
  if (slug.startsWith("live-")) {
    const bare = slug.slice(5);
    const hit = rows?.find((r) => r.slug === bare);
    if (hit) return hit.seoSlug;
  }
  if (slug in RETIRED_CURATED) {
    const t = RETIRED_CURATED[slug];
    const hit = t ? rows?.find((r) => r.slug === t) : undefined;
    return hit ? hit.seoSlug : null;
  }
  /* The address this build used before the move. */
  const internal = rows?.find((r) => r.slug === slug);
  if (internal) return internal.seoSlug;
  return undefined;
}

/* The old address keeps working: rel=canonical carries the SEO equity to the
   new URL and the script hops humans there instantly; the visible link covers
   anything that doesn't run scripts. GitHub Pages cannot 301 — this is the
   static-host equivalent. */
function LegacyStub({ href }: { href: string }) {
  return (
    <div data-legacy-stub className="mx-auto max-w-xl px-6 py-28 text-center">
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <p className="font-serif text-[1.25rem] font-medium text-[#1a1a1a]">Project Intelligence Report</p>
      <p className="mt-2 text-[0.85rem] font-light text-[#1a1a1a]/60">This report is hosted at its primary canonical address.</p>
      <a href={href} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1e6b45] px-5 py-2.5 text-[0.88rem] font-medium text-white shadow-sm hover:bg-[#165034]">
        Continue to Verified Report →
      </a>
    </div>
  );
}

export async function generateStaticParams() {
  const rows = await backlog();
  // join record in the build log: direct id hits vs name-bridged hits
  const [ext, cfg, nameIds] = [await extended(), await configurations(), await backlogNameIds()];
  if (rows && (ext || cfg)) {
    let direct = 0, bridged = 0;
    for (const r of rows) {
      const eK = lookupKey(r.id, r.name, ext, nameIds, r.altIds);
      const cK = lookupKey(r.id, r.name, cfg, nameIds, r.altIds);
      if (eK === r.id || cK === r.id) direct++;
      else if (eK || cK) bridged++;
    }
    console.log(`[supabase] extended/config join → direct ${direct} · name-bridged ${bridged} · unmatched ${rows.length - direct - bridged} (of ${rows.length} scored)`);
  }
  const live = (rows ?? []).map((r) => ({ slug: r.seoSlug }));
  // every old address survives as a redirect stub — including the
  // db-name slug this build itself served until the move
  const seoSet = new Set((rows ?? []).map((r) => r.seoSlug));
  const stubs: { slug: string }[] = [];
  for (const r of rows ?? []) {
    if (!seoSet.has(r.slug)) stubs.push({ slug: r.slug });
    stubs.push({ slug: `live-${r.slug}` });
  }
  for (const s of Object.keys(RETIRED_CURATED)) if (!seoSet.has(s)) stubs.push({ slug: s });
  console.log(`[urls] project pages:${live.length} · legacy stubs:${stubs.length} · +sample`);
  return [...live, ...stubs, { slug: SAMPLE_SLUG }, { slug: SAMPLE_LEGACY }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === SAMPLE_SLUG) {
    return {
      title: "Sample read — Project Intelligence",
      description:
        "A fully-populated sample project read — every forensic pillar, the price journey, ROI model and verdict — on the standard Truth Estate report layout. The project, the developer and every figure are invented; no real project's paid read is published here.",
      robots: { index: false, follow: false },
      alternates: { canonical: `/projects/${SAMPLE_SLUG}` },
    };
  }
  if (slug === SAMPLE_LEGACY) {
    return {
      title: "Sample read",
      robots: { index: false, follow: false },
      alternates: { canonical: `/projects/${SAMPLE_SLUG}` },
    };
  }
  const rows = await backlog();
  const live = rows?.find((r) => r.seoSlug === slug || r.slug === slug || r.slug === slug.replace(/^live-/, ""));
  if (live) {
    /* Category-design SEO copy — a buyer-intent title (≤60 chars) and meta
       description (≤155), curated per project with a deterministic 7-vector
       fallback for new ones. See src/lib/seoCategoryGrowth.ts (AG's engine). */
    const meta = getProjectSeoMeta({
      name: live.name,
      developer: live.developer,
      truthScore: live.truthScore,
      minPriceCr: live.minPriceCr,
      seoSlug: live.seoSlug,
    });
    /* Social cards lead with the project's latest verified ground event (AG's
       OG-freshness pass) — a share on WhatsApp/LinkedIn shows this month's
       milestone instead of evergreen copy. The SEARCH description stays
       meta.description: the curated buyer-intent copy is what should rank. */
    const wire = await fetchProjectWire(slug);
    const topWire = wire.find((w) => w.isPinned) ?? wire[0];
    const ogDesc = topWire
      ? `${topWire.headline} — ${topWire.forensicImpactSummary || meta.description}`.slice(0, 220)
      : meta.description;
    return {
      /* Absolute so the layout's "… | Truth Estate" template can't double up —
         meta.title already reads as a finished headline. */
      title: { absolute: meta.title },
      description: meta.description,
      alternates: { canonical: `/projects/${slug}` },
      /* Per-report OG/Twitter so each of the 97 cards is distinct. Kept from
         before — AG's branch dropped the article type and the twitter card;
         a distinct social card is worth keeping alongside the new copy. */
      openGraph: {
        type: "article",
        title: meta.title,
        description: ogDesc,
        url: `/projects/${slug}`,
      },
      twitter: { card: "summary_large_image", title: meta.title, description: ogDesc },
    };
  }
  const target = await legacyTarget(slug);
  if (target !== undefined) {
    // moved address: the canonical carries the equity to the new URL
    return {
      title: "Report moved",
      alternates: { canonical: target ? `/projects/${target}` : "/intelligence/projects" },
    };
  }
  return { title: "Project Intelligence" };
}

/* ── Page-level structured data ───────────────────────────────────
   Both of these were built inside the SAMPLE branch and rendered only
   there, so all 97 real reports shipped BreadcrumbList and nothing else —
   no rating for Google to read, and no FAQ for an answer engine to quote.
   Lifted out so the live pages, which are the ones that rank, get them
   too. */

/* The Truth Score is our independent assessment of a third-party
   development — modelled as a Product review so Google and AI engines can
   read the rating (out of 100) and who stands behind it. */
function productLdFor(p: { name: string; developer?: string | null; reason?: string | null; truthScore?: number | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    category: "Residential real estate",
    ...(p.developer ? { brand: { "@type": "Organization", name: p.developer } } : {}),
    ...(p.reason ? { description: p.reason } : {}),
    /* Omitted rather than sent as null when a project has not been scored */
    ...(p.truthScore != null
      ? {
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Truth Score",
              value: p.truthScore,
              maxValue: 100,
              unitText: "points",
            },
          ],
          review: {
            "@type": "Review",
            name: `Truth Estate Assessment — ${p.name}`,
            // NOTE: no `itemReviewed` here — this Review is nested inside the
            // Product it reviews, so the reviewed item is implicit. Setting it
            // made Google parse the inner node as a phantom 2nd Product with no
            // review, triggering the "offers/review/aggregateRating" warning.
            reviewRating: {
              "@type": "Rating",
              ratingValue: p.truthScore,
              bestRating: 100,
              worstRating: 0,
            },
            author: {
              "@type": "Organization",
              name: "Truth Estate Advisory",
              url: SITE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "Truth Estate",
              url: SITE_URL,
            },
            ...(p.reason ? { reviewBody: p.reason } : {}),
          },
        }
      : {}),
  };
}

/* Forensic FAQ as FAQPage schema — a strong GEO/AI-answer surface so LLMs
   and Google can cite our independent read directly. */
function faqLdFor(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/* ── News & Updates as structured data (AG's backend SEO pass, ported) ──
   The same wire log the report renders and TruthGuide serves, exposed to
   crawlers: the full timeline as an ItemList, and the latest dispatch as a
   NewsArticle. Both render only when the project has events, and both key
   on the exact-slug matcher, so a report can never carry a sibling's news. */
type WireLite = import("@/lib/supabase").ProjectWireItem;

function timelineLdFor(wire: WireLite[], p: { name: string; seoSlug?: string | null }) {
  if (!wire.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${p.name} — Verified Ground Intelligence Timeline`,
    description: `Chronological forensic ground updates, structural milestones, pricing benchmarks and regulatory filings for ${p.name}.`,
    itemListElement: wire.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.headline,
      description: (item.verifiedFacts || "").replace(/\n+/g, " ").trim(),
      url: `${SITE_URL}/projects/${p.seoSlug}`,
    })),
  };
}

function newsLdFor(wire: WireLite[], p: { name: string; seoSlug?: string | null }) {
  const top = wire.find((w) => w.isPinned) ?? wire[0];
  if (!top) return null;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: top.headline,
    description: top.forensicImpactSummary || (top.verifiedFacts || "").replace(/\n+/g, " ").trim(),
    datePublished: top.eventDate,
    /* The row's own last-edit time — a hardcoded build date would claim every
       article was freshly modified on every rebuild (freshness-faking). */
    dateModified: (top.updatedAt || "").slice(0, 10) || top.eventDate,
    mainEntityOfPage: `${SITE_URL}/projects/${p.seoSlug}`,
    author: { "@type": "Organization", name: "Truth Estate Forensic Intelligence", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Truth Estate", url: SITE_URL },
    articleBody: (top.verifiedFacts || "").replace(/\n+/g, " ").trim(),
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // The sample read is now a bottom sheet opened from the locked report — the
  // standalone page is retired. The sample address and its legacy alias both
  // redirect to the projects index.
  if (slug === SAMPLE_SLUG || slug === SAMPLE_LEGACY) return <LegacyStub href={`${BASE}/intelligence/projects`} />;
  // Retired above; the ternary stays only so the (now unreachable) sample-render
  // tail below keeps its types. slug is a string, so TS won't fold this to never.
  const p = slug === SAMPLE_SLUG ? sampleIntel() : undefined;

  if (!p) {
    const rows = await backlog();
    const live = rows?.find((r) => r.seoSlug === slug || r.slug === slug || r.slug === slug.replace(/^live-/, ""));
    if (!live) {
      const target = await legacyTarget(slug);
      if (target === undefined) notFound();
      return <LegacyStub href={target ? `${BASE}/projects/${target}` : `${BASE}/intelligence/projects`} />;
    }
    const liveBreadcrumb = breadcrumbLd([
      { name: "Home", path: "" },
      { name: "Intelligence", path: "/intelligence" },
      { name: "Projects", path: "/intelligence/projects" },
      { name: live.name, path: `/projects/${slug}` },
    ]);
    const [ext, cfg, nameIds, corridorPsf, pillarSets] = [await extended(), await configurations(), await backlogNameIds(), await fetchCorridorPsf(), await truthPillars()];
    const extKey = lookupKey(live.id, live.name, ext, nameIds, live.altIds);
    const cfgKey = lookupKey(live.id, live.name, cfg, nameIds, live.altIds);
    // the whole live scored set — the rank basis; passed to the overlay too so the
    // rank can recompute from this project's LIVE score without another fetch.
    const scores = await liveScores();
    const projectWire = await fetchProjectWire(slug);
    const intel = {
      ...liveProjectIntel(live, extKey ? ext![extKey] : null, cfgKey ? cfg![cfgKey] : null, corridorPsf, {
        /* The newest wire event joins the "last updated" candidates, so
           fresh News & Updates move the report's own updated date. */
        newsLatest: latestWireUpdate(projectWire),
      }),
      trackedRank: trackedRankOf(live.truthScore, scores),
      wireItems: projectWire,
      ...(pillarSets?.[live.id] ? { livePillars: pillarSets[live.id] } : {}),
    };
    /* Attach the developer's project ledger by matching the normalised
       developer name — the report reads it verbatim under Developer DNA. */
    const ledgerMap = await developerLedger();
    if (intel.liveDeveloper && ledgerMap) {
      const items = ledgerMap[devKey(intel.liveDeveloper.name)];
      if (items?.length) {
        // Avg slippage from the filed ledger, NOT the v3 row's stale
        // developer_avg_delay_months (null → "0 mo" on the report). Same
        // computation the developer page uses, so the report and the dossier
        // always agree. launched/delivered/ongoing/on-time stay from the row.
        const avg = avgSlippageFromLedger(items);
        intel.liveDeveloper = {
          ...intel.liveDeveloper,
          ledger: items,
          ...(avg != null ? { performance: { ...intel.liveDeveloper.performance, avgDelayMonths: avg } } : {}),
        };
      }
    }
    /* The FAQ schema is the PUBLIC view — search engines and anon readers —
       so gate the paid figures out of it (locked=true); the visible section
       re-derives ungated for an entitled reader client-side. */
    const liveFaqs = projectFaqs(intel, true);
    const timelineLd = timelineLdFor(intel.wireItems ?? [], live);
    const newsLd = newsLdFor(intel.wireItems ?? [], live);

    /* The brief-ranked section runs client-side, after a reader unlocks —
       so it never appeared in a prerendered page, and it was still reading
       the ten-project demo set. Same comparables the tabs above it use,
       built as full report records so the ranking and the links are real. */
    const related = relatedProjects(live, rows);
    const bySeo = new Map((rows ?? []).map((r) => [r.seoSlug, r]));
    const alternatives = related.all
      .map((a) => bySeo.get(a.seoSlug))
      .filter((r): r is NonNullable<typeof r> => !!r && r.id !== live.id)
      .map((r) => {
        const eK = lookupKey(r.id, r.name, ext, nameIds, r.altIds);
        const cK = lookupKey(r.id, r.name, cfg, nameIds, r.altIds);
        return liveProjectIntel(r, eK ? ext![eK] : null, cK ? cfg![cK] : null, corridorPsf);
      });

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(liveBreadcrumb)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(productLdFor(intel))} />
        {liveFaqs.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLdFor(liveFaqs))} />
        )}
        {timelineLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(timelineLd)} />
        )}
        {newsLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(newsLd)} />
        )}
        <LiveProjectProfile baked={intel} row={live} corridorPsf={corridorPsf} related={related} alternatives={alternatives} liveScores={scores} />
      </>
    );
  }

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Projects", path: "/intelligence/projects" },
    { name: p.name, path: `/projects/${p.slug}` },
  ]);

  /* No Product/Review or FAQPage schema here, unlike every real report.
     Both would be structured data describing a product that does not
     exist and a rating nobody issued — marking up invented facts as
     machine-readable claims is the definition of misleading structured
     data, whatever the page says in prose. The breadcrumb is fine: the
     page genuinely is where it says it is. */
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      {/* the sample dossier ranks against the same live set as real pages;
         `sample` renders it watermarked and never paywalled */}
      <ProjectProfile p={{ ...p, trackedRank: trackedRankOf(p.truthScore, await liveScores()) }} sample />
    </>
  );
}
