"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — "let the market compete for your price."

   A reverse auction, not a negotiation tip-sheet: the buyer names a
   target; verified brokers, owners & developers send written offers over
   2–4 days while the buyer stays anonymous. ₹0 to start; the desk earns a
   share only of what it saves.

   Three surfaces, one dark, high-contrast treatment (the report's
   strong-CTA language) so it carries real weight:
     • band   — full-width, right after Vitals (pre-paywall).
     • rail   — compact, under the unlock/desk card in the desktop rail.
     • sticky — a mobile bottom bar that docks after the reader is engaged.

   Every CTA opens the Deal Room sheet (the whole flow lives there).

   HONEST BY DESIGN — matches /deal-room. There is no live marketplace yet;
   the concierge desk runs each mandate by hand. So this surface shows NO
   fabricated auction (no "sellers competing", no countdown, no invented
   live bids). The only figures shown are the project's OWN filed asking
   price and the 5–10% band our buyers typically settle under — a stated
   methodology claim, consistent with the report and with /deal-room, never
   an invented number. Anything else would contradict the truth brand.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";

export const DEAL_ROOM_BAND_ID = "deal-room";

/* ── Shared deal math (also used by the sheet) ──────────────────────
   Anchored on the project's own filed entry price (ticketCr). The target
   band is the 5–10% our buyers typically settle under asking — the same
   methodology /deal-room states. No fabricated bids. */
export type Deal = {
  market: number;    // the project's filed asking / entry price (Cr)
  targetLow: number; // 10% under — the ambitious end
  targetHigh: number;// 5% under — the conservative end
  saveLow: number;   // 5% of asking
  saveHigh: number;  // 10% of asking
};

export function computeDeal(ticketCr: number): Deal | null {
  if (!(ticketCr > 0)) return null;
  const market = ticketCr;
  return {
    market,
    targetLow: market * 0.9,
    targetHigh: market * 0.95,
    saveLow: market * 0.05,
    saveHigh: market * 0.1,
  };
}
export const cr = (v: number) => `₹${v.toFixed(2)} Cr`;
export const save = (c: number) => {
  const l = c * 100;
  return l < 100 ? `₹${Math.round(l)} L` : `₹${(Math.round(c * 10) / 10).toFixed(1)} Cr`;
};
/* The FOMO figure: what the read is worth at the table — the 5–10% band the
   desk settles across, applied to this project's entry ticket. Stated as
   "typical", never guaranteed. */
export const potentialRange = (market: number) => `${save(market * 0.05)} – ${save(market * 0.1)}`;
export function dealPotentialHighCr(ticketCr: number): number {
  const d = computeDeal(ticketCr);
  return d ? d.market * 0.1 : 0;
}

const COPY = {
  eyebrow: "The Deal Room",
  headline: "Let the market compete for your price.",
  subBand: (name: string) =>
    `Name your target for ${name}. Verified brokers, owners & developers send written offers in 2–4 days — you stay anonymous.`,
  subRail: "Name your target. Written offers in 2–4 days — you stay anonymous.",
  button: "Get the best price",
  buttonMobile: "Best price",
  fine: "Neutral · on the record · we earn a share only of what we save you.",
};

const STYLE = `
  .tdr .tdr-fill{transform-origin:left;transition:transform .8s cubic-bezier(.2,.6,.2,1);}
  .tdr.is-armed .tdr-fill{transform:scaleX(0);}
  .tdr.is-armed[data-in] .tdr-fill{transform:scaleX(var(--w));}
  .tdr .tdr-rise{transition:opacity .6s ease,transform .6s cubic-bezier(.2,.6,.2,1);}
  .tdr.is-armed .tdr-rise{opacity:0;transform:translateY(10px);}
  .tdr.is-armed[data-in] .tdr-rise{opacity:1;transform:none;}
  @media (prefers-reduced-motion:reduce){
    .tdr .tdr-rise{opacity:1!important;transform:none!important;transition:none!important;}
    .tdr .tdr-fill{transform:scaleX(var(--w))!important;transition:none!important;}
  }
`;

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("is-armed");
    const io = new IntersectionObserver(
      (es) => es.some((e) => e.isIntersecting) && (el.setAttribute("data-in", ""), io.disconnect()),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ── The deal card — honest: the project's filed asking price, the band
   buyers typically settle at, and what that keeps in your pocket. No live
   auction, no invented bids. Inset on the dark band. ─────────────────── */
export function DealCard({ ticketCr, compact = false }: { ticketCr: number; compact?: boolean }) {
  const deal = computeDeal(ticketCr);
  if (!deal) return null;
  const { market, targetLow, targetHigh, saveLow, saveHigh } = deal;
  const typicalMid = (targetLow + targetHigh) / 2;
  const wTypical = market > 0 ? typicalMid / market : 1;
  return (
    <div className={`rounded-2xl border border-white/12 bg-white/[0.055] ${compact ? "p-4" : "p-5"} backdrop-blur-sm`}>
      <div className="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.12em]">
        <span className="text-[#c9a96e]">How buyers win here</span>
        <span className="text-white/35">on the record</span>
      </div>

      {/* the project's own filed asking price */}
      <div className={compact ? "mt-3" : "mt-4"}>
        <div className="flex items-baseline justify-between">
          <span className="text-[0.72rem] font-light text-white/50">Current asking</span>
          <span className="font-mono text-[0.9rem] text-white/70">{cr(market)}</span>
        </div>
        <span className="mt-1.5 block h-[6px] overflow-hidden rounded-full bg-white/10">
          <span className="tdr-fill block h-full rounded-full" style={{ ["--w" as string]: "1", background: "#c9a96e" }} />
        </span>
      </div>

      {/* the band buyers typically settle at */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[0.72rem] font-light text-white/50">Where buyers typically settle</span>
          <span className="font-mono text-[0.9rem] font-semibold text-[#5fd39a]">{`₹${targetLow.toFixed(2)}–${targetHigh.toFixed(2)} Cr`}</span>
        </div>
        <span className="mt-1.5 block h-[6px] overflow-hidden rounded-full bg-white/10">
          <span className="tdr-fill block h-full rounded-full" style={{ ["--w" as string]: wTypical.toFixed(3), background: "#5fd39a" }} />
        </span>
      </div>

      {/* what that keeps in your pocket */}
      <div className="mt-3.5 flex items-baseline justify-between border-t border-white/10 pt-3">
        <span className="whitespace-nowrap text-[0.62rem] font-medium uppercase tracking-[0.1em] text-white/45">You keep</span>
        <span className="whitespace-nowrap font-mono text-[1.05rem] font-semibold text-[#5fd39a]">{save(saveLow)} – {save(saveHigh)}</span>
      </div>

      {!compact && (
        <p className="mt-2.5 text-[0.62rem] font-light leading-[1.5] text-white/40">
          The 5–10% our buyers typically settle under asking. Your Deal Room targets <span className="text-white/60">your</span> number — sellers send written offers, you pick the best.
        </p>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#c9a96e]/35 bg-white/[0.04] px-2.5 py-1 text-[0.66rem] font-medium text-[#e3c07f]">{children}</span>;
}

/* Dark, high-contrast frame shared by band + rail — the strong-CTA panel. */
function panelClass(extra = "") {
  return `tdr relative overflow-hidden rounded-2xl bg-[#0B1F1A] text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] ${extra}`;
}
function Glow() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(47,154,104,0.4), transparent 70%)", filter: "blur(32px)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)" }} />
    </>
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
      <div ref={ref} className={panelClass("mt-4 p-4")}>
        <style>{STYLE}</style>
        <Glow />
        <div className="relative">
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.2em] text-[#c9a96e]">{COPY.eyebrow}</p>
          <p className="mt-1 font-serif text-[1.05rem] font-medium leading-[1.2] text-white">{COPY.headline}</p>
          {potRange && (
            <div className="tdr-rise mt-2.5 flex items-baseline justify-between gap-2">
              <span className="shrink-0 whitespace-nowrap text-[0.52rem] font-bold uppercase tracking-[0.12em] text-[#c9a96e]/80">Potential saving</span>
              <span className="whitespace-nowrap font-serif text-[1.35rem] font-semibold leading-none text-[#e3c07f]">{potRange}</span>
            </div>
          )}
          <p className="mt-2 text-[0.66rem] font-light leading-snug text-white/50">{COPY.subRail}</p>
          <button onClick={onStart} className="group mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2f9a68] px-5 py-2.5 text-[0.84rem] font-semibold text-white transition-colors hover:bg-[#38b37c]">
            {COPY.button} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>
      </div>
    );
  }

  // band — full width, dark, dramatic
  return (
    <div ref={ref} id={DEAL_ROOM_BAND_ID} className={panelClass("scroll-mt-24 p-7 md:p-10")}>
      <style>{STYLE}</style>
      <Glow />
      <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:items-center md:gap-12">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#c9a96e]">{COPY.eyebrow}</p>
          <h2 className="mt-2.5 font-serif text-[2rem] font-medium leading-[1.08] text-white md:text-[2.5rem]">{COPY.headline}</h2>
          {potRange && (
            <div className="tdr-rise mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#c9a96e]/90">Potential saving</span>
              <span className="font-serif text-[2.6rem] font-semibold leading-none text-[#e3c07f] md:text-[3.1rem]">{potRange}</span>
              <span className="w-full text-[0.74rem] font-light leading-snug text-white/50">the 5&ndash;10% our buyers typically settle under the asking price</span>
            </div>
          )}
          <p className="mt-5 max-w-xl text-[0.96rem] font-light leading-[1.7] text-white/70">{COPY.subBand(projectName)}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip>Written offers</Chip><Chip>Anonymous</Chip><Chip>₹0 to start</Chip>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button onClick={onStart} className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f9a68] px-7 py-3.5 text-[0.95rem] font-semibold text-white shadow-[0_18px_40px_-16px_rgba(47,154,104,0.8)] transition-colors hover:bg-[#38b37c]">
              {COPY.button} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
            <p className="text-[0.72rem] font-light leading-[1.5] text-white/45">{COPY.fine}</p>
          </div>
        </div>
        <DealCard ticketCr={ticketCr} />
      </div>
    </div>
  );
}

/* ── Mobile sticky bar — strong, dark, docks after engagement ────────
   Appears past ~40% depth OR ~15s on page, whichever first; never on load.
   Once per session. Hidden while the in-page band is on screen. Dismiss ×
   quiets it 7 days. Phones only (≥768 uses the rail card / desktop pill). */
const DISMISS_KEY = "te.dealroom.stickyDismissedUntil";

export function DealRoomStickyBar({ ticketCr, onStart }: { ticketCr: number; onStart?: () => void }) {
  const [armed, setArmed] = useState(false);
  const [bandVisible, setBandVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const potHigh = dealPotentialHighCr(ticketCr);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
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
    const arm = () => { if (done) return; done = true; setArmed(true); cleanup(); };
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && window.scrollY / h > 0.4) arm();
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
      <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-[#c9a96e]/25 bg-[#0B1F1A] shadow-[0_22px_48px_-16px_rgba(0,0,0,0.7)]">
        <div aria-hidden className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)" }} />
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#c9a96e]">The Deal Room</p>
            <p className="mt-0.5 truncate text-[0.86rem] font-semibold leading-tight text-white">
              {potHigh > 0 ? <>Save up to <span className="text-[#e3c07f]">~{save(potHigh)}</span> — let the market compete</> : <>Let the market compete for your price</>}
            </p>
          </div>
          <button onClick={onStart} className="shrink-0 rounded-lg bg-[#2f9a68] px-4 py-2.5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-[#38b37c]">
            {COPY.buttonMobile} →
          </button>
          <button
            onClick={() => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 864e5)); } catch { /* ignore */ } }}
            aria-label="Dismiss"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
