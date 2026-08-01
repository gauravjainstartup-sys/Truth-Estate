import type { Metadata } from "next";
import NRIDesk from "@/components/nri/NRIDesk";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/nri" },
  title: "The NRI Desk — Buy Property in India from Abroad",
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
      "Your independent principal on the ground in India. Forensic due diligence, site visits, FEMA and tax navigated. Our advice isn't for sale — no developer can buy our recommendation.",
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
