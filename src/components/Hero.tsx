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

type Cat = "all" | "project" | "developer" | "corridor";
const CATS: { key: Cat; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "project", label: "Projects" },
  { key: "developer", label: "Developers" },
  { key: "corridor", label: "Corridors" },
];

type Row =
  | { kind: "project"; p: OmniProject }
  | { kind: "corridor"; label: string; needle: string; count: number }
  | { kind: "developer"; name: string; count: number }
  | { kind: "chips"; labels: string[] }
  | { kind: "ask" };

export default function Hero({ index }: { index: OmniIndex }) {
  const { open: openJourney } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false); // the search terminal / sheet is engaged
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("all");
  const [ghost, setGhost] = useState("");
  const stopRef = useRef(false);
  const deskInput = useRef<HTMLInputElement>(null);
  const mobInput = useRef<HTMLInputElement>(null);

  /* ── ghost-typing loop (resting only); honours reduced-motion ── */
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
        for (let c = 1; c <= s.length && !cancelled && !stopRef.current; c++) { setGhost(s.slice(0, c)); await wait(34 + Math.random() * 46); }
        await wait(1700);
        for (let c = s.length; c >= 0 && !cancelled && !stopRef.current; c--) { setGhost(s.slice(0, c)); await wait(13); }
        await wait(420);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── the index, sliced the way the terminal reads it ── */
  const corridors = useMemo(() =>
    AREA_ALIASES
      .map(([, needle, label]) => ({ label, needle, count: index.projects.filter((p) => (p.location ?? "").toLowerCase().includes(needle)).length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count),
  [index]);

  const developers = useMemo(() => {
    const m = new Map<string, { count: number; top: number }>();
    for (const p of index.projects) {
      if (!p.developer) continue;
      const e = m.get(p.developer) ?? { count: 0, top: 0 };
      e.count++; e.top = Math.max(e.top, p.score ?? 0);
      m.set(p.developer, e);
    }
    return [...m.entries()].map(([name, e]) => ({ name, count: e.count, top: e.top })).sort((a, b) => b.count - a.count || b.top - a.top);
  }, [index]);

  const topProjects = useMemo(() => [...index.projects].filter((p) => p.score != null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)), [index]);

  /* ── results: category-aware, empty vs typed ── */
  const { rows, note } = useMemo<{ rows: Row[]; note: string | null }>(() => {
    const qn = query.trim();
    const low = qn.toLowerCase();
    if (!qn) {
      if (cat === "developer") return { rows: developers.slice(0, 8).map((d) => ({ kind: "developer" as const, ...d })), note: null };
      if (cat === "corridor") return { rows: corridors.map((c) => ({ kind: "corridor" as const, ...c })), note: null };
      if (cat === "project") return { rows: topProjects.slice(0, 8).map((p) => ({ kind: "project" as const, p })), note: "Highest Truth Scores" };
      return { rows: corridors.slice(0, 5).map((c) => ({ kind: "corridor" as const, ...c })), note: null };
    }
    if (cat === "developer") {
      const ds = developers.filter((d) => d.name.toLowerCase().includes(low));
      return { rows: ds.map((d) => ({ kind: "developer" as const, ...d })), note: `${ds.length} developer${ds.length === 1 ? "" : "s"}` };
    }
    if (cat === "corridor") {
      const cs = corridors.filter((c) => c.label.toLowerCase().includes(low) || c.needle.includes(low));
      return { rows: cs.map((c) => ({ kind: "corridor" as const, ...c })), note: `${cs.length} corridor${cs.length === 1 ? "" : "s"}` };
    }
    if (cat === "project") {
      const ps = typeahead(qn, index, 8);
      return { rows: ps.map((p) => ({ kind: "project" as const, p })), note: `${ps.length} match${ps.length === 1 ? "" : "es"}` };
    }
    // all — the smart mixed read
    const hits = typeahead(qn, index, 6);
    if (hits.length) return { rows: hits.map((p) => ({ kind: "project" as const, p })), note: `${hits.length} match${hits.length === 1 ? "" : "es"}` };
    const parsed = qn.length >= 6 ? parseAsk(qn, index) : null;
    const chips = parsed?.chips ?? [];
    if (chips.length >= 2) return { rows: [{ kind: "chips", labels: chips.map((c) => c.label) }], note: null };
    const alias = AREA_ALIASES.find(([re]) => re.test(low));
    if (alias) {
      const [, needle, label] = alias;
      const projs = index.projects.filter((p) => (p.location ?? "").toLowerCase().includes(needle));
      if (projs.length)
        return {
          rows: [
            { kind: "corridor", label, needle, count: projs.length },
            ...[...projs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3).map((p) => ({ kind: "project" as const, p })),
          ],
          note: null,
        };
    }
    return { rows: [{ kind: "ask" }], note: null };
  }, [query, cat, index, corridors, developers, topProjects]);

  /* ── actions ── */
  const go = (q?: string) => {
    const ask = (q ?? query).trim();
    if (ask) window.location.href = `${basePath}/intelligence?q=${encodeURIComponent(ask)}`;
  };
  const rowHref = (r: Row): string | null =>
    r.kind === "project" ? `${basePath}/intelligence/projects/${r.p.slug}` : null;
  const rowGo = (r: Row) => {
    if (r.kind === "project") window.location.href = `${basePath}/intelligence/projects/${r.p.slug}`;
    else if (r.kind === "corridor") go(r.label);
    else if (r.kind === "developer") go(r.name);
    else go();
  };

  const openSearch = () => setOpen(true);
  const closeSearch = () => { setOpen(false); setQuery(""); setCat("all"); };
  // pause the self-writing line only while the terminal is open; always
  // resume (and never leave the resting line stuck) when it closes
  useEffect(() => { stopRef.current = open; }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSearch(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);
  // raise the keyboard when the mobile sheet opens
  useEffect(() => { if (open) mobInput.current?.focus(); }, [open]);

  /* ── shared renderers ── */
  const catBar = (
    <div className="flex gap-6 overflow-x-auto text-[13px] md:gap-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CATS.map((c) => (
        <button
          key={c.key}
          onClick={() => setCat(c.key)}
          className={`flex-none pb-1.5 transition-colors ${cat === c.key ? "border-b border-[#c9a96e] text-white" : "text-white/40 hover:text-white/70"}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );

  const projRow = (p: OmniProject, mobile: boolean) => (
    <>
      <span className="min-w-0 flex-1">
        <span className={`font-serif ${mobile ? "text-[19px]" : "text-[22px]"} leading-snug text-white/[0.93]`}>{p.name}</span>
        {p.has3D && (
          <span className="ml-2 inline-block whitespace-nowrap rounded-sm border border-[#c9a96e]/60 px-[5px] py-[2px] align-[3px] text-[8px] font-bold tracking-[0.08em] text-[#c9a96e]">
            3D&nbsp;LIVE
          </span>
        )}
        <span className={`mt-1 block truncate ${mobile ? "text-[11.5px]" : "text-[12.5px]"} font-light text-white/40`}>
          {[p.location, p.developer].filter(Boolean).join(" · ")}
        </span>
      </span>
      {p.score != null && (
        <span className={`shrink-0 rounded-md bg-[#1e6b45]/[0.28] px-[10px] py-1.5 font-mono ${mobile ? "text-[13px]" : "text-[15px]"} font-bold text-[#b9e2c9]`}>{p.score}</span>
      )}
      <span className="shrink-0 text-white/30">→</span>
    </>
  );

  const renderRows = (mobile: boolean) => (
    <>
      {note && <div className={`${mobile ? "mt-4" : "mt-11"} text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/[0.32]`}>{note}</div>}
      <div className={mobile ? "mt-3" : "mt-3"}>
        {rows.map((r, i) => {
          const inner =
            r.kind === "project" ? projRow(r.p, mobile)
            : r.kind === "corridor" ? (
              <>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[8.5px] font-semibold tracking-[0.2em] text-[#c9a96e]/80">CORRIDOR</span>
                  <span className={`font-serif ${mobile ? "text-[19px]" : "text-[22px]"} text-white/[0.93]`}>{r.label}</span>
                  <span className={`mt-1 block ${mobile ? "text-[11.5px]" : "text-[12.5px]"} font-light text-white/40`}>{r.count} tracked projects</span>
                </span>
                <span className={`shrink-0 ${mobile ? "text-[11px]" : "text-[12.5px]"} text-white/[0.34]`}>open →</span>
              </>
            )
            : r.kind === "developer" ? (
              <>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[8.5px] font-semibold tracking-[0.2em] text-[#c9a96e]/80">DEVELOPER</span>
                  <span className={`font-serif ${mobile ? "text-[19px]" : "text-[22px]"} text-white/[0.93]`}>{r.name}</span>
                  <span className={`mt-1 block ${mobile ? "text-[11.5px]" : "text-[12.5px]"} font-light text-white/40`}>{r.count} tracked project{r.count === 1 ? "" : "s"}</span>
                </span>
                <span className="shrink-0 text-white/30">→</span>
              </>
            )
            : r.kind === "chips" ? (
              <span className="min-w-0 flex-1">
                <span className="mb-2 block text-[8.5px] font-medium uppercase tracking-[0.18em] text-white/[0.35]">I&rsquo;ll search {index.projects.length} tracked projects with</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {r.labels.map((l) => (
                    <span key={l} className="rounded-full border border-[#2f8f5b]/[0.55] bg-[#1e6b45]/[0.18] px-3 py-1 text-[11.5px] font-medium text-[#b9e2c9]">{l}</span>
                  ))}
                  <span className="ml-1.5 text-[11.5px] text-[#c9a96e]">↵ open the answer canvas</span>
                </span>
              </span>
            )
            : (
              <>
                <span className="text-[14px] text-[#c9a96e]">✦</span>
                <span className="min-w-0 flex-1 font-serif text-[16px] italic text-white/[0.88]">Ask Truth Intelligence</span>
                <span className="shrink-0 text-[11.5px] text-[#c9a96e]">↵ Enter</span>
              </>
            );
          const href = rowHref(r);
          const cls = `flex w-full items-center gap-4 border-b border-white/[0.07] ${mobile ? "py-[17px]" : "py-[18px]"} text-left transition-[padding] hover:pl-2`;
          return href ? (
            <a key={i} href={href} className={cls}>{inner}</a>
          ) : (
            <button key={i} onClick={() => rowGo(r)} className={cls}>{inner}</button>
          );
        })}
      </div>
    </>
  );

  const footStat = (
    <div className="text-[11px] tracking-[0.03em] text-white/30">
      <b className="font-medium text-white/55">{index.projects.length}</b> projects tracked
      <span className="mx-2.5 text-[#c9a96e]/50">·</span>
      <b className="font-medium text-white/55">{developers.length}</b> developers verified
      <span className="mx-2.5 text-[#c9a96e]/50">·</span> nothing sponsored, ever
    </div>
  );

  return (
    <section className={`teh-stage relative min-h-svh w-full overflow-hidden${open ? " open" : ""}`}>
      {/* ═══ DESKTOP — the ask line blooms in place ═══ */}
      <div className="hidden h-svh md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}/images/hero-desktop.jpg`} alt="" className="teh-bg absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center center" }} />
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(1.8px)", WebkitBackdropFilter: "blur(1.8px)",
            maskImage: "radial-gradient(ellipse 28% 48% at 60% 50%, transparent 28%, black 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 28% 48% at 60% 50%, transparent 28%, black 100%)",
            opacity: open ? 0 : 1, transition: "opacity 0.8s",
          }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(255,220,170,0.025) 0%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 72% 68% at 50% 50%, transparent 42%, rgba(4,6,5,0.42) 100%)" }} />
        <div className="teh-scrim absolute inset-0" style={{ background: "linear-gradient(to right, rgba(4,6,5,0.78) 0%, rgba(4,6,5,0.45) 22%, rgba(4,6,5,0.10) 38%, transparent 48%)" }} />
        {/* terminal ground — the warm near-black the search sits on */}
        <div className="teh-ground absolute inset-0" onClick={closeSearch} style={{ background: "radial-gradient(ellipse 70% 55% at 22% 0%, rgba(201,169,110,0.08) 0%, transparent 60%), rgba(6,7,6,0.55)" }} />

        {/* nav — restored to the original flush-right layout (esc is a
            separate absolutely-positioned control, so it never shifts links) */}
        <nav className="absolute left-20 right-12 top-0 z-20 flex items-center pt-14 lg:left-28 lg:right-20 lg:pt-20">
          <Logo className="h-10 w-auto opacity-75 lg:h-[3rem]" />
          <div className={`ml-auto hidden items-center gap-10 text-[12px] font-medium tracking-[0.14em] text-white/80 transition-opacity duration-700 lg:flex xl:gap-12 ${open ? "pointer-events-none opacity-0" : ""}`}>
            <a href={`${basePath}/intelligence`} className="flex items-center gap-1.5 transition-colors duration-500 hover:text-white">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" />
              </svg>
              Truth Intelligence
            </a>
            <a href={`${basePath}/deal-room`} className="flex items-center gap-1.5 transition-colors duration-500 hover:text-white">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <path d="M12 5v15" /><path d="M8 20h8" /><path d="M4 8h16" /><path d="M4 8l-2 4.2h4z" /><path d="M20 8l-2 4.2h4z" />
              </svg>
              Deal Room
            </a>
            <a href={`${basePath}/sun-vastu`} className="flex items-center gap-1.5 transition-colors duration-500 hover:text-white">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" className="shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </svg>
              Sun &amp; Vastu 3D Simulation
            </a>
            <a href={`${basePath}/nri`} className="rounded-full border border-[#c9a96e]/45 bg-[#c9a96e]/[0.12] px-4 py-1.5 text-[#ecdcb0] transition-all duration-300 hover:border-[#c9a96e]/85 hover:bg-[#c9a96e]/25 hover:text-[#f6ecd0]">NRI Desk</a>
          </div>
        </nav>
        <button onClick={closeSearch} aria-label="Close search" className="teh-esc absolute right-12 top-14 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/15 text-[13px] text-white/55 hover:bg-white/[0.06] hover:text-white lg:right-20 lg:top-20">esc</button>

        {/* hero chrome — recedes on open */}
        <div className="teh-herochrome absolute left-20 right-20 top-[36vh] z-10 lg:left-28">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]" style={{ textShadow: "0 1px 12px rgba(4,6,5,0.5)" }}>The Independent Buyer&apos;s Office</p>
          <h1 className="mt-[22px] font-serif text-[3.2rem] font-bold leading-[1.1] text-white lg:text-[3.9rem]">Decisions<br />Worth Living With.</h1>
        </div>

        {/* terminal eyebrow — appears above the ask line */}
        <div className="teh-tieyebrow absolute left-20 z-10 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]/85 lg:left-28">Truth Intelligence</div>

        {/* THE SHARED ASK LINE */}
        <div className="teh-ask absolute left-20 right-20 z-10 lg:left-28 lg:right-28">
          <div className="teh-inputrow relative flex items-baseline gap-4">
            <span className="teh-mark flex-none text-[#c9a96e]/70">✦</span>
            <div className="teh-q min-w-0 flex-1 overflow-hidden whitespace-nowrap font-serif italic leading-[1.1] text-white" style={{ textShadow: open ? "none" : "0 1px 14px rgba(4,6,5,0.5)" }}>
              {open ? (query || <span className="text-white/[0.42]">Ask about any Gurugram project</span>) : (
                <>{ghost || <span className="text-white/[0.42]">Ask about any Gurugram project</span>}<span className="teh-caret ml-[3px] inline-block w-[2px] flex-none bg-[#c9a96e] align-baseline te-caret" /></>
              )}
            </div>
            <input
              ref={deskInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={openSearch}
              onKeyDown={(e) => { if (e.key === "Enter") go(); }}
              aria-label="Ask Truth Intelligence"
              autoComplete="off"
              className="absolute inset-0 h-full w-full cursor-text bg-transparent font-serif italic text-transparent caret-transparent outline-none"
            />
          </div>
          <div className="teh-hair mt-3.5 h-px w-full" />
        </div>

        {/* below — category tabs + results, bloom in */}
        <div className="teh-below absolute left-20 right-20 z-10 max-h-[52vh] max-w-[900px] overflow-y-auto lg:left-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {catBar}
          {renderRows(false)}
          <div className="mt-12 pb-8">{footStat}</div>
        </div>

        {/* hero foot line — credential plaque with a mildly shimmering border */}
        <div className="teh-foothero absolute bottom-20 left-20 z-10 lg:left-28">
          <div className="te-foot-plaque max-w-md">
            <span className="shrink-0 text-[10px] text-[#e7cf95]" aria-hidden="true">&#9670;</span>
            <span className="font-serif text-[19px] font-medium leading-[1.5] tracking-[0.005em] text-[#d3cdc3]">
              Independent by design. No developer&rsquo;s rupee, ever.
            </span>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE — resting hero (sheet renders separately when open) ═══ */}
      <div className="relative h-svh overflow-hidden md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}/images/hero-mobile.jpg`} alt="" className="absolute left-0 top-0 w-full object-cover" style={{ height: "122%", objectPosition: "center center", filter: "brightness(0.66) contrast(1.12) saturate(1.05)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(4,6,5,0.92) 0%, rgba(4,6,5,0.86) 32%, rgba(4,6,5,0.74) 48%, rgba(4,6,5,0.44) 60%, rgba(4,6,5,0.20) 72%, rgba(4,6,5,0.40) 90%, rgba(4,6,5,0.72) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 88% 82% at 50% 50%, transparent 52%, rgba(4,6,5,0.30) 100%)" }} />
        <div className="relative z-10 flex h-full flex-col px-7 pt-10 pb-8">
          <nav className="flex items-center justify-between">
            <Logo className="h-9 w-auto opacity-85" />
            <button onClick={() => setMenuOpen(true)} className="flex flex-col gap-[6px] p-1" aria-label="Open menu" aria-expanded={menuOpen}>
              <span className="block h-[1.5px] w-6 bg-white/40" />
              <span className="block h-[1.5px] w-6 bg-white/40" />
            </button>
          </nav>
          <div className="mt-[9vh] flex flex-col">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a96e]" style={{ textShadow: "0 1px 12px rgba(4,6,5,0.6)" }}>The Independent Buyer&apos;s Office</p>
            <div style={{ height: "16px" }} />
            <h1 className="font-serif text-[2.3rem] font-bold leading-[1.16] text-white">Decisions<br />Worth Living With.</h1>
            <div style={{ height: "40px" }} />
            {/* resting ask line — tap opens the full-screen sheet */}
            <button onClick={openSearch} className="relative w-full text-left" aria-label="Open search">
              <div className="flex items-baseline gap-3">
                <span className="flex-none text-[16px] text-[#c9a96e]/70">✦</span>
                <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap font-serif text-[17px] italic text-white/[0.85]" style={{ textShadow: "0 1px 14px rgba(4,6,5,0.5)" }}>
                  {ghost || <span className="text-white/[0.5]">Ask anything</span>}<span className="te-caret ml-[3px] inline-block h-[19px] w-[2px] flex-none translate-y-[3px] bg-[#c9a96e]" />
                </div>
              </div>
              <div className="mt-3 h-px w-full bg-[#c9a96e]/[0.34]" />
            </button>
          </div>
          <div className="mt-auto">
            <div className="te-foot-plaque max-w-[19rem] !gap-3 !px-5 !py-3.5">
              <span className="shrink-0 text-[9px] text-[#e7cf95]" aria-hidden="true">&#9670;</span>
              <span className="font-serif text-[15px] font-medium leading-[1.45] tracking-[0.005em] text-[#d3cdc3]">
                Independent by design. No developer&rsquo;s rupee, ever.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE — full-screen search sheet ═══ */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#0a0b0a] md:hidden" role="dialog" aria-modal="true" aria-label="Search">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 40% at 30% 0%, rgba(201,169,110,0.08) 0%, transparent 55%)" }} />
          <div className="relative flex items-center justify-between px-6 pt-5">
            <Logo className="h-8 w-auto opacity-75" />
            <button onClick={closeSearch} className="text-[13px] text-white/55">Cancel</button>
          </div>
          <div className="relative flex-1 overflow-y-auto px-6 pt-3.5">
            <div className="flex items-baseline gap-3 border-b border-[#c9a96e]/[0.42] pb-4">
              <span className="flex-none text-[16px] text-[#c9a96e]/70">✦</span>
              <input
                ref={mobInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") go(); }}
                placeholder="Ask anything"
                aria-label="Ask Truth Intelligence"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent font-serif text-[24px] italic text-white caret-[#c9a96e] outline-none placeholder:text-white/[0.42]"
              />
            </div>
            <div className="mt-5">{catBar}</div>
            {renderRows(true)}
            <div className="mt-6 pb-10">{footStat}</div>
          </div>
        </div>
      )}

      {/* ═══ MOBILE MENU OVERLAY ═══ */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between px-7 pt-10">
            <Logo className="h-9 w-auto opacity-85" />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-[11px] font-light tracking-[0.18em] text-white/50 transition-colors hover:text-white/80">CLOSE</button>
          </div>
          <nav className="flex flex-1 flex-col justify-center gap-8 px-7">
            <a href={`${basePath}/intelligence`} className="flex items-center gap-3 font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" />
              </svg>
              Truth Intelligence
            </a>
            <a href={`${basePath}/deal-room`} className="flex items-center gap-3 font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <path d="M12 5v15" /><path d="M8 20h8" /><path d="M4 8h16" /><path d="M4 8l-2 4.2h4z" /><path d="M20 8l-2 4.2h4z" />
              </svg>
              Deal Room
            </a>
            <a href={`${basePath}/sun-vastu`} className="flex items-center gap-3 font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" className="shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </svg>
              Sun &amp; Vastu 3D
            </a>
            <a href={`${basePath}/nri`} className="flex items-center gap-3 font-serif text-[2rem] font-light text-[#e3c98f] transition-colors hover:text-[#f2e2b8]">NRI Desk<span className="text-[1.2rem] text-[#c9a96e]">&rarr;</span></a>
          </nav>
          <div className="px-7 pb-12">
            <button onClick={() => { setMenuOpen(false); openJourney(); }} className="w-full rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white transition-colors hover:bg-[#238c55]">{PRIMARY_CTA}</button>
          </div>
        </div>
      )}
    </section>
  );
}
