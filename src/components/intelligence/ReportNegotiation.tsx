"use client";

/* ════════════════════════════════════════════════════════════════
   NEGOTIATE LIKE A KING — the leverage this file hands the buyer.

   Renders on locked AND unlocked reports, deliberately. A guest sees the
   leverage and the figure behind it; what they do not see is the ask —
   the sentence to send, the clause to name, the number to counter with.

   That split is the honest one. Telling someone "you have a card here,
   and here is the number that proves it" is worth reading on its own and
   is true whether or not they ever pay us. Telling them exactly how to
   play it is the work, and the work is what the ₹1,100 buys.

   It is also the section that gives a locked report something for a
   crawler to index that is unique to this project: every figure below
   comes from this file, and a lever with no figure never renders.
   ════════════════════════════════════════════════════════════════ */
import { FREE_LEVERS, negotiationLevers, type Lever } from "@/lib/negotiation";
import type { ProjectIntel } from "@/lib/projects";

/* What buyers advised off these files settle at against the prevailing
   rate — a range across the whole book, not a per-project projection. */
const SAVE_LOW = 0.05;
const SAVE_HIGH = 0.1;

/* The saving band, in the unit an Indian reader actually thinks in: lakh
   until it stops being sensible, then crore — "₹250 lakh" is a number
   nobody says out loud. The unit is written ONCE when both ends share it,
   because "₹15 lakh–₹30 lakh" is how a spreadsheet writes a range and
   "₹15–30 lakh" is how a person says it. */
function savingRange(cr: number): string {
  const unit = (v: number) => (v * 100 < 100 ? "lakh" : "Cr");
  const val = (v: number) => {
    if (v * 100 < 100) return String(Math.round(v * 100));
    const c = Math.round(v * 10) / 10;
    return Number.isInteger(c) ? String(c) : c.toFixed(1);
  };
  const lo = cr * SAVE_LOW, hi = cr * SAVE_HIGH;
  return unit(lo) === unit(hi)
    ? `₹${val(lo)}\u2013${val(hi)} ${unit(hi)}`
    : `₹${val(lo)} ${unit(lo)}\u2013₹${val(hi)} ${unit(hi)}`;
}

export default function ReportNegotiation({
  p,
  locked,
  onUnlock,
}: {
  p: ProjectIntel;
  locked: boolean;
  onUnlock: () => void;
}) {
  const levers = negotiationLevers(p);
  if (!levers.length) return null;

  const shown = locked ? levers.slice(0, FREE_LEVERS) : levers;
  const held = locked ? levers.slice(FREE_LEVERS) : [];

  /* WHAT THIS IS WORTH, IN MONEY.
     The 5-10% band is the founder's own figure for what buyers advised off
     these files settle at against the prevailing rate — stated as what it
     is: a range across every project we advise on, not a promise about
     this one. It is applied to the ENTRY ticket rather than the top of the
     band, so the number under-promises on every configuration above the
     smallest. What is never written here is a count of buyers or a total
     saved: we do not measure either, and an invented one is the single
     easiest thing on this page for a reader to disbelieve. */
  const ticketCr = p.budget?.[0] ?? 0;
  const saving = ticketCr > 0 ? savingRange(ticketCr) : null;
  const psfNow = p.ops?.price?.currentHigh ?? p.ops?.price?.currentLow ?? null;
  const premiumPct = p.psf && psfNow && psfNow > p.psf.high ? Math.round(((psfNow - p.psf.high) / p.psf.high) * 100) : null;

  return (
    <div>
      <div className="-mt-2 mb-7 rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/[0.07] p-6 md:p-7">
        <p className="font-serif text-[1.24rem] font-medium leading-[1.4] text-[#1a1a1a] md:text-[1.38rem]">
          The weak spots in this report are your argument.
        </p>
        <p className="mt-3 max-w-2xl text-[0.92rem] font-light leading-[1.75] text-[#1a1a1a]/65">
          {saving ? (
            <>
              Across the projects we advise on, buyers typically settle <b className="font-semibold text-[#1a1a1a]">5&ndash;10% under</b> the
              prevailing rate. On a ₹{ticketCr} Cr entry ticket that is <b className="font-semibold text-[#1a1a1a]">{saving}</b>.{" "}
            </>
          ) : null}
          {levers.length === 1 ? "One thing" : `${levers.length} things`} in {p.name}&rsquo;s own filings can be
          argued with.
          {/* The premium is stated as a share and left there. Multiplying it
              out reads as a prize on offer — "₹5.3 crore of premium" on DLF
              The Arbour — and nobody negotiates away the entire gap between
              a landmark project and its corridor's median. The percentage is
              the true thing: something they should be made to itemise. */}
          {premiumPct != null && premiumPct >= 5 ? (
            <> Entry here also sits about {premiumPct}% above the corridor&rsquo;s tracked top — a premium worth making them itemise line by line.</>
          ) : null}{" "}
          A buyer who arrives with a specific number is negotiating. One who asks for the best price is waiting to be told.
        </p>
      </div>

      <p className="mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
        Every project hands the buyer different cards. These are {p.name}&rsquo;s — read off its own construction,
        sales and registry data, not general advice about negotiating.
      </p>

      <ol className="divide-y divide-[#1a1a1a]/8 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/50">
        {shown.map((l, i) => (
          <li key={l.key} className="px-6 py-6 md:px-7">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[0.62rem] font-bold tracking-[0.16em] text-[#c9a96e]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-serif text-[1.15rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.28rem]">
                {l.title}
              </h3>
            </div>
            <p className="mt-2.5 pl-[calc(0.62rem+0.75rem)] text-[0.9rem] font-light leading-[1.75] text-[#1a1a1a]/65">
              {l.evidence}
            </p>

            {locked ? (
              <button
                onClick={onUnlock}
                className="group mt-3 flex w-full items-center gap-2.5 rounded-lg border border-dashed border-[#9a7a2e]/40 bg-[#c9a96e]/[0.07] px-4 py-3 text-left transition-colors hover:border-[#9a7a2e]/70 hover:bg-[#c9a96e]/[0.12]"
              >
                <LockMark />
                <span className="min-w-0 flex-1 text-[0.82rem] font-light leading-snug text-[#7a5f1e]">
                  What to actually ask for here — the wording, and what it is reasonable to expect back.
                </span>
                <span aria-hidden className="shrink-0 text-[0.78rem] font-semibold text-[#9a7a2e] transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            ) : (
              <div className="mt-3.5 rounded-lg border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-4 py-3.5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#1e6b45]">Your ask</p>
                <p className="mt-1.5 text-[0.9rem] font-light leading-[1.75] text-[#1a1a1a]/80">{l.ask}</p>
              </div>
            )}
          </li>
        ))}
      </ol>

      {held.length > 0 && <Withheld levers={held} onUnlock={onUnlock} start={shown.length} />}

      {!locked && (
        <p className="mt-5 text-[0.78rem] font-light italic leading-relaxed text-[#1a1a1a]/45">
          Leverage is not a discount. The best outcome on most of these is a better payment structure, a written date
          or a clause changed — all of which are worth more over five years than the two per cent everybody asks for.
        </p>
      )}
    </div>
  );
}

/* The remaining levers, named but not spent. Naming them matters: a
   "3 more" counter is a claim, whereas a titled row is checkable, and
   the reader can judge for themselves whether it is worth ₹1,100. */
function Withheld({ levers, onUnlock, start }: { levers: Lever[]; onUnlock: () => void; start: number }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#9a7a2e]/25 bg-[#c9a96e]/[0.06]">
      <p className="border-b border-[#9a7a2e]/15 px-6 py-3.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9a7a2e] md:px-7">
        {levers.length} more {levers.length === 1 ? "lever" : "levers"} on this project
      </p>
      <ul className="divide-y divide-[#9a7a2e]/12">
        {levers.map((l, i) => (
          <li key={l.key}>
            <button onClick={onUnlock} className="group flex w-full items-center gap-3.5 px-6 py-4 text-left transition-colors hover:bg-[#c9a96e]/[0.12] md:px-7">
              <span className="font-mono text-[0.62rem] font-bold tracking-[0.16em] text-[#c9a96e]">
                {String(start + i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[1.02rem] font-medium text-[#1a1a1a]/85">{l.title}</span>
                <span className="mt-0.5 block text-[0.78rem] font-light text-[#1a1a1a]/45">
                  The evidence on this project, and the ask that follows from it.
                </span>
              </span>
              <LockMark />
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onUnlock}
        className="w-full border-t border-[#9a7a2e]/15 bg-[#c9a96e]/[0.1] px-6 py-4 text-[0.85rem] font-semibold text-[#7a5f1e] transition-colors hover:bg-[#c9a96e]/20 md:px-7"
      >
        Unlock every lever on this project &rarr;
      </button>
    </div>
  );
}

function LockMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-[#9a7a2e]" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
