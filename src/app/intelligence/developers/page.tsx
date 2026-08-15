import type { Metadata } from "next";
import DevelopersIndex from "@/components/intelligence/DevelopersIndex";
import { resolveDevelopers } from "@/lib/developersLive";
import { collectionLd, ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/developers" },
  title: "Top Gurugram Developers, Ranked",
  description:
    "Independent developer dossiers for Gurugram real estate — track record, delivery performance and financial health. No paid rankings.",
  openGraph: {
    title: "Top Gurugram Developers, Ranked",
    description: "Independent dossiers on Gurugram developers — delivery track record and financial health. No paid rankings.",
    url: "/intelligence/developers",
    type: "website",
  },
};

export default async function Page() {
  /* resolveDevelopers = the whole universe: the hand-reviewed dossiers first,
     then every other filed developer as a computed-from-filings profile. */
  const developers = await resolveDevelopers();
  const ld = collectionLd({
    name: "Top Gurugram Developers, Ranked",
    description: "Independent developer dossiers for Gurugram — track record, delivery and financial health.",
    path: "/intelligence/developers",
    items: developers.filter((d) => d.slug && d.name).map((d) => ({ name: d.name, path: `/intelligence/developers/${d.slug}` })),
  });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(ld)} />
      <DevelopersIndex developers={developers} />
    </>
  );
}
