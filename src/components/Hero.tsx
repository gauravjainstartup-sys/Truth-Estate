"use client";

/* ────────────────────────────────────────────────────────────────────────
   Homepage hero — the Independent Buyer's Office.

   A calm, private-office hero built on the "Property Verdict" photograph.
   All content sits in the empty dark zone of the frame (left third on
   desktop, upper half on mobile); the photographed verdict document stays
   uncovered. Legibility never depends on the photo — a dark gradient carries
   the text at every breakpoint.

   Search is a real, submitting input. A hit routes to the intelligence
   workspace; a miss (a project we haven't covered) routes to the free
   consultation / custom-report enquiry — the buyer lead path.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import Logo from "./Logo";
import HeroSearch from "./HeroSearch";
import { useJourney } from "./journey/JourneyProvider";
import { AUTH_EVENT, isSignedIn, loadAccount } from "@/lib/journey";
import type { OmniIndex } from "@/lib/omni";
import { basePath } from "@/lib/site";

const IMG = `${basePath}/images`;

/* ── header icons — simple line marks, sized by the caller ── */
type IconProps = { className?: string };
const svgBase = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
function IconCompare({ className }: IconProps) { // two opposing arrows — compare / weigh side by side
  return <svg className={className} {...svgBase}><path d="M4 8h13M13 4l4 4-4 4" /><path d="M20 16H7M11 12l-4 4 4 4" /></svg>;
}
function IconDealRoom({ className }: IconProps) { // balance scale — on your side
  return <svg className={className} {...svgBase}><path d="M12 4v16M8 20h8M5 8h14" /><path d="M5 8l-2.5 5a2.5 2.5 0 0 0 5 0Z" /><path d="M19 8l-2.5 5a2.5 2.5 0 0 0 5 0Z" /></svg>;
}
function IconCube({ className }: IconProps) { // cube — Sun & Vastu 3D
  return <svg className={className} {...svgBase}><path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>;
}
function IconGlobe({ className }: IconProps) { // globe — NRI / overseas
  return <svg className={className} {...svgBase}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" /></svg>;
}
function Initial({ name }: { name: string }) {
  /* Same fallback fix as AccountChip: most accounts carry no name, and a
     bare "\u2022" in a gold circle read as an unlabelled dot. The person
     glyph says "account" without one. The gold-on-dark styling is this
     hero's own palette and stays. */
  const ch = name.trim().charAt(0).toUpperCase();
  return (
    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#c9a24b] text-[9px] font-bold text-[#0b1a12]">
      {ch || <IconUser className="h-[10px] w-[10px]" />}
    </span>
  );
}

function IconUser({ className }: IconProps) { // person — sign in
  return <svg className={className} {...svgBase}><circle cx="12" cy="8.5" r="3.3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>;
}
/* ── trust-chip marks — one distinct gold glyph per promise ── */
function IconShield({ className }: IconProps) { // shield + check — independent, on the buyer's side
  return <svg className={className} {...svgBase}><path d="M12 3l7 2.6v5.4c0 4.3-2.9 7.4-7 8.9-4.1-1.5-7-4.6-7-8.9V5.6z" /><path d="M9 12l2 2 4-4.2" /></svg>;
}
function IconTag({ className }: IconProps) { // price tag — best deal, secured
  return <svg className={className} {...svgBase}><path d="M20.6 13.4 12 22l-8.6-8.6a3 3 0 0 1 0-4.2l4.8-4.8a3 3 0 0 1 2.1-.9H16a4 4 0 0 1 4 4v4.5a3 3 0 0 1-.9 2.1z" /><circle cx="15.5" cy="8.5" r="1.3" /></svg>;
}
function IconRupee({ className }: IconProps) { // rupee coin — flat, fixed fee
  return <svg className={className} {...svgBase}><circle cx="12" cy="12" r="9" /><path d="M9.5 8.2h5M9.5 11h5M13.6 8.2c0 2.6-1.9 3-4.1 3l3.9 4.6" /></svg>;
}

const NAV = [
  { label: "Compare", href: `${basePath}/intelligence/compare`, Icon: IconCompare },
  { label: "Deal Room", href: `${basePath}/deal-room`, Icon: IconDealRoom },
  { label: "Sun & Vastu 3D", href: `${basePath}/sun-vastu`, Icon: IconCube },
];
const CHIPS = [
  { label: "Zero Brokerage, No Bias", Icon: IconShield },
  { label: "Best Deal, on Record", Icon: IconTag },
  { label: "Fixed Representation Fee", Icon: IconRupee },
];

/* Mobile-only header ticker — the three products roll through one at a time
   beside the menu (they live in the desktop nav, hidden below 900px, so on a
   phone they'd otherwise vanish). A masked gradient ring gives the pill a light
   shimmering border. The rolling content is decorative (aria-hidden); tapping
   the pill opens the menu, where the real links live — so an auto-advancing
   label can never mis-navigate. Hidden below 360px so it can't crowd the logo
   and hamburger on the narrowest phones. */
function MobileFeatureTicker({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Explore Truth Estate features"
      className="teh-tick relative hidden items-center rounded-full bg-[#f6f1e8]/[0.05] px-2.5 py-1.5 backdrop-blur-[2px] min-[360px]:inline-flex min-[900px]:hidden"
    >
      <style>{`
        .teh-tick::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.3px;
          background:linear-gradient(115deg,rgba(246,241,232,.22) 0%,rgba(246,241,232,.22) 36%,rgba(255,251,236,.95) 50%,rgba(246,241,232,.22) 64%,rgba(246,241,232,.22) 100%);
          background-size:230% 100%;
          -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
          -webkit-mask-composite:xor;mask-composite:exclude;
          animation:teh-tick-shimmer 3s linear infinite;pointer-events:none}
        .teh-tick::after{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;box-shadow:0 0 12px -3px rgba(231,207,149,.35)}
        .teh-tick-col{animation:teh-tick-roll 7.2s ease-in-out infinite}
        @keyframes teh-tick-roll{0%,26%{transform:translateY(0)}33.3%,59.3%{transform:translateY(-20px)}66.6%,92.6%{transform:translateY(-40px)}100%{transform:translateY(-60px)}}
        @keyframes teh-tick-shimmer{0%{background-position:210% 0}100%{background-position:-30% 0}}
        @media(prefers-reduced-motion:reduce){.teh-tick-col,.teh-tick::before{animation:none}}
      `}</style>
      <span aria-hidden className="block h-[20px] overflow-hidden">
        <span className="teh-tick-col flex flex-col">
          {[...NAV, NAV[0]].map((n, i) => (
            <span key={i} className="flex h-[20px] items-center justify-center gap-1.5 whitespace-nowrap text-[0.78rem] font-medium text-[#f6f1e8] [text-shadow:0_1px_3px_rgba(6,4,2,0.55)]">
              <n.Icon className="h-[13px] w-[13px] shrink-0 opacity-90" />{n.label}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

export default function Hero({ index }: { index: OmniIndex }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [who, setWho] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setWho(isSignedIn() ? (loadAccount()?.name ?? "") : null);
    read();
    /* AUTH_EVENT covers signing in on this page (the chat does it inline);
       `storage` covers doing it in another tab. */
    window.addEventListener(AUTH_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(AUTH_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const firstName = who ? who.trim().split(/\s+/)[0] : "";
  const { open } = useJourney();

  return (
    <section className="teh2 relative w-full overflow-hidden bg-[#14110d]" style={{ height: "100svh", maxHeight: "900px", minHeight: "560px" }}>
      {/* ── background photograph (decorative) ── */}
      <picture>
        <source media="(max-width:767px)" type="image/avif" srcSet={`${IMG}/new-hero-mobile.avif`} />
        <source media="(max-width:767px)" type="image/webp" srcSet={`${IMG}/new-hero-mobile.webp`} />
        <source media="(max-width:767px)" srcSet={`${IMG}/new-hero-mobile.jpg`} />
        {/* Desktop: the 50 KB AVIF (webp/jpg fallbacks) instead of the 647 KB
           final_hero_desktop.webp — same photograph, ~12× smaller, so the
           desktop LCP image is no longer half a megabyte. */}
        <source type="image/avif" srcSet={`${IMG}/new-hero-desktop.avif`} />
        <source type="image/webp" srcSet={`${IMG}/new-hero-desktop.webp`} />
        <img src={`${IMG}/new-hero-desktop.jpg`} alt="" aria-hidden="true" fetchPriority="high"
          className="teh2-img absolute inset-0 h-full w-full object-cover" />
      </picture>

      {/* ── legibility overlays (text never depends on the photo) ── */}
      <div className="absolute inset-0 hidden md:block" aria-hidden="true"
        style={{ background: "linear-gradient(90deg, rgba(10,8,5,0.92) 0%, rgba(10,8,5,0.75) 35%, rgba(10,8,5,0.15) 62%, rgba(10,8,5,0) 100%)" }} />
      <div className="absolute inset-0 md:hidden" aria-hidden="true"
        style={{ background: "linear-gradient(180deg, rgba(10,8,5,0.90) 0%, rgba(10,8,5,0.78) 30%, rgba(10,8,5,0.55) 48%, rgba(10,8,5,0.25) 62%, rgba(10,8,5,0) 80%)" }} />
      {/* header scrim — keeps nav legible over the bright lamp; darker + taller
         so the top-right lamp glow can't wash out the nav */}
      <div className="absolute inset-x-0 top-0 z-20 hidden h-40 md:block" aria-hidden="true"
        style={{ background: "linear-gradient(180deg, rgba(10,8,5,0.82) 0%, rgba(10,8,5,0.42) 42%, rgba(10,8,5,0) 100%)" }} />

      {/* ── header ── */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10 md:py-7 lg:px-16">
          <a href={`${basePath}/`} aria-label="Truth Estate — home"><Logo className="h-9 w-auto md:h-10" /></a>
          {/* desktop nav */}
          <nav className="hidden items-center gap-7 text-[13.5px] font-medium tracking-[0.01em] text-[#f6f1e8]/90 [text-shadow:0_1px_2px_rgba(6,4,2,0.6),0_1px_14px_rgba(6,4,2,0.9)] min-[900px]:flex xl:gap-9">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="flex items-center gap-1.5 transition-colors duration-150 hover:text-[#f6f1e8]">
                <n.Icon className="h-[15px] w-[15px] shrink-0 opacity-80" />{n.label}
              </a>
            ))}
            <a href={`${basePath}/nri`} className="flex items-center gap-1.5 text-[#f6f1e8]/70 transition-colors duration-150 hover:text-[#f6f1e8]">
              <IconGlobe className="h-[15px] w-[15px] shrink-0 opacity-80" />NRI Desk
            </a>
            <a href={`${basePath}/office`} className="flex items-center gap-1.5 rounded-full border border-[#c9a24b]/50 px-4 py-1.5 text-[#e7cf95] transition-colors duration-150 hover:border-[#c9a24b] hover:bg-[#c9a24b]/10">
              {who === null ? (
                <><IconUser className="h-[15px] w-[15px] shrink-0" />Sign in</>
              ) : (
                <><Initial name={firstName} />{firstName || "My Office"}</>
              )}
            </a>
          </nav>
          {/* mobile: rolling product ticker + hamburger, grouped by the menu */}
          <div className="flex items-center gap-2.5 min-[900px]:hidden">
            <MobileFeatureTicker onOpen={() => setMenuOpen(true)} />
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className="grid h-10 w-10 place-items-center text-[#f6f1e8]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── content column ── */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-start px-6 pt-28 pb-16 md:items-center md:px-10 md:pt-7 md:pb-7 lg:px-16">
        <div className="w-full max-w-[380px] md:max-w-[46%] md:-translate-y-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c9a24b]">The Independent Buyer&rsquo;s Office</p>
          <h1 className="mt-3 font-serif font-semibold leading-[1.05] tracking-[-0.01em] text-[#f6f1e8] text-[2.125rem] md:mt-4 md:text-[clamp(2.75rem,4vw,3.5rem)]">
            Know the Truth<br />Before you Buy.
          </h1>
          <p className="mt-3 text-[15px] leading-snug text-[#b3aa9e] md:text-[16px]">
            We audit from RERA &amp; Court filings, not brochures.
          </p>

          {/* search — a real, submitting input with a results dropdown */}
          <div className="mt-5 md:mt-6">
            <HeroSearch index={index} />
          </div>

          {/* trust chips — stacked one-per-line on mobile; an inline, wrapping
             row on desktop. Each promise carries its own distinct gold glyph;
             no dividers (the narrow hero column can't hold them on one line). */}
          <ul className="mt-4 flex flex-col items-start gap-y-3 text-[11px] tracking-[0.02em] text-[#9a9287] md:mt-5 md:flex-row md:flex-wrap md:items-center md:gap-x-[18px] md:gap-y-2.5">
            {CHIPS.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <c.Icon className="h-3.5 w-3.5 shrink-0 text-[#c9a24b] md:h-4 md:w-4" />{c.label}
              </li>
            ))}
          </ul>

          {/* secondary CTA — for the buyer WITHOUT a project in mind. A quiet
             one-line whisper, sat AFTER the trust promises with a hair-thin
             divider so the credibility lands first and this reads as the natural
             next step, not a competing button. open() with no intent starts at
             the Welcome intro (then flows into the buy journey), matching the
             other requirement entry points site-wide. */}
          <button
            type="button"
            onClick={() => open()}
            className="group mt-4 block w-full max-w-[420px] border-t border-[#f6f1e8]/10 pt-3.5 text-left text-[13.5px] text-[#b3aa9e] transition-colors duration-150 hover:text-[#f6f1e8] md:mt-5 md:pt-4"
          >
            Not sure?{" "}
            <span className="whitespace-nowrap font-medium text-[#e7cf95]">
              <span className="underline decoration-[#c9a24b]/40 underline-offset-[3px] transition-colors duration-150 group-hover:decoration-[#c9a24b]">
                Share your requirements
              </span>
              <span className="ml-1 inline-block text-[#c9a24b] transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true">&rarr;</span>
            </span>
          </button>
        </div>
      </div>

      {/* ── scroll cue (desktop) — understated; no bounce under reduced-motion ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden justify-center md:flex" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8f887d" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
          className="opacity-50 motion-safe:animate-[teh2-nudge_2.6s_ease-in-out_infinite]">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* ── mobile menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#14110d] min-[900px]:hidden">
          <div className="flex items-center justify-between px-6 py-6">
            <Logo className="h-9 w-auto" />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#f6f1e8]/60 transition-colors hover:text-[#f6f1e8]">Close</button>
          </div>
          <nav className="flex flex-1 flex-col justify-center gap-8 px-7">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="flex items-center gap-4 font-serif text-[2rem] font-light text-[#f6f1e8]/85 transition-colors hover:text-[#f6f1e8]">
                <n.Icon className="h-6 w-6 shrink-0 opacity-70" />{n.label}
              </a>
            ))}
            <a href={`${basePath}/nri`} className="flex items-center gap-4 font-serif text-[2rem] font-light text-[#f6f1e8]/70 transition-colors hover:text-[#f6f1e8]">
              <IconGlobe className="h-6 w-6 shrink-0 opacity-70" />NRI Desk
            </a>
            <a href={`${basePath}/office`} className="flex items-center gap-4 font-serif text-[2rem] font-light text-[#e7cf95]">
              {who === null ? (
                <><IconUser className="h-6 w-6 shrink-0 opacity-80" />Sign in</>
              ) : (
                <><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#c9a24b] text-[11px] font-bold text-[#0b1a12]">
                    {firstName.charAt(0).toUpperCase() || <IconUser className="h-3 w-3" />}
                  </span>{firstName || "My Office"}</>
              )}
            </a>
          </nav>
        </div>
      )}
    </section>
  );
}
