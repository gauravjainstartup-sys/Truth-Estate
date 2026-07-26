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
import { relatedProjects } from "@/lib/relatedProjects";

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
        "A fully-populated sample project read — every forensic pillar, the price journey, ROI model and verdict — on the standard Truth Estate report layout. Watermarked as a sample.",
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
  const live = rows?.find((r) => r.seoSlug === slug);
  if (live) {
    const desc = `Independent read on ${live.name}${live.developer ? ` by ${live.developer}` : ""}${live.truthScore != null ? ` — Truth Score ${live.truthScore}/100` : ""}: delivery risk, construction pace, legal and financial signals from RERA filings and public records.`;
    return {
      /* No " | Truth Estate" here — the layout's title template already
         appends it, and having both produced "… | Truth Estate | Truth
         Estate" on all 97 reports. */
      title: `${live.name} — Project Intelligence`,
      description: desc,
      alternates: { canonical: `/projects/${slug}` },
      /* Without this every report inherited the site-wide OG title, so all
         97 shared one card: "Truth Estate — Independent Real Estate
         Advisory for NRI Investors". A shared social title is also a
         weaker signal to the engines that read them. */
      openGraph: {
        type: "article",
        title: `${live.name} — Project Intelligence`,
        description: desc,
        url: `/projects/${slug}`,
      },
      twitter: { card: "summary_large_image", title: `${live.name} — Project Intelligence`, description: desc },
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
    /* Omitted rather than sent as null when a project has not been scored:
       a Rating with no ratingValue is invalid structured data, and an
       invalid block can cost the whole page its rich result. */
    ...(p.truthScore != null
      ? {
          review: {
            "@type": "Review",
            name: `Truth Score for ${p.name}`,
            reviewRating: { "@type": "Rating", ratingValue: p.truthScore, bestRating: 100, worstRating: 0 },
            author: { "@type": "Organization", name: "Truth Estate" },
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

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // the old sample address redirects to the clean /sample-read
  if (slug === SAMPLE_LEGACY) return <LegacyStub href={`${BASE}/projects/${SAMPLE_SLUG}`} />;
  const p = slug === SAMPLE_SLUG ? sampleIntel() : undefined;

  if (!p) {
    const rows = await backlog();
    const live = rows?.find((r) => r.seoSlug === slug);
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
    const [ext, cfg, nameIds, corridorPsf] = [await extended(), await configurations(), await backlogNameIds(), await fetchCorridorPsf()];
    const extKey = lookupKey(live.id, live.name, ext, nameIds, live.altIds);
    const cfgKey = lookupKey(live.id, live.name, cfg, nameIds, live.altIds);
    const intel = {
      ...liveProjectIntel(live, extKey ? ext![extKey] : null, cfgKey ? cfg![cfgKey] : null, corridorPsf),
      trackedRank: trackedRankOf(live.truthScore, await liveScores()),
    };
    const liveFaqs = projectFaqs(intel);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(liveBreadcrumb)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(productLdFor(intel))} />
        {liveFaqs.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLdFor(liveFaqs))} />
        )}
        <ProjectProfile p={intel} related={relatedProjects(live, rows)} />
      </>
    );
  }

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Projects", path: "/intelligence/projects" },
    { name: p.name, path: `/projects/${p.slug}` },
  ]);

  const productLd = productLdFor(p);
  const faqLd = faqLdFor(projectFaqs(p));

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
