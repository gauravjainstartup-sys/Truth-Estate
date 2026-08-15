import type { Metadata } from "next";
import DealRoomMandate from "@/components/dealroom/DealRoomMandate";

export const metadata: Metadata = {
  // Path-relative canonical — without it Next emits the bare root URL as this
  // page's canonical (see src/app/nri/page.tsx).
  alternates: { canonical: "/deal-room" },
  // Lead with the value-seeker's intent (best price / best deal + Gurugram),
  // not the mechanic. Title + description are what actually rank and show in
  // the result; the keywords array is near-cosmetic for ranking but kept
  // value-first for completeness and internal search.
  title: "Best Price on Your Gurugram Home — Let the Market Compete",
  description:
    "Want the best deal on a Gurugram home? Name the project and your target price; verified brokers, owners and developers send written offers in 2–4 days. Neutral, on the record, no upfront cost — you negotiate from the truth.",
  keywords: [
    "best price flats Gurugram",
    "best deal property Gurugram NCR",
    "negotiate property price Gurugram",
    "discount new launch Gurugram",
    "lowest price apartment NCR",
    "let the market compete home price",
    "written offers home buying",
    "neutral property negotiation",
    "reverse auction property India",
    "Truth Estate Deal Room",
  ],
  openGraph: {
    title: "Best Price on Your Gurugram Home — the market sends written offers",
    description:
      "Stop calling ten brokers. Name the home and your target; verified sellers compete in writing for the best price. Neutral, on the record, no upfront cost.",
    type: "website",
  },
};

export default function DealRoomPage() {
  return (
    <main>
      <DealRoomMandate />
    </main>
  );
}
