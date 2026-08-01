import type { Metadata } from "next";
import SunVastu from "@/components/sunvastu/SunVastu";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/sun-vastu" },
  title: "Sun & Vastu 3D Simulation — See the light before you buy",
  description:
    "Truth Estate's Sun & Vastu 3D Simulation shows how a specific home in Gurugram meets the sun through every hour and season, and how it sits on the Vastu compass — floor by floor, unit by unit, before you buy. Seven towers modelled and interactive today.",
  keywords: [
    "sunlight simulation apartment India",
    "3D sun path real estate Gurugram",
    "Vastu compass floor plan",
    "direct sunlight hours flat",
    "which floor gets more sunlight",
    "Vastu direction home buying",
    "Truth Estate Sun Vastu simulation",
  ],
  openGraph: {
    title: "Sun & Vastu 3D Simulation — See the light before you buy",
    description:
      "See a home's direct sun, afternoon heat and Vastu placement — floor by floor, across every season — before you commit. Seven Gurugram towers live now.",
    type: "website",
  },
};

export default function SunVastuPage() {
  return (
    <>
      <main>
        <SunVastu />
      </main>
      <Footer precededByDark />
    </>
  );
}
