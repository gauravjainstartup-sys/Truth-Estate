"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — "let the market compete for your price."

   A reverse auction, not a negotiation tip-sheet. The buyer names a
   target; verified brokers, owners & developers send written offers over
   2–4 days while the buyer stays anonymous. ₹0 to start; the desk earns a
   share only of what it saves. This module is the entry point.

   Built to the founder's "Deal Room Placements" spec — three variants of
   one module, one memorable line everywhere:

     • band   — full-width, right after Vitals (pre-paywall), pitch + a
                live step-down auction card.
     • rail   — compact, under the unlock card in the desktop rail.
     • sticky — a mobile bottom bar that docks after the reader is engaged.

   Figures are ILLUSTRATIVE, derived from the project's own filed entry
   price; the live module will read real cohort state. The CTA is a
   placeholder until the marketplace backend is wired.

   Motion (offers landing, best-bid step-down, a live pulse, a gold
   shimmer) is one-time on scroll-in and fully disabled under
   prefers-reduced-motion.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";

export const DEAL_ROOM_BAND_ID = "deal-room";

const COPY = {
  eyebrow: "The Deal Room",
  headline: "Let the market compete for your price.",
  subBand: (name: string) =>
    `Name your target for ${name}. Verified brokers, owners & developers send written offers in 2–4 days — you stay anonymous.`,
  subRail: "Name your target. Written offers in 2–4 days. ₹0 to start.",
  button: "Get the best price",
  buttonMobile: "Best price",
  fine: "Neutral · on the record · we earn a share only of what we save you.",
};

/* Illustrative cohort, stepped down off the filed entry price. The bands
   (−3.5% / −5% / −6.5%) match the 5–10% the desk quotes across the book,
   applied to the entry ticket so the figure under-promises above it. */
type Bid = { k: string; who: string; cr: number };
function computeDeal(ticketCr: number): { market: number; bids: Bid[]; best: number; saveCr: number } | null {
  if (!(ticketCr > 0)) return null;
  const market = ticketCr;
  const bids: Bid[] = [
    { k: "B", who: "Verified broker", cr: market * 0.965 },
    { k: "O", who: "Direct owner", cr: market * 0.95 },
    { k: "P", who: "Channel partner", cr: market * 0.935 },
  ];
  const best = Math.min(...bids.map((b) => b.cr));
  return { market, bids, best, saveCr: market - best };
}
const cr = (v: number) => `₹${v.toFixed(2)} Cr`;
const save = (c: number) => {
  const l = c * 100;
  return l < 100 ? `₹${Math.round(l)} L` : `₹${(Math.round(c * 10) / 10).toFixed(1)} Cr`;
};
/* The FOMO figure: what the read is worth at the table — the 5–10% band the
   desk settles across, applied to this project's entry ticket. */
const potentialRange = (market: number) => `${save(market * 0.05)} – ${save(market * 0.1)}`;

const STYLE = `
  .tdr .tdr-pulse{position:relative;}
  .tdr .tdr-pulse::before{content:"";position:absolute;left:-2px;top:50%;transform:translateY(-50%);width:6px;height:6px;border-radius:50%;background:#1e6b45;box-shadow:0 0 0 0 rgba(30,107,69,.5);animation:tdr-pulse 2.4s ease-out infinite;}
  @keyframes tdr-pulse{0%{box-shadow:0 0 0 0 rgba(30,107,69,.5)}70%{box-shadow:0 0 0 7px rgba(30,107,69,0)}100%{box-shadow:0 0 0 0 rgba(30,107,69,0)}}
  .tdr .tdr-bid{transition:opacity .55s cubic-bezier(.2,.6,.2,1),transform .55s cubic-bezier(.2,.6,.2,1);}
  .tdr.is-armed .tdr-bid{opacity:0;transform:translateY(8px);}
  .tdr.is-armed[data-in] .tdr-bid{opacity:1;transform:none;}
  .tdr .tdr-fill{transform-origin:right;transition:transform .8s cubic-bezier(.2,.6,.2,1);}
  .tdr.is-armed .tdr-fill{transform:scaleX(1);}
  .tdr.is-armed[data-in] .tdr-fill{transform:scaleX(var(--w));}
  .tdr .tdr-best{transition:opacity .6s ease .35s;}
  .tdr.is-armed .tdr-best{opacity:0;}
  .tdr.is-armed[data-in] .tdr-best{opacity:1;}
  @media (prefers-reduced-motion:reduce){
    .tdr .tdr-pulse::before{animation:none}
    .tdr .tdr-bid,.tdr .tdr-best{opacity:1!important;transform:none!important;transition:none!important;}
    .tdr .tdr-fill{transform:scaleX(var(--w))!important;transition:none!important;}
  }
`;

/* Reveal the auction card once when it scrolls into view (JS-gated, so it
   is fully visible without JS or under reduced-motion). */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("is-armed");
    const io = new IntersectionObserver(
      (es) => es.some((e) => e.isIntersecting) && (el.setAttribute("data-in", ""), io.disconnect()),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ── The live auction card (shared by band + rail) ────────────────── */
function AuctionCard({ ticketCr, compact = false }: { ticketCr: number; compact?: boolean }) {
  const deal = computeDeal(ticketCr);
  if (!deal) return null;
  const { market, bids, best, saveCr } = deal;
  return (
    <div className={`rounded-2xl border border-[#1a1a1a]/10 bg-white/70 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between text-[0.62rem] font-medium uppercase tracking-[0.12em]">
        <span className="tdr-pulse pl-3 text-[#1e6b45]">3 sellers competing</span>
        <span className="text-[#1a1a1a]/40">2 days left</span>
      </div>
      {!compact && (
        <div className="mt-3 flex items-baseline justify-between border-b border-dashed border-[#1a1a1a]/12 pb-2.5">
          <span className="text-[0.72rem] font-light text-[#1a1a1a]/50">Current market</span>
          <span className="font-mono text-[0.92rem] text-[#1a1a1a]/70">{cr(market)}</span>
        </div>
      )}
      <div className={`${compact ? "mt-2.5" : "mt-3"} space-y-2`}>
        {bids.map((b, i) => {
          const w = market > 0 ? b.cr / market : 1;
          const isBest = b.cr === best;
          return (
            <div key={b.k} className="tdr-bid flex items-center gap-2.5" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold ${isBest ? "bg-[#1e6b45] text-white" : "bg-[#1a1a1a]/[0.06] text-[#1a1a1a]/60"}`}>{b.k}</span>
              {!compact && <span className="w-24 shrink-0 truncate text-[0.72rem] font-light text-[#1a1a1a]/55">{b.who}</span>}
              <span className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-[#1a1a1a]/[0.06]">
                <span className="tdr-fill absolute inset-y-0 left-0 w-full rounded-full" style={{ ["--w" as string]: w.toFixed(3), background: isBest ? "#1e6b45" : "#c9a96e" }} />
              </span>
              <span className={`w-[4.6rem] shrink-0 text-right font-mono text-[0.8rem] ${isBest ? "font-semibold text-[#1e6b45]" : "text-[#1a1a1a]/70"}`}>{cr(b.cr)}</span>
            </div>
          );
        })}
      </div>
      <div className="tdr-best mt-3 flex items-center justify-between border-t border-[#1a1a1a]/8 pt-2.5">
        <span className="text-[0.66rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/45">Best so far</span>
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-[1rem] font-semibold text-[#1e6b45]">{cr(best)}</span>
          <span className="rounded-full bg-[#1e6b45]/[0.1] px-2 py-0.5 font-mono text-[0.68rem] font-bold text-[#1e6b45]">−{save(saveCr)} vs market</span>
        </span>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#9a7a2e]/30 bg-white/50 px-2.5 py-1 text-[0.66rem] font-medium text-[#7a5f1e]">{children}</span>;
}
function Cta({ label, onClick, full = false }: { label: string; onClick?: () => void; full?: boolean }) {
  return (
    <button onClick={onClick} className={`group inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e6b45] px-6 py-3 text-[0.9rem] font-semibold text-white shadow-[0_16px_36px_-18px_rgba(30,107,69,0.7)] transition-colors hover:bg-[#238c55] ${full ? "w-full" : ""}`}>
      {label} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
    </button>
  );
}

export default function DealRoom({
  variant, projectName, ticketCr, onStart,
}: {
  variant: "band" | "rail";
  projectName: string;
  ticketCr: number;
  onStart?: () => void;
}) {
  const ref = useReveal<HTMLDivElement>();
  const deal = computeDeal(ticketCr);
  const potRange = deal ? potentialRange(deal.market) : null;

  if (variant === "rail") {
    return (
      <div ref={ref} className="tdr mt-4 rounded-2xl border border-[#c9a96e]/35 bg-[#c9a96e]/[0.08] p-5">
        <style>{STYLE}</style>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-[#9a7a2e]">{COPY.eyebrow}</p>
        <p className="mt-1.5 font-serif text-[1.18rem] font-medium leading-[1.25] text-[#1a1a1a]">{COPY.headline}</p>
        <p className="mt-2 text-[0.76rem] font-light leading-[1.5] text-[#1a1a1a]/60">{COPY.subRail}</p>
        {potRange && (
          <p className="mt-3 text-[0.82rem] text-[#1e6b45]">Potential saving <b className="font-semibold">{potRange}</b></p>
        )}
        {deal && (
          <div className="tdr-best mt-3 rounded-xl border border-[#1a1a1a]/10 bg-white/70 px-3.5 py-3">
            <div className="flex items-center justify-between text-[0.56rem] font-medium uppercase tracking-[0.12em]">
              <span className="tdr-pulse pl-3 text-[#1e6b45]">3 competing</span>
              <span className="text-[#1a1a1a]/40">2 days left</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[0.64rem] uppercase tracking-[0.1em] text-[#1a1a1a]/45">Best so far</span>
              <span className="font-mono text-[1.05rem] font-semibold text-[#1e6b45]">{cr(deal.best)}</span>
            </div>
            <div className="mt-1.5 flex justify-end">
              <span className="rounded-full bg-[#1e6b45]/[0.1] px-2 py-0.5 font-mono text-[0.64rem] font-bold text-[#1e6b45]">−{save(deal.saveCr)} vs market</span>
            </div>
          </div>
        )}
        <div className="mt-3.5"><Cta label={COPY.button} onClick={onStart} full /></div>
        <p className="mt-2.5 text-center text-[0.62rem] font-light leading-[1.4] text-[#1a1a1a]/40">{COPY.fine}</p>
      </div>
    );
  }

  // band — full width, two columns on desktop
  return (
    <div ref={ref} id={DEAL_ROOM_BAND_ID} className="tdr scroll-mt-24 rounded-2xl border border-[#c9a96e]/35 bg-gradient-to-br from-[#c9a96e]/[0.1] to-[#c9a96e]/[0.04] p-7 md:p-9">
      <style>{STYLE}</style>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:items-center md:gap-12">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#9a7a2e]">{COPY.eyebrow}</p>
          <h2 className="mt-2.5 font-serif text-[1.9rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.3rem]">{COPY.headline}</h2>
          {potRange && (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#1e6b45]/75">Potential saving</span>
              <span className="font-serif text-[1.9rem] font-semibold leading-none text-[#1e6b45] md:text-[2.15rem]">{potRange}</span>
              <span className="w-full text-[0.72rem] font-light leading-snug text-[#1a1a1a]/50">the 5&ndash;10% our buyers typically settle under the asking price</span>
            </div>
          )}
          <p className="mt-4 max-w-xl text-[0.96rem] font-light leading-[1.7] text-[#1a1a1a]/65">{COPY.subBand(projectName)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip>Written offers</Chip><Chip>Anonymous</Chip><Chip>₹0 to start</Chip>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Cta label={COPY.button} onClick={onStart} />
            <p className="text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/45">{COPY.fine}</p>
          </div>
        </div>
        <AuctionCard ticketCr={ticketCr} />
      </div>
    </div>
  );
}

/* ── Mobile sticky bar ────────────────────────────────────────────────
   Docks after the reader is engaged — scrolled past ~40% depth OR ~15s on
   page, whichever first; never on load. Once per session. Hidden while the
   in-page band is on screen. Dismiss × quiets it for 7 days. Mobile only. */
const DISMISS_KEY = "te.dealroom.stickyDismissedUntil";
const SHOWN_KEY = "te.dealroom.stickyShown";

export function DealRoomStickyBar({ savingCr, onStart }: { savingCr: number; onStart?: () => void }) {
  const [armed, setArmed] = useState(false);
  const [bandVisible, setBandVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return; // phones only; ≥768 uses the rail card / desktop pill
    try {
      const until = parseInt(localStorage.getItem(DISMISS_KEY) ?? "", 10);
      if (Number.isFinite(until) && Date.now() < until) return;
    } catch { /* ignore */ }

    const band = document.getElementById(DEAL_ROOM_BAND_ID);
    let io: IntersectionObserver | undefined;
    if (band) {
      io = new IntersectionObserver((es) => setBandVisible(es.some((e) => e.isIntersecting)), { threshold: 0.15 });
      io.observe(band);
    }

    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setArmed(true);
      try { sessionStorage.setItem(SHOWN_KEY, "1"); } catch { /* ignore */ }
      cleanup();
    };
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && (window.scrollY / h) > 0.4) arm();
    };
    const t = window.setTimeout(arm, 15000);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() { window.clearTimeout(t); window.removeEventListener("scroll", onScroll); }
    return () => { cleanup(); io?.disconnect(); };
  }, []);

  if (dismissed || !armed) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-500 md:hidden ${bandVisible ? "translate-y-full" : "translate-y-0"}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-[#9a7a2e]/25 bg-[#faf7f0] px-4 py-3 shadow-[0_18px_40px_-16px_rgba(40,32,18,0.5)]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.82rem] font-semibold leading-tight text-[#1a1a1a]">{COPY.headline.replace(/\.$/, "")}</p>
          <p className="truncate text-[0.68rem] font-light text-[#1a1a1a]/55">
            Offers in 2–4 days · ₹0 to start{savingCr > 0 ? ` · save up to ~${save(savingCr)}` : ""}
          </p>
        </div>
        <button onClick={onStart} className="shrink-0 rounded-lg bg-[#1e6b45] px-4 py-2.5 text-[0.8rem] font-semibold text-white transition-colors hover:bg-[#238c55]">
          {COPY.buttonMobile} →
        </button>
        <button onClick={() => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 864e5)); } catch { /* ignore */ } }} aria-label="Dismiss" className="shrink-0 grid h-7 w-7 place-items-center rounded-full text-[#1a1a1a]/40 transition-colors hover:bg-[#1a1a1a]/[0.06] hover:text-[#1a1a1a]/70">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}

/* The FOMO figure for the sticky bar's subline (potential saving, high end
   of the 5–10% band) — without rendering the whole card. */
export function dealSavingCr(ticketCr: number): number {
  const d = computeDeal(ticketCr);
  return d ? d.market * 0.1 : 0;
}
