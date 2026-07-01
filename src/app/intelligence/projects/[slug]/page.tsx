import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECT_INTEL, projectBySlug, projectFaqs } from "@/lib/projects";
import ProjectProfile from "@/components/intelligence/ProjectProfile";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export function generateStaticParams() {
  return PROJECT_INTEL.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return { title: "Project Intelligence — Truth Estate" };
  return {
    title: `${p.name} — Project Intelligence | Truth Estate`,
    description: `Independent Truth Score (${p.truthScore}/100) for ${p.name} by ${p.developer}, ${p.market}: developer track record, financial audit, construction velocity, legal & RERA signals, location intelligence and projected ROI. ${p.reason}`,
    alternates: { canonical: `/intelligence/projects/${p.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();

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
