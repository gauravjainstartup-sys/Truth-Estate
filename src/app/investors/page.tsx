import type { Metadata } from "next";
import InvestorMemo from "@/components/investors/InvestorMemo";

/* Private memorandum — reachable only by URL. Kept out of the index and
   out of the sitemap; shared link-by-link during conversations. */
export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/investors" },
  title: "Investor Memorandum",
  description: "Private & confidential. Independent real-estate intelligence and buyer-side advisory for premium Indian residential.",
  robots: { index: false, follow: false },
};

export default function InvestorsPage() {
  return <InvestorMemo />;
}
