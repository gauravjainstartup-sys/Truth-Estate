import type { Metadata } from "next";
import TermsContent from "@/components/legal/TermsContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/terms" },
  title: "Terms of Use",
  description:
    "The terms governing your use of Truth Estate's independent real estate research platform and advisory services.",
  keywords: [
    "Truth Estate Terms of Use",
    "Real Estate Advisory Terms",
    "Property Research Terms",
    "Independent Advisory Terms",
    "Truth Estate",
  ],
  openGraph: {
    title: "Terms of Use",
    description:
      "Terms governing your use of Truth Intelligence, TruthGuide, Private Office, and all Truth Estate services.",
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <>
      <main>
        <TermsContent />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
