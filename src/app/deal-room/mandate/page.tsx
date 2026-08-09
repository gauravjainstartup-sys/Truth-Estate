import type { Metadata } from "next";
import DealRoomMandate from "@/components/dealroom/DealRoomMandate";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  // Path-relative canonical — without it Next emits the bare root URL as this
  // page's canonical (see src/app/nri/page.tsx).
  alternates: { canonical: "/deal-room/mandate" },
  title: "Start a Deal Room Mandate — Let the Market Compete for Your Price",
  description:
    "You've chosen the home — now let the market fight for the price. Name the asset and your target; brokers, owners and developers send written offers in 2–4 days. Neutral, on the record, no upfront cost. Join the Deal Room August cohort.",
  keywords: [
    "reverse auction property India",
    "let market compete home price",
    "buyer mandate real estate",
    "best price property Gurugram NCR",
    "written offers home buying",
    "neutral property negotiation",
    "Truth Estate Deal Room mandate",
  ],
  openGraph: {
    title: "The Deal Room — name your asset, the market sends written offers",
    description:
      "Stop calling ten brokers. Name the home and your target; the market competes in writing. Neutral, on the record, no upfront cost.",
    type: "website",
  },
};

export default function DealRoomMandatePage() {
  return (
    <>
      <main>
        <DealRoomMandate />
      </main>
      <Footer precededByDark />
    </>
  );
}
