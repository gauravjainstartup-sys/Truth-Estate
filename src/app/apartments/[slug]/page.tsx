import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { activeApartmentClusters, apartmentClusterBySlug, MIN_CLUSTER_PROJECTS, unitEntryPriceCr } from "@/lib/apartmentClusters";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import ClusterCTA from "@/components/apartments/ClusterCTA";
import { projectHref } from "@/lib/projectHref";
import { buildScoredProjectIntel } from "@/lib/compareData";
import { fetchTrackedStats } from "@/lib/supabase";
import type { ProjectIntel } from "@/lib/projects";
import { breadcrumbLd, collectionLd, ldJson } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/* Only clusters with something to list get a page (MIN_CLUSTER_PROJECTS).
   dynamicParams=false below turns the rest into 404s rather than empty
   listings — a thin page is worse for the reader and for the index than
   no page. A cluster comes back automatically once the data fills in. */
export async function generateStaticParams() {
  const intel = await buildScoredProjectIntel();
  return activeApartmentClusters(Object.values(intel)).map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const cluster = apartmentClusterBySlug(slug);
  if (!cluster) return { title: "Apartment Intelligence | Truth Estate" };

  const canonicalUrl = `${SITE_URL}/apartments/${cluster.slug}`;

  return {
    title: cluster.title,
    description: cluster.description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: cluster.title,
      description: cluster.description,
      url: canonicalUrl,
      siteName: "Truth Estate",
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: cluster.title,
      description: cluster.description,
    },
    keywords: [
      cluster.h1,
      `${cluster.h1} 2026`,
      "Gurugram luxury apartments",
      "TruthScore audited apartments",
      "RERA verified projects Gurugram",
      "Gurugram property price per sq ft",
      "Dwarka Expressway apartments",
      "Golf Course Extension Road residences",
      "SPR luxury apartments",
    ],
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cluster = apartmentClusterBySlug(slug);
  if (!cluster) notFound();

  const [intelMap, stats] = await Promise.all([
    buildScoredProjectIntel(),
    fetchTrackedStats(),
  ]);

  const allProjects = Object.values(intelMap);
  const projects: ProjectIntel[] = allProjects.filter(cluster.match);
  if (projects.length < MIN_CLUSTER_PROJECTS) notFound();

  /* ── Conversion furniture, computed from THIS cluster's set ────────
     The stat row must describe the list below it (the global universe's
     numbers on a filtered page read as a mismatch even when correct),
     and the CTA band leads with the cluster's strongest file — the
     first report is ₹0, so the lowest-friction next step is proof,
     not a form. */
  const top = [...projects].sort((a, b) => b.truthScore - a.truthScore)[0];
  /* Everything money on this page quotes THE PAGE'S UNIT — the 4 BHK's
     filed layout at the project's filed rate — never the project's
     cheapest config wearing the wrong label. unitEntryPriceCr returns
     null rather than guessing; unpriced projects still list, they just
     sit outside the bucket chips. */
  const unitPrice = new Map(projects.map((p) => [p.slug, unitEntryPriceCr(p, cluster.config)]));
  const priced = [...unitPrice.values()].filter((v): v is number => v != null && v > 0);
  const cr = (v: number) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
  const unitWord = cluster.config ? `${cluster.h1.match(/penthouse/i) ? "penthouse" : cluster.config.toUpperCase().replace(" BHK", " BHK")} unit` : "entry";
  const metaLine = [
    `${projects.length} audited files`,
    priced.length ? `${unitWord} ₹${cr(Math.min(...priced))}–${cr(Math.max(...priced))} Cr` : null,
    "filed rates, not broker quotes",
    "no developer pays to rank",
  ].filter(Boolean).join(" · ");

  /* Fixed rupee bands, chips shown only where projects actually sit.
     Buckets price the page's unit (founder: "for 4 BHK unit only, not
     the project"). */
  const EDGES = [3, 5, 8, 12];
  const bucketLabel = (v: number) => {
    if (v < EDGES[0]) return `Under ₹${EDGES[0]} Cr`;
    for (let i = 0; i < EDGES.length - 1; i++) if (v < EDGES[i + 1]) return `₹${EDGES[i]}–${EDGES[i + 1]} Cr`;
    return `₹${EDGES[EDGES.length - 1]} Cr+`;
  };
  const of: Record<string, string> = {};
  const counts = new Map<string, number>();
  for (const p of projects) {
    const v = unitPrice.get(p.slug);
    if (v == null || v <= 0) continue;
    const label = bucketLabel(v);
    of[p.slug] = label;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const ORDER = [`Under ₹${EDGES[0]} Cr`, ...EDGES.slice(0, -1).map((e, i) => `₹${e}–${EDGES[i + 1]} Cr`), `₹${EDGES[EDGES.length - 1]} Cr+`];
  const priceChips = {
    labels: ORDER.filter((l) => (counts.get(l) ?? 0) > 0).map((l) => ({ label: l, count: counts.get(l)! })),
    of,
  };

  const breadcrumbs = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Apartments", path: "/intelligence/projects" },
    { name: cluster.title, path: `/apartments/${cluster.slug}` },
  ]);

  const ld = collectionLd({
    name: cluster.title,
    description: cluster.description,
    path: `/apartments/${cluster.slug}`,
    items: projects.map((p) => ({ name: p.name, path: `/projects/${p.slug}` })),
  });

  const faqLd = cluster.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: cluster.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbs)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(ld)} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <ProjectsIndex
        projects={projects}
        stats={stats}
        /* The h1, never the meta title — the title tag read as debris
           in a breadcrumb. */
        crumb={cluster.h1}
        heading={cluster.h1}
        intro={cluster.intro}
        dense
        metaLine={metaLine}
        priceChips={priceChips}
        feedSlot={top ? {
          /* Seventh cell: six real options first, then the next step —
             in-feed is where marketplace surfaces convert, and it costs
             the fold nothing. */
          after: 6,
          node: (
            <ClusterCTA
              clusterSlug={cluster.slug}
              topName={top.name}
              topHref={projectHref(top)}
              topScore={top.truthScore}
              pricePage={cluster.pricePage}
            />
          ),
        } : undefined}
      />

      {/* Light-Themed FAQ & Ground Intelligence Section at Bottom (GEO & AI Snippet Optimization) */}
      {cluster.faqs && cluster.faqs.length > 0 && (
        <section aria-labelledby="faq-heading" className="bg-[#fbf8f2] border-t border-[#1a1a1a]/10 pb-24 pt-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* AG's editorial intro lives HERE now, not above the grid:
                  it earns its keep as context under the list (and for
                  crawlers, position is irrelevant) instead of costing the
                  fold on a phone. */}
              <p className="mb-10 max-w-2xl text-[0.95rem] font-light leading-[1.85] text-[#1a1a1a]/60">
                {cluster.intro}
              </p>
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#9a7a2e]">
                Frequently Answered Intelligence
              </span>
              <h2 id="faq-heading" className="mt-2 font-serif text-[1.8rem] font-medium text-[#1a1a1a]">
                Questions Buyers Ask About {cluster.h1}
              </h2>
              <div className="mt-6 divide-y divide-[#1a1a1a]/10 rounded-lg border border-[#1a1a1a]/10 bg-white shadow-xs">
                {cluster.faqs.map((faq, i) => (
                  <div key={i} className="p-6">
                    <h3 className="font-serif text-[1.05rem] font-medium text-[#1a1a1a]">
                      {faq.q}
                    </h3>
                    <p className="mt-2 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/65">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
