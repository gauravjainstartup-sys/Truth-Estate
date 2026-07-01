import type { Metadata } from "next";
import NRIDesk from "@/components/nri/NRIDesk";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "The NRI Desk — Buy Property in India from Abroad | Truth Estate",
  description:
    "Independent, forensic property advice for NRIs and OCIs buying in India from the UK, USA, Canada, UAE, Singapore and Australia. Your eyes on the ground: due diligence, site visits, negotiation, FEMA, TDS, repatriation and Power of Attorney — represented only by you.",
  keywords: [
    "NRI property investment India",
    "buy property in India from abroad",
    "NRI real estate advisory",
    "OCI buy property India",
    "FEMA rules NRI property",
    "NRI TDS on property",
    "repatriation of sale proceeds NRI",
    "Power of Attorney NRI property",
    "NRI property due diligence",
    "Truth Estate",
  ],
  openGraph: {
    title: "The NRI Desk — Buy Property in India from Abroad",
    description:
      "Your independent principal on the ground in India. Forensic due diligence, site visits, FEMA and tax navigated — paid only by you, never by a developer.",
    type: "website",
  },
};

export default function NRIPage() {
  return (
    <>
      <main>
        <NRIDesk />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
