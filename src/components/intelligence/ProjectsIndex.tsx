"use client";

import React, { useEffect, useMemo, useState } from "react";
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
}) {
  const { open } = useJourney();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("score");
  const [corridor, setCorridor] = useState<string | null>(null);
  const [bucket, setBucket] = useState<string | null>(null);
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

  const shown = useMemo(() => {
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
    if (corridor) out = out.filter((x) => (x.p.marketShort || x.p.market) === corridor);
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
  }, [indexed, q, corridor, sort, devFilter, bucket, priceChips]);

  const filtered = q.trim() !== "" || corridor != null || bucket != null;
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
            <div className="sticky top-[57px] z-30 -mx-6 mt-4 flex flex-col gap-3 border-b border-[#1a1a1a]/[0.06] bg-[#F5F0E8]/95 px-6 py-3 backdrop-blur-sm sm:flex-row sm:items-center md:-mx-10 md:px-10">
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
              {/* Landers hide the sort: the default order is already the
                  Truth Score, which is the page's whole argument — a
                  control that re-orders the ranking is catalogue
                  furniture, not landing-page furniture. */}
              {!dense && (
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
              )}
            </div>

            {/* One row that scrolls sideways on a phone rather than two that
                wrap — eight corridors stacked would push the grid another
                40px down every screen. */}
            {priceChips ? (
              priceChips.labels.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                  <Chip on={bucket == null} onClick={() => setBucket(null)}>All prices<Count n={projects.length} /></Chip>
                  {priceChips.labels.map(({ label, count }) => (
                    <Chip key={label} on={bucket === label} onClick={() => setBucket(bucket === label ? null : label)}>{label}<Count n={count} /></Chip>
                  ))}
                </div>
              )
            ) : corridors.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                <Chip on={corridor == null} onClick={() => setCorridor(null)}>All corridors<Count n={projects.length} /></Chip>
                {corridors.map(([c, n]) => (
                  <Chip key={c} on={corridor === c} onClick={() => setCorridor(corridor === c ? null : c)}>{c}<Count n={n} /></Chip>
                ))}
              </div>
            )}

            <p className="mt-5 text-[0.76rem] font-light text-[#1a1a1a]/45" aria-live="polite">
              {shown.length === projects.length
                ? `Showing all ${projects.length} scored projects`
                : `${shown.length} of ${projects.length} projects`}
              {filtered && shown.length > 0 && (
                <button onClick={() => { setQ(""); setCorridor(null); setBucket(null); }} className="ml-3 text-[#9a7a2e] underline-offset-2 hover:underline">Clear</button>
              )}
            </p>

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
                <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]/75">Nothing matches “{q}”{corridor ? ` in ${corridor}` : ""}{bucket ? ` at ${bucket}` : ""}.</p>
                <p className="mx-auto mt-2 max-w-md text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/45">
                  We track {projects.length} scored projects across {corridors.length} corridors. Try a developer name, a sector number, or clear the filters.
                </p>
                <button onClick={() => { setQ(""); setCorridor(null); setBucket(null); }} className="mt-5 rounded-sm border border-[#1a1a1a]/15 px-5 py-2.5 text-[0.78rem] font-light text-[#1a1a1a]/65 transition-colors hover:border-[#1a1a1a]/35">
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
