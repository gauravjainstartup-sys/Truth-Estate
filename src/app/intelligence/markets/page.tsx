import type { Metadata } from "next";
import MarketsIndex from "@/components/intelligence/MarketsIndex";
import { fetchTrackedOverview } from "@/lib/supabase";
import { marketCards, uncoveredMarkets } from "@/lib/marketsLive";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/markets" },
  title: "Location Intelligence",
  description:
    "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook. No paid rankings.",
};

/* Corridor numbers are resolved against the pipeline at build time; the
   prose stays curated. Unreachable backend simply leaves the curated
   values standing and hides the coverage strip. */
export default async function Page() {
  const [markets, uncovered, overview] = await Promise.all([marketCards(), uncoveredMarkets(), fetchTrackedOverview()]);
  return <MarketsIndex markets={markets} uncovered={uncovered} overview={overview} />;
}
