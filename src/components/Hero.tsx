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

import { useState, useEffect } from "react";
import Logo from "./Logo";
import { useConsultation } from "./consultation/ConsultationProvider";
import { typeahead, type OmniIndex } from "@/lib/omni";

const basePath = "/Truth-Estate";
const IMG = `${basePath}/images`;

const NAV = [
  { label: "Truth Intelligence", href: `${basePath}/intelligence` },
  { label: "Deal Room", href: `${basePath}/deal-room` },
  { label: "Sun & Vastu 3D", href: `${basePath}/sun-vastu` },
];
const CHIPS = ["No brokerage", "No developer bias", "Fixed fee"];

export default function Hero({ index }: { index: OmniIndex }) {
  const { openConsult } = useConsultation();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  // Shorter placeholder on phones so it never truncates; full copy on desktop.
  const [placeholder, setPlaceholder] = useState("Search any Gurugram project");
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPlaceholder(mq.matches ? "Search any project" : "Search any Gurugram project");
    const id = requestAnimationFrame(apply);
    mq.addEventListener("change", apply);
    return () => { cancelAnimationFrame(id); mq.removeEventListener("change", apply); };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const hit = typeahead(q, index, 1).length > 0;
    if (hit) {
      // Known project / corridor / developer → resolve on the intelligence workspace.
      window.location.href = `${basePath}/intelligence?q=${encodeURIComponent(q)}`;
    } else {
      // MISS — the project isn't in our database yet. Route to the free
      // consultation, carrying what they searched for so the advisor arrives
      // prepared, and we can turn it into a custom-report enquiry.
      // TODO: when a dedicated "request a custom report" page exists, route
      // there instead of the consultation modal for the not-found path.
      openConsult({ sourceKind: "homepage", source: q });
    }
  };

  return (
    <section className="teh2 relative w-full overflow-hidden bg-[#14110d]" style={{ height: "100svh", maxHeight: "900px", minHeight: "560px" }}>
      {/* ── background photograph (decorative) ── */}
      <picture>
        <source media="(max-width:767px)" type="image/avif" srcSet={`${IMG}/new-hero-mobile.avif`} />
        <source media="(max-width:767px)" type="image/webp" srcSet={`${IMG}/new-hero-mobile.webp`} />
        <source media="(max-width:767px)" srcSet={`${IMG}/new-hero-mobile.jpg`} />
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
      {/* header scrim — keeps nav legible over the lamp at any width */}
      <div className="absolute inset-x-0 top-0 z-20 hidden h-32 md:block" aria-hidden="true"
        style={{ background: "linear-gradient(180deg, rgba(10,8,5,0.55) 0%, rgba(10,8,5,0) 100%)" }} />

      {/* ── header ── */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10 md:py-7 lg:px-16">
          <a href={`${basePath}/`} aria-label="Truth Estate — home"><Logo className="h-9 w-auto md:h-10" /></a>
          {/* desktop nav */}
          <nav className="hidden items-center gap-8 text-[13.5px] font-medium tracking-[0.01em] text-[#f6f1e8]/82 min-[900px]:flex xl:gap-10">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors duration-150 hover:text-[#f6f1e8]">{n.label}</a>
            ))}
            <a href={`${basePath}/nri`} className="rounded-full border border-[#c9a24b]/50 px-4 py-1.5 text-[#e7cf95] transition-colors duration-150 hover:border-[#c9a24b] hover:bg-[#c9a24b]/10">NRI Desk</a>
            <a href={`${basePath}/office`} className="text-[#f6f1e8]/70 transition-colors duration-150 hover:text-[#f6f1e8]">Sign in</a>
          </nav>
          {/* hamburger */}
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
            className="grid h-10 w-10 place-items-center text-[#f6f1e8] min-[900px]:hidden">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
        </div>
      </header>

      {/* ── content column ── */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-start px-6 pt-28 pb-16 md:items-center md:px-10 md:pt-7 md:pb-7 lg:px-16">
        <div className="w-full max-w-[380px] md:max-w-[46%] md:-translate-y-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c9a24b]">The Independent Buyer&rsquo;s Office</p>
          <h1 className="mt-3 font-serif font-semibold leading-[1.05] tracking-[-0.01em] text-[#f6f1e8] text-[2.125rem] md:mt-4 md:text-[clamp(2.75rem,4vw,3.5rem)]">
            Decisions worth<br />living with.
          </h1>
          <p className="mt-3 text-[15px] leading-snug text-[#b3aa9e] md:text-[16px]">
            Built for buyers. Never paid by builders.
          </p>

          {/* search — a real, submitting input */}
          <form onSubmit={submit} className="mt-5 flex h-[50px] w-full max-w-[420px] rounded-lg ring-1 ring-transparent transition-shadow duration-150 focus-within:ring-[#c9a24b]/70 md:mt-6 md:h-[52px]">
            <label htmlFor="hero-search" className="sr-only">Search any Gurugram project</label>
            <div className="flex flex-1 items-center gap-2 rounded-l-lg bg-[#efe9dc] pl-3 md:gap-3 md:pl-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a6f56" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" className="shrink-0"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" /></svg>
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="h-full w-full min-w-0 bg-transparent pr-2 text-[13px] text-[#2a2318] placeholder:text-[#7a6f56] focus:outline-none min-[360px]:text-[15px]"
              />
            </div>
            <button type="submit" className="shrink-0 rounded-r-lg bg-[#2f6b4f] px-4 text-[13px] font-medium text-[#f6f1e8] transition-colors duration-150 hover:bg-[#285c44] min-[360px]:text-[15px] md:px-5">
              Get verdict
            </button>
          </form>

          {/* trust chips — one row */}
          <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] tracking-[0.02em] text-[#9a9287] md:mt-5">
            {CHIPS.map((c, i) => (
              <li key={c} className="flex items-center gap-4">
                {i > 0 && <span className="h-3 w-px bg-[#c9a24b]/30" aria-hidden="true" />}
                <span className="flex items-center gap-1.5">
                  <span className="text-[#a07d2c]" aria-hidden="true">&#9670;</span>{c}
                </span>
              </li>
            ))}
          </ul>
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
              <a key={n.href} href={n.href} className="font-serif text-[2rem] font-light text-[#f6f1e8]/85 transition-colors hover:text-[#f6f1e8]">{n.label}</a>
            ))}
            <a href={`${basePath}/nri`} className="font-serif text-[2rem] font-light text-[#e7cf95]">NRI Desk</a>
            <a href={`${basePath}/office`} className="font-serif text-[2rem] font-light text-[#f6f1e8]/70 transition-colors hover:text-[#f6f1e8]">Sign in</a>
          </nav>
        </div>
      )}
    </section>
  );
}
