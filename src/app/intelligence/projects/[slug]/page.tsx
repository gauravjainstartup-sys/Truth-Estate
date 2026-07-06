import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECT_INTEL, projectBySlug, projectFaqs } from "@/lib/projects";
import {
  fetchBacklogFull,
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

export async function generateStaticParams() {
  const flagship = PROJECT_INTEL.map((p) => ({ slug: p.slug }));
  const rows = await backlog();
  // one-line join record in the build log: how many live rows carry media/config data
  const [ext, cfg] = [await extended(), await configurations()];
  if (rows && (ext || cfg)) {
    const hits = rows.filter((r) => ext?.[r.id] || cfg?.[r.id]).length;
    console.log(`[supabase] extended/config join → ${hits}/${rows.length} scored projects matched`);
  }
  const flagshipSlugs = new Set(flagship.map((f) => f.slug));
  const live = (rows ?? [])
    .filter((r) => !flagshipSlugs.has(r.slug))
    .map((r) => ({ slug: r.slug }));
  return [...flagship, ...live];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
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
  const p = projectBySlug(slug);

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
    const [ext, cfg] = [await extended(), await configurations()];
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(liveBreadcrumb)} />
        <ProjectProfile p={liveProjectIntel(live, ext?.[live.id] ?? null, cfg?.[live.id] ?? null)} />
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
