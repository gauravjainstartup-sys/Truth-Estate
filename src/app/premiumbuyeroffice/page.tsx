import type { Metadata } from "next";
import PremiumBuyerOffice from "@/components/premiumBuyerOffice/PremiumBuyerOffice";
import Footer from "@/components/Footer";
import { CONSULT_FEE } from "@/lib/consultation";

export const metadata: Metadata = {
  title: "Premium Buyer Office — Your Independent Representative | Truth Estate",
  description:
    "Your independent representative from first thought to final signature. Eight offices under one membership — buyer & unit intelligence, on-ground evaluation, negotiation, transaction management and lifelong ownership support — for one of life's biggest financial decisions.",
  keywords: [
    "Premium Buyer Office",
    "Buyer-side real estate advisory",
    "Independent buyer representation",
    "NRI property advisory Gurugram",
    "Real estate negotiation support",
    "Unit intelligence",
    "Truth Estate",
  ],
  alternates: { canonical: "/premiumbuyeroffice" },
  openGraph: {
    title: "Premium Buyer Office — Truth Estate",
    description:
      "One membership, eight offices — the entire buy-side, working only for you. From first thought to final signature.",
    type: "website",
  },
};

/* Service schema — lets Google and AI answer engines read the offering, who
   provides it, where, and the entry price. */
const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Premium Buyer Office",
  serviceType: "Independent buyer-side real estate advisory",
  provider: { "@type": "Organization", name: "Truth Estate" },
  areaServed: { "@type": "City", name: "Gurugram" },
  audience: { "@type": "Audience", audienceType: "Premium & NRI home buyers" },
  description:
    "An independent buyer's representative across eight offices — buyer intelligence, unit intelligence, ground intelligence, commercial negotiation, transaction management, Buyer Memory, ownership OS and an expert network — from first thought to final signature.",
  ...(CONSULT_FEE != null
    ? { offers: { "@type": "Offer", price: CONSULT_FEE, priceCurrency: "INR" } }
    : {}),
};

export default function PremiumBuyerOfficePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <main>
        <PremiumBuyerOffice />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
