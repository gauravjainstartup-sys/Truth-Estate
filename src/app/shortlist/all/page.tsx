import type { Metadata } from "next";
import AllMatches from "@/components/shortlist/AllMatches";

/* /shortlist/all — the full ranked field behind the three shortlist cards:
   every project the engine matched against this reader's brief, top 20, as
   the same cards. Personalised (brief + entitlements live client-side), so
   it renders from the baked catalog on the client and stays out of the
   index — there is nothing here for a crawler that the catalogue doesn't
   already say better. */
export const metadata: Metadata = {
  title: "All Matching Projects — Your Shortlist",
  robots: { index: false },
};

export default function Page() {
  return <AllMatches />;
}
