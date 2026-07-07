import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECT_INTEL, projectBySlug, projectFaqs } from "@/lib/projects";
import {
  fetchBacklogFull,
  fetchBacklogNameIds,
  fetchConfigurations,
  fetchExtendedDetails,
  type LiveBacklogFull,
  type LiveConfiguration,
  type LiveExtendedDetails,
} from "@/lib/supabase";
import ProjectProfile from "@/components/intelligence/ProjectProfile";
import { liveProjectIntel } from "@/lib/liveReport";
import { breadcrumbLd, ldJson } from "@/lib/seo";

/* Two kinds of file share this route: the hand-built flagship dossiers
   (PROJECT_INTEL) and auto-generated pipeline files for every scored
   backlog project ("live-…" slugs, fetched at build time). Both render
   through the SAME original report UI — live rows are adapted onto the
   ProjectIntel shape and the report's own hide/NA behaviour covers
   whatever the pipeline hasn't extracted yet. The backlog is fetched
   once per build; a fetch failure simply means only the flagship pages
   exist in that deploy. */

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

/* the extended/config tables key on backlog_projects.id; join directly
   on the view row's id, else bridge through the project name — resolved
   per table so one table's match never masks the other's */
function lookupKey<T>(
  rowId: string,
  name: string,
  table: Record<string, T> | null,
  nameIds: Record<string, string> | null,
): string | null {
  if (!table) return null;
  if (table[rowId] !== undefined) return rowId;
  const alt = nameIds?.[name];
  return alt && table[alt] !== undefined ? alt : null;
}

/* A fully-populated SAMPLE file — the curated DLF Arbour dossier (all media:
   brochure, site map, payment plan, floor plans, construction, USPs) hosted at
   a distinct slug so it can sit beside the sparse live-… pipeline file as a
   "this is what a complete file looks like" reference. */
const SAMPLE_SLUG = "sample-dlf-the-arbour";
function sampleIntel() {
  const base = projectBySlug("dlf-arbour");
  return base ? { ...base, slug: SAMPLE_SLUG, name: "DLF The Arbour" } : undefined;
}

export async function generateStaticParams() {
  const flagship = PROJECT_INTEL.map((p) => ({ slug: p.slug }));
  const rows = await backlog();
  // join record in the build log: direct id hits vs name-bridged hits
  const [ext, cfg, nameIds] = [await extended(), await configurations(), await backlogNameIds()];
  if (rows && (ext || cfg)) {
    let direct = 0, bridged = 0;
    for (const r of rows) {
      const eK = lookupKey(r.id, r.name, ext, nameIds);
      const cK = lookupKey(r.id, r.name, cfg, nameIds);
      if (eK === r.id || cK === r.id) direct++;
      else if (eK || cK) bridged++;
    }
    console.log(`[supabase] extended/config join → direct ${direct} · name-bridged ${bridged} · unmatched ${rows.length - direct - bridged} (of ${rows.length} scored)`);
  }
  const flagshipSlugs = new Set(flagship.map((f) => f.slug));
  const live = (rows ?? [])
    .filter((r) => !flagshipSlugs.has(r.slug))
    .map((r) => ({ slug: r.slug }));
  return [...flagship, ...live, { slug: SAMPLE_SLUG }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === SAMPLE_SLUG) {
    return {
      title: "DLF The Arbour (Sample) — Project Intelligence | Truth Estate",
      description:
        "A fully-populated sample project file — brochure, site map, payment plan and floor plans — on the standard Truth Estate report layout.",
      robots: { index: false, follow: false },
      alternates: { canonical: `/intelligence/projects/${SAMPLE_SLUG}` },
    };
  }
  const p = projectBySlug(slug);
  if (p) {
    return {
      title: `${p.name} — Project Intelligence | Truth Estate`,
      description: `Independent Truth Score (${p.truthScore}/100) for ${p.name} by ${p.developer}, ${p.market}: developer track record, financial audit, construction velocity, legal & RERA signals, location intelligence and projected ROI. ${p.reason}`,
      alternates: { canonical: `/intelligence/projects/${p.slug}` },
    };
  }
  const rows = await backlog();
  const live = rows?.find((r) => r.slug === slug);
  if (!live) return { title: "Project Intelligence — Truth Estate" };
  return {
    title: `${live.name} — Pipeline File | Truth Estate`,
    description: `Auto-generated independent read on ${live.name}${live.developer ? ` by ${live.developer}` : ""}${live.truthScore != null ? ` — Truth Score ${live.truthScore}/100` : ""}: delivery risk, construction pace, legal and financial signals from RERA filings and public records.`,
    alternates: { canonical: `/intelligence/projects/${slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = slug === SAMPLE_SLUG ? sampleIntel() : projectBySlug(slug);

  if (!p) {
    const rows = await backlog();
    const live = rows?.find((r) => r.slug === slug);
    if (!live) notFound();
    const liveBreadcrumb = breadcrumbLd([
      { name: "Home", path: "" },
      { name: "Intelligence", path: "/intelligence" },
      { name: "Projects", path: "/intelligence/projects" },
      { name: live.name, path: `/intelligence/projects/${slug}` },
    ]);
    const [ext, cfg, nameIds] = [await extended(), await configurations(), await backlogNameIds()];
    const extKey = lookupKey(live.id, live.name, ext, nameIds);
    const cfgKey = lookupKey(live.id, live.name, cfg, nameIds);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(liveBreadcrumb)} />
        <ProjectProfile p={liveProjectIntel(live, extKey ? ext![extKey] : null, cfgKey ? cfg![cfgKey] : null)} />
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
      <ProjectProfile p={p} />
    </>
  );
}
