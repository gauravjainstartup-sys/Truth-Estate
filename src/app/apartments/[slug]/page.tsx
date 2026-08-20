import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APARTMENT_CLUSTERS, apartmentClusterBySlug, clusterMetaOnly } from "@/lib/apartmentClusters";
import ApartmentClusterView from "@/components/apartments/ApartmentClusterView";
import { buildScoredProjectIntel } from "@/lib/compareData";
import type { ProjectIntel } from "@/lib/projects";
import { breadcrumbLd, ldJson } from "@/lib/seo";
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

  return {
    alternates: { canonical: `/apartments/${cluster.slug}` },
    title: cluster.title,
    description: cluster.description,
    openGraph: {
      title: cluster.title,
      description: cluster.description,
      url: `${SITE_URL}/apartments/${cluster.slug}`,
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cluster = apartmentClusterBySlug(slug);
  if (!cluster) notFound();

  const intelMap = await buildScoredProjectIntel();
  const allProjects = Object.values(intelMap);
  const projects: ProjectIntel[] = allProjects.filter(cluster.match);

  // Structured Data (JSON-LD) for SEO & GEO
  const breadcrumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Gurugram Apartments", path: "/intelligence/projects" },
    { name: cluster.h1, path: `/apartments/${cluster.slug}` },
  ]);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: cluster.h1,
    description: cluster.description,
    numberOfItems: projects.length,
    itemListElement: projects.slice(0, 20).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: p.name,
      url: `${SITE_URL}/projects/${p.slug}`,
      description: `${p.name} by ${p.developer} in ${p.market} — TruthScore ${p.truthScore}/100.`,
    })),
  };

  const faqLd = cluster.faqs && cluster.faqs.length ? {
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
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(itemListLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd) }} />}
      <ApartmentClusterView cluster={clusterMetaOnly(cluster)} projects={projects} />
    </>
  );
}
