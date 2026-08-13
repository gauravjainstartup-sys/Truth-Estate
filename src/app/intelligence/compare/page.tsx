import type { Metadata } from "next";
import CompareIndex from "@/components/intelligence/CompareIndex";
import { fetchBacklogFull } from "@/lib/supabase";
import { scoredProjectOptions, projectComparePairs, resolvableProjectPairs } from "@/lib/compare";
import { INDEXABLE_COMPARE_PAIRS } from "@/lib/indexableCompares";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/compare" },
  title: "Compare — Truth Estate Intelligence",
  description:
    "Compare any two Gurugram projects, developers or markets side by side on the same independent evidence — Truth Score anatomy, delivery, financial signals, pricing and outlook. No sponsored winner.",
};

/* The project picker offers EVERY scored project (not just the prerendered
   top set): pairs within the prerendered cap open their static page, the rest
   render client-side on /intelligence/compare/live from the compare index.
   Developers & markets come from the curated registries. Fetched once/build. */
export default async function Page() {
  const rows = await fetchBacklogFull();
  const projectOptions = scoredProjectOptions(rows, Number.POSITIVE_INFINITY);
  /* The exact set of project pairs that get a static page — MUST mirror
     generateStaticParams in [pair]/page.tsx: the high-intent filtered pairs
     among the scored/capped set, plus the demand-proven indexable pairs.
     CompareIndex routes any pair outside this set to /compare/live, so a picker
     selection of two "unrelated" projects never 404s on the static export. */
  const prerenderedPairs = [
    ...projectComparePairs(scoredProjectOptions(rows)),
    ...resolvableProjectPairs(INDEXABLE_COMPARE_PAIRS, (rows ?? []).map((r) => r.slug)),
  ];
  return <CompareIndex projectOptions={projectOptions} prerenderedPairs={prerenderedPairs} />;
}
