import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEVELOPERS, developerBySlug } from "@/lib/developers";
import { resolveDeveloperBySlug } from "@/lib/developersLive";
import DeveloperProfile from "@/components/intelligence/DeveloperProfile";
import { breadcrumbLd, ldJson } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return DEVELOPERS.map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dev = developerBySlug(slug);
  if (!dev) return { title: "Developer Intelligence" };
  const title = `${dev.name} Gurugram — Track Record, Delivery & Financial Audit`;
  const desc = `Independent developer intelligence on ${dev.name}: track record, delivery performance and financial health. ${dev.tagline}`;
  return {
    alternates: { canonical: `/intelligence/developers/${dev.slug}` },
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `/intelligence/developers/${dev.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  /* The ledger comes from the filings, the prose from the desk — see
     lib/developersLive.ts for what had drifted and by how much. */
  const dev = await resolveDeveloperBySlug(slug);
  if (!dev) notFound();

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Developers", path: "/intelligence/developers" },
    { name: dev.name, path: `/intelligence/developers/${dev.slug}` },
  ]);

  const devLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    "@id": `${SITE_URL}/intelligence/developers/${dev.slug}#organization`,
    name: dev.name,
    url: `${SITE_URL}/intelligence/developers/${dev.slug}`,
    description: dev.about || dev.tagline,
    areaServed: { "@type": "City", name: "Gurugram" },
    knowsAbout: ["Real estate development", "Gurugram residential projects", "RERA compliance"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(devLd)} />
      <DeveloperProfile dev={dev} />
    </>
  );
}
