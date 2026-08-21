"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../Logo";
import SearchPalette from "./SearchPalette";
import { useJourney } from "../journey/JourneyProvider";
import type { ProjectIntel } from "@/lib/projects";
import type { TrackedStats } from "@/lib/supabase";
import ProjectOptionCard, { streetAddress } from "./ProjectOptionCard";
import { basePath, homeHref } from "@/lib/site";


type Sort = "score" | "priceAsc" | "priceDesc" | "name";

const SORTS: { key: Sort; label: string }[] = [
  { key: "score", label: "Truth Score" },
  { key: "priceAsc", label: "Price · low first" },
  { key: "priceDesc", label: "Price · high first" },
  { key: "name", label: "Name A–Z" },
];

/* Everything a reader might type at a grid of ninety-seven: the project,
   who is building it, the sector, the corridor. Folded to lowercase once
   per project rather than once per keystroke. */
function haystack(p: ProjectIntel): string {
  return [p.name, p.developer, p.market, p.marketShort, streetAddress(p), ...(p.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/* ── The catalogue's facet filters (founder-approved mock, 20 Aug 2026) ──
   Four dropdowns whose option counts answer "what happens if I pick this",
   faceted against every OTHER active filter. Budget reads the project's
   ENTRY price. ROI is one thing only — the audited model's projected
   8-year CAGR, risk-adjusted (liveRoi.adjCagr); not absolute appreciation,
   not XIRR — and the label says so. Opt-in via facetFilters: the landers
   and best-projects pages keep their own narrower controls. */
const BUDGETS = [
  { k: "u2", l: "Under ₹2 Cr", t: (v: number) => v < 2 },
  { k: "2-3", l: "₹2–3 Cr", t: (v: number) => v >= 2 && v < 3 },
  { k: "3-5", l: "₹3–5 Cr", t: (v: number) => v >= 3 && v < 5 },
  { k: "5-8", l: "₹5–8 Cr", t: (v: number) => v >= 5 && v < 8 },
  { k: "8-12", l: "₹8–12 Cr", t: (v: number) => v >= 8 && v < 12 },
  { k: "12p", l: "₹12 Cr+", t: (v: number) => v >= 12 },
];
const CONFIGS = [
  { k: "2bhk", l: "2 BHK", m: ["2 bhk", "2bhk", "2.5"] },
  { k: "3bhk", l: "3 BHK", m: ["3 bhk", "3bhk", "3.5"] },
  { k: "4bhk", l: "4 BHK", m: ["4 bhk", "4bhk", "4.5"] },
  { k: "5bhk", l: "5 BHK", m: ["5 bhk", "5bhk", "5.5"] },
  { k: "pent", l: "Penthouse", m: ["penthouse"] },
  { k: "dup", l: "Duplex", m: ["duplex"] },
];
const ROIS = [
  { k: "8", l: "8%+ proj. CAGR", t: (v: number) => v >= 8 },
  { k: "10", l: "10%+ proj. CAGR", t: (v: number) => v >= 10 },
  { k: "12", l: "12%+ proj. CAGR", t: (v: number) => v >= 12 },
];

const cfgTextOf = (p: ProjectIntel) => (p.configs ?? []).join(" ").toLowerCase();
const corridorOf = (p: ProjectIntel) => p.marketShort || p.market || "";
const corridorSlug = (v: string) => v.toLowerCase().replace(/\s+/g, "-");

type Dim = "corridor" | "budget" | "config" | "roi";
const DIMS: Dim[] = ["corridor", "budget", "config", "roi"];
const dimPass: Record<Dim, (p: ProjectIntel, v: string) => boolean> = {
  corridor: (p, v) => corridorOf(p) === v,
  budget: (p, v) => {
    const b = BUDGETS.find((x) => x.k === v);
    const e = p.budget?.[0] ?? 0;
    return !!b && e > 0 && b.t(e);
  },
  config: (p, v) => {
    const c = CONFIGS.find((x) => x.k === v);
    return !!c && c.m.some((n) => cfgTextOf(p).includes(n));
  },
  roi: (p, v) => {
    const r = ROIS.find((x) => x.k === v);
    const cagr = p.liveRoi?.adjCagr;
    return !!r && cagr != null && r.t(cagr);
  },
};
const dimLabel: Record<Dim, (v: string) => string> = {
  corridor: (v) => v,
  budget: (v) => BUDGETS.find((x) => x.k === v)?.l ?? v,
  config: (v) => CONFIGS.find((x) => x.k === v)?.l ?? v,
  roi: (v) => ROIS.find((x) => x.k === v)?.l ?? v,
};

/* Landers that exist today — when the live filter combo sits inside one,
   a line above the grid offers the permanent page. The catalogue feeds
   the SEO mesh instead of competing with it: forward flow for the
   reader, a crawl path for the bot. Combos with no lander show nothing. */
const MESH: { c: string | null; b: string[] | null; co: string | null; s: string; h: string }[] = [
  { c: "4bhk", b: null, co: null, s: "4-bhk-apartments-gurugram", h: "4 BHK Apartments in Gurugram" },
  { c: "3bhk", b: null, co: null, s: "3-bhk-apartments-gurugram", h: "3 BHK Apartments in Gurugram" },
  { c: "5bhk", b: null, co: null, s: "5-bhk-apartments-gurugram", h: "5 BHK Luxury Apartments in Gurugram" },
  { c: "pent", b: null, co: null, s: "penthouses-in-gurugram", h: "Luxury Penthouses in Gurugram" },
  { c: "dup", b: null, co: null, s: "duplex-apartments-gurugram", h: "Duplex Apartments in Gurugram" },
  { c: "4bhk", b: ["u2", "2-3", "3-5"], co: null, s: "4-bhk-in-gurugram-under-5-cr", h: "4 BHK in Gurugram Under ₹5 Cr" },
  { c: "4bhk", b: ["5-8"], co: null, s: "4-bhk-in-gurugram-under-8-cr", h: "4 BHK in Gurugram Under ₹8 Cr" },
  { c: "3bhk", b: ["u2"], co: null, s: "3-bhk-in-gurugram-under-2-cr", h: "3 BHK in Gurugram Under ₹2 Cr" },
  { c: "3bhk", b: ["2-3"], co: null, s: "3-bhk-in-gurugram-under-3-cr", h: "3 BHK in Gurugram Under ₹3 Cr" },
  { c: "pent", b: ["5-8", "8-12"], co: null, s: "penthouses-in-gurugram-under-10-cr", h: "Penthouses in Gurugram Under ₹10 Cr" },
  { c: null, b: ["12p"], co: null, s: "luxury-apartments-in-gurugram-above-10-cr", h: "Ultra-Luxury Above ₹10 Cr" },
  { c: "4bhk", b: null, co: "GCE", s: "4-bhk-golf-course-extension", h: "4 BHK on Golf Course Extension Road" },
  { c: "4bhk", b: null, co: "Dwarka Expy", s: "4-bhk-dwarka-expressway", h: "4 BHK on Dwarka Expressway" },
  { c: "4bhk", b: null, co: "SPR", s: "4-bhk-southern-peripheral-road-spr", h: "4 BHK on SPR" },
  { c: "4bhk", b: null, co: "GCR", s: "4-bhk-golf-course-road", h: "4 BHK on Golf Course Road" },
  { c: "4bhk", b: null, co: "New Gurgaon", s: "4-bhk-new-gurgaon", h: "4 BHK in New Gurgaon" },
  { c: "3bhk", b: null, co: "Dwarka Expy", s: "3-bhk-dwarka-expressway", h: "3 BHK on Dwarka Expressway" },
  { c: "3bhk", b: null, co: "GCE", s: "3-bhk-golf-course-extension", h: "3 BHK on Golf Course Extension Road" },
  { c: "pent", b: null, co: "Dwarka Expy", s: "penthouses-dwarka-expressway", h: "Penthouses on Dwarka Expressway" },
  { c: "4bhk", b: ["u2", "2-3", "3-5"], co: "Dwarka Expy", s: "4-bhk-dwarka-expressway-under-5-cr", h: "4 BHK on Dwarka Expressway Under ₹5 Cr" },
  { c: "4bhk", b: ["u2", "2-3", "3-5"], co: "SPR", s: "4-bhk-spr-under-5-cr", h: "4 BHK on SPR Under ₹5 Cr" },
  { c: "3bhk", b: ["u2"], co: "Dwarka Expy", s: "3-bhk-dwarka-expressway-under-2-5-cr", h: "3 BHK on Dwarka Expressway Under ₹2.5 Cr" },
];

/* The projects index — the entire tracked universe, live from the pipeline.
   Every project is a real backlog_listing_public row adapted onto the shared
   ProjectOptionCard; no seed/demo entries.

   THE COPY AND SLOT PROPS ARE OPTIONAL AND DEFAULT TO WHAT THIS PAGE HAS
   ALWAYS SAID, so /intelligence/projects renders byte-identically and no
   layout, style or element changed. They exist because the
   /best-projects/ and /apartments/ pages are this same grid over a
   filtered set, and a landing page for "under ₹3 Cr" that is headed
   "Every project, independently scored" is a duplicate of the index in
   Google's eyes and an answer to the wrong question in the reader's.

   statTiles replaces the GLOBAL stat row (325 tracked / 10% delayed…)
   with numbers true of the filtered set — on a "4 BHK under ₹5 Cr" page
   the universe's totals describe a different population than the list
   below them, which reads as a mismatch even when both are correct.
   afterHeader renders between the stats and the grid: the cluster
   landers put their conversion band there. Both default off. */
export default function ProjectsIndex({
  projects,
  stats,
  crumb = "Projects",
  heading = "Every project, independently scored.",
  intro = "One Truth Score per project, built from six audited inputs — delivery, legal, developer strength, liquidity, pricing and construction. No developer pays to appear here, and none can move a score. Open any project to see exactly how it’s built.",
  statTiles,
  afterHeader,
  dense = false,
  metaLine,
  feedSlot,
  priceChips,
  facetFilters = false,
}: {
  projects: ProjectIntel[];
  stats?: TrackedStats | null;
  crumb?: string;
  heading?: string;
  intro?: string;
  statTiles?: { v: string; k: string }[];
  afterHeader?: React.ReactNode;
  /* dense: the landing-page cut. A cluster page's product is the grid,
     so the framing collapses to crumb + a smaller h1 + ONE meta line and
     the cards start inside the first screen — with the standard header a
     phone showed the first card ~1,400px down, which is a library, not a
     landing page. metaLine is that one line; feedSlot drops a node INTO
     the grid after N cards, where a next-step card converts without
     costing the fold. All default off; the catalogue is unchanged. */
  dense?: boolean;
  metaLine?: string;
  feedSlot?: { after: number; node: React.ReactNode };
  /* Price-bucket chips for the landers, REPLACING the corridor chips —
     a budget is how a buyer actually narrows a shortlist, and on a
     config page the bucket is the PAGE'S UNIT price (4 BHK cost), not
     the project's cheapest flat. Server-computed (functions don't
     cross the RSC boundary): `of` maps project slug → bucket label,
     `labels` carries the ordered chips with real counts. */
  priceChips?: { labels: { label: string; count: number }[]; of: Record<string, string> };
  /* facetFilters: the CATALOGUE's four dropdowns (corridor, entry budget,
     configuration, projected-CAGR band) with faceted counts, active-filter
     pills, URL-synced state and the lander mesh line. Opt-in and off by
     default so every other surface renders exactly as before. */
  facetFilters?: boolean;
}) {
  const { open } = useJourney();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("score");
  const [corridor, setCorridor] = useState<string | null>(null);
  const [bucket, setBucket] = useState<string | null>(null);
  const [budget, setBudget] = useState("");
  const [config, setConfig] = useState("");
  const [roi, setRoi] = useState("");
  // ?developer=<name> deep-link from a dossier's "See all X projects" CTA —
  // filters THIS catalogue (and its ProjectOptionCard grid) to one builder.
  const [devFilter, setDevFilter] = useState<string | null>(null);

  /* ?q=SPR lands here pre-filtered — the corridor pages link straight into
     the grid rather than dropping the reader at all ninety-seven. Read on
     mount rather than during render: the server has no URL, and seeding
     state from window during render is a hydration mismatch. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get("q");
    if (seed) setQ(seed);
    const dev = params.get("developer");
    if (dev?.trim()) setDevFilter(dev.trim());
  }, []);

  const scores = projects.map((p) => p.truthScore).filter((s) => s > 0);
  const lo = scores.length ? Math.min(...scores) : 0;
  const hi = scores.length ? Math.max(...scores) : 0;

  const indexed = useMemo(() => projects.map((p) => ({ p, hay: haystack(p) })), [projects]);

  /* Corridors with their real counts, biggest first — a filter that shows
     how much sits behind each option is a filter you can plan with. */
  const corridors = useMemo(() => {
    const by = new Map<string, number>();
    for (const p of projects) {
      const c = p.marketShort || p.market;
      if (c) by.set(c, (by.get(c) ?? 0) + 1);
    }
    return [...by.entries()].sort((a, b) => b[1] - a[1]);
  }, [projects]);

  /* ?corridor=dwarka-expy&budget=3-5&config=4bhk&roi=10 — the filter state
     IS the URL on the catalogue, so every combination is shareable,
     bookmarkable and ad-landable. Seeded once on mount (after `corridors`
     exists, to resolve the corridor slug back to its label)… */
  const seeded = useRef(false);
  useEffect(() => {
    if (!facetFilters || seeded.current) return;
    seeded.current = true;
    const params = new URLSearchParams(window.location.search);
    const co = params.get("corridor");
    if (co) {
      const hitC = corridors.find(([c]) => corridorSlug(c) === co.toLowerCase());
      if (hitC) setCorridor(hitC[0]);
    }
    const b = params.get("budget");
    if (b && BUDGETS.some((x) => x.k === b)) setBudget(b);
    const cf = params.get("config");
    if (cf && CONFIGS.some((x) => x.k === cf)) setConfig(cf);
    const r = params.get("roi");
    if (r && ROIS.some((x) => x.k === r)) setRoi(r);
  }, [facetFilters, corridors]);

  /* …and written back on every change. replaceState, not pushState — the
     back button should leave the page, not unwind twelve filter clicks.
     Other params (?developer=…) pass through untouched. */
  useEffect(() => {
    if (!facetFilters) return;
    const qs = new URLSearchParams(window.location.search);
    const entries: [string, string][] = [
      ["corridor", corridor ? corridorSlug(corridor) : ""],
      ["budget", budget],
      ["config", config],
      ["roi", roi],
      ["q", q.trim()],
    ];
    for (const [k, v] of entries) {
      if (v) qs.set(k, v);
      else qs.delete(k);
    }
    const s = qs.toString();
    window.history.replaceState(null, "", s ? `${window.location.pathname}?${s}` : window.location.pathname);
  }, [facetFilters, corridor, budget, config, roi, q]);

  /* Search + developer scope, applied BEFORE the facet dims — this is the
     base population the dropdowns facet against. */
  const prefiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = indexed;
    if (devFilter) {
      // Exact (normalised) developer match, so a short CTA name ("Krisumi")
      // resolves to the full filed name and can't drag in a project that merely
      // mentions the developer in its text.
      const key = devFilter.toLowerCase().replace(/[^a-z0-9]/g, "");
      out = out.filter((x) => {
        const d = (x.p.developer ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return !!key && (d === key || d.startsWith(key) || key.startsWith(d));
      });
    }
    if (needle) out = out.filter((x) => x.hay.includes(needle));
    return out;
  }, [indexed, q, devFilter]);

  const dimValues: Record<Dim, string> = useMemo(
    () => ({ corridor: corridor ?? "", budget, config, roi }),
    [corridor, budget, config, roi],
  );

  /* Option counts answer "what happens if I pick this", faceted against
     every OTHER active filter. Zero-count options drop out unless they are
     the current selection (which must stay visible to be deselectable). */
  const facets = useMemo(() => {
    if (!facetFilters) return null;
    const passExcept = (p: ProjectIntel, except: Dim) =>
      DIMS.every((d) => d === except || !dimValues[d] || dimPass[d](p, dimValues[d]));
    const build = (dim: Dim, items: { k: string; l: string }[]) => {
      const base = prefiltered.filter((x) => passExcept(x.p, dim));
      return {
        all: base.length,
        items: items
          .map((it) => ({ ...it, n: base.filter((x) => dimPass[dim](x.p, it.k)).length }))
          .filter((it) => it.n > 0 || dimValues[dim] === it.k),
      };
    };
    return {
      corridor: build("corridor", corridors.map(([c]) => ({ k: c, l: c }))),
      budget: build("budget", BUDGETS),
      config: build("config", CONFIGS),
      roi: build("roi", ROIS),
    };
  }, [facetFilters, prefiltered, dimValues, corridors]);

  /* The lander mesh line — offered only while the combo maps to a page
     that exists (and only when something is actually filtered). */
  const meshHit = useMemo(() => {
    if (!facetFilters || (!config && !budget && !corridor)) return null;
    return (
      MESH.find(
        (m) =>
          (m.c ? config === m.c : !config) &&
          (m.co ? corridor === m.co : !corridor) &&
          (m.b ? m.b.includes(budget) : !budget),
      ) ?? null
    );
  }, [facetFilters, config, budget, corridor]);

  const shown = useMemo(() => {
    let out = prefiltered;
    for (const d of DIMS) {
      const v = dimValues[d];
      if (v) out = out.filter((x) => dimPass[d](x.p, v));
    }
    if (bucket && priceChips) out = out.filter((x) => priceChips.of[x.p.slug] === bucket);
    const list = out.map((x) => x.p);
    /* DEFAULT ORDER IS THE SCORE. The grid used to render in whatever
       order the pipeline returned rows — 75, 77, 61, 65, 61, 59, 81 — so
       the first screen of a page about ranking projects was unranked. */
    const price = (p: ProjectIntel) => (p.budget?.[0] ?? 0) || Number.MAX_SAFE_INTEGER;
    return [...list].sort((a, b) =>
      sort === "score" ? b.truthScore - a.truthScore
      : sort === "priceAsc" ? price(a) - price(b)
      : sort === "priceDesc" ? (b.budget?.[0] ?? 0) - (a.budget?.[0] ?? 0)
      : a.name.localeCompare(b.name),
    );
  }, [prefiltered, dimValues, sort, bucket, priceChips]);

  const filtered = q.trim() !== "" || corridor != null || bucket != null || budget !== "" || config !== "" || roi !== "";
  const clearAll = () => { setQ(""); setCorridor(null); setBucket(null); setBudget(""); setConfig(""); setRoi(""); };
  // When arrived via a developer's "See all X projects" CTA, the page reframes
  // to that builder (heading, crumb, intro) and the global stat row is hidden —
  // its counts describe the whole universe, not this one developer.
  const devActive = !!devFilter && devFilter.trim() !== "";
  const displayCrumb = devActive ? devFilter! : crumb;
  const displayHeading = devActive ? `All ${devFilter} projects` : heading;
  const displayIntro = devActive
    ? `Every ${devFilter} project we track — one Truth Score each, built from delivery, legal, developer strength, liquidity, pricing and construction.`
    : intro;

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={homeHref} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <SearchPalette className="ml-auto" />
          <button onClick={() => open()} className="rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5">
            Request Independent Advice
          </button>
        </div>
      </header>

      <div className={`mx-auto max-w-7xl px-6 pb-[14vh] md:px-10 ${dense ? "pt-6" : "pt-[7vh]"}`}>
        <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
          <a href={`${basePath}/intelligence`} className="transition-colors hover:text-[#1a1a1a]/70">Intelligence</a>
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">{displayCrumb}</span>
        </div>

        <p className={dense ? "mt-4 text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]" : "mt-8 text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]"}>Project Intelligence</p>
        <h1 className={dense
          ? "mt-2.5 max-w-3xl font-serif text-[1.9rem] font-medium leading-[1.08] tracking-[-0.01em] md:text-[2.6rem]"
          : "mt-5 max-w-2xl font-serif text-[2.6rem] font-medium leading-[1.04] tracking-[-0.02em] md:text-[4rem]"}>{displayHeading}</h1>
        {dense ? (
          metaLine ? <p className="mt-2.5 text-[0.8rem] font-light leading-relaxed text-[#1a1a1a]/55">{metaLine}</p> : null
        ) : (
        <p className="mt-6 max-w-2xl text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.05rem]">
          {displayIntro}
        </p>
        )}
        {!devActive && !dense && (
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
            {statTiles ? (
              /* Cluster landers pass numbers true of THIS filtered set. */
              statTiles.map((t) => <Stat key={t.k} v={t.v} k={t.k} />)
            ) : (
              <>
                {/* The fallback was ACTIVE_PROJECT_COUNT — a hand-set 127 against a
                    live 312. A stat that wrong is worse than a stat missing, so
                    when the pipeline cannot answer the tile simply does not draw. */}
                {stats?.tracked != null && <Stat v={stats.tracked.toLocaleString("en-IN")} k="RERA projects tracked · live" />}
                {stats?.delayed != null && stats.delayed > 0 && (
                  <Stat v={`${Math.round((stats.delayed / stats.tracked) * 100)}%`} k="of them running delayed" />
                )}
                {projects.length > 0 && <Stat v={`${projects.length}`} k="scored & listed here" />}
                {hi > 0 && <Stat v={`${lo}–${hi}`} k="Truth Score range" />}
              </>
            )}
          </div>
        )}

        {!devActive && afterHeader}

        {/* ── The tracked universe — every project live from the pipeline ── */}
        {!dense && (
        <div className="mt-11 flex items-center gap-3">
          <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">The tracked universe</span>
          <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-2.5 py-0.5 font-mono text-[0.54rem] tracking-[0.14em] text-[#1e6b45]">LIVE · FROM THE PIPELINE</span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
        </div>
        )}

        {projects.length > 0 ? (
          <>
            {/* ── FIND ONE. Ninety-seven cards with no way through them is a
                   list, not an index: a reader who arrived for one project
                   had to scroll for it, and one who wanted "everything on
                   Dwarka Expressway under 3 Cr" could not ask at all. ── */}
            {/* STICKY, because the hero fills a phone screen on its own: the
                search sat about 1,700px down a page whose entire job is
                finding one project among ninety-seven, and it scrolled away
                the moment you started looking. It now follows the grid.
                The negative margins let the bar's background run to the
                full page width while its contents stay on the text column. */}
            <div className={`sticky top-[57px] z-30 -mx-6 mt-4 flex flex-col gap-3 border-b border-[#1a1a1a]/[0.06] bg-[#F5F0E8]/95 px-6 py-3 backdrop-blur-sm md:-mx-10 md:px-10 ${facetFilters ? "" : "sm:flex-row sm:items-center"}`}>
              <div className="relative flex-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/30">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="search"
                  placeholder="Search project, developer, sector or corridor"
                  aria-label="Search projects"
                  className="w-full rounded-md border border-[#1a1a1a]/[0.14] bg-white py-3 pl-10 pr-3 text-[0.9rem] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/30 focus:border-[#c9a96e]"
                />
              </div>
              {/* The catalogue's facet row — one line that scrolls sideways
                  on a phone rather than five selects stacked a screen tall.
                  Every option carries its live count, faceted against the
                  other active filters, so the dropdown answers "what
                  happens if I pick this" before it is picked. */}
              {facetFilters && facets ? (
                <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                  <Facet label="Corridor" value={corridor ?? ""} all={facets.corridor.all} items={facets.corridor.items} onChange={(v) => setCorridor(v || null)} />
                  <Facet label="Budget · entry" value={budget} all={facets.budget.all} items={facets.budget.items} onChange={setBudget} />
                  <Facet label="Configuration" value={config} all={facets.config.all} items={facets.config.items} onChange={setConfig} />
                  <Facet label="Expected ROI · 8-yr CAGR" value={roi} all={facets.roi.all} items={facets.roi.items} onChange={setRoi} />
                  <label className="flex shrink-0 flex-col gap-1">
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[#1a1a1a]/40">Sort</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as Sort)}
                      aria-label="Sort projects"
                      className="rounded-md border border-[#1a1a1a]/[0.14] bg-white px-3 py-2.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-[#c9a96e]"
                    >
                      {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </label>
                </div>
              ) : (
                /* Landers hide the sort: the default order is already the
                    Truth Score, which is the page's whole argument — a
                    control that re-orders the ranking is catalogue
                    furniture, not landing-page furniture. */
                !dense && (
                <label className="flex shrink-0 items-center gap-2 text-[0.72rem] font-light text-[#1a1a1a]/40">
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    aria-label="Sort projects"
                    className="rounded-md border border-[#1a1a1a]/[0.14] bg-white px-3 py-3 text-[0.84rem] text-[#1a1a1a] outline-none focus:border-[#c9a96e]"
                  >
                    {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </label>
                )
              )}
            </div>

            {/* One row that scrolls sideways on a phone rather than two that
                wrap — eight corridors stacked would push the grid another
                40px down every screen. In facet mode the corridor chips are
                gone: the corridor lives in its dropdown. */}
            {priceChips ? (
              priceChips.labels.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                  <Chip on={bucket == null} onClick={() => setBucket(null)}>All prices<Count n={projects.length} /></Chip>
                  {priceChips.labels.map(({ label, count }) => (
                    <Chip key={label} on={bucket === label} onClick={() => setBucket(bucket === label ? null : label)}>{label}<Count n={count} /></Chip>
                  ))}
                </div>
              )
            ) : !facetFilters && corridors.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                <Chip on={corridor == null} onClick={() => setCorridor(null)}>All corridors<Count n={projects.length} /></Chip>
                {corridors.map(([c, n]) => (
                  <Chip key={c} on={corridor === c} onClick={() => setCorridor(corridor === c ? null : c)}>{c}<Count n={n} /></Chip>
                ))}
              </div>
            )}

            {facetFilters ? (
              <>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.76rem] font-light text-[#1a1a1a]/45" aria-live="polite">
                  <span>
                    {shown.length === projects.length
                      ? `Showing all ${projects.length} scored projects`
                      : `${shown.length} of ${projects.length} projects`}
                  </span>
                  {DIMS.filter((d) => dimValues[d]).map((d) => (
                    <button
                      key={d}
                      onClick={() => (d === "corridor" ? setCorridor(null) : d === "budget" ? setBudget("") : d === "config" ? setConfig("") : setRoi(""))}
                      className="rounded-full border border-[#9a7a2e]/40 bg-[#c9a96e]/10 px-3 py-1 text-[0.72rem] text-[#9a7a2e] transition-colors hover:border-[#9a7a2e]/70"
                    >
                      {dimLabel[d](dimValues[d])} <span className="opacity-55">✕</span>
                    </button>
                  ))}
                  {filtered && (
                    <button onClick={clearAll} className="text-[#9a7a2e] underline-offset-2 hover:underline">Clear all</button>
                  )}
                </div>
                {/* The mesh line — when this exact cut of the universe has a
                    permanent lander, say so. The catalogue feeds the SEO
                    pages instead of competing with them. */}
                {meshHit && (
                  <p className="mt-2 text-[0.78rem] font-light text-[#1a1a1a]/55">
                    Permanent page for this search →{" "}
                    <a href={`${basePath}/apartments/${meshHit.s}`} className="text-[#9a7a2e] underline underline-offset-[3px] transition-colors hover:text-[#1a1a1a]">
                      {meshHit.h}
                    </a>
                  </p>
                )}
              </>
            ) : (
            <p className="mt-5 text-[0.76rem] font-light text-[#1a1a1a]/45" aria-live="polite">
              {shown.length === projects.length
                ? `Showing all ${projects.length} scored projects`
                : `${shown.length} of ${projects.length} projects`}
              {filtered && shown.length > 0 && (
                <button onClick={clearAll} className="ml-3 text-[#9a7a2e] underline-offset-2 hover:underline">Clear</button>
              )}
            </p>
            )}

            {shown.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((p, i) => (
                  <React.Fragment key={p.slug}>
                    {feedSlot && i === Math.min(feedSlot.after, shown.length - 1) && feedSlot.node}
                    <ProjectOptionCard p={p} />
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-[#1a1a1a]/8 bg-white/60 px-6 py-10 text-center">
                <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]/75">
                  {q.trim() ? <>Nothing matches “{q}”</> : <>Nothing matches</>}
                  {corridor ? ` in ${corridor}` : ""}{bucket ? ` at ${bucket}` : ""}
                  {budget || config || roi ? " with these filters" : ""}.
                </p>
                <p className="mx-auto mt-2 max-w-md text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/45">
                  We track {projects.length} scored projects across {corridors.length} corridors. Try a developer name, a sector number, or clear the filters.
                </p>
                <button onClick={clearAll} className="mt-5 rounded-sm border border-[#1a1a1a]/15 px-5 py-2.5 text-[0.78rem] font-light text-[#1a1a1a]/65 transition-colors hover:border-[#1a1a1a]/35">
                  Show every project
                </button>
              </div>
            )}

            <p className="mt-6 text-[0.68rem] font-light text-[#1a1a1a]/40">
              Scores computed by our pipeline from public filings — refreshed with every deploy, shown as scored and unedited. Deep files follow as each project clears review.
            </p>
          </>
        ) : (
          <p className="mt-6 text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/55">
            Live project files are refreshing from the pipeline — please check back shortly.
          </p>
        )}
      </div>
    </div>
  );
}

/* One labelled facet dropdown. The label sits ABOVE the control so five of
   them share a baseline (the founder's alignment note on the mock), and
   each option prints its live count. */
function Facet({
  label,
  value,
  all,
  items,
  onChange,
}: {
  label: string;
  value: string;
  all: number;
  items: { k: string; l: string; n: number }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex shrink-0 flex-col gap-1">
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[#1a1a1a]/40">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Filter by ${label}`}
        className="rounded-md border border-[#1a1a1a]/[0.14] bg-white px-3 py-2.5 text-[0.8rem] text-[#1a1a1a] outline-none focus:border-[#c9a96e]"
      >
        <option value="">All ({all})</option>
        {items.map((it) => (
          <option key={it.k} value={it.k}>{it.l} ({it.n})</option>
        ))}
      </select>
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.74rem] transition-colors ${
        on ? "border-[#1e6b45]/35 bg-[#1e6b45]/[0.08] text-[#1e6b45]" : "border-[#1a1a1a]/12 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/28 hover:text-[#1a1a1a]/80"
      }`}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 font-mono text-[0.64rem] opacity-50">{n}</span>;
}

function Stat({ v, k }: { v: string; k: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-mono text-[1.2rem] text-[#1a1a1a]">{v}</span>
      <span className="text-[0.74rem] font-light text-[#1a1a1a]/40">{k}</span>
    </div>
  );
}
