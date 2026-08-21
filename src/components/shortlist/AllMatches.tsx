"use client";

import { useEffect, useMemo, useState } from "react";
import Logo from "../Logo";
import ProjectOptionCard from "../intelligence/ProjectOptionCard";
import LockedMatchCard from "./LockedMatchCard";
import OtpSheet from "./OtpSheet";
import { loadVerified, saveVerified, type Verified } from "@/lib/shortlistAuth";
import { getSession } from "@/lib/phoneAuth";
import {
  loadBuyData, hasPreferences, deriveDNA, saveLead, isSignedIn, loadAccount,
  type BuyData,
} from "@/lib/journey";
import { rankProjectsIntel } from "@/lib/shortlist";
import { useAiRerank } from "@/lib/useAiRerank";
import { useMatchCatalog, useMatchMarket } from "@/lib/useMatchCatalog";
import type { ProjectIntel } from "@/lib/projects";
import { basePath, homeHref } from "@/lib/site";
import { track } from "@/lib/events";

/* ════════════════════════════════════════════════════════════════
   ALL MATCHES — the full field behind the three shortlist cards.

   The shortlist argues three options; this page shows the whole ranked
   field, top 20, as the SAME cards in brief order — no new card design,
   no table. Reached from the shortlist and the Office recommendations.

   The #1 stays behind the same OTP the shortlist's top card uses — this
   page must not become the free back door to the recommendation the
   shortlist gates — and a verified contact (or a signed-in session) is
   recognised exactly the way ShortlistCore recognises it.
   ════════════════════════════════════════════════════════════════ */

export default function AllMatches() {
  const [mounted, setMounted] = useState(false);
  const [buy, setBuy] = useState<BuyData | null>(null);
  const [verified, setVerified] = useState<Verified | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBuy(loadBuyData());
    const v = loadVerified();
    if (v) { setVerified(v); return; }
    if (isSignedIn()) {
      const s = getSession();
      const acct = loadAccount();
      setVerified({
        channel: s?.phone ? "mobile" : "email",
        contact: s?.phone || s?.email || "",
        name: acct?.name || undefined,
        email: s?.email || undefined,
        at: Date.now(),
      });
    }
  }, []);

  const catalog = useMatchCatalog();
  const market = useMatchMarket();
  const det = useMemo(
    () => (buy && catalog ? rankProjectsIntel(buy, catalog, market) : []),
    [buy, catalog, market]
  );
  /* Same AI pass the shortlist runs, so this page's #1 IS the shortlist's #1. */
  const { recs, settled } = useAiRerank(buy, det);
  const top = useMemo(
    () => recs.slice(0, 20).filter((p): p is ProjectIntel & { matchPct: number } => "slug" in p),
    [recs]
  );
  const dna = useMemo(() => (buy ? deriveDNA(buy) : null), [buy]);
  const revealed = verified != null;

  function handleVerified(v: Verified) {
    const firstEver = !loadVerified();
    saveVerified(v);
    const lead = top[0];
    if (lead) {
      saveLead({
        name: v.name ?? "",
        email: v.email ?? (v.channel === "email" ? v.contact : ""),
        phone: v.channel === "mobile" ? `${v.cc ?? ""} ${v.contact}`.trim() : undefined,
        project: lead.name,
        intent: "shortlist-unlock",
        buy: buy ?? undefined,
        createdAt: Date.now(),
      });
    }
    if (firstEver) track("first_shortlist_unlocked", { projectName: top[0]?.name, props: { channel: v.channel } });
    setVerified(v);
    setOtpOpen(false);
  }

  const ready = mounted && buy && dna && hasPreferences(buy) && catalog && settled && top.length > 0;

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/[0.06] bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={homeHref} aria-label="Truth Estate — home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <a href={`${basePath}/shortlist`} className="ml-auto text-[0.8rem] font-medium text-[#1e6b45] transition-colors hover:text-[#238c55]">
            ← Back to your shortlist
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-8 md:px-10">
        {!mounted || (buy && (!catalog || !settled)) ? (
          <div className="mx-auto max-w-lg py-[14vh] text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1e6b45]/20 border-t-[#1e6b45]" aria-hidden />
            <p className="mt-5 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#9a7a2e]" role="status">Ranking your matches…</p>
          </div>
        ) : !ready ? (
          <div className="mx-auto max-w-lg py-[12vh] text-center">
            <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#9a7a2e]">All matches</p>
            <h1 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.08] tracking-[-0.01em] md:text-[2.7rem]">
              Build your brief first.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/60">
              This page ranks every tracked project against your requirements — it needs your brief to rank with.
            </p>
            <a href={`${basePath}/shortlist`} className="mt-8 inline-flex items-center gap-2 rounded-[13px] bg-[#1e6b45] px-7 py-4 text-[0.9rem] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(30,107,69,0.6)] transition-colors hover:bg-[#238c55]">
              Go to your shortlist →
            </a>
          </div>
        ) : (
          <>
            <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#9a7a2e]">Your shortlist · the full field</p>
            <h1 className="mt-2.5 max-w-3xl font-serif text-[1.9rem] font-medium leading-[1.08] tracking-[-0.01em] md:text-[2.6rem]">
              Every project matching your brief.
            </h1>
            <p className="mt-2.5 text-[0.8rem] font-light leading-relaxed text-[#1a1a1a]/55">
              Top {top.length} of {catalog!.length} scanned · ranked by fit to your requirements · the same scoring your shortlist uses
            </p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {top.map((p, i) =>
                i === 0 && !revealed ? (
                  /* The #1 keeps the shortlist's own gate — same card, same OTP. */
                  <div key={p.slug} className="sm:col-span-2 lg:col-span-1">
                    <LockedMatchCard
                      p={p}
                      second={top[1] ?? null}
                      buy={buy!}
                      dna={dna!}
                      matchPct={p.matchPct}
                      revealed={false}
                      onUnlock={() => setOtpOpen(true)}
                    />
                  </div>
                ) : (
                  <ProjectOptionCard key={p.slug} p={p} matchPct={p.matchPct} />
                )
              )}
            </div>
          </>
        )}
      </main>

      <OtpSheet open={otpOpen} onClose={() => setOtpOpen(false)} onVerified={handleVerified} />
    </div>
  );
}
