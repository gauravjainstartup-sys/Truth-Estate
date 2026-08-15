import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveDeveloperBySlug, resolveDevelopers } from "@/lib/developersLive";
import DeveloperProfile from "@/components/intelligence/DeveloperProfile";
import { breadcrumbLd, developerLd, ldJson } from "@/lib/seo";

export async function generateStaticParams() {
  // all 17 — curated dossiers + every developer computed from the filings
  return (await resolveDevelopers()).map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dev = await resolveDeveloperBySlug(slug);
  if (!dev) return { title: "Developer Intelligence" };
  return {
    alternates: { canonical: `/intelligence/developers/${dev.slug}` },
    title: `${dev.name}, Gurugram — Track Record & Financials`,
    description: `Independent developer intelligence on ${dev.name}: track record, delivery performance and financial health.${dev.tagline ? ` ${dev.tagline}` : ""}`,
    openGraph: {
      title: `${dev.name} — Gurugram Developer Intelligence`,
      description: `${dev.name}'s delivery track record and financial health, independently assessed. No paid rankings.`,
      url: `/intelligence/developers/${dev.slug}`,
      type: "profile",
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

  const devOrg = developerLd({
    name: dev.name,
    slug: dev.slug,
    est: dev.est || undefined,
    description: dev.tagline || undefined,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(devOrg)} />
      <DeveloperProfile dev={dev} />
    </>
  );
}
