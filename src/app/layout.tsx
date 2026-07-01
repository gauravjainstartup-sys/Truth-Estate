import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import JourneyProvider from "@/components/journey/JourneyProvider";
import ConsultationProvider from "@/components/consultation/ConsultationProvider";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const OG_IMAGE = `${SITE_URL}/images/og-truth-estate.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Truth Estate — Independent Real Estate Advisory for NRI Investors in India",
    template: "%s | Truth Estate",
  },
  description:
    "Independent, evidence-first real estate advisory for NRIs and discerning buyers in India. Forensic due diligence, unbiased Truth Scores, and one advisor who represents only you — from first question to handover.",
  applicationName: "Truth Estate",
  keywords: [
    "NRI real estate advisory India",
    "buy property in India from abroad",
    "independent real estate advisor Gurugram",
    "real estate due diligence India",
    "property Truth Score",
    "Gurugram real estate intelligence",
    "NRI property investment",
    "RERA project verification",
    "independent property research",
    "Truth Estate",
  ],
  authors: [{ name: "Truth Estate" }],
  creator: "Truth Estate",
  publisher: "Truth Estate",
  category: "Real Estate",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "Truth Estate",
    locale: "en_IN",
    url: SITE_URL,
    title: "Truth Estate — Independent Real Estate Advisory for NRI Investors",
    description:
      "Forensic, independent property intelligence and advisory for NRIs buying in India. Evidence over marketing — one advisor who represents only you.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Truth Estate — the Independent Buyer's Office" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Truth Estate — Independent Real Estate Advisory for NRIs",
    description:
      "Forensic, independent property intelligence and advisory for NRIs buying in India. Evidence over marketing.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/* Site-wide structured data — an Organization entity (strong for AI/GEO
   entity understanding + Google knowledge graph) and the WebSite. */
const orgLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": `${SITE_URL}/#organization`,
  name: "Truth Estate",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  image: OG_IMAGE,
  slogan: "Less promises. More proof.",
  description:
    "Truth Estate is an independent, evidence-first real estate advisory for NRIs and discerning buyers in India. It provides forensic due diligence, unbiased Truth Scores and end-to-end representation — never influenced by developer marketing.",
  knowsAbout: [
    "Real estate due diligence",
    "NRI property investment in India",
    "FEMA regulations for NRI property",
    "RERA project verification",
    "Property title verification",
    "Gurugram real estate market intelligence",
    "Builder–Buyer Agreement review",
    "Repatriation of property sale proceeds",
  ],
  areaServed: [
    { "@type": "Country", name: "India" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "Singapore" },
    { "@type": "Country", name: "Australia" },
  ],
  serviceType: "Independent real estate advisory",
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Truth Estate",
  description:
    "Independent real estate intelligence and advisory for NRIs and discerning buyers in India.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <ConsultationProvider>
          <JourneyProvider>{children}</JourneyProvider>
        </ConsultationProvider>
      </body>
    </html>
  );
}
