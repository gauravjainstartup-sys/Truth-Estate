import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import JourneyProvider from "@/components/journey/JourneyProvider";
import ConsultationProvider from "@/components/consultation/ConsultationProvider";
import { IS_PRODUCTION_ORIGIN, SITE_URL, basePath } from "@/lib/site";
import { KEEP_ON_RELOAD } from "@/lib/durableKeys";
import EventTracker from "@/components/EventTracker";
import Analytics from "@/components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  /* The mono face is only ever used below the fold (the "₹4.5 Cr" price
     comparison mock, a handful of numeric readouts) — never in the hero or
     any LCP element. next/font preloads every configured face at high
     priority by default, so the default put a ~20 KB woff2 in front of the
     hero image on the initial load for text no first screen shows. preload:
     false drops that early fetch; the face still loads (display: swap) the
     moment a mono element scrolls into play. */
  preload: false,
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
    "Independent, evidence-first real estate advice for NRIs and discerning buyers in India — every project scored on the facts, every developer promise kept on the record. Forensic due diligence and one advisor who represents only you, from first question to handover.",
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
  /* Favicons are NOT declared here on purpose. metadata.icons resolves every
     href against metadataBase (the production origin), which is correct for a
     canonical but wrong for an icon the browser must fetch from whatever host
     is serving the page: on the .run.app arena (and the github.io preview)
     that produced <link href="https://truthestate.in/favicon.svg">, an
     off-host request to the not-yet-cutover domain, so the new icon never
     loaded. They're rendered in <head> instead with base-path-relative,
     same-origin hrefs. */
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
  /* ONE INDEXABLE COPY OF THIS SITE, EVER.

     The GitHub Pages preview serves the same 935 pages as production.
     Left crawlable it competes with truthestate.in for truthestate.in's
     own rankings and splits the link equity across two hosts, and Google
     decides the winner, not us. So indexing is granted to the production
     origin and to nothing else — a preview, a branch deploy or a local
     build all ship noindex,nofollow site-wide.

     This is the ONLY `robots` key in the root metadata, and it has to
     stay that way: metadata is a plain object literal, so a second
     `robots` further down silently wins over the first no matter which
     one carries the intent. That is exactly what happened on the first
     attempt here — the conditional was added above an existing
     `index: true` block and every page still shipped "index, follow".

     Flips automatically with NEXT_PUBLIC_ORIGIN, so nobody has to
     remember to remove anything at cutover. Routes that set their own
     robots (/office, /shortlist, the legacy stubs) still win — this is
     the floor, not a ceiling. */
  robots: IS_PRODUCTION_ORIGIN
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
      }
    : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/* Site-wide structured data — an Organization entity (strong for AI/GEO
   entity understanding + Google knowledge graph) and the WebSite. */
const orgLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": `${SITE_URL}/#organization`,
  name: "Truth Estate",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
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
    { "@type": "City", name: "Gurugram", containedInPlace: { "@type": "State", name: "Haryana" } },
    { "@type": "Country", name: "India" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "Singapore" },
    { "@type": "Country", name: "Australia" },
  ],
  serviceType: "Independent real estate advisory",
  /* The verified brand profiles — the primary signal Google/AI engines use to
     reconcile Truth Estate into a knowledge panel. Must be the REAL profiles
     (the same URLs the footer links), never a guessed handle. */
  sameAs: [
    "https://www.linkedin.com/company/truth-estate/",
    "https://x.com/truthestateggn",
  ],
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
        {/* Treat every hard refresh as a brand-new visitor: on a genuine page
           reload we wipe all locally-stored demo state (persona, unlocks,
           brief, leads) so nothing carries over. Ordinary link / router
           navigation (type "navigate") is left untouched, so moving between
           reports keeps the persona built during the session. Runs before
           React hydrates so no stale state is ever read.

           KEEP_KEYS is the exception, and it exists because this wipe was
           silently shredding the analytics. The device id lived in the same
           truthEstate.* namespace as the demo state, so every refresh minted
           a new one: 25 events arrived under SIX identities in a single
           afternoon, and signing in could only ever claim the handful
           written since the last refresh — the rest were orphaned for good.
           Demo state is disposable; who the device is, is not — and neither
           is the session, nor a record of what they paid for. The session
           keys were missing from this list while the entitlements cache was
           on it, so a refresh produced a header saying "Sign in" above a
           fully unlocked report. The list is now shared with signOut and
           clearAllDemoData rather than kept in step by comment. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if('scrollRestoration' in history){history.scrollRestoration='manual';}window.scrollTo(0,0);var r=false;var e=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0]);if(e){r=e.type==='reload';}else if(performance.navigation){r=performance.navigation.type===1;}if(r){var KEEP=${JSON.stringify(
              Object.fromEntries(KEEP_ON_RELOAD.map((k) => [k, 1])),
            )};for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf('truthEstate')===0&&!KEEP[k]){localStorage.removeItem(k);}}}}catch(_){}})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
        {/* Favicons — same-origin, base-path-relative so they load from the
           host actually serving the page (the .run.app arena and the github.io
           preview both differ from the production origin). SVG first for modern
           browsers; the .ico is the legacy fallback. Sources in /public. */}
        <link rel="icon" href={`${basePath}/favicon.svg`} type="image/svg+xml" />
        <link rel="icon" href={`${basePath}/favicon-48x48.png`} type="image/png" sizes="48x48" />
        <link rel="icon" href={`${basePath}/favicon.png`} type="image/png" sizes="192x192" />
        <link rel="icon" href={`${basePath}/favicon.ico`} sizes="any" />
        <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} sizes="180x180" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <Analytics />
        <ConsultationProvider>
          <EventTracker />
          <JourneyProvider>{children}</JourneyProvider>
        </ConsultationProvider>
      </body>
    </html>
  );
}
