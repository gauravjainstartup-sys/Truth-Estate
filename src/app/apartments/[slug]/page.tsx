import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APARTMENT_CLUSTERS, apartmentClusterBySlug } from "@/lib/apartmentClusters";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { buildScoredProjectIntel } from "@/lib/compareData";
import { fetchTrackedStats } from "@/lib/supabase";
import type { ProjectIntel } from "@/lib/projects";
import { breadcrumbLd, collectionLd, ldJson } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return APARTMENT_CLUSTERS.map((c) => ({ slug: c.slug }));
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
        crumb={cluster.title}
        heading={cluster.h1}
        intro={cluster.intro}
      />

      {/* Light-Themed FAQ & Ground Intelligence Section at Bottom (GEO & AI Snippet Optimization) */}
      {cluster.faqs && cluster.faqs.length > 0 && (
        <section aria-labelledby="faq-heading" className="bg-[#fbf8f2] border-t border-[#1a1a1a]/10 pb-24 pt-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
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
