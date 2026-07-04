import type { Metadata } from "next";
import InvestorMemo from "@/components/investors/InvestorMemo";

/* Private memorandum — reachable only by URL. Kept out of the index and
   out of the sitemap; shared link-by-link during conversations. */
export const metadata: Metadata = {
  title: "Investor Memorandum — Truth Estate",
  description: "Private & confidential. Independent real-estate intelligence and buyer-side advisory for premium Indian residential.",
  robots: { index: false, follow: false },
};

export default function InvestorsPage() {
  return <InvestorMemo />;
}
