"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../Logo";
import { useConsultation } from "../consultation/ConsultationProvider";
import type { ConsultContext } from "@/lib/consultation";
import {
  PROJECTS,
  DEVELOPER_PROFILES,
  MARKET_PROFILES,
  RESEARCH_PLACEHOLDERS,
  RESEARCH_SUGGESTIONS,
  ResearchResult,
  classifyAndResearch,
  type Project,
} from "@/lib/journey";
import { projectSlug, projectByName, reviewedOn } from "@/lib/projects";
import { DEVELOPERS } from "@/lib/developers";
import { MARKETS } from "@/lib/markets";
import { comparePairSlug } from "@/lib/compare";
import ProjectOptionCard from "./ProjectOptionCard";
import {
  mergeChips,
  parseAsk,
  screen,
  topUnits,
  typeahead,
  type Chip,
  type OmniIndex,
  type OmniProject,
  type Parsed,
  type Ranked,
  type RouterAnswer,
} from "@/lib/omni";
import { askRouter } from "@/lib/router";

const EMPTY_INDEX: OmniIndex = { projects: [], units: {}, live: false };

/* ════════════════════════════════════════════════════════════════
   VIEW TYPES — the workspace is the research desk: the home surface
   and TruthGuide answers. Catalogues and dossiers live on their own
   routed pages (/projects, /developers, /markets, /compare).
   ════════════════════════════════════════════════════════════════ */
type View =
  | { type: "home" }
  | { type: "search-result"; query: string; result: ResearchResult }
  | { type: "canvas"; query: string; parsed: Parsed };

/* Resolve an entity name to its real routed page. */
function entityHref(name: string): { kind: "project" | "developer" | "market"; slug: string; href: string } | null {
  const n = name.trim().toLowerCase();
  const p = PROJECTS.find((x) => x.name.toLowerCase() === n);
  if (p) { const slug = projectSlug(p.name); return { kind: "project", slug, href: `${basePath}/intelligence/projects/${slug}` }; }
  const d = DEVELOPERS.find((x) => x.name.toLowerCase() === n);
  if (d) return { kind: "developer", slug: d.slug, href: `${basePath}/intelligence/developers/${d.slug}` };
  const m = MARKETS.find((x) => x.name.toLowerCase() === n || x.short.toLowerCase() === n);
  if (m) return { kind: "market", slug: m.slug, href: `${basePath}/intelligence/markets/${m.slug}` };
  return null;
}

/* "A vs B" where both sides resolve to the same kind → the real compare page. */
function compareHref(q: string): string | null {
  const parts = q.split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  const a = entityHref(parts[0]);
  const b = entityHref(parts[1]);
  if (!a || !b || a.kind !== b.kind || a.slug === b.slug) return null;
  return `${basePath}/intelligence/compare/${comparePairSlug(a.slug, b.slug)}`;
}

const basePath = "/Truth-Estate";

const INVESTMENT_THEMES = [
  "Luxury",
  "Rental",
  "Capital Appreciation",
  "NRI",
  "End Use",
  "Ultra Luxury",
];

/* ════════════════════════════════════════════════════════════════
   INTELLIGENCE WORKSPACE — main export
   ════════════════════════════════════════════════════════════════ */
export default function IntelligenceWorkspace({ index = EMPTY_INDEX }: { index?: OmniIndex }) {
  const [view, setView] = useState<View>({ type: "home" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const { openConsult } = useConsultation();

  const consultContext = useMemo<ConsultContext>(() => ({ sourceKind: "intelligence" }), []);

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    // "A vs B" between two known things deserves the real comparison page
    const cmp = compareHref(q);
    if (cmp) { window.location.href = cmp; return; }
    setSearchOpen(false);
    setSearchQuery("");
    setRecentSearches((h) => [q, ...h.filter((x) => x !== q)].slice(0, 6));
    /* omnibox intent routing — deterministic first:
       a bare project name navigates; a constrained or unit-level ask opens
       the answer canvas instantly. Free-text questions ALSO open the canvas
       (Phase 2 — the Claude router reads the index in the background);
       CanvasView falls back to the TruthGuide brief if it's unreachable. */
    const parsed = parseAsk(q, index);
    if (parsed.intent === "navigate" && parsed.project) {
      window.location.href = `${basePath}/intelligence/projects/${parsed.project.slug}`;
      return;
    }
    setView({ type: "canvas", query: q, parsed });
    mainRef.current?.scrollTo(0, 0);
  };

  /* deep-link handoff: /intelligence?q=… (the home hero's Enter) runs the
     ask on arrival exactly as if it were typed into the omnibox */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q?.trim()) doSearch(q.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fallbackToBrief = (q: string) => {
    const r = classifyAndResearch(q);
    setView({ type: "search-result", query: q, result: r });
    mainRef.current?.scrollTo(0, 0);
  };

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { label: string; type: string }[] = [];
    PROJECTS.forEach((p) => {
      if (p.name.toLowerCase().includes(q)) results.push({ label: p.name, type: "Project" });
    });
    DEVELOPER_PROFILES.forEach((d) => {
      if (d.name.toLowerCase().includes(q)) results.push({ label: d.name, type: "Developer" });
    });
    MARKET_PROFILES.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || m.short.toLowerCase().includes(q))
        results.push({ label: m.name, type: "Location" });
    });
    if (q.includes("vs") || q.includes("compare"))
      results.push({ label: searchQuery, type: "Compare" });
    if (results.length < 3)
      RESEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((s) => results.push({ label: s, type: "Question" }));
    return results.slice(0, 8);
  }, [searchQuery]);

  return (
    <div className="flex h-screen flex-col bg-[#F5F0E8] text-[#1a1a1a]">
      {/* ── Navigation ── */}
      <nav className="flex shrink-0 items-center justify-between border-b border-[#1a1a1a]/[0.06] px-4 py-4 md:px-10">
        <div className="flex items-center gap-8">
          <a
            href={basePath}
            aria-label="Truth Estate — Home"
            className="transition-opacity duration-300 hover:opacity-70"
          >
            <Logo className="h-7 w-auto md:h-9" color="#1a1a1a" />
          </a>
          <div className="hidden items-center gap-1 lg:flex">
            {(
              [
                ["Projects", `${basePath}/intelligence/projects`],
                ["Developers", `${basePath}/intelligence/developers`],
                ["Locations", `${basePath}/intelligence/markets`],
                ["Compare", `${basePath}/intelligence/compare`],
              ] as const
            ).map(([label, href]) => (
              <a key={label} href={href}
                className="rounded-sm px-3.5 py-2 text-[0.78rem] font-light tracking-[0.02em] text-[#1a1a1a]/40 transition-colors duration-300 hover:text-[#1a1a1a]/70">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <div className="relative">
            <button
              onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="flex items-center gap-2 text-[0.78rem] font-light text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]/70"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span className="hidden xl:inline">Search</span>
            </button>
          </div>
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
            className="hidden text-[0.78rem] font-light text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]/70 xl:block"
          >
            TruthGuide
          </button>
          <button
            onClick={() => openConsult(consultContext)}
            className="whitespace-nowrap rounded-sm bg-[#1e6b45] px-3 py-2 text-[10px] font-medium tracking-[0.04em] text-white transition-all duration-500 hover:bg-[#238c55] md:px-5 md:py-2.5 md:text-[11px] md:tracking-[0.08em]"
          >
            Request Independent Advice
          </button>
        </div>
      </nav>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#0a0a0a]/30 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative mx-auto mt-20 w-full max-w-[700px] px-5">
            <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/[0.06] bg-[#F5F0E8] shadow-2xl shadow-black/10">
              <div className="flex h-[60px] items-center gap-4 border-b border-[#1a1a1a]/[0.06] px-6">
                <svg className="h-5 w-5 shrink-0 text-[#1a1a1a]/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") doSearch(searchQuery); if (e.key === "Escape") setSearchOpen(false); }}
                  placeholder="Search projects, developers, locations…"
                  className="flex-1 bg-transparent font-serif text-[1.1rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/25"
                  autoFocus
                />
                <button onClick={() => setSearchOpen(false)} className="text-[10px] font-light tracking-[0.1em] text-[#1a1a1a]/30">ESC</button>
              </div>
              {searchSuggestions.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto py-2">
                  {searchSuggestions.map((s) => {
                    // entity hits go straight to their real pages; questions stay in the desk
                    const href = s.type === "Project" || s.type === "Developer" || s.type === "Location" ? entityHref(s.label)?.href : null;
                    const inner = (
                      <>
                        <span className="font-serif text-[0.95rem] font-light text-[#1a1a1a]/70">{s.label}</span>
                        <span className="text-[10px] font-light uppercase tracking-[0.15em] text-[#1a1a1a]/25">{s.type}</span>
                      </>
                    );
                    const cls = "flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-[#1a1a1a]/[0.03]";
                    return href ? (
                      <a key={s.label + s.type} href={href} className={cls}>{inner}</a>
                    ) : (
                      <button key={s.label + s.type} onClick={() => doSearch(s.label)} className={cls}>{inner}</button>
                    );
                  })}
                </div>
              )}
              {searchQuery.trim() === "" && (
                <div className="px-6 py-4">
                  <p className="mb-3 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/25">Try searching</p>
                  <div className="flex flex-wrap gap-2">
                    {RESEARCH_SUGGESTIONS.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        onClick={() => doSearch(s)}
                        className="rounded-full border border-[#1a1a1a]/[0.06] px-4 py-2 text-[0.78rem] font-light text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]/65"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content — full width; catalogues live on their own routes ── */}
      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
        {view.type === "home" && <HomeView doSearch={doSearch} recentSearches={recentSearches} index={index} />}
        {view.type === "search-result" && <SearchResultView result={view.result} doSearch={doSearch} />}
        {view.type === "canvas" && (
          <CanvasView key={view.query} query={view.query} parsed={view.parsed} index={index} onFallback={fallbackToBrief} />
        )}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HOME VIEW
   ════════════════════════════════════════════════════════════════ */
function HomeView({ doSearch, recentSearches, index }: { doSearch: (q: string) => void; recentSearches: string[]; index: OmniIndex }) {
  const [query, setQuery] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [phFade, setPhFade] = useState(true);
  const [cursorOn, setCursorOn] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const blink = setInterval(() => setCursorOn((v) => !v), 530);
    const rotate = setInterval(() => {
      setPhFade(false);
      setTimeout(() => { setPhIdx((i) => (i + 1) % RESEARCH_PLACEHOLDERS.length); setPhFade(true); }, 400);
    }, 4500);
    return () => { clearInterval(blink); clearInterval(rotate); };
  }, []);

  const sorted = useMemo(() => [...PROJECTS].sort((a, b) => b.truthScore - a.truthScore), []);

  /* layer 1 — instant, local, deterministic */
  const hits = useMemo(() => typeahead(query, index, 5), [query, index]);
  const parsed = useMemo(() => (query.trim().length >= 6 ? parseAsk(query, index) : null), [query, index]);
  const showAsk = parsed != null && parsed.chips.length > 0;
  const trackedCount = index.projects.length;

  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      {/* Hero */}
      <div className="pb-12 pt-12 text-center md:pb-16 md:pt-20">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a96e]">
          Truth Intelligence
        </p>
        <h1 className="mx-auto max-w-[600px] font-serif text-[2.2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[3rem]">
          {trackedCount > 0
            ? `Ask anything about ${trackedCount} tracked projects.`
            : "Independent research for India's biggest real estate decisions."}
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-[0.86rem] font-light leading-[1.7] text-[#1a1a1a]/40">
          Independent research for India&apos;s biggest real estate decisions — every answer built from evidence, down to the exact flat.
        </p>
      </div>

      {/* Universal search */}
      <div className="mx-auto mb-16 max-w-[790px] md:mb-20">
        <div className="flex h-[56px] items-center gap-3 rounded-2xl border border-[#1a1a1a]/[0.06] bg-white px-5 transition-all duration-700 focus-within:border-[#c9a96e]/30 focus-within:shadow-[0_0_0_4px_rgba(201,169,110,0.06)] md:h-[64px] md:gap-4 md:px-7">
          <svg className="h-5 w-5 shrink-0 text-[#1a1a1a]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { doSearch(query); setQuery(""); } }}
              className="w-full bg-transparent font-serif text-[1.05rem] font-light text-[#1a1a1a] outline-none md:text-[1.2rem]"
            />
            {!query && (
              <span className="pointer-events-none absolute inset-0 flex items-center">
                <span className={`font-serif text-[1.05rem] font-light text-[#1a1a1a]/25 transition-opacity duration-500 md:text-[1.2rem] ${phFade ? "opacity-100" : "opacity-0"}`}>
                  {RESEARCH_PLACEHOLDERS[phIdx]}
                </span>
                <span className={`ml-[1px] inline-block h-[1.15em] w-[1.5px] bg-[#1a1a1a]/30 transition-opacity duration-100 ${cursorOn ? "opacity-100" : "opacity-0"}`} />
              </span>
            )}
          </div>
          <button
            onClick={() => { doSearch(query); setQuery(""); }}
            aria-label="Search"
            className="group/arrow flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white transition-all duration-300 hover:scale-[1.06] md:h-10 md:w-10"
          >
            <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover/arrow:translate-x-[3px] md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        {/* Layer 1 — instant results + the ask-preview (deterministic, <100 ms) */}
        {(hits.length > 0 || showAsk) && query.trim() !== "" && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#1a1a1a]/[0.08] bg-white shadow-xl shadow-black/[0.06]">
            {showAsk && parsed && (
              <div className="border-b border-[#1a1a1a]/[0.05] bg-gradient-to-r from-[#c9a96e]/[0.08] to-transparent px-5 py-3.5">
                <p className="mb-2 text-[8.5px] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/35">
                  I&apos;ll search {trackedCount} projects with
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {parsed.chips.map((c) => (
                    <span key={c.key + c.label} className="rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/[0.06] px-3 py-1 text-[0.72rem] font-medium text-[#1e6b45]">
                      {c.label}
                    </span>
                  ))}
                  <button onClick={() => doSearch(query)}
                    className="ml-1 text-[0.74rem] font-medium text-[#c9a96e] transition-colors hover:text-[#a8863f]">
                    ✦ Enter — open the answer canvas
                  </button>
                </div>
              </div>
            )}
            {hits.map((p) => (
              <div key={p.slug} className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/[0.04] px-5 py-3 last:border-b-0">
                <a href={`${basePath}/intelligence/projects/${p.slug}`} className="min-w-0 flex-1">
                  <span className="font-serif text-[0.95rem] font-medium text-[#1a1a1a]">{p.name}</span>
                  {p.has3D && (
                    <span className="ml-2 rounded border border-[#c9a96e]/60 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.08em] text-[#c9a96e]">3D LIVE</span>
                  )}
                  <span className="mt-0.5 block truncate text-[0.72rem] font-light text-[#1a1a1a]/35">
                    {[p.location, p.developer].filter(Boolean).join(" · ")}
                  </span>
                </a>
                <div className="flex shrink-0 items-center gap-2">
                  {p.score != null && <span className="rounded-md bg-[#1e6b45]/[0.08] px-2 py-1 font-mono text-[0.78rem] font-bold text-[#1e6b45]">{p.score}</span>}
                  <a href={`${basePath}/intelligence/projects/${p.slug}`}
                    className="rounded-md border border-[#1e6b45]/35 px-2.5 py-1 text-[0.68rem] font-medium text-[#1e6b45]">Report</a>
                  {p.advisorFile && (
                    <a href={`${basePath}/${p.advisorFile}`}
                      className="rounded-md bg-[#1e6b45] px-2.5 py-1 text-[0.68rem] font-medium text-white">3D</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {recentSearches.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
            <span className="text-[0.62rem] font-light uppercase tracking-[0.18em] text-[#1a1a1a]/25">Recent</span>
            {recentSearches.slice(0, 4).map((s) => (
              <button key={s} onClick={() => doSearch(s)}
                className="max-w-[16rem] truncate text-[0.76rem] font-light text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]/70">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Browse Intelligence */}
      <div className="mx-auto max-w-[1000px]">
        <SectionLabel>Browse Intelligence</SectionLabel>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <BrowseTile
            title="Projects"
            sub="Independent intelligence on every residential project."
            href={`${basePath}/intelligence/projects`}
          />
          <BrowseTile
            title="Developers"
            sub="Delivery history. Financial health. Track record."
            href={`${basePath}/intelligence/developers`}
          />
          <BrowseTile
            title="Locations"
            sub="Infrastructure. Supply. Demand. Outlook."
            href={`${basePath}/intelligence/markets`}
          />
          <BrowseTile
            title="Compare"
            sub="Compare any projects, developers, or markets."
            href={`${basePath}/intelligence/compare`}
          />
          <BrowseTile
            title="Map"
            sub="Modelled towers pinned at their exact sites."
            href={`${basePath}/tower-intel/projects-map.html`}
          />
        </div>

        {/* Investment themes */}
        <div className="mt-8 flex flex-wrap gap-2">
          {INVESTMENT_THEMES.map((t) => (
            <button
              key={t}
              onClick={() => doSearch(`Best ${t.toLowerCase()} projects in Gurugram`)}
              className="rounded-full border border-[#1a1a1a]/[0.06] px-5 py-2.5 text-[0.78rem] font-light text-[#1a1a1a]/40 transition-all duration-300 hover:-translate-y-[1px] hover:border-[#1a1a1a]/15 hover:text-[#1a1a1a]/65"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Latest Intelligence */}
      <div className="mx-auto mt-16 max-w-[1000px] md:mt-24">
        <SectionLabel>Latest Intelligence</SectionLabel>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.slice(0, 6).map((p) => (
            <ProjectCard key={p.name} project={p} href={`${basePath}/intelligence/projects/${projectSlug(p.name)}`} />
          ))}
        </div>
      </div>

      {/* Recently Updated */}
      <div className="mx-auto mt-16 max-w-[1000px] md:mt-24">
        <SectionLabel>Recently Updated</SectionLabel>
        <div className="mt-6 flex flex-col gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/[0.06]">
          {sorted.slice(0, 5).map((p) => {
            const intel = projectByName(p.name);
            return (
              <a
                key={p.name}
                href={`${basePath}/intelligence/projects/${projectSlug(p.name)}`}
                className="flex items-center justify-between gap-4 bg-white px-6 py-4 text-left transition-colors hover:bg-[#1a1a1a]/[0.03]"
              >
                <div className="min-w-0">
                  <span className="font-serif text-[1rem] font-medium text-[#1a1a1a]">{p.name}</span>
                  <span className="ml-3 hidden text-[0.78rem] font-light text-[#1a1a1a]/35 sm:inline">{p.developer} &middot; {p.market}</span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-serif text-[1rem] font-medium text-[#1e6b45]">{p.truthScore}</span>
                  <span className="text-[0.72rem] font-light text-[#1a1a1a]/25">{intel ? `Reviewed ${reviewedOn(intel)}` : "Reviewed quarterly"}</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Popular research */}
      <div className="mx-auto mt-16 max-w-[1000px] md:mt-24">
        <SectionLabel>Popular Research</SectionLabel>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {RESEARCH_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => doSearch(s)}
              className="rounded-full border border-[#1a1a1a]/[0.06] px-5 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/45 transition-all duration-300 hover:-translate-y-[1px] hover:border-[#1a1a1a]/15 hover:text-[#1a1a1a]/70"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <BottomCTA />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SEARCH RESULT VIEW
   ════════════════════════════════════════════════════════════════ */
function SearchResultView({ result, doSearch }: { result: ResearchResult; doSearch: (q: string) => void }) {
  const typeLabel: Record<ResearchResult["type"], string> = {
    project: "Project Analysis",
    developer: "Developer Profile",
    location: "Market Intelligence",
    comparison: "Comparative Analysis",
    question: "Research Brief",
  };

  // the brief is the appetiser — the full routed page is the meal
  const full = useMemo(() => {
    if (result.type === "project" || result.type === "developer" || result.type === "location") {
      const e = entityHref(result.title);
      if (e) return { href: e.href, label: result.type === "project" ? "Open the full project report" : result.type === "developer" ? "Open the developer dossier" : "Open the market profile" };
    }
    if (result.type === "comparison") {
      const href = compareHref(result.title);
      if (href) return { href, label: "Open the full comparison" };
    }
    return null;
  }, [result]);

  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      <div className="mx-auto max-w-[820px] pt-10 md:pt-16">
        <p className="mb-3 text-[9px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">{typeLabel[result.type]}</p>
        <h1 className="font-serif text-[1.8rem] font-medium leading-[1.2] text-[#1a1a1a] md:text-[2.4rem]">{result.title}</h1>
        {result.subtitle && (
          <p className="mt-2 font-serif text-[1rem] font-light text-[#1a1a1a]/40">{result.subtitle}</p>
        )}

        {result.verdict && (
          <div className="mt-8 flex items-start gap-5 rounded-lg border border-[#1a1a1a]/[0.08] bg-white px-6 py-5">
            {result.score != null && (
              <div className="flex flex-col items-center">
                <span className="font-serif text-[2.4rem] font-medium leading-none text-[#1e6b45]">{result.score}</span>
                <span className="mt-1 text-[8px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/30">Truth Score</span>
              </div>
            )}
            <div className="flex-1">
              <p className="mb-1 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">{result.confidence ?? "Truth Verdict"}</p>
              <p className="font-serif text-[0.95rem] font-light leading-[1.7] text-[#1a1a1a]/65">{result.verdict}</p>
            </div>
          </div>
        )}

        {full && (
          <a href={full.href}
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#1e6b45] px-6 py-3 text-[0.78rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            {full.label} <span aria-hidden>→</span>
          </a>
        )}

        {result.highlights && result.highlights.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/[0.08] bg-[#1a1a1a]/[0.06] md:grid-cols-3">
            {result.highlights.map((h) => (
              <div key={h.label} className="bg-[#F5F0E8] p-4 md:p-5">
                <p className="mb-1.5 text-[8px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">{h.label}</p>
                <p className="font-serif text-[0.95rem] font-medium text-[#1a1a1a]">{h.value}</p>
              </div>
            ))}
          </div>
        )}

        {(result.strengths?.length || result.watchouts?.length) && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {result.strengths && result.strengths.length > 0 && (
              <div>
                <p className="mb-3 text-[9px] font-light uppercase tracking-[0.22em] text-[#1e6b45]">Strengths</p>
                <ul className="flex flex-col gap-2">
                  {result.strengths.map((s) => (
                    <li key={s} className="flex gap-2.5 text-[0.86rem] font-light text-[#1a1a1a]/60"><span className="mt-0.5 text-[#1e6b45]">+</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.watchouts && result.watchouts.length > 0 && (
              <div>
                <p className="mb-3 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">Watchouts</p>
                <ul className="flex flex-col gap-2">
                  {result.watchouts.map((w) => (
                    <li key={w} className="flex gap-2.5 text-[0.86rem] font-light text-[#1a1a1a]/60"><span className="mt-0.5 text-[#c9a96e]">!</span>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result.sections.length > 0 && (
          <div className="mt-8 flex flex-col gap-6 border-t border-[#1a1a1a]/[0.06] pt-8">
            {result.sections.map((sec) => (
              <div key={sec.label}>
                <p className="mb-2 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">{sec.label}</p>
                <p className="font-serif text-[0.92rem] font-light leading-[1.8] text-[#1a1a1a]/60">{sec.body}</p>
              </div>
            ))}
          </div>
        )}

        {result.followUps.length > 0 && (
          <div className="mt-10 border-t border-[#1a1a1a]/[0.06] pt-8">
            <p className="mb-4 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/25">Continue Researching</p>
            <div className="flex flex-wrap gap-2.5">
              {result.followUps.map((f) => (
                <button key={f} onClick={() => doSearch(f)} className="rounded-full border border-[#1a1a1a]/[0.06] px-5 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/45 transition-all duration-300 hover:-translate-y-[1px] hover:border-[#1a1a1a]/15 hover:text-[#1a1a1a]/70">
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomCTA />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ANSWER CANVAS — conversational input, forensic output. Artifacts
   centre-stage, the conversation as a thin rail; follow-ups MUTATE
   the canvas (merge chips, re-rank) instead of appending prose.
   Deterministic Phase 1: every number is a row from the build-time
   index; nothing is generated.
   ════════════════════════════════════════════════════════════════ */
type Turn = { q: string; note: string };

function CanvasView({ query, parsed, index, onFallback }: {
  query: string;
  parsed: Parsed;
  index: OmniIndex;
  onFallback: (q: string) => void;
}) {
  const [chips, setChips] = useState<Chip[]>(parsed.chips);
  const [unitsProject, setUnitsProject] = useState<OmniProject | null>(
    parsed.intent === "units" && parsed.project ? parsed.project : null,
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [followQ, setFollowQ] = useState("");
  /* Phase 2 — the Claude router refines every canvas in the background.
     For an "ask" (free text the deterministic parser couldn't structure)
     the router IS the answer path; unreachable → TruthGuide brief. */
  const isAsk = parsed.intent === "question" || parsed.intent === "compare";
  const [ai, setAi] = useState<RouterAnswer | null>(null);
  const [aiState, setAiState] = useState<"pending" | "live" | "off">("pending");
  const aiSeq = useRef(0);

  const results = useMemo(() => screen(index, chips), [index, chips]);
  const units = unitsProject ? topUnits(index, unitsProject.slug, 3) : [];

  const applyAnswer = (r: RouterAnswer, fresh: boolean) => {
    setAi(r);
    setAiState("live");
    if (r.intent === "units" && r.projectSlug) {
      const p = index.projects.find((x) => x.slug === r.projectSlug);
      if (p && index.units[p.slug]?.length) setUnitsProject(p);
    } else if (r.intent === "screen" && r.chips.length) {
      setUnitsProject(null);
    }
    if (r.chips.length) setChips((prev) => mergeChips(fresh ? [] : prev, r.chips));
    if (r.note) setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, note: r.note } : x)));
  };

  const consult = (q: string, cs: Chip[], slug: string | null, fresh: boolean, fallback: boolean) => {
    const seq = ++aiSeq.current;
    askRouter({ q, chips: cs, project: slug }, index).then((r) => {
      if (seq !== aiSeq.current) return; // a newer ask superseded this one
      if (r) { applyAnswer(r, fresh); return; }
      setAiState("off");
      if (fallback) onFallback(q);
    });
  };

  // first turn (the view keys on the query, so this runs once per ask)
  useEffect(() => {
    const note = isAsk
      ? "Consulting Truth Intelligence — reading the tracked index…"
      : unitsProject
        ? `Read ${(index.units[unitsProject.slug] ?? []).length} modelled lines in ${unitsProject.name} — winter-benchmark sun + room-by-room vastu.`
        : `Screened ${index.projects.length} tracked projects → ${screen(index, parsed.chips).length} match, ranked by Truth Score${parsed.chips.some((c) => c.key === "sun") ? " + modelled winter sun" : ""}.`;
    setTurns([{ q: query, note }]);
    consult(query, parsed.chips, parsed.intent === "units" && parsed.project ? parsed.project.slug : null, isAsk, isAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeChip = (c: Chip) => {
    const next = chips.filter((x) => !(x.key === c.key && x.label === c.label));
    setChips(next);
    setTurns((t) => [...t, { q: `× ${c.label}`, note: `Filter removed — ${screen(index, next).length} project${screen(index, next).length === 1 ? "" : "s"} now match.` }]);
  };

  const follow = () => {
    const q = followQ.trim();
    if (!q) return;
    setFollowQ("");
    const p = parseAsk(q, index);
    if (p.intent === "units" && p.project) {
      setUnitsProject(p.project);
      const next = p.chips.length ? p.chips : chips;
      setChips(next);
      setTurns((t) => [...t, { q, note: `Switched to ${p.project!.name} — ${(index.units[p.project!.slug] ?? []).length} modelled lines read.` }]);
      consult(q, next, p.project.slug, false, false);
      return;
    }
    if (p.chips.length > 0) {
      const next = mergeChips(chips, p.chips);
      setUnitsProject(null);
      setChips(next);
      setTurns((t) => [...t, { q, note: `Filters updated — ${screen(index, next).length} project${screen(index, next).length === 1 ? "" : "s"} match.` }]);
      consult(q, next, null, false, false);
      return;
    }
    // no deterministic structure — the router answers in-canvas;
    // unreachable → the ask becomes a TruthGuide research brief
    setTurns((t) => [...t, { q, note: "Consulting Truth Intelligence…" }]);
    consult(q, chips, unitsProject?.slug ?? null, false, true);
  };

  const top = results[0];
  /* the model's verdict (composed only from index rows) replaces the
     deterministic sentence when it lands; an ask shows nothing until then */
  const verdict = ai?.verdict
    ? <>{ai.verdict}</>
    : isAsk
      ? null
      : unitsProject
        ? units.length
          ? <>The advisor&apos;s top pick in <b className="text-[#1e6b45]">{unitsProject.name}</b> is <b className="text-[#1e6b45]">{units[0].tower} · Line {units[0].unit.slice(-2)}</b> — {units[0].grade} {units[0].score}{units[0].sunWinterH != null ? <>, {units[0].sunWinterH} h winter sun</> : null}, {units[0].facing}-facing.</>
          : <>No modelled lines for <b>{unitsProject.name}</b> yet — its 3D advisor is in production.</>
        : top
          ? <><b className="text-[#1e6b45]">{top.p.name}</b> leads your brief{top.p.score != null ? <> at Truth Score {top.p.score}</> : null} — {results.length} of {index.projects.length} tracked projects match.</>
          : <>No tracked project clears every filter — remove one to widen the screen.</>;

  /* cards: filters active → the deterministic screen; a pure ask → the
     rows the verdict cites (refs). Same markup, same provenance. */
  const refRanked: Ranked[] = (ai?.refs ?? [])
    .map((s) => index.projects.find((p) => p.slug === s))
    .filter((p): p is OmniProject => !!p)
    .map((p) => ({ p, why: [] }));
  const shownRanked = unitsProject ? [] : chips.length > 0 ? results.slice(0, 8) : refRanked.slice(0, 8);

  const mapPins = (unitsProject ? [unitsProject] : shownRanked.map((r) => r.p)).filter((p) => p.lat != null && p.lng != null);

  return (
    <div className="grid min-h-full lg:grid-cols-[260px_1fr]">
      {/* ── conversation rail ── */}
      <aside className="border-b border-[#1a1a1a]/[0.06] bg-[#efe9dd] px-5 py-5 lg:border-b-0 lg:border-r">
        <p className="mb-3 text-[8.5px] font-medium uppercase tracking-[0.22em] text-[#1a1a1a]/30">Conversation</p>
        <div className="flex flex-col gap-3">
          {turns.map((t, i) => (
            <div key={i}>
              <div className="rounded-xl rounded-bl-sm border border-[#1a1a1a]/[0.06] bg-white px-3.5 py-2.5 text-[0.8rem] font-light leading-[1.5] text-[#1a1a1a]">{t.q}</div>
              <p className="mt-1.5 px-1 text-[0.72rem] font-light leading-[1.55] text-[#1a1a1a]/50">{t.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[0.6rem] font-light leading-[1.6] text-[#1a1a1a]/30">
          {aiState === "live" ? "numbers from DB rows · prose composed by claude" : "answers built from DB rows · nothing generated"}
        </p>
      </aside>

      {/* ── artifacts ── */}
      <section className="relative px-5 pb-32 pt-6 md:px-8">
        <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#c9a96e]">
          Answer{!unitsProject && chips.length > 0 && <> · {results.length} project{results.length === 1 ? "" : "s"} match</>}
        </p>
        {isAsk && aiState === "pending" && !ai && (
          <div className="flex max-w-[640px] items-center gap-3 rounded-xl border border-[#1a1a1a]/[0.08] bg-white px-5 py-4">
            <span className="animate-pulse text-[#c9a96e]">✦</span>
            <p className="font-serif text-[0.95rem] font-light text-[#1a1a1a]/45">Truth Intelligence is reading the tracked index…</p>
          </div>
        )}
        {verdict && (
          <p className="max-w-[640px] font-serif text-[1.15rem] font-light leading-[1.5] text-[#1a1a1a] md:text-[1.3rem]">{verdict}</p>
        )}

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button key={c.key + c.label} onClick={() => removeChip(c)}
                className="group rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/[0.06] px-3 py-1.5 text-[0.74rem] font-medium text-[#1e6b45]">
                {c.label} <span className="ml-1 opacity-45 group-hover:opacity-100">×</span>
              </button>
            ))}
          </div>
        )}

        {/* unit cards — the per-flat moat */}
        {unitsProject && units.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {units.map((u) => (
              <div key={u.tower + u.unit} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[0.9rem] font-bold text-[#1a1a1a]">{u.tower} · Line {u.unit.slice(-2)}</span>
                  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[0.72rem] font-bold text-white ${u.grade.startsWith("A") ? "bg-[#3fa06a]" : u.grade.startsWith("B") ? "bg-[#c9a96e]" : "bg-[#a8a29a]"}`}>
                    {u.grade} {u.score}
                  </span>
                </div>
                <p className="mt-1 text-[0.7rem] font-light text-[#1a1a1a]/40">{u.facing}-facing</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[["Winter sun", u.sunWinterH != null ? `${u.sunWinterH}h` : "—"], ["Vastu", u.vastu ?? "—"], ["View", u.view ?? "—"]].map(([k, v]) => (
                    <div key={String(k)} className="rounded-lg border border-[#1a1a1a]/[0.05] bg-[#faf7f0] px-1.5 py-2 text-center">
                      <p className="text-[7.5px] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/35">{k}</p>
                      <p className="mt-1 font-mono text-[0.82rem] font-bold text-[#1a1a1a]">{v}</p>
                    </div>
                  ))}
                </div>
                {unitsProject.advisorFile && (
                  <a href={`${basePath}/${unitsProject.advisorFile}`}
                    className="mt-3 block rounded-lg bg-[#1e6b45] py-2 text-center text-[0.72rem] font-bold text-white">
                    Open in 3D — dollhouse + walk-through
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ranked project cards */}
        {shownRanked.length > 0 && (
          <div className="mt-5 flex flex-col gap-2.5">
            {shownRanked.map((r, i) => (
              <div key={r.p.slug} className="flex flex-col gap-3 rounded-xl border border-[#1a1a1a]/[0.08] bg-white px-4 py-3.5 sm:flex-row sm:items-center">
                <span className="hidden w-5 shrink-0 font-mono text-[0.8rem] font-bold text-[#1a1a1a]/25 sm:block">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[1rem] font-medium text-[#1a1a1a]">{r.p.name}</p>
                  {r.p.location && <p className="text-[0.72rem] font-light text-[#1a1a1a]/40">{r.p.location}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.why.map((w) => (
                      <span key={w.label} className={`rounded-md px-1.5 py-0.5 text-[0.64rem] font-medium ${w.warn ? "bg-[#c9a96e]/[0.14] text-[#8a6d1f]" : "bg-[#1e6b45]/[0.07] text-[#1e6b45]"}`}>
                        {w.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {r.p.score != null && (
                    <span className="font-mono text-[1.3rem] font-bold text-[#1e6b45]">{r.p.score}</span>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {r.p.advisorFile && (
                      <a href={`${basePath}/${r.p.advisorFile}`} className="rounded-md bg-[#1e6b45] px-3 py-1.5 text-center text-[0.66rem] font-bold text-white">Open 3D advisor</a>
                    )}
                    <a href={`${basePath}/intelligence/projects/${r.p.slug}`} className="rounded-md border border-[#1e6b45]/35 px-3 py-1.5 text-center text-[0.66rem] font-medium text-[#1e6b45]">Full report</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* map strip — matches with confirmed coordinates */}
        {mapPins.length > 0 && (
          <a href={`${basePath}/tower-intel/projects-map.html`}
            className="relative mt-4 block h-[110px] overflow-hidden rounded-xl border border-[#1a1a1a]/[0.08] bg-[#e8e6df]">
            {(() => {
              const lats = mapPins.map((p) => p.lat!), lngs = mapPins.map((p) => p.lng!);
              const la = Math.min(...lats), lb = Math.max(...lats), ga = Math.min(...lngs), gb = Math.max(...lngs);
              const X = (g: number) => 8 + ((gb - ga ? (g - ga) / (gb - ga) : 0.5) * 78);
              const Y = (l: number) => 14 + ((lb - la ? (lb - l) / (lb - la) : 0.5) * 58);
              return mapPins.map((p) => (
                <span key={p.slug}>
                  <span className="absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1e6b45] shadow" style={{ left: `${X(p.lng!)}%`, top: `${Y(p.lat!)}%` }} />
                  <span className="absolute rounded bg-[#111814]/90 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-[#f4efe4]" style={{ left: `${X(p.lng!) + 1.5}%`, top: `${Y(p.lat!) + 10}%` }}>{p.name}</span>
                </span>
              ));
            })()}
            <span className="absolute bottom-2 right-3 font-mono text-[8.5px] text-[#1a1a1a]/40">exact sites · open full map →</span>
          </a>
        )}

        <p className="mt-4 font-mono text-[0.62rem] font-light leading-[1.7] text-[#1a1a1a]/30">
          sources · {index.live ? "backlog_listing_public (scores, price, possession)" : "curated research desk (live view unreachable at build)"} · tower-intel per-flat intelligence (winter benchmark) · computed at publish
          {aiState === "live" && <> · ✦ verdict composed by claude — every number from these rows</>}
        </p>

        {/* follow-up — docked */}
        <div className="absolute inset-x-5 bottom-5 flex items-center gap-3 rounded-xl border border-[#1a1a1a]/[0.08] bg-white px-4 py-3 shadow-lg shadow-black/[0.06] md:inset-x-8">
          <span className="text-[#c9a96e]">✦</span>
          <input
            value={followQ}
            onChange={(e) => setFollowQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") follow(); }}
            placeholder="Follow up — “only ready-to-move”, “which flat in Birla Arika”…"
            className="flex-1 bg-transparent font-serif text-[0.95rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/25"
          />
          <button onClick={follow} aria-label="Ask"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ════════════════════════════════════════════════════════════════ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/25">
      {children}
    </p>
  );
}

function PageHero({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-[700px] pb-10 pt-12 text-center md:pb-14 md:pt-20">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a96e]">{kicker}</p>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[2.8rem]">{title}</h1>
      <p className="mx-auto mt-4 max-w-[480px] text-[0.88rem] font-light leading-[1.7] text-[#1a1a1a]/40">{sub}</p>
    </div>
  );
}

function BrowseTile({ title, sub, onClick, href }: { title: string; sub: string; onClick?: () => void; href?: string }) {
  const cls =
    "group block rounded-lg border border-[#1a1a1a]/[0.06] bg-white p-6 text-left transition-all duration-300 hover:border-[#1a1a1a]/12 hover:shadow-lg hover:shadow-black/[0.03]";
  const inner = (
    <>
      <h3 className="font-serif text-[1.3rem] font-medium text-[#1a1a1a] transition-colors group-hover:text-[#1e6b45]">{title}</h3>
      <p className="mt-2 text-[0.82rem] font-light leading-[1.6] text-[#1a1a1a]/45">{sub}</p>
      <span className="mt-4 inline-block text-[#1a1a1a]/20 transition-transform duration-300 group-hover:translate-x-1">→</span>
    </>
  );
  return href ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <button onClick={onClick} className={`${cls} w-full`}>{inner}</button>
  );
}

/* Thin wrapper over the shared project-option card so the workspace grids
   read identically to the report, shortlist and index. Resolves the light
   Project to its ProjectIntel; keeps the link / click variants. */
function ProjectCard({ project: p, onClick, href }: { project: Project; onClick?: () => void; href?: string }) {
  const intel = projectByName(p.name);
  if (!intel) return null;
  return <ProjectOptionCard p={intel} onSelect={onClick} href={href} />;
}

function BottomCTA({ context }: { context?: ConsultContext }) {
  const { openConsult } = useConsultation();
  return (
    <div className="mx-auto mt-20 max-w-[600px] border-t border-[#1a1a1a]/[0.06] pt-12 text-center md:mt-28">
      <p className="font-serif text-[1.3rem] font-medium text-[#1a1a1a]/70 md:text-[1.6rem]">Need independent judgement?</p>
      <p className="mx-auto mt-3 max-w-[400px] text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/35">
        Research builds confidence. Independent representation helps you decide.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => openConsult(context)}
          className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[12px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-all hover:bg-[#238c55]"
        >
          Request Independent Advice
        </button>
        <button
          onClick={() => openConsult(context)}
          className="rounded-sm border border-[#1a1a1a]/15 px-8 py-4 text-[12px] font-light tracking-[0.05em] text-[#1a1a1a]/60 transition-all hover:border-[#1a1a1a]/30"
        >
          Become a Private Client
        </button>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pb-4">
        {["Independent Intelligence", "No Sponsored Recommendations", "Answers Backed by Evidence"].map((t) => (
          <span key={t} className="flex items-center gap-2 text-[0.7rem] font-light text-[#1a1a1a]/20">
            <span className="text-[#c9a96e]/50">&#10003;</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}
