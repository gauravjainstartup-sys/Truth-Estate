import type { Metadata } from "next";
import DevelopersIndex from "@/components/intelligence/DevelopersIndex";
import { resolveDevelopers } from "@/lib/developersLive";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/developers" },
  title: "Developer Intelligence",
  description:
    "Independent developer dossiers for Gurugram real estate — track record, delivery performance and financial health. No paid rankings.",
};

export default async function Page() {
  /* resolveDevelopers = the whole universe: the hand-reviewed dossiers first,
     then every other filed developer as a computed-from-filings profile. */
  const developers = await resolveDevelopers();
  return <DevelopersIndex developers={developers} />;
}
