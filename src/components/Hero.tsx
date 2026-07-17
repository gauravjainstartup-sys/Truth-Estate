"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "./Logo";
import { useJourney } from "./journey/JourneyProvider";
import { PRIMARY_CTA } from "@/lib/journey";
import { AREA_ALIASES, parseAsk, typeahead, type OmniIndex, type OmniProject } from "@/lib/omni";

const basePath = "/Truth-Estate";

/* the line writes itself — real asks the canvas can answer today */
const DESK_ASKS = [
  "Which flat gets the most winter sun in Birla Arika?",
  "3 BHK under ₹5 Cr on Dwarka Expressway",
  "Is M3M Elie Saab safe on delivery?",
  "Sabse achha flat Elan Presidential mein?",
];
const MOB_ASKS = [
  "Best flat in Birla Arika?",
  "3 BHK under ₹5 Cr?",
  "Is M3M safe on delivery?",
  "Sabse achha flat kaunsa?",
];

type PanelState =
  | { kind: "rows"; rows: OmniProject[] }
  | { kind: "chips"; labels: string[]; tracked: number }
  | { kind: "corridor"; label: string; count: number; top: OmniProject[] }
  | { kind: "ask" }
  | { kind: "none" };

export default function Hero({ index }: { index: OmniIndex }) {
  const { open } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [live, setLive] = useState(false);
  const [ghost, setGhost] = useState("");
  const stopRef = useRef(false);

  /* ghost-typing loop; honours prefers-reduced-motion */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGhost("Ask about any Gurugram project");
      return;
    }
    const asks = window.matchMedia("(max-width: 767px)").matches ? MOB_ASKS : DESK_ASKS;
    let cancelled = false;
    stopRef.current = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      let i = 0;
      while (!cancelled) {
        if (stopRef.current) { await wait(300); continue; }
        const s = asks[i++ % asks.length];
        for (let c = 1; c <= s.length && !cancelled && !stopRef.current; c++) {
          setGhost(s.slice(0, c));
          await wait(34 + Math.random() * 46);
        }
        await wait(1700);
        for (let c = s.length; c >= 0 && !cancelled && !stopRef.current; c--) {
          setGhost(s.slice(0, c));
          await wait(13);
        }
        await wait(420);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* layer 1 — the same instant index the /intelligence omnibox reads */
  const qn = query.trim();
  const panel: PanelState = useMemo(() => {
    if (!qn || !live) return { kind: "none" };
    const hits = typeahead(qn, index, 4);
    if (hits.length) return { kind: "rows", rows: hits };
    const parsed = qn.length >= 6 ? parseAsk(qn, index) : null;
    const chips = parsed?.chips ?? [];
    if (chips.length >= 2)
      return { kind: "chips", labels: chips.map((c) => c.label), tracked: index.projects.length };
    const lc = qn.toLowerCase();
    const alias = AREA_ALIASES.find(([re]) => re.test(lc));
    if (alias) {
      const [, needle, label] = alias;
      const projs = index.projects.filter((p) => (p.location ?? "").toLowerCase().includes(needle));
      if (projs.length)
        return {
          kind: "corridor", label, count: projs.length,
          top: [...projs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3),
        };
    }
    return { kind: "ask" };
  }, [qn, live, index]);

  const go = (q?: string) => {
    const ask = (q ?? qn).trim();
    if (ask) window.location.href = `${basePath}/intelligence?q=${encodeURIComponent(ask)}`;
  };

  const onFocus = () => { stopRef.current = true; setLive(true); };
  const onBlur = () => {
    /* delay lets a click on a suggestion land before the panel folds */
    setTimeout(() => {
      if (!query) { setLive(false); stopRef.current = false; }
    }, 180);
  };

  /* shared bits between the desktop and mobile trees */
  const projRow = (p: OmniProject) => (
    <a
      key={p.slug}
      href={`${basePath}/intelligence/projects/${p.slug}`}
      className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-[18px] py-3.5 last:border-b-0 hover:bg-white/[0.04]"
    >
      <span className="min-w-0">
        <span className="font-serif text-[15.5px] leading-snug text-white/90">{p.name}</span>
        {p.has3D && (
          <span className="ml-2 inline-block whitespace-nowrap rounded-sm border border-[#c9a96e]/60 px-[5px] py-[2px] align-[2px] text-[8px] font-bold tracking-[0.08em] text-[#c9a96e]">
            3D&nbsp;LIVE
          </span>
        )}
        <span className="mt-[3px] block truncate text-[11px] font-light text-white/[0.38]">
          {[p.location, p.developer].filter(Boolean).join(" · ")}
        </span>
      </span>
      {p.score != null && (
        <span className="shrink-0 rounded bg-[#1e6b45]/30 px-[9px] py-1 font-mono text-[12.5px] font-bold text-[#b9e2c9]">
          {p.score}
        </span>
      )}
    </a>
  );

  const suggestPanel = panel.kind !== "none" && (
    <div className="absolute left-0 top-[calc(100%+14px)] z-30 max-h-[min(46vh,26rem)] w-full overflow-y-auto overscroll-contain rounded-[3px] border border-white/10 bg-[#0a0c0b]/[0.98] shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {panel.kind === "rows" && panel.rows.map(projRow)}
      {panel.kind === "corridor" && (
        <>
          <button onClick={() => go()} className="flex w-full items-center justify-between gap-3 border-b border-white/[0.06] px-[18px] py-3.5 text-left hover:bg-white/[0.04]">
            <span>
              <span className="mb-[3px] block text-[8.5px] font-semibold tracking-[0.2em] text-[#c9a96e]/80">CORRIDOR</span>
              <span className="font-serif text-[15.5px] text-white/90">{panel.label}</span>
              <span className="mt-[3px] block text-[11px] font-light text-white/[0.38]">{panel.count} tracked projects</span>
            </span>
            <span className="shrink-0 text-[11px] text-white/[0.35]">open the screen →</span>
          </button>
          {panel.top.map(projRow)}
        </>
      )}
      {panel.kind === "chips" && (
        <button onClick={() => go()} className="block w-full bg-gradient-to-r from-[#c9a96e]/10 to-transparent px-[18px] py-[13px] text-left">
          <span className="mb-2 block text-[8.5px] font-medium uppercase tracking-[0.18em] text-white/[0.35]">
            I&rsquo;ll search {panel.tracked} tracked projects with
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            {panel.labels.map((l) => (
              <span key={l} className="rounded-full border border-[#2f8f5b]/[0.55] bg-[#1e6b45]/[0.18] px-3 py-1 text-[11.5px] font-medium text-[#b9e2c9]">
                {l}
              </span>
            ))}
            <span className="ml-1.5 text-[11.5px] text-[#c9a96e]">↵ open the answer canvas</span>
          </span>
        </button>
      )}
      {panel.kind === "ask" && (
        <button onClick={() => go()} className="flex w-full items-center gap-3 px-[18px] py-4 text-left hover:bg-white/[0.04]">
          <span className="text-[14px] text-[#c9a96e]">✦</span>
          <span className="font-serif text-[15.5px] italic text-white/[0.88]">Ask Truth Intelligence</span>
          <span className="ml-auto text-[11.5px] text-[#c9a96e]">↵ Enter</span>
        </button>
      )}
    </div>
  );

  const askLine = (mobile: boolean) => (
    <div className="relative max-w-[540px] cursor-text" onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
      {!live && (
        <div className={`flex items-baseline overflow-hidden whitespace-nowrap font-serif italic text-white/[0.62] ${mobile ? "min-h-[36px] text-[17px]" : "min-h-[44px] text-[21px]"}`}
          style={{ textShadow: "0 1px 14px rgba(4,6,5,0.5)" }}>
          <span>{ghost}</span>
          <span className={`te-caret ml-[3px] w-[1.5px] flex-none bg-[#c9a96e] ${mobile ? "h-[19px] translate-y-[3px]" : "h-6 translate-y-1"}`} />
        </div>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => { if (e.key === "Enter") go(); }}
        aria-label="Ask Truth Intelligence"
        autoComplete="off"
        className={`w-full bg-transparent font-serif italic text-white caret-[#c9a96e] outline-none ${mobile ? "text-[17px]" : "text-[21px]"} ${live ? (mobile ? "min-h-[36px]" : "min-h-[44px]") : "absolute inset-0 h-full opacity-0"}`}
      />
      <div className={`mt-3 h-px w-full transition-colors duration-500 ${live ? "bg-[#c9a96e]/80" : "bg-[#c9a96e]/[0.34] hover:bg-[#c9a96e]/[0.55]"}`} />
      {suggestPanel}
    </div>
  );

  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      {/* ─── DESKTOP ─── */}
      <div className="hidden h-svh md:block">
        <img
          src={`${basePath}/images/hero-desktop.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-1000"
          style={{
            objectPosition: "center center",
            transform: "scale(1.01) rotate(-0.15deg)",
            filter: live
              ? "brightness(0.48) contrast(1.08) saturate(0.9)"
              : "brightness(0.68) contrast(1.10) saturate(1.02)",
          }}
        />

        {/* Depth of field — verdict document stays sharp */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(1.8px)",
            WebkitBackdropFilter: "blur(1.8px)",
            maskImage:
              "radial-gradient(ellipse 28% 48% at 60% 50%, transparent 28%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 28% 48% at 60% 50%, transparent 28%, black 100%)",
          }}
        />

        {/* Warm morning light */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(255,220,170,0.025) 0%, transparent 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 72% 68% at 50% 50%, transparent 42%, rgba(4,6,5,0.42) 100%)",
          }}
        />

        {/* Text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(4,6,5,0.78) 0%, rgba(4,6,5,0.45) 22%, rgba(4,6,5,0.10) 38%, transparent 48%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between py-14 pl-20 lg:py-20 lg:pl-28">
          <nav className={`animate-fade-up flex items-center pr-12 transition-opacity duration-1000 lg:pr-20 ${live ? "opacity-30" : ""}`}>
            <Logo className="h-10 w-auto opacity-75 lg:h-[3rem]" />
            <div className="ml-auto hidden items-center gap-12 text-[11px] font-medium tracking-[0.14em] text-white/55 lg:flex xl:gap-14">
              <a href={`${basePath}/intelligence`} className="transition-colors duration-500 hover:text-white/90">
                Truth Intelligence
              </a>
              <a href={`${basePath}/pricing`} className="transition-colors duration-500 hover:text-white/90">
                Private Office
              </a>
              <a href={`${basePath}/intelligence`} className="transition-colors duration-500 hover:text-white/90">
                Ownership Intelligence
              </a>
              <a
                href={`${basePath}/nri`}
                className="rounded-full border border-[#c9a96e]/45 bg-[#c9a96e]/[0.12] px-4 py-1.5 text-[#ecdcb0] transition-all duration-300 hover:border-[#c9a96e]/85 hover:bg-[#c9a96e]/25 hover:text-[#f6ecd0]"
              >
                NRI Desk
              </a>
            </div>
          </nav>

          <div className="relative z-20 flex max-w-2xl flex-col">
            <p
              className="animate-fade-up text-[11px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]"
              style={{ animationDelay: "50ms", textShadow: "0 1px 12px rgba(4,6,5,0.5)" }}
            >
              The Independent Buyer&apos;s Office
            </p>

            <div style={{ height: "22px" }} />

            <h1
              className="animate-fade-up font-serif text-[3.2rem] font-bold leading-[1.1] text-white lg:text-[3.9rem]"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth Living With.
            </h1>

            <div style={{ height: "52px" }} />

            <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
              {askLine(false)}
            </div>
          </div>

          {/* Operating philosophy — quietly revealed at the foot of the hero */}
          <div className={`max-w-md transition-opacity duration-1000 ${live ? "opacity-25" : ""}`}>
            <p className="font-serif text-[20px] font-medium leading-[1.7] tracking-[0.005em] text-[#b3aea7]">
              Independent by design. No developer&rsquo;s rupee, ever.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="relative h-svh md:hidden overflow-hidden">
        <img
          src={`${basePath}/images/hero-mobile.jpg`}
          alt=""
          className="absolute left-0 top-0 w-full object-cover transition-[filter] duration-1000"
          style={{
            /* Scale tuned so the verdict page lands in the gap between the
               ask line and the foot quote */
            height: "122%",
            objectPosition: "center center",
            filter: live
              ? "brightness(0.44) contrast(1.1) saturate(0.92)"
              : "brightness(0.66) contrast(1.12) saturate(1.05)",
          }}
        />

        {/* Scrim — dark over the headline up top, lifts through the middle so
            the verdict page reads in the gap, settles behind the foot quote */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,6,5,0.92) 0%, rgba(4,6,5,0.86) 32%, rgba(4,6,5,0.74) 48%, rgba(4,6,5,0.44) 60%, rgba(4,6,5,0.20) 72%, rgba(4,6,5,0.40) 90%, rgba(4,6,5,0.72) 100%)",
          }}
        />

        {/* Subtle edge vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 88% 82% at 50% 50%, transparent 52%, rgba(4,6,5,0.30) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col px-7 pt-10 pb-8">
          <nav className={`animate-fade-up flex items-center justify-between transition-opacity duration-1000 ${live ? "opacity-30" : ""}`}>
            <Logo className="h-9 w-auto opacity-85" />
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col gap-[6px] p-1"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="block h-[1.5px] w-6 bg-white/40" />
              <span className="block h-[1.5px] w-6 bg-white/40" />
            </button>
          </nav>

          <div className="relative z-20 mt-[9vh] flex flex-col">
            <p
              className="animate-fade-up text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a96e]"
              style={{ animationDelay: "50ms", textShadow: "0 1px 12px rgba(4,6,5,0.6)" }}
            >
              The Independent Buyer&apos;s Office
            </p>

            <div style={{ height: "16px" }} />

            <h1
              className="animate-fade-up font-serif text-[2.3rem] font-bold leading-[1.16] text-white"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth Living With.
            </h1>

            <div style={{ height: "40px" }} />

            <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
              {askLine(true)}
            </div>
          </div>

          {/* Operating philosophy — quietly revealed at the foot of the hero */}
          <div className={`mt-auto transition-opacity duration-1000 ${live ? "opacity-25" : ""}`}>
            <p className="font-serif text-[17px] font-medium leading-[1.7] tracking-[0.005em] text-[#b3aea7]">
              Independent by design. No developer&rsquo;s rupee, ever.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MOBILE MENU OVERLAY ─── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between px-7 pt-10">
            <Logo className="h-9 w-auto opacity-85" />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="text-[11px] font-light tracking-[0.18em] text-white/50 transition-colors hover:text-white/80"
            >
              CLOSE
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-8 px-7">
            <a
              href={`${basePath}/intelligence`}
              className="font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white"
            >
              Truth Intelligence
            </a>
            <a
              href={`${basePath}/pricing`}
              className="font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white"
            >
              Private Office
            </a>
            <a
              href={`${basePath}/intelligence`}
              className="font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white"
            >
              Ownership Intelligence
            </a>
            <a
              href={`${basePath}/nri`}
              className="flex items-center gap-3 font-serif text-[2rem] font-light text-[#e3c98f] transition-colors hover:text-[#f2e2b8]"
            >
              NRI Desk
              <span className="text-[1.2rem] text-[#c9a96e]">&rarr;</span>
            </a>
          </nav>

          <div className="px-7 pb-12">
            <button
              onClick={() => {
                setMenuOpen(false);
                open();
              }}
              className="w-full rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white transition-colors hover:bg-[#238c55]"
            >
              {PRIMARY_CTA}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
