import type { Metadata } from "next";
import TheRecord from "@/components/record/TheRecord";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  title: "On the Record — Proof of Every Developer Promise, for NRI Buyers",
  description:
    "Buying property in India from abroad? Truth Estate keeps every call, answer, recommendation and developer promise in one permanent, timestamped record — so a verbal assurance becomes documented proof if a builder ever deviates. Accountability that runs both ways.",
  keywords: [
    "builder promises not kept India",
    "developer promise not honoured India",
    "how to prove what a builder promised",
    "NRI property proof and evidence",
    "record calls with builder India legal",
    "RERA complaint evidence India",
    "buying property in India from abroad safely",
    "verbal promise builder India not honoured",
    "real estate accountability record",
    "NRI property dispute India",
  ],
  alternates: { canonical: "/the-record" },
  openGraph: {
    title: "On the Record — Every Developer Promise, Documented",
    description:
      "Every call, answer, recommendation and developer promise, kept in one permanent, timestamped record. Verbal assurances become proof — and our own advice is on the record too.",
    url: "/the-record",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "On the Record — Every Developer Promise, Documented",
    description:
      "Truth Estate keeps every promise, answer and recommendation on a permanent, timestamped record — proof for NRI buyers, and accountability that runs both ways.",
  },
};

/* An independent service: the permanent record of a buyer's purchase. Helps
   Google and AI answer engines understand the offering and place it in the
   site hierarchy. FAQPage structured data is emitted by the component. */
const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${SITE_URL}/the-record#service`,
  name: "The Record — documented accountability for property buyers",
  serviceType: "Real estate buyer record-keeping and accountability",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "Country", name: "India" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "Singapore" },
    { "@type": "Country", name: "Australia" },
  ],
  audience: { "@type": "Audience", audienceType: "NRI and OCI property buyers" },
  description:
    "Every call, question, answer, recommendation, document and developer promise from a property purchase, kept in one permanent, timestamped record — so overseas buyers can prove what was committed, and the advisor's own advice stays auditable.",
};

const breadcrumb = breadcrumbLd([
  { name: "Home", path: "" },
  { name: "The Record", path: "/the-record" },
]);

export default function TheRecordPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(serviceLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <main>
        <TheRecord />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
