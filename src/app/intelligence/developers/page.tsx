import type { Metadata } from "next";
import DevelopersIndex from "@/components/intelligence/DevelopersIndex";
import { fetchDevelopersOverview } from "@/lib/supabase";
import { DEVELOPERS } from "@/lib/developers";
import { SITE_URL } from "@/lib/site";
import { ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/developers" },
  title: "Top Gurugram Developers — Ranked by Delivery & Financials",
  description:
    "Independent developer dossiers for Gurugram real estate — track record, RERA delivery performance and financial health. No paid rankings.",
  openGraph: {
    title: "Top Gurugram Developers — Ranked by Delivery & Financials",
    description:
      "Independent developer dossiers for Gurugram real estate — track record, delivery performance and financial health.",
    url: "/intelligence/developers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Gurugram Developers — Ranked by Delivery & Financials",
    description:
      "Independent developer dossiers for Gurugram real estate — track record, delivery performance and financial health.",
  },
};

/* Live filings data is pulled at build time; unreachable backend
   simply hides the computed-track-records section. */
export default async function Page() {
  const live = await fetchDevelopersOverview();

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Top Gurugram Developers — Ranked by Delivery & Financials",
    description:
      "Independent developer dossiers for Gurugram real estate — track record, RERA delivery performance and financial health.",
    url: `${SITE_URL}/intelligence/developers`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: DEVELOPERS.length,
      itemListElement: DEVELOPERS.map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: d.name,
        url: `${SITE_URL}/intelligence/developers/${d.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(collectionLd)} />
      <DevelopersIndex live={live} />
    </>
  );
}
