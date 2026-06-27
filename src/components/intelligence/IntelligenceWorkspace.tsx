"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../Logo";
import ProjectDecisionSystem from "./ProjectDecisionSystem";
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

/* ════════════════════════════════════════════════════════════════
   VIEW TYPES
   ════════════════════════════════════════════════════════════════ */
type View =
  | { type: "home" }
  | { type: "projects" }
  | { type: "developers" }
  | { type: "locations" }
  | { type: "compare" }
  | { type: "project"; name: string }
  | { type: "developer"; name: string }
  | { type: "location"; name: string }
  | { type: "search-result"; query: string; result: ResearchResult };

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
export default function IntelligenceWorkspace() {
  const [view, setView] = useState<View>({ type: "home" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const { openConsult } = useConsultation();

  // Consultation context derived from where the visitor is in the workspace,
  // so the advisor "arrives prepared" for the exact project/developer/market.
  const consultContext = useMemo<ConsultContext>(() => {
    switch (view.type) {
      case "project":
        return { source: view.name, sourceKind: "project", intent: "buy" };
      case "developer":
        return { source: view.name, sourceKind: "developer", intent: "advice" };
      case "location":
        return { source: view.name, sourceKind: "location", intent: "invest" };
      default:
        return { sourceKind: "intelligence" };
    }
  }, [view]);

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setSearchOpen(false);
    setSearchQuery("");
    setRecentSearches((h) => [q, ...h.filter((x) => x !== q)].slice(0, 6));
    const r = classifyAndResearch(q);
    setView({ type: "search-result", query: q, result: r });
    mainRef.current?.scrollTo(0, 0);
  };

  const navigate = (v: View) => {
    setView(v);
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
      <nav className="flex shrink-0 items-center justify-between border-b border-[#1a1a1a]/[0.06] px-6 py-4 md:px-10">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate({ type: "home" })}>
            <Logo className="h-8 w-auto md:h-12" color="#1a1a1a" />
          </button>
          <div className="hidden items-center gap-1 lg:flex">
            {(
              [
                ["Projects", "projects"],
                ["Developers", "developers"],
                ["Locations", "locations"],
                ["Compare", "compare"],
              ] as const
            ).map(([label, key]) => (
              <button
                key={key}
                onClick={() => navigate({ type: key })}
                className={`rounded-sm px-3.5 py-2 text-[0.78rem] font-light tracking-[0.02em] transition-colors duration-300 ${
                  view.type === key
                    ? "text-[#1a1a1a]"
                    : "text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70"
                }`}
              >
                {label}
              </button>
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
                  {searchSuggestions.map((s) => (
                    <button
                      key={s.label + s.type}
                      onClick={() => doSearch(s.label)}
                      className="flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-[#1a1a1a]/[0.03]"
                    >
                      <span className="font-serif text-[0.95rem] font-light text-[#1a1a1a]/70">{s.label}</span>
                      <span className="text-[10px] font-light uppercase tracking-[0.15em] text-[#1a1a1a]/25">{s.type}</span>
                    </button>
                  ))}
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

      {/* ── Main content + sidebar ── */}
      <div className="flex min-h-0 flex-1">
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          {view.type === "home" && <HomeView navigate={navigate} doSearch={doSearch} />}
          {view.type === "projects" && <ProjectsView navigate={navigate} />}
          {view.type === "developers" && <DevelopersView navigate={navigate} />}
          {view.type === "locations" && <LocationsView navigate={navigate} />}
          {view.type === "compare" && <CompareView doSearch={doSearch} />}
          {view.type === "project" && (
            <ProjectDecisionSystem
              name={view.name}
              scrollRoot={mainRef}
              goProjects={() => navigate({ type: "projects" })}
              goProject={(n) => navigate({ type: "project", name: n })}
              goDeveloper={(n) => navigate({ type: "developer", name: n })}
              goLocation={(n) => navigate({ type: "location", name: n })}
              doSearch={doSearch}
            />
          )}
          {view.type === "developer" && <DeveloperDetail name={view.name} navigate={navigate} doSearch={doSearch} />}
          {view.type === "location" && <LocationDetail name={view.name} navigate={navigate} doSearch={doSearch} />}
          {view.type === "search-result" && <SearchResultView result={view.result} doSearch={doSearch} />}
        </main>

        {/* ── Right sidebar (desktop) — hidden on the project memo, which has its own ── */}
        <aside className={`${view.type === "project" ? "hidden" : "hidden lg:block"} w-[220px] shrink-0 border-l border-[#1a1a1a]/[0.06] p-6`}>
          {recentSearches.length > 0 && (
            <div className="mb-8">
              <p className="mb-3 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/25">Recent Searches</p>
              <div className="flex flex-col gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => doSearch(s)}
                    className="text-left text-[0.78rem] font-light leading-snug text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => openConsult(consultContext)}
            className="mb-3 w-full rounded-sm bg-[#1e6b45] px-4 py-3 text-[10px] font-medium tracking-[0.1em] text-white transition-all hover:bg-[#238c55]"
          >
            Request Independent Advice
          </button>
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
            className="w-full rounded-sm border border-[#1a1a1a]/10 px-4 py-3 text-[10px] font-light tracking-[0.1em] text-[#1a1a1a]/50 transition-all hover:border-[#1a1a1a]/20"
          >
            TruthGuide
          </button>
        </aside>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HOME VIEW
   ════════════════════════════════════════════════════════════════ */
function HomeView({ navigate, doSearch }: { navigate: (v: View) => void; doSearch: (q: string) => void }) {
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

  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      {/* Hero */}
      <div className="pb-12 pt-12 text-center md:pb-16 md:pt-20">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a96e]">
          Truth Intelligence
        </p>
        <h1 className="mx-auto max-w-[600px] font-serif text-[2.2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[3rem]">
          Independent research for India&apos;s biggest real estate decisions.
        </h1>
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
            className="group/arrow flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white transition-all duration-300 hover:scale-[1.06] md:h-10 md:w-10"
          >
            <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover/arrow:translate-x-[3px] md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      {/* Browse Intelligence */}
      <div className="mx-auto max-w-[1000px]">
        <SectionLabel>Browse Intelligence</SectionLabel>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BrowseTile
            title="Projects"
            sub="Independent intelligence on every residential project."
            onClick={() => navigate({ type: "projects" })}
          />
          <BrowseTile
            title="Developers"
            sub="Delivery history. Financial health. Track record."
            onClick={() => navigate({ type: "developers" })}
          />
          <BrowseTile
            title="Locations"
            sub="Infrastructure. Supply. Demand. Outlook."
            onClick={() => navigate({ type: "locations" })}
          />
          <BrowseTile
            title="Compare"
            sub="Compare any projects, developers, or markets."
            onClick={() => navigate({ type: "compare" })}
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
            <ProjectCard key={p.name} project={p} onClick={() => navigate({ type: "project", name: p.name })} />
          ))}
        </div>
      </div>

      {/* Recently Updated */}
      <div className="mx-auto mt-16 max-w-[1000px] md:mt-24">
        <SectionLabel>Recently Updated</SectionLabel>
        <div className="mt-6 flex flex-col gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/[0.06]">
          {sorted.slice(0, 5).map((p) => (
            <button
              key={p.name}
              onClick={() => navigate({ type: "project", name: p.name })}
              className="flex items-center justify-between bg-white px-6 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <div>
                <span className="font-serif text-[1rem] font-medium text-[#1a1a1a]">{p.name}</span>
                <span className="ml-3 text-[0.78rem] font-light text-[#1a1a1a]/35">{p.developer} &middot; {p.market}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-serif text-[1rem] font-medium text-[#1e6b45]">{p.truthScore}</span>
                <span className="text-[0.72rem] font-light text-[#1a1a1a]/25">Updated Today</span>
              </div>
            </button>
          ))}
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
   PROJECTS VIEW
   ════════════════════════════════════════════════════════════════ */
function ProjectsView({ navigate }: { navigate: (v: View) => void }) {
  const sorted = useMemo(() => [...PROJECTS].sort((a, b) => b.truthScore - a.truthScore), []);
  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      <PageHero kicker="Projects" title="Every project. Independently assessed." sub="Truth Scores, verdicts, and executive summaries based on independent research." />
      <div className="mx-auto max-w-[1000px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p) => (
            <ProjectCard key={p.name} project={p} onClick={() => navigate({ type: "project", name: p.name })} />
          ))}
        </div>
      </div>
      <BottomCTA />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DEVELOPERS VIEW
   ════════════════════════════════════════════════════════════════ */
function DevelopersView({ navigate }: { navigate: (v: View) => void }) {
  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      <PageHero kicker="Developers" title="Developer intelligence." sub="Delivery history, financial health, and independent track-record analysis." />
      <div className="mx-auto max-w-[1000px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DEVELOPER_PROFILES.map((d) => (
            <button
              key={d.name}
              onClick={() => navigate({ type: "developer", name: d.name })}
              className="group rounded-lg border border-[#1a1a1a]/[0.06] bg-white p-6 text-left transition-all duration-300 hover:border-[#1a1a1a]/12 hover:shadow-lg hover:shadow-black/[0.03]"
            >
              <p className="mb-1 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">Est. {d.est}</p>
              <h3 className="font-serif text-[1.4rem] font-medium text-[#1a1a1a]">{d.name}</h3>
              <p className="mt-3 text-[0.82rem] font-light leading-[1.65] text-[#1a1a1a]/50 line-clamp-3">{d.verdict}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[0.72rem] font-light text-[#1a1a1a]/30">
                  {PROJECTS.filter((p) => p.developer === d.name).length} active projects
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <BottomCTA />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   LOCATIONS VIEW
   ════════════════════════════════════════════════════════════════ */
function LocationsView({ navigate }: { navigate: (v: View) => void }) {
  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      <PageHero kicker="Locations" title="Market intelligence." sub="Infrastructure, supply, demand, and outlook for every micro-market." />
      <div className="mx-auto max-w-[1000px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MARKET_PROFILES.map((m) => (
            <button
              key={m.name}
              onClick={() => navigate({ type: "location", name: m.name })}
              className="group rounded-lg border border-[#1a1a1a]/[0.06] bg-white p-6 text-left transition-all duration-300 hover:border-[#1a1a1a]/12 hover:shadow-lg hover:shadow-black/[0.03]"
            >
              <p className="mb-1 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">{m.short}</p>
              <h3 className="font-serif text-[1.3rem] font-medium text-[#1a1a1a]">{m.name}</h3>
              <p className="mt-3 text-[0.82rem] font-light leading-[1.65] text-[#1a1a1a]/50 line-clamp-3">{m.overview}</p>
              <p className="mt-4 text-[0.72rem] font-light text-[#1a1a1a]/30">{m.projects.length} tracked projects</p>
            </button>
          ))}
        </div>
      </div>
      <BottomCTA />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   COMPARE VIEW
   ════════════════════════════════════════════════════════════════ */
function CompareView({ doSearch }: { doSearch: (q: string) => void }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const comparisons = [
    "DLF Arbour vs Puri Aravallis",
    "DLF vs Godrej",
    "Golf Course Extension vs SPR",
    "Godrej Aristocrat vs DLF Privana South",
    "M3M Golf Estate II vs Birla Navya",
    "Dwarka Expressway vs SPR",
  ];

  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      <PageHero kicker="Compare" title="Compare anything." sub="Projects, developers, or locations — side by side." />
      <div className="mx-auto max-w-[700px]">
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="First project, developer, or location"
            className="flex-1 border-b border-[#1a1a1a]/12 bg-transparent py-3 font-serif text-[1.05rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/22 focus:border-[#c9a96e]/40"
          />
          <span className="hidden self-end pb-3 font-serif text-[1rem] text-[#1a1a1a]/20 sm:block">vs</span>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="Second project, developer, or location"
            className="flex-1 border-b border-[#1a1a1a]/12 bg-transparent py-3 font-serif text-[1.05rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/22 focus:border-[#c9a96e]/40"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => { if (a.trim() && b.trim()) doSearch(`${a.trim()} vs ${b.trim()}`); }}
            disabled={!a.trim() || !b.trim()}
            className="rounded-sm bg-[#1e6b45] px-8 py-3 text-[11px] font-medium tracking-[0.08em] text-white transition-all hover:bg-[#238c55] disabled:opacity-30"
          >
            Compare
          </button>
        </div>

        <div className="mt-14">
          <SectionLabel>Popular Comparisons</SectionLabel>
          <div className="mt-5 flex flex-col gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/[0.06]">
            {comparisons.map((c) => (
              <button
                key={c}
                onClick={() => doSearch(c)}
                className="flex items-center justify-between bg-white px-6 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <span className="font-serif text-[0.95rem] font-light text-[#1a1a1a]/65">{c}</span>
                <svg className="h-4 w-4 text-[#1a1a1a]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomCTA />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DEVELOPER DETAIL
   ════════════════════════════════════════════════════════════════ */
function DeveloperDetail({ name, navigate, doSearch }: { name: string; navigate: (v: View) => void; doSearch: (q: string) => void }) {
  const d = DEVELOPER_PROFILES.find((x) => x.name === name);
  if (!d) return <div className="p-12 text-center font-serif text-[#1a1a1a]/40">Developer not found.</div>;

  const projects = PROJECTS.filter((p) => p.developer === name);
  const sections: { l: string; v: string }[] = [
    { l: "Delivery Track Record", v: d.delivery },
    { l: "Financial Health", v: d.financial },
    { l: "Completed Projects", v: d.completed },
    { l: "Currently Building", v: d.building },
    { l: "Legal & Compliance", v: d.legal },
  ];

  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      <div className="mx-auto max-w-[820px] pt-10 md:pt-16">
        <div className="mb-8 flex items-center gap-2 text-[0.72rem] font-light text-[#1a1a1a]/30">
          <button onClick={() => navigate({ type: "developers" })} className="hover:text-[#1a1a1a]/60">Developers</button>
          <span>/</span>
          <span className="text-[#1a1a1a]/50">{name}</span>
        </div>

        <p className="mb-2 text-[9px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">Developer Profile</p>
        <h1 className="font-serif text-[2rem] font-medium text-[#1a1a1a] md:text-[2.8rem]">{name}</h1>
        <p className="mt-1 text-[0.88rem] font-light text-[#1a1a1a]/35">Established {d.est}</p>

        <div className="mt-8 rounded-lg border border-[#1a1a1a]/[0.08] bg-white px-6 py-5">
          <p className="mb-1 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">Truth Verdict</p>
          <p className="font-serif text-[0.95rem] font-light leading-[1.75] text-[#1a1a1a]/65">{d.verdict}</p>
        </div>

        <div className="mt-10 flex flex-col gap-7">
          {sections.map((s) => (
            <div key={s.l}>
              <p className="mb-2 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">{s.l}</p>
              <p className="font-serif text-[0.92rem] font-light leading-[1.75] text-[#1a1a1a]/60">{s.v}</p>
            </div>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="mt-10 border-t border-[#1a1a1a]/[0.06] pt-8">
            <SectionLabel>Active Projects</SectionLabel>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.name} project={p} onClick={() => navigate({ type: "project", name: p.name })} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-[#1a1a1a]/[0.06] pt-8">
          <p className="mb-4 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/25">Ask TruthGuide</p>
          <div className="flex flex-wrap gap-2.5">
            {[`${name} delivery track record`, `Compare ${name} with alternatives`, `${name} financial health`, `Best ${name} project for investment`].map((q) => (
              <button key={q} onClick={() => doSearch(q)} className="rounded-full border border-[#1a1a1a]/[0.06] px-5 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/45 transition-all duration-300 hover:-translate-y-[1px] hover:border-[#1a1a1a]/15 hover:text-[#1a1a1a]/70">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomCTA context={{ source: name, sourceKind: "developer", intent: "advice" }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   LOCATION DETAIL
   ════════════════════════════════════════════════════════════════ */
function LocationDetail({ name, navigate, doSearch }: { name: string; navigate: (v: View) => void; doSearch: (q: string) => void }) {
  const m = MARKET_PROFILES.find((x) => x.name === name);
  if (!m) return <div className="p-12 text-center font-serif text-[#1a1a1a]/40">Location not found.</div>;

  const projects = PROJECTS.filter((p) => p.market === name);
  const sections: { l: string; v: string }[] = [
    { l: "Market Overview", v: m.overview },
    { l: "Infrastructure", v: m.infra },
    { l: "Price Trends", v: m.price },
    { l: "Supply", v: m.supply },
    { l: "Demand", v: m.demand },
    { l: "Outlook", v: m.outlook },
  ];

  return (
    <div className="px-6 pb-24 md:px-12 lg:px-16">
      <div className="mx-auto max-w-[820px] pt-10 md:pt-16">
        <div className="mb-8 flex items-center gap-2 text-[0.72rem] font-light text-[#1a1a1a]/30">
          <button onClick={() => navigate({ type: "locations" })} className="hover:text-[#1a1a1a]/60">Locations</button>
          <span>/</span>
          <span className="text-[#1a1a1a]/50">{name}</span>
        </div>

        <p className="mb-2 text-[9px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">Market Intelligence</p>
        <h1 className="font-serif text-[2rem] font-medium text-[#1a1a1a] md:text-[2.8rem]">{name}</h1>

        <div className="mt-10 flex flex-col gap-7">
          {sections.map((s) => (
            <div key={s.l}>
              <p className="mb-2 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">{s.l}</p>
              <p className="font-serif text-[0.92rem] font-light leading-[1.75] text-[#1a1a1a]/60">{s.v}</p>
            </div>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="mt-10 border-t border-[#1a1a1a]/[0.06] pt-8">
            <SectionLabel>Top Projects</SectionLabel>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.name} project={p} onClick={() => navigate({ type: "project", name: p.name })} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-[#1a1a1a]/[0.06] pt-8">
          <p className="mb-4 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/25">Ask TruthGuide</p>
          <div className="flex flex-wrap gap-2.5">
            {[`Best projects in ${name}`, `${name} investment outlook`, `Compare ${name} with alternatives`, `Pricing trends in ${name}`].map((q) => (
              <button key={q} onClick={() => doSearch(q)} className="rounded-full border border-[#1a1a1a]/[0.06] px-5 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/45 transition-all duration-300 hover:-translate-y-[1px] hover:border-[#1a1a1a]/15 hover:text-[#1a1a1a]/70">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomCTA context={{ source: name, sourceKind: "location", intent: "invest" }} />
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

function BrowseTile({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-lg border border-[#1a1a1a]/[0.06] bg-white p-6 text-left transition-all duration-300 hover:border-[#1a1a1a]/12 hover:shadow-lg hover:shadow-black/[0.03]"
    >
      <h3 className="font-serif text-[1.3rem] font-medium text-[#1a1a1a] transition-colors group-hover:text-[#1e6b45]">{title}</h3>
      <p className="mt-2 text-[0.82rem] font-light leading-[1.6] text-[#1a1a1a]/45">{sub}</p>
      <span className="mt-4 inline-block text-[#1a1a1a]/20 transition-transform duration-300 group-hover:translate-x-1">→</span>
    </button>
  );
}

function ProjectCard({ project: p, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-lg border border-[#1a1a1a]/[0.06] bg-white p-5 text-left transition-all duration-300 hover:border-[#1a1a1a]/12 hover:shadow-lg hover:shadow-black/[0.03]"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-[1.1rem] font-medium text-[#1a1a1a]">{p.name}</h3>
          <p className="mt-0.5 text-[0.72rem] font-light text-[#1a1a1a]/35">{p.developer} &middot; {p.market}</p>
        </div>
        <div className="text-right">
          <span className="font-serif text-[1.3rem] font-medium text-[#1e6b45]">{p.truthScore}</span>
          <p className="text-[8px] font-light uppercase tracking-[0.15em] text-[#1a1a1a]/25">Score</p>
        </div>
      </div>
      <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.15em] text-[#1a1a1a]/50">{p.recommendation}</p>
      <p className="mt-2 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/45 line-clamp-2">{p.reason}</p>
      <p className="mt-3 text-[0.68rem] font-light text-[#1a1a1a]/22">Updated Today</p>
    </button>
  );
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
