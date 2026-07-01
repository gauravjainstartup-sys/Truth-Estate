import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COMPARE_PAIRS, resolvePair, compareTitle } from "@/lib/compare";
import ComparePage from "@/components/intelligence/ComparePage";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export function generateStaticParams() {
  return COMPARE_PAIRS.map((pair) => ({ pair }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const r = resolvePair(pair);
  if (!r) return { title: "Compare — Truth Estate Intelligence" };
  const title = compareTitle(r);
  return {
    title: `${title} — Compare | Truth Estate`,
    description: `Independent side-by-side comparison of ${title}: measured on the same evidence — score, signals, delivery, pricing and outlook. No paid rankings.`,
  };
}

export default async function Page({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const r = resolvePair(pair);
  if (!r) notFound();

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Compare", path: "/intelligence/compare" },
    { name: compareTitle(r), path: `/intelligence/compare/${pair}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <ComparePage r={r} />
    </>
  );
}
