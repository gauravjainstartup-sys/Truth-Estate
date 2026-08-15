import type { Metadata } from "next";
import MarketsIndex from "@/components/intelligence/MarketsIndex";
import { fetchTrackedOverview } from "@/lib/supabase";
import { marketCards, uncoveredMarkets } from "@/lib/marketsLive";
import { MARKETS } from "@/lib/markets";
import { collectionLd, ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/markets" },
  title: "Gurugram Real Estate Markets & Corridors",
  description:
    "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook. No paid rankings.",
  openGraph: {
    title: "Gurugram Real Estate Markets & Corridors",
    description: "Every Gurugram micro-market mapped — project counts, price bands and outlook. Independent, no paid rankings.",
    url: "/intelligence/markets",
    type: "website",
  },
};

/* Corridor numbers are resolved against the pipeline at build time; the
   prose stays curated. Unreachable backend simply leaves the curated
   values standing and hides the coverage strip. */
export default async function Page() {
  const [markets, uncovered, overview] = await Promise.all([marketCards(), uncoveredMarkets(), fetchTrackedOverview()]);
  const ld = collectionLd({
    name: "Gurugram Real Estate Markets & Corridors",
    description: "The Gurugram micro-markets and corridors Truth Estate tracks, with price bands and outlook.",
    path: "/intelligence/markets",
    items: MARKETS.map((m) => ({ name: `${m.name}, Gurugram`, path: `/intelligence/markets/${m.slug}` })),
  });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(ld)} />
      <MarketsIndex markets={markets} uncovered={uncovered} overview={overview} />
    </>
  );
}
