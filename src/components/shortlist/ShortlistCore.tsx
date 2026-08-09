"use client";

import { useEffect, useMemo, useState } from "react";
import ProjectOptionCard from "../intelligence/ProjectOptionCard";
import LockedMatchCard from "./LockedMatchCard";
import OtpSheet from "./OtpSheet";
import { projectByName, type ProjectIntel } from "@/lib/projects";
import { briefChips } from "@/lib/shortlist";
import { loadVerified, saveVerified, type Verified } from "@/lib/shortlistAuth";
import { getSession } from "@/lib/phoneAuth";
import { saveLead, isSignedIn, loadAccount, ACTIVE_PROJECT_COUNT, type BuyData, type DNA, type Scored } from "@/lib/journey";
import { track } from "@/lib/events";

/* ════════════════════════════════════════════════════════════════
   THE CLUBBED SHORTLIST — one surface, two homes.

   Buyer DNA + brief on the left, the three ranked options on the right
   (#1 gated behind a single OTP; #2 and #3 through the untouched
   ProjectOptionCard). Rendered both by the standalone /shortlist route
   (external-onboarding direct-land) and inside the in-app "Start Your
   Journey" modal — identical markup, only the navigation callbacks differ.
   The OTP gate, lead capture and reveal live here so both entries behave
   exactly the same. Nothing is invented; every line derives from the brief.
   ════════════════════════════════════════════════════════════════ */

export default function ShortlistCore({
  buy,
  dna,
  recs,
  onRefine,
  onConsult,
  onPickCard,
  onVerifiedChange,
  scannedCount,
}: {
  buy: BuyData;
  dna: DNA;
  recs: Scored[];
  onRefine: () => void;
  onConsult: () => void;
  /* How many projects were scanned to produce this shortlist — the live
     catalog size on /shortlist; falls back to ACTIVE_PROJECT_COUNT (the
     in-modal mock journey doesn't pass it). */
  scannedCount?: number;
  /* When set, #2/#3 (and the revealed #1) open the report via this callback
     instead of navigating by link — the in-modal path closes the modal first. */
  onPickCard?: (intel: ProjectIntel) => void;
  /* Lets a parent mirror the verified identity (e.g. a header chip). */
  onVerifiedChange?: (v: Verified) => void;
}) {
  const [verified, setVerified] = useState<Verified | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  useEffect(() => {
    const v = loadVerified();
    if (v) { setVerified(v); return; }
    /* Signed in (Google or phone) but no shortlist OTP record on this device →
       recognise the session so the #1 match isn't gated behind a second OTP.
       isSignedIn() is the one flag every sign-in path sets; identity for the
       lead comes from getSession()/loadAccount(). The read is still bought on
       the report itself. */
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

  const top = useMemo(
    () =>
      recs
        .slice(0, 3)
        // Live catalog items already ARE ProjectIntel (they carry a slug) — use
        // them directly; mock items (the in-modal JourneyModal path) resolve by name.
        .map((r) => ({
          r,
          intel: "slug" in r ? (r as unknown as ProjectIntel) : projectByName(r.name),
        }))
        .filter((x): x is { r: Scored; intel: ProjectIntel } => Boolean(x.intel)),
    [recs]
  );
  const revealed = verified != null;

  function handleVerified(v: Verified) {
    /* First OTP unlock on this device? loadVerified() is still null until
       saveVerified writes it — read before the write so this fires once ever. */
    const firstEver = !loadVerified();
    saveVerified(v);
    const lead = top[0];
    if (lead) {
      saveLead({
        name: v.name ?? "",
        email: v.email ?? (v.channel === "email" ? v.contact : ""),
        phone: v.channel === "mobile" ? `${v.cc ?? ""} ${v.contact}`.trim() : undefined,
        project: lead.intel.name,
        intent: "shortlist-unlock",
        buy,
        createdAt: Date.now(),
      });
      /* No entitlement is granted here any more. Verifying a contact is a
         lead, not a purchase — the paid read is bought only on the report,
         through its own Razorpay checkout. saveLead above still records the
         lead (and its 'lead'-tier model access); this used to also call
         unlockProject(), a free client-side unlock that fired a false
         report_unlocked and wrote the legacy unlock store. */
    }
    if (firstEver) track("first_shortlist_unlocked", { projectName: top[0]?.intel.name, props: { channel: v.channel } });
    setVerified(v);
    onVerifiedChange?.(v);
    setOtpOpen(false);
  }

  if (top.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
        {/* ── LEFT · Buyer DNA + brief ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#9a7a2e]">Your buyer DNA</p>
          <h2 className="mt-3.5 font-serif text-[2.2rem] font-medium leading-[1.06] tracking-[-0.01em] text-[#1a1a1a] md:text-[2.9rem]">
            You&apos;re a <span className="text-[#1e6b45]">{dna.archetype}</span>.
          </h2>
          <p className="mt-3.5 max-w-md text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/60">{firstSentence(dna.insight)}</p>

          <BriefAccordion chips={briefChips(dna)} onRefine={onRefine} />

          {/* Desktop: trust stays pinned beside the cards as you evaluate. */}
          <Honesty revealed={revealed} onAdvice={onConsult} stacked className="mt-12 hidden lg:block" />
        </div>

        {/* ── RIGHT · funnel + the three options ── */}
        <div>
          <p className="text-[0.82rem] font-light leading-[1.5] text-[#1a1a1a]/55">
            <b className="font-serif text-[1rem] font-medium text-[#1a1a1a]">{scannedCount ?? ACTIVE_PROJECT_COUNT}</b> scanned
            <span className="mx-1.5 text-[#c9a96e]">→</span>
            <b className="font-serif text-[1rem] font-medium text-[#1a1a1a]">{top.length}</b> make the cut
            <span className="mx-1.5 text-[#c9a96e]">→</span>
            <b className="font-serif text-[1rem] font-medium text-[#1e6b45]">1</b>
            <span className="text-[#1e6b45]"> fits you almost perfectly ↓</span>
          </p>

          <p className="mt-6 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#1a1a1a]/40">Your shortlist</p>

          <div className="mt-3.5 flex flex-col gap-5">
            <LockedMatchCard
              p={top[0].intel}
              second={top[1]?.intel ?? null}
              buy={buy}
              dna={dna}
              matchPct={top[0].r.matchPct}
              revealed={revealed}
              onUnlock={() => setOtpOpen(true)}
              onOpen={onPickCard ? () => onPickCard(top[0].intel) : undefined}
            />

            {top.slice(1).map(({ r, intel }) => (
              <ProjectOptionCard
                key={intel.slug}
                p={intel}
                matchPct={r.matchPct}
                onSelect={onPickCard ? () => onPickCard(intel) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile / in-modal: trust runs full-width after the cards. */}
      <Honesty revealed={revealed} onAdvice={onConsult} className="mt-14 lg:hidden" />

      <OtpSheet open={otpOpen} onClose={() => setOtpOpen(false)} onVerified={handleVerified} />
    </>
  );
}

/* First sentence of the archetype insight — the one-line explainer. */
function firstSentence(s: string): string {
  const m = s.match(/^[^.]*\./);
  return (m ? m[0] : s).trim();
}

/* ── The brief, collapsed into an accordion so the cards get prime space ── */
function BriefAccordion({ chips, onRefine }: { chips: string[]; onRefine: () => void }) {
  const [open, setOpen] = useState(false);
  const summary = chips.slice(0, 3).join(" · ");
  const more = chips.length - 3;

  return (
    <div className="mt-8 border-y border-[#1a1a1a]/[0.09]">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 py-3.5 text-left">
        <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#1a1a1a]/40">Your brief</span>
        <span className="min-w-0 flex-1 truncate text-[0.8rem] text-[#1a1a1a]/70">
          {summary}
          {more > 0 && <span className="ml-1.5 font-mono text-[0.7rem] text-[#9a7a2e]">+{more} more</span>}
        </span>
        <span className={`text-[0.8rem] text-[#1a1a1a]/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>⌄</span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 pb-1">
            {chips.map((c) => (
              <span key={c} className="rounded-full border border-[#1a1a1a]/12 bg-[#FBF8F2] px-3 py-1.5 text-[0.76rem] text-[#1a1a1a]/70">{c}</span>
            ))}
          </div>
          <button onClick={onRefine} className="mb-4 mt-3 font-mono text-[0.68rem] tracking-[0.02em] text-[#9a7a2e] transition-opacity hover:opacity-70">
            ✎ Refine your brief — your shortlist re-ranks.
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Why #1 is locked + the trust ledger. `stacked` renders the sidebar
   variant (single column); otherwise a two-column full-width band. ── */
function Honesty({
  revealed,
  onAdvice,
  stacked = false,
  className = "",
}: {
  revealed: boolean;
  onAdvice: () => void;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <div className={`${stacked ? "" : "border-t border-[#1a1a1a]/[0.09] pt-8"} ${className}`}>
      <div className={stacked ? "flex flex-col gap-7" : "grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-14"}>
        <div>
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-[#9a7a2e]">
            {revealed ? "What happens now" : "Why is #1 locked?"}
          </p>
          <p className="mt-3 max-w-md text-[0.86rem] font-light leading-[1.7] text-[#1a1a1a]/60">
            {revealed ? (
              <>
                Your shortlist is saved and your advisor has it. No automated blast — <b className="font-medium text-[#1a1a1a]">a
                real person reviews your brief</b> before reaching out, buyer-side only.
              </>
            ) : (
              <>
                A recommendation this specific is a relationship, not a listing. Verify a number and your top match is
                yours — <b className="font-medium text-[#1a1a1a]">free, and never shared with a developer.</b>
              </>
            )}
          </p>
          <button onClick={onAdvice} className="mt-5 text-[0.82rem] font-medium text-[#1e6b45] underline underline-offset-4 transition-opacity hover:opacity-70">
            Prefer to talk it through? Request independent advice →
          </button>
        </div>
        <ul className={`flex flex-col gap-2.5 ${stacked ? "" : "md:pt-6"}`}>
          {["No developer money — ever", "Your details are never shared with a builder", "The founder reviews every shortlist"].map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-[0.8rem] font-light text-[#1a1a1a]/55">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a96e]" aria-hidden /> {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
