import type { Metadata } from "next";
import DealRoom from "@/components/dealroom/DealRoom";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "The Deal Room — Independent, Buyer-Side Negotiation",
  description:
    "The Deal Room is an independent, buyer-side negotiation service for premium homebuyers in Gurugram. Flat-fee, never developer-paid — we make the market compete for your deal, in writing, with transparent cost break-ups. Built to surface offers typically 10–15% better than negotiating alone.",
  keywords: [
    "buyer side negotiation India",
    "real estate deal room",
    "independent property negotiation Gurugram",
    "flat fee real estate advisor",
    "no brokerage home buying",
    "premium homebuyer negotiation",
    "Truth Estate Deal Room",
  ],
  openGraph: {
    title: "The Deal Room — You no longer negotiate alone",
    description:
      "Independent, flat-fee, buyer-side negotiation. We make the market compete for your deal, in writing — no brokerage, no developer money.",
    type: "website",
  },
};

export default function DealRoomPage() {
  return (
    <>
      <main>
        <DealRoom />
      </main>
      <Footer precededByDark />
    </>
  );
}
