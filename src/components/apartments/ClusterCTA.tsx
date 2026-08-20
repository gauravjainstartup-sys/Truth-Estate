"use client";

import { useJourney } from "@/components/journey/JourneyProvider";
import { basePath } from "@/lib/site";
import { track } from "@/lib/events";

/* ════════════════════════════════════════════════════════════════
   CLUSTER CTA — the conversion band on a programmatic /apartments page.

   A reader landing from "4 bhk in gurugram under 5 cr" is the highest
   intent traffic the site gets, and the page used to answer with a
   library: search box, sort control, forty cards. This band gives that
   reader the two actions the site actually converts on, before the
   list asks them to do any work:

     · READ THE TOP-RANKED FILE — the strongest report in this exact
       cluster, one click away. The first report is ₹0, so this is the
       lowest-friction entry into the unlock funnel, and it starts from
       proof (a ranked, audited file) rather than a form.

     · A price cluster ("under ₹5 Cr") gets the Deal Room — a reader
       filtering by budget is negotiating already. Every other cluster
       gets the advice desk — the same journey the header CTA opens.

   Both paths are the EXISTING funnels; this band builds no capture of
   its own and holds no state. Ivory card, ink primary, gold accents —
   the report pages' own grammar.
   ════════════════════════════════════════════════════════════════ */

export default function ClusterCTA({
  clusterSlug,
  topName,
  topHref,
  topScore,
  count,
  pricePage,
}: {
  clusterSlug: string;
  topName: string;
  topHref: string;
  topScore: number;
  count: number;
  pricePage?: boolean;
}) {
  const { open } = useJourney();

  return (
    <div className="mt-9 overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-white shadow-[0_10px_34px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div className="max-w-xl">
          <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[#9a7a2e]">
            Where to start
          </p>
          <p className="mt-2 font-serif text-[1.25rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.4rem]">
            {count} audited files below — or open the strongest one first.
          </p>
          <p className="mt-1.5 text-[0.84rem] font-light leading-relaxed text-[#1a1a1a]/55">
            {topName} ranks highest here at Truth Score {topScore}. Your first full report is ₹0 — no card, no broker calls.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 md:w-[21rem]">
          <a
            href={topHref}
            onClick={() => track("cluster_cta_clicked", { props: { cluster: clusterSlug, action: "top-report", project: topName } })}
            className="rounded-md bg-[#1e6b45] px-5 py-3 text-center text-[0.82rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]"
          >
            Read the {topName} report — ₹0 →
          </a>
          {pricePage ? (
            <a
              href={`${basePath}/deal-room`}
              onClick={() => track("cluster_cta_clicked", { props: { cluster: clusterSlug, action: "deal-room" } })}
              className="rounded-md border border-[#9a7a2e]/40 px-5 py-3 text-center text-[0.8rem] font-medium text-[#9a7a2e] transition-colors hover:border-[#9a7a2e] hover:bg-[#9a7a2e]/[0.05]"
            >
              Have a price in mind? Enter the Deal Room
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                track("cluster_cta_clicked", { props: { cluster: clusterSlug, action: "advice" } });
                open();
              }}
              className="rounded-md border border-[#1a1a1a]/15 px-5 py-3 text-center text-[0.8rem] font-medium text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]"
            >
              Get a 15-min independent read on your shortlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
