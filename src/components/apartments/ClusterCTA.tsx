"use client";

import { useJourney } from "@/components/journey/JourneyProvider";
import { basePath } from "@/lib/site";
import { track } from "@/lib/events";

/* ════════════════════════════════════════════════════════════════
   IN-FEED CTA — one card INSIDE the cluster grid, after the first
   rows of projects.

   The first cut of this was a band between the header and the list;
   the founder's verdict was right — it pushed the product further
   down a page whose product IS the list. This is the opposite shape:
   the reader sees six real options first, and the next step arrives
   as the seventh card, where marketplace feeds actually convert.

   One dark card among white ones — instantly a different kind of
   object, same grammar as the report's watch banner. ONE primary
   action, chosen by intent:
     · price clusters → the Deal Room (a buyer filtering by budget is
       already negotiating)
     · everything else → the cluster's №1 file, first report ₹0 (the
       unlock funnel, led by proof instead of a form)
   The other path survives as a one-line text link. No new capture,
   no state — existing funnels only.
   ════════════════════════════════════════════════════════════════ */

export default function ClusterCTA({
  clusterSlug,
  topName,
  topHref,
  topScore,
  pricePage,
}: {
  clusterSlug: string;
  topName: string;
  topHref: string;
  topScore: number;
  pricePage?: boolean;
}) {
  const { open } = useJourney();

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#c9a96e]/30 bg-[#14110d] p-6 text-[#f6f1e8]">
      <div>
        <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#c9a96e]">
          {pricePage ? "Name your price" : "Where to start"}
        </p>
        <p className="mt-2.5 font-serif text-[1.3rem] font-medium leading-snug text-white">
          {pricePage ? "Have a target price for one of these?" : `${topName} ranks №1 here — Truth Score ${topScore}.`}
        </p>
        <p className="mt-2 text-[0.8rem] font-light leading-relaxed text-[#f6f1e8]/60">
          {pricePage
            ? "Set it in the Deal Room and let sellers compete to meet it — anonymous until you choose."
            : "Read its full forensic file before you shortlist anything. Your first report is ₹0 — no card, no broker calls."}
        </p>
      </div>
      <div className="mt-5">
        {pricePage ? (
          <a
            href={`${basePath}/deal-room`}
            onClick={() => track("cluster_cta_clicked", { props: { cluster: clusterSlug, action: "deal-room" } })}
            className="block rounded-md bg-[#1e6b45] px-5 py-3 text-center text-[0.82rem] font-medium text-white transition-colors hover:bg-[#238c55]"
          >
            Enter the Deal Room →
          </a>
        ) : (
          <a
            href={topHref}
            onClick={() => track("cluster_cta_clicked", { props: { cluster: clusterSlug, action: "top-report", project: topName } })}
            className="block rounded-md bg-[#1e6b45] px-5 py-3 text-center text-[0.82rem] font-medium text-white transition-colors hover:bg-[#238c55]"
          >
            Read the {topName} file — ₹0 →
          </a>
        )}
        {pricePage ? (
          <a
            href={topHref}
            onClick={() => track("cluster_cta_clicked", { props: { cluster: clusterSlug, action: "top-report", project: topName } })}
            className="mt-2.5 block text-center text-[0.72rem] text-[#f6f1e8]/55 underline-offset-4 hover:text-white hover:underline"
          >
            or read {topName}, the №1 file here — ₹0
          </a>
        ) : (
          <button
            type="button"
            onClick={() => {
              track("cluster_cta_clicked", { props: { cluster: clusterSlug, action: "advice" } });
              open();
            }}
            className="mt-2.5 block w-full text-center text-[0.72rem] text-[#f6f1e8]/55 underline-offset-4 hover:text-white hover:underline"
          >
            or get a free 15-min independent read on your shortlist
          </button>
        )}
      </div>
    </div>
  );
}
