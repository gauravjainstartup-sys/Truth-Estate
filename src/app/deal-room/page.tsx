import type { Metadata } from "next";
import DealRoomMandate from "@/components/dealroom/DealRoomMandate";

export const metadata: Metadata = {
  title: { absolute: "The Deal Room Mandate — Independent Buyer-Side Clearinghouse | Truth Estate" },
  description:
    "Name your target home and budget. Truth Estate runs a 100% confidential clearinghouse where developers, owners and brokers compete in writing. Zero upfront fee — 10% of savings below market benchmark, billed strictly post-BBA/ATS signing.",
  keywords: [
    "reverse auction property India",
    "let market compete home price",
    "buyer mandate real estate",
    "best price property Gurugram NCR",
    "written offers home buying",
    "neutral property negotiation",
    "Truth Estate Deal Room mandate",
  ],
  alternates: { canonical: "/deal-room" },
  openGraph: {
    title: "The Deal Room Mandate — Name your asset, the market sends written offers",
    description:
      "Stop calling ten brokers. Name the home and your target; the market competes in writing. 100% blind & confidential, zero upfront cost.",
    url: "/deal-room",
    type: "website",
  },
};

export default function DealRoomPage() {
  return <DealRoomMandate />;
}
