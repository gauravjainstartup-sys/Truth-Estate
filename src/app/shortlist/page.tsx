import type { Metadata } from "next";
import ShortlistExperience from "@/components/shortlist/ShortlistExperience";

/* A personalised, post-onboarding surface — kept out of the index (it only
   has meaning against a visitor's own brief, and the #1 match is gated). */
export const metadata: Metadata = {
  title: "Your Shortlist",
  description: "Your three strongest matches, ranked against your brief — with your #1 match one verification away.",
  robots: { index: false, follow: false, nocache: true },
};

export default function ShortlistPage() {
  return <ShortlistExperience />;
}
