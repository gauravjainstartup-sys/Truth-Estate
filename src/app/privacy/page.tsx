import type { Metadata } from "next";
import PrivacyContent from "@/components/legal/PrivacyContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Truth Estate",
  description:
    "How Truth Estate collects, uses, and protects your information. Written in plain English for transparency.",
  keywords: [
    "Truth Estate Privacy Policy",
    "Real Estate Data Privacy",
    "Property Advisory Privacy",
    "Data Protection India",
    "Truth Estate",
  ],
  openGraph: {
    title: "Privacy Policy — Truth Estate",
    description:
      "How we collect, use, and protect your information when you use Truth Estate's independent research and advisory services.",
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <main>
        <PrivacyContent />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
