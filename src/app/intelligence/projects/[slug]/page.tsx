import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectBySlug, projectFaqs, trackedRankOf } from "@/lib/projects";
import {
  fetchBacklogFull,
  fetchBacklogNameIds,
  fetchConfigurations,
  fetchCorridorPsf,
  fetchExtendedDetails,
  type LiveBacklogFull,
  type LiveConfiguration,
  type LiveExtendedDetails,
} from "@/lib/supabase";
import ProjectProfile from "@/components/intelligence/ProjectProfile";
import { liveProjectIntel } from "@/lib/liveReport";
import { breadcrumbLd, ldJson } from "@/lib/seo";

/* ONE URL per project: /intelligence/projects/<slugified DB name>. Every
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
function sampleIntel() {
  const base = projectBySlug("dlf-arbour");
  return base ? { ...base, slug: SAMPLE_SLUG, name: "DLF The Arbour" } : undefined;
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
  if (slug.startsWith("live-")) {
    const bare = slug.slice(5);
    if (rows?.some((r) => r.slug === bare)) return bare;
  }
  if (slug in RETIRED_CURATED) {
    const t = RETIRED_CURATED[slug];
    return t && rows?.some((r) => r.slug === t) ? t : null;
  }
  return undefined;
}

const BASE = "/Truth-Estate";
/* The old address keeps working: rel=canonical carries the SEO equity to the
   new URL and the script hops humans there instantly; the visible link covers
   anything that doesn't run scripts. GitHub Pages cannot 301 — this is the
   static-host equivalent. */
function LegacyStub({ href }: { href: string }) {
  return (
    <div data-legacy-stub className="mx-auto max-w-xl px-6 py-28 text-center">
      <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(href)})` }} />
      <p className="text-[0.8rem] font-light text-[#1a1a1a]/55">This report moved to a new address.</p>
      <a href={href} className="mt-3 inline-block text-[0.95rem] font-medium text-[#1e6b45] underline underline-offset-4">
        Continue to the report →
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
  const live = (rows ?? []).map((r) => ({ slug: r.slug }));
  // every old address survives as a redirect stub
  const liveSlugSet = new Set((rows ?? []).map((r) => r.slug));
  const stubs = (rows ?? []).map((r) => ({ slug: `live-${r.slug}` }));
  for (const s of Object.keys(RETIRED_CURATED)) if (!liveSlugSet.has(s)) stubs.push({ slug: s });
  console.log(`[urls] project pages:${live.length} · legacy stubs:${stubs.length} · +sample`);
  return [...live, ...stubs, { slug: SAMPLE_SLUG }, { slug: SAMPLE_LEGACY }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === SAMPLE_SLUG) {
    return {
      title: "Sample read — Project Intelligence | Truth Estate",
      description:
        "A fully-populated sample project read — every forensic pillar, the price journey, ROI model and verdict — on the standard Truth Estate report layout. Watermarked as a sample.",
      robots: { index: false, follow: false },
      alternates: { canonical: `/intelligence/projects/${SAMPLE_SLUG}` },
    };
  }
  if (slug === SAMPLE_LEGACY) {
    return {
      title: "Sample read — Truth Estate",
      robots: { index: false, follow: false },
      alternates: { canonical: `/intelligence/projects/${SAMPLE_SLUG}` },
    };
  }
  const rows = await backlog();
  const live = rows?.find((r) => r.slug === slug);
  if (live) {
    return {
      title: `${live.name} — Project Intelligence | Truth Estate`,
      description: `Independent read on ${live.name}${live.developer ? ` by ${live.developer}` : ""}${live.truthScore != null ? ` — Truth Score ${live.truthScore}/100` : ""}: delivery risk, construction pace, legal and financial signals from RERA filings and public records.`,
      alternates: { canonical: `/intelligence/projects/${slug}` },
    };
  }
  const target = await legacyTarget(slug);
  if (target !== undefined) {
    // moved address: the canonical carries the equity to the new URL
    return {
      title: "Report moved — Truth Estate",
      alternates: { canonical: target ? `/intelligence/projects/${target}` : "/intelligence/projects" },
    };
  }
  return { title: "Project Intelligence — Truth Estate" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // the old sample address redirects to the clean /sample-read
  if (slug === SAMPLE_LEGACY) return <LegacyStub href={`${BASE}/intelligence/projects/${SAMPLE_SLUG}`} />;
  const p = slug === SAMPLE_SLUG ? sampleIntel() : undefined;

  if (!p) {
    const rows = await backlog();
    const live = rows?.find((r) => r.slug === slug);
    if (!live) {
      const target = await legacyTarget(slug);
      if (target === undefined) notFound();
      return <LegacyStub href={target ? `${BASE}/intelligence/projects/${target}` : `${BASE}/intelligence/projects`} />;
    }
    const liveBreadcrumb = breadcrumbLd([
      { name: "Home", path: "" },
      { name: "Intelligence", path: "/intelligence" },
      { name: "Projects", path: "/intelligence/projects" },
      { name: live.name, path: `/intelligence/projects/${slug}` },
    ]);
    const [ext, cfg, nameIds, corridorPsf] = [await extended(), await configurations(), await backlogNameIds(), await fetchCorridorPsf()];
    const extKey = lookupKey(live.id, live.name, ext, nameIds, live.altIds);
    const cfgKey = lookupKey(live.id, live.name, cfg, nameIds, live.altIds);
    const intel = {
      ...liveProjectIntel(live, extKey ? ext![extKey] : null, cfgKey ? cfg![cfgKey] : null, corridorPsf),
      trackedRank: trackedRankOf(live.truthScore, await liveScores()),
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(liveBreadcrumb)} />
        <ProjectProfile p={intel} />
      </>
    );
  }

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Projects", path: "/intelligence/projects" },
    { name: p.name, path: `/intelligence/projects/${p.slug}` },
  ]);

  /* The Truth Score is our independent assessment of a third-party
     development — modelled as a Product review so Google and AI engines can
     read the rating (out of 100) and who stands behind it. */
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    category: "Residential real estate",
    brand: { "@type": "Organization", name: p.developer },
    description: p.reason,
    review: {
      "@type": "Review",
      name: `Truth Score for ${p.name}`,
      reviewRating: { "@type": "Rating", ratingValue: p.truthScore, bestRating: 100, worstRating: 0 },
      author: { "@type": "Organization", name: "Truth Estate" },
      reviewBody: p.reason,
    },
  };

  /* Forensic FAQ as FAQPage schema — a strong GEO/AI-answer surface so LLMs
     and Google can cite our independent read directly. */
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: projectFaqs(p).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(productLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLd)} />
      {/* the sample dossier ranks against the same live set as real pages;
         `sample` renders it watermarked and never paywalled */}
      <ProjectProfile p={{ ...p, trackedRank: trackedRankOf(p.truthScore, await liveScores()) }} sample />
    </>
  );
}
