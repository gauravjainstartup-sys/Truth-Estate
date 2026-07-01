import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MARKETS, marketBySlug } from "@/lib/markets";
import MarketProfile from "@/components/intelligence/MarketProfile";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export function generateStaticParams() {
  return MARKETS.map((m) => ({ slug: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = marketBySlug(slug);
  if (!m) return { title: "Location Intelligence — Truth Estate" };
  return {
    title: `${m.name} — Location Intelligence | Truth Estate`,
    description: `Independent intelligence on ${m.name}, Gurugram: verdict, project count, price band, current and future trends, and the projects we track. ${m.info}`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = marketBySlug(slug);
  if (!m) notFound();

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Locations", path: "/intelligence/markets" },
    { name: m.name, path: `/intelligence/markets/${m.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <MarketProfile m={m} />
    </>
  );
}
