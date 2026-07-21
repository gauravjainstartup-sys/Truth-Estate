import type { Metadata } from "next";
import TestRankConsole from "./TestRankConsole";

/* Internal ranking test harness — not a buyer surface. Give it a brief, hit
   RUN, read the ranked catalog + the per-axis breakdown that explains every
   score, plus a live data-completeness audit of the matchable universe. Kept
   out of the index and the sitemap. */
export const metadata: Metadata = {
  title: "Rank Console · Truth Estate",
  description: "Internal ranking test harness.",
  robots: { index: false, follow: false, nocache: true },
};

export default function TestRankPage() {
  return <TestRankConsole />;
}
