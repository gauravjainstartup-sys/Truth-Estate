import type { Metadata } from "next";
import MarketsIndex from "@/components/intelligence/MarketsIndex";
import { fetchTrackedOverview } from "@/lib/supabase";
import { marketCards, uncoveredMarkets } from "@/lib/marketsLive";
import { MARKETS } from "@/lib/markets";
import { SITE_URL } from "@/lib/site";
import { ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/markets" },
  title: "Gurugram Real Estate Market Intelligence & Corridor Trends",
  description:
    "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook. No paid rankings.",
  openGraph: {
    title: "Gurugram Real Estate Market Intelligence & Corridor Trends",
    description:
      "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook.",
    url: "/intelligence/markets",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gurugram Real Estate Market Intelligence & Corridor Trends",
    description:
      "Independent location intelligence for Gurugram real estate — every micro-market mapped, with price bands and outlook.",
  },
};

/* Corridor numbers are resolved against the pipeline at build time; the
   prose stays curated. Unreachable backend simply leaves the curated
   values standing and hides the coverage strip. */
export default async function Page() {
  const [markets, uncovered, overview] = await Promise.all([marketCards(), uncoveredMarkets(), fetchTrackedOverview()]);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Gurugram Real Estate Market Intelligence & Corridor Trends",
    description:
      "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook.",
    url: `${SITE_URL}/intelligence/markets`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: MARKETS.length,
      itemListElement: MARKETS.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: m.name,
        url: `${SITE_URL}/intelligence/markets/${m.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(collectionLd)} />
      <MarketsIndex markets={markets} uncovered={uncovered} overview={overview} />
    </>
  );
}
