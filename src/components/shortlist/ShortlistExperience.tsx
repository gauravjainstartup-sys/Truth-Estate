"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import ShortlistCore from "./ShortlistCore";
import { loadVerified, maskContact, type Verified } from "@/lib/shortlistAuth";
import { loadBuyData, hasPreferences, deriveDNA } from "@/lib/journey";
import { rankProjectsIntel } from "@/lib/shortlist";
import { useMatchCatalog } from "@/lib/useMatchCatalog";
import { useAiRerank } from "@/lib/useAiRerank";

/* ════════════════════════════════════════════════════════════════
   THE STANDALONE /shortlist ROUTE — the direct-land entry.

   Site chrome around the shared ShortlistCore. This is the page an
   externally-run onboarding drops the buyer onto: their brief is already
   in local storage, so we derive the DNA + ranking and render the clubbed
   shortlist. Cold visitors (no brief, or a hard refresh cleared it) get an
   empty state into the journey. The identical body also renders inside the
   in-app "Start Your Journey" modal — see ShortlistCore.
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";

export default function ShortlistExperience() {
  const { open, isOpen } = useJourney();

  const [mounted, setMounted] = useState(false);
  const [buy, setBuy] = useState<ReturnType<typeof loadBuyData>>(null);
  const [verified, setVerified] = useState<Verified | null>(null);

  const refresh = useCallback(() => {
    setBuy(loadBuyData());
    setVerified(loadVerified());
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  // When the refine journey closes, re-read the brief so the shortlist re-ranks.
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (wasOpen.current && !isOpen) refresh();
    wasOpen.current = isOpen;
  }, [isOpen, refresh]);

  // The live tracked universe (baked match-catalog.json); null until fetched.
  const catalog = useMatchCatalog();
  const dna = useMemo(() => (buy ? deriveDNA(buy) : null), [buy]);
  const det = useMemo(
    () => (buy && catalog ? rankProjectsIntel(buy, catalog) : []),
    [buy, catalog]
  );
  // Path 2: Gemini re-ranks the gated deterministic top; any failure keeps
  // the deterministic order (settled flips either way, bounded at 3 s).
  const { recs, settled } = useAiRerank(buy, det);

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      {/* ── Header — identity chip once verified, otherwise a quiet sign-in ── */}
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/[0.06] bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={basePath} aria-label="Truth Estate — home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          {mounted && verified && (
            <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-3.5 py-2 font-mono text-[0.68rem] tracking-[0.02em] text-[#1e6b45]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e6b45]" aria-hidden /> {maskContact(verified)}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 md:pt-12">
        {!mounted ? null : !buy || !dna || !hasPreferences(buy) ? (
          <EmptyState onStart={() => open("buy")} />
        ) : !catalog || !settled ? null /* catalog / re-rank settling — hold so cards never shuffle after reveal */ : recs.length >= 1 ? (
          <ShortlistCore
            buy={buy}
            dna={dna}
            recs={recs}
            scannedCount={catalog.length}
            onRefine={() => open("buy")}
            onConsult={() => open()}
            onVerifiedChange={setVerified}
          />
        ) : (
          <EmptyState onStart={() => open("buy")} />
        )}
      </main>
    </div>
  );
}

/* ── Cold visitor (no brief yet, or a hard refresh wiped it) ── */
function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-[12vh] text-center">
      <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#9a7a2e]">Your shortlist</p>
      <h1 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.08] tracking-[-0.01em] md:text-[2.7rem]">
        Tell us what you&apos;re looking for.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/60">
        Your shortlist is built from your brief — budget, corridor, configuration and what matters most. Answer a few
        questions and we&apos;ll rank the market against you.
      </p>
      <button
        onClick={onStart}
        className="mt-8 inline-flex items-center gap-2 rounded-[13px] bg-[#1e6b45] px-7 py-4 text-[0.9rem] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(30,107,69,0.6)] transition-colors hover:bg-[#238c55]"
      >
        Build my brief →
      </button>
    </div>
  );
}
