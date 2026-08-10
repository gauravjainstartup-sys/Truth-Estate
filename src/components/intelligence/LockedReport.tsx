"use client";

/* ────────────────────────────────────────────────────────────────────────
   LockedReport — the conversion surface a guest hits from Chapter II · Pillar I
   down. NOT a dead-end. It:
     • names exactly what's behind the wall (curiosity-gap FOMO), each row a
       tap-to-unlock;
     • anchors the ₹1,100 price against the ticket at stake;
     • ties the *visible* Truth Score to the locked detail ("why only X?").
   ──────────────────────────────────────────────────────────────────────── */

import { discountOf } from "@/lib/journey";
import { usePackage } from "@/lib/usePricing";
import { offerFirstFree } from "@/lib/entitlements";

/* Each locked section framed as the burning question it answers — the pull is
   the question, not a data dump. Generic-but-true (no fabricated findings). */
const LOCKED: { k: string; t: string; hook: string }[] = [
  { k: "Pillar I", t: "Developer DNA", hook: "Has this builder delivered on time before — and can its balance sheet finish the job?" },
  { k: "Pillar II", t: "Construction & sales", hook: "On pace for its RERA date, or quietly slipping? Build-vs-promise, in numbers." },
  { k: "Pillar III", t: "Location intelligence", hook: "The metro, roads and catalysts that will actually move this price." },
  { k: "Pillar IV", t: "Legal & compliance", hook: "Title, RERA and litigation signals we'd want cleared before you sign." },
  { k: "Pillar V", t: "Project USPs", hook: "Which claims hold real value — and which are just brochure gloss." },
  { k: "Chapter III", t: "Price & ROI model", hook: "The exact 5-year CAGR we project — and whether it beats the corridor." },
  { k: "Chapter IV", t: "The verdict", hook: "Should you buy it? Our tailored call for your budget, timeline and risk." },
  /* "Straight answers" was on this list, and it is not behind the wall — the
     FAQ renders free on every locked report, now under its own chapter. A
     teaser that promises a section the reader can already scroll to is the
     one thing on this page that can be checked in four seconds, and it was
     wrong. What is genuinely withheld stays; this went. */
];

/* ── Who is reading this ──────────────────────────────────────────────────
   Someone who arrived from the owner path has ALREADY bought. Every line
   below that is written forward — "before you sign", "should you buy it",
   "decide the cheque" — is advice about a decision they made in 2023. It
   does not just miss; it reads as a scolding for something they cannot undo.

   The argument for paying is every bit as strong the other way round, and
   in one respect stronger: while the tower is still going up they can still
   act on what the report finds. Same report, same price, same layout — only
   the sentences that assume a decision still ahead of them are replaced. */
const OWNER_HOOKS: Record<string, string> = {
  "Legal & compliance": "Title, RERA and litigation signals — what your agreement actually obliges them to.",
  "The verdict": "Where this leaves you now: hold, push the developer, or get out.",
  "Straight answers": "Blunt answers to the questions owners bring us after they've paid.",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function LockedReport({
  projectName, truthScore = 0, grade = "", ticket = "", onUnlock, audience = "buyer",
}: {
  projectName: string;
  truthScore?: number;
  grade?: string;
  ticket?: string;
  onUnlock: () => void;
  audience?: "buyer" | "owner";
}) {
  const lost = Math.max(0, 100 - Math.round(truthScore));
  const owner = audience === "owner";
  const read = usePackage("read");
  const d = discountOf(read);
  /* First report free — offered to anyone who does not yet own a report: a
     guest (they'll sign up to claim), or a signed-in profile with nothing
     unlocked. offerFirstFree() gates the entitlements cache on the CURRENT
     session's user (the same gate serverHasAccess applies), so a cache left by
     a different or earlier sign-in is ignored — the CTA never quotes the paid
     price off someone else's unlocks while the report itself stays locked.
     claim-free-unlock re-checks server-side and is the authority. */
  const firstFree = offerFirstFree();
  return (
    <div className="mt-14 border-t border-[#1a1a1a]/8 pt-12">
      {/* ── the pitch ── */}
      <div className="mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#b0503e]/30 bg-[#b0503e]/[0.06] px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#b0503e]">
          <Lock className="h-3 w-3" /> {owner ? "The part that tells you where you stand is locked" : "The part that decides it is locked"}
        </span>
        <h3 className="mt-5 text-balance font-serif text-[1.95rem] font-semibold leading-[1.1] text-[#1a1a1a] md:text-[2.5rem]">
          {owner
            ? <>This is what you bought.</>
            : ticket ? <>Don&rsquo;t stake {ticket} on a brochure.</> : <>Don&rsquo;t buy on a brochure.</>}
        </h3>
        {truthScore > 0 && (
          <p className="mt-4 text-[0.98rem] leading-relaxed text-[#1a1a1a]/65">
            {projectName} scored <b className="font-semibold text-[#1a1a1a]">{Math.round(truthScore)}/100</b>
            {grade ? <> — &ldquo;{grade}&rdquo;</> : null}. The full read shows exactly what cost it the other{" "}
            <b className="font-semibold text-[#b0503e]">{lost} points</b>
            {owner ? <> — and which of them you can still do something about.</> : <> — and whether that&rsquo;s a dealbreaker for you.</>}
          </p>
        )}
        <button
          onClick={onUnlock}
          className="group mt-7 inline-flex w-full flex-col items-center justify-center gap-0.5 rounded-lg bg-[#1e6b45] px-6 py-3 text-white shadow-[0_18px_40px_-16px_rgba(30,107,69,0.6)] transition-all hover:bg-[#238c55] sm:w-auto sm:px-12"
        >
          <span className="inline-flex items-center gap-2 text-[1rem] font-semibold tracking-[0.01em]">
            {firstFree ? "Unlock First Report at ₹0" : <>Get the full read — {inr(read.inr)}</>}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          {firstFree
            ? <span className="text-[0.72rem] font-medium text-white/85"><span className="text-white/55 line-through">{inr(d?.mrp ?? read.inr)}</span> · your first report is free</span>
            : d && (
              <span className="text-[0.72rem] font-medium text-white/85">
                <span className="text-white/55 line-through">{inr(d.mrp)}</span> · save {inr(d.mrp - read.inr)} ({d.pct}% off)
              </span>
            )}
        </button>
        <p className="mt-3.5 text-[0.82rem] leading-relaxed text-[#1a1a1a]/55">
          {firstFree
            ? <>Free on sign-up — no card. One missed red flag costs a great deal more.</>
            : owner
            ? <>While it&rsquo;s still going up, what this finds is still worth acting on.</>
            : ticket
            ? <>That&rsquo;s a rounding error on {ticket} — one missed red flag costs a great deal more.</>
            : <>One missed red flag costs a great deal more than the read.</>}
        </p>
      </div>

      {/* ── what's behind the wall — every row taps to unlock ── */}
      <div className="mx-auto mt-11 max-w-2xl">
        <p className="text-center text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#1a1a1a]/40">What you&rsquo;re not seeing</p>
        <div className="mt-5 divide-y divide-[#1a1a1a]/8 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/55">
          {LOCKED.map((s) => (
            <button
              key={s.t}
              onClick={onUnlock}
              className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1e6b45]/[0.05] md:px-6"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1a1a1a]/[0.05] text-[#9a7a2e] transition-colors group-hover:bg-[#1e6b45]/10 group-hover:text-[#1e6b45]">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                {/* The numeral sits ON ITS OWN LINE, always. These were flex
                    siblings that wrapped, so whether "Pillar I" shared a line
                    with its title came down to how long the title happened to
                    be — "Developer DNA" and "Project USPs" fitted and sat
                    inline, "Construction & sales" did not and dropped below.
                    Five rows in one card, ragged three different ways. */}
                <span className="block font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[#c9a96e]">{s.k}</span>
                <span className="mt-0.5 block font-serif text-[1.05rem] font-medium leading-tight text-[#1a1a1a]">{s.t}</span>
                <span className="mt-0.5 block text-[0.82rem] font-light leading-snug text-[#1a1a1a]/55">
                  {(owner && OWNER_HOOKS[s.t]) || s.hook}
                </span>
              </span>
              <span aria-hidden className="shrink-0 text-[0.72rem] font-semibold text-[#1e6b45] opacity-60 transition-opacity group-hover:opacity-100">
                Unlock →
              </span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-center text-[0.72rem] leading-relaxed text-[#1a1a1a]/45">
          Register, then pay once — no subscription. Custom packages are shaped on your first free advisor call.
        </p>
      </div>
    </div>
  );
}

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
