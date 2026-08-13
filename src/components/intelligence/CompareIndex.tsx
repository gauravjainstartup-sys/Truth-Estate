"use client";

import { useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { basePath, homeHref } from "@/lib/site";
import {
  COMPARE_OPTIONS,
  POPULAR_COMPARISONS,
  comparePairSlug,
  type CompareKind,
  type ProjectCompareOption,
} from "@/lib/compare";
import TypeAhead, { type TAItem } from "./TypeAhead";
import SearchPalette from "./SearchPalette";


const KIND_LABEL: Record<CompareKind, string> = { project: "Projects", developer: "Developers", market: "Markets" };

type PopularEntry = { label: string; pair: string; kind: CompareKind; scores?: [number, number] };

export default function CompareIndex({ projectOptions, prerenderedPairs }: { projectOptions: ProjectCompareOption[]; prerenderedPairs: string[] }) {
  const { open } = useJourney();

  // real projects (live scored set) + curated developer/market registries
  const OPTS: Record<CompareKind, { slug: string; name: string }[]> = {
    project: projectOptions,
    developer: COMPARE_OPTIONS.developer,
    market: COMPARE_OPTIONS.market,
  };
  // The EXACT set of project pairs prerendered as static pages — the high-intent
  // filter from generateStaticParams (same developer / same corridor / both
  // top-tier / close price) plus the demand-proven indexable pairs. Any pair
  // outside this set has no static page and is rendered client-side on
  // /intelligence/compare/live instead of 404ing on the static export.
  const prerenderedPairSet = new Set(prerenderedPairs);
  // start on Projects when we have a live set to compare; else fall back
  const initialKind: CompareKind = projectOptions.length >= 2 ? "project" : "developer";

  const [kind, setKind] = useState<CompareKind>(initialKind);
  const opts = OPTS[kind];
  const [a, setA] = useState(OPTS[initialKind][0]?.slug ?? "");
  const [b, setB] = useState(OPTS[initialKind][1]?.slug ?? "");

  const switchKind = (k: CompareKind) => {
    setKind(k);
    setA(OPTS[k][0]?.slug ?? "");
    setB(OPTS[k][1]?.slug ?? "");
  };
  const swap = () => { setA(b); setB(a); };

  // the active tab's list as type-ahead items (Truth Score rides along for projects)
  const items: TAItem[] = opts.map((o) => {
    const score = (o as Partial<ProjectCompareOption>).score;
    return typeof score === "number" ? { id: o.slug, name: o.name, score } : { id: o.slug, name: o.name };
  });

  const go = () => {
    if (!a || !b || a === b) return;
    // a project pair outside the prerendered cap has no static page — render it
    // live from the compare index instead of 404ing on the static export.
    if (kind === "project" && !prerenderedPairSet.has(comparePairSlug(a, b))) {
      window.location.href = `${basePath}/intelligence/compare/live?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
      return;
    }
    window.location.href = `${basePath}/intelligence/compare/${comparePairSlug(a, b)}`;
  };

  // popular project pairs come from the top of the live scored set; the
  // developer/market ones are curated. Both are real — no sample data.
  const popularProjects: PopularEntry[] = [[0, 1], [2, 3], [0, 2]]
    .filter(([i, j]) => projectOptions[i] && projectOptions[j])
    .map(([i, j]) => {
      const [x, y] = [projectOptions[i], projectOptions[j]];
      return {
        label: `${x.name} vs ${y.name}`,
        pair: comparePairSlug(x.slug, y.slug),
        kind: "project" as const,
        scores: [x.score, y.score] as [number, number],
      };
    });
  const popular: PopularEntry[] = [...popularProjects, ...POPULAR_COMPARISONS].slice(0, 6);

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

      <div className="mx-auto max-w-7xl px-6 pb-[14vh] pt-6 md:px-10 md:pt-[7vh]">
        <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
          <a href={`${basePath}/intelligence`} className="transition-colors hover:text-[#1a1a1a]/70">Intelligence</a>
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">Compare</span>
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e] md:mt-8">Comparative Intelligence</p>
        <h1 className="mt-3 max-w-2xl font-serif text-[2rem] font-medium leading-[1.05] tracking-[-0.02em] md:mt-5 md:text-[4rem]">Compare anything, side by side.</h1>
        <p className="mt-4 max-w-2xl text-[0.92rem] font-light leading-[1.6] text-[#1a1a1a]/60 md:mt-6 md:text-[1.05rem] md:leading-[1.85]">
          {/* a tight one-liner on mobile keeps the picker in the first screen; the full intro shows from md up */}
          <span className="md:hidden">Two projects, developers or markets — measured on the same evidence. No spin, no sponsored winner.</span>
          <span className="hidden md:inline">Two projects, two developers or two markets — measured on the same evidence. Score anatomy against score anatomy, delivery against delivery, price against price. No spin, no sponsored winner.</span>
        </p>

        {/* Picker */}
        <div className="mt-6 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-5 md:mt-10 md:p-9">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(KIND_LABEL) as CompareKind[]).map((k) => (
              <button key={k} onClick={() => switchKind(k)}
                className={`rounded-full border px-4 py-2 text-[0.76rem] font-medium tracking-[0.02em] transition-colors ${kind === k ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/15 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/30"}`}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="mt-5 grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr] md:mt-6">
            <label className="block">
              <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">First</span>
              <div className="mt-2">
                <TypeAhead
                  items={items}
                  value={a}
                  onPick={(it) => setA(it.id)}
                  placeholder={`Search ${KIND_LABEL[kind].toLowerCase()}…`}
                  ariaLabel={`First ${KIND_LABEL[kind].slice(0, -1).toLowerCase()}`}
                />
              </div>
            </label>
            <button
              type="button"
              onClick={swap}
              aria-label="Swap the two sides"
              title="Swap"
              className="hidden h-11 w-11 shrink-0 items-center justify-center self-end rounded-full border border-[#1a1a1a]/15 text-[#1a1a1a]/45 transition-colors hover:border-[#c9a96e] hover:text-[#1e6b45] sm:flex"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4L3 8l4 4" /><path d="M3 8h14" /><path d="M17 20l4-4-4-4" /><path d="M21 16H7" /></svg>
            </button>
            <label className="block">
              <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Second</span>
              <div className="mt-2">
                <TypeAhead
                  items={items}
                  value={b}
                  onPick={(it) => setB(it.id)}
                  placeholder={`Search ${KIND_LABEL[kind].toLowerCase()}…`}
                  ariaLabel={`Second ${KIND_LABEL[kind].slice(0, -1).toLowerCase()}`}
                />
              </div>
            </label>
          </div>

          <div className="mt-5 flex items-center gap-4 md:mt-6">
            <button onClick={go} disabled={!a || !b || a === b}
              className="rounded-sm bg-[#1e6b45] px-8 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] disabled:opacity-30">
              Compare &rarr;
            </button>
            {a === b && <span className="text-[0.78rem] font-light text-[#1a1a1a]/40">Pick two different {KIND_LABEL[kind].toLowerCase()}.</span>}
          </div>
        </div>

        {/* Popular */}
        {popular.length > 0 && (
          <>
            <h2 className="mt-16 font-serif text-[1.6rem] font-medium tracking-[-0.01em] md:text-[2rem]">Popular comparisons</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {popular.map((c) => (
                <a key={c.pair} href={`${basePath}/intelligence/compare/${c.pair}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-[#1a1a1a]/8 bg-white/55 px-6 py-4 transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/80">
                  <div className="min-w-0">
                    <span className="font-serif text-[1.02rem] font-light text-[#1a1a1a]/75">{c.label}</span>
                    <span className="ml-3 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[#1a1a1a]/30">{KIND_LABEL[c.kind].slice(0, -1)}</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-3">
                    {c.scores && (
                      <span className="font-mono text-[0.72rem] tabular-nums text-[#1e6b45]">{c.scores[0]} · {c.scores[1]}</span>
                    )}
                    <span className="text-[#1a1a1a]/20 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
