"use client";

/* ────────────────────────────────────────────────────────────────────────
   Hero search — the input plus its focus / results / no-match dropdown.

   Lives beneath the hero's existing search field (visuals unchanged). A
   full ARIA combobox: the input owns aria-expanded / aria-activedescendant,
   the panel is a listbox, each row an option. Arrow keys move the highlight,
   Enter selects, Escape closes, Tab closes. Selecting a project navigates
   straight to its free verdict page; a no-match routes to the custom-report
   enquiry and logs a demand signal.

   Every verdict and source count comes from the build-time index (see
   lib/omniIndex.ts). Nothing here fabricates data.
   ──────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useConsultation } from "./consultation/ConsultationProvider";
import type { OmniIndex, OmniProject, Verdict3 } from "@/lib/omni";
import {
  fuzzySearch, highlightName, topSearched, coveredNearby, coveredCountLabel,
  rowMeta, VERDICT_CHIP, getRecentSlugs, pushRecentSlug, pushDemand,
} from "@/lib/heroSearch";

const basePath = "/Truth-Estate";
const DEBOUNCE_MS = 150;

type NavItem =
  | { kind: "project"; p: OmniProject }
  | { kind: "action"; action: "report" | "prioritise" };

function VerdictChip({ v }: { v: Verdict3 }) {
  const s = VERDICT_CHIP[v];
  return (
    <span
      className="shrink-0 rounded-[11px] px-2 py-[3px] text-[10.5px] font-medium leading-none"
      style={{ color: s.text, border: `0.5px solid ${s.border}` }}
    >
      {v}
    </span>
  );
}

export default function HeroSearch({ index }: { index: OmniIndex }) {
  const { openConsult } = useConsultation();
  const projects = index.projects;

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [prioritised, setPrioritised] = useState(false);
  const [placeholder, setPlaceholder] = useState("Search any Gurugram project");

  const inputRef = useRef<HTMLInputElement>(null);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const panelId = `${uid}-panel`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  /* shorter placeholder on phones so it never truncates (matches prior hero) */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPlaceholder(mq.matches ? "Search any project" : "Search any Gurugram project");
    const id = requestAnimationFrame(apply);
    mq.addEventListener("change", apply);
    return () => { cancelAnimationFrame(id); mq.removeEventListener("change", apply); };
  }, []);

  /* recent searches hydrate after mount (avoids SSR mismatch) */
  useEffect(() => { setRecentSlugs(getRecentSlugs()); }, []);

  /* debounce the query that drives results */
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const q = debounced;
  const typing = q.length >= 2;
  const results = useMemo(() => (typing ? fuzzySearch(q, projects, 6) : []), [q, typing, projects]);
  const state: 1 | 2 | 3 = !typing ? 1 : results.length > 0 ? 2 : 3;

  const recentProjects = useMemo(
    () => recentSlugs.map((s) => projects.find((p) => p.slug === s)).filter((p): p is OmniProject => !!p),
    [recentSlugs, projects],
  );
  const mostSearched = useMemo(() => {
    const seen = new Set(recentProjects.map((p) => p.slug));
    return topSearched(projects.filter((p) => !seen.has(p.slug)), 6);
  }, [projects, recentProjects]);
  const nearby = useMemo(() => (state === 3 ? coveredNearby(q, projects, 3) : []), [state, q, projects]);

  /* flat, ordered list of arrow-navigable items — indices align with optId() */
  const navItems: NavItem[] = useMemo(() => {
    if (state === 1) return [...recentProjects, ...mostSearched].map((p) => ({ kind: "project", p }) as NavItem);
    if (state === 2) return results.map((p) => ({ kind: "project", p }) as NavItem);
    return [
      { kind: "action", action: "report" },
      ...(prioritised ? [] : [{ kind: "action", action: "prioritise" } as NavItem]),
      ...nearby.map((p) => ({ kind: "project", p }) as NavItem),
    ];
  }, [state, recentProjects, mostSearched, results, nearby, prioritised]);

  /* reset highlight + inline confirm when the query context changes */
  useEffect(() => { setActive(-1); }, [q, state]);
  useEffect(() => { setPrioritised(false); }, [q]);

  /* keep the highlighted option in view */
  useEffect(() => {
    if (open && active >= 0) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
  }, [active, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((p: OmniProject) => {
    pushRecentSlug(p.slug);
    window.location.href = `${basePath}/intelligence/projects/${p.slug}`;
  }, []);
  const requestReport = useCallback(() => {
    openConsult({ sourceKind: "homepage", source: (query.trim() || q), intent: "research" });
    setOpen(false);
  }, [openConsult, query, q]);
  const prioritise = useCallback(() => { pushDemand(query.trim() || q); setPrioritised(true); }, [query, q]);

  const activate = useCallback((item: NavItem) => {
    if (item.kind === "project") go(item.p);
    else if (item.action === "report") requestReport();
    else prioritise();
  }, [go, requestReport, prioritise]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    const hits = fuzzySearch(term, projects, 1);
    if (hits.length) go(hits[0]); else requestReport();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = navItems.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((a) => (n ? (a + 1) % n : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((a) => (n ? (a <= 0 ? n - 1 : a - 1) : -1));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && navItems[active]) { e.preventDefault(); activate(navItems[active]); }
      /* otherwise let the form submit (Get verdict) run */
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); setOpen(false); setActive(-1); }
    }
    /* Tab: default — focus leaves and onBlur closes */
  };

  const onFocus = () => {
    setOpen(true);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      // bring the input toward the top so the on-screen keyboard can't hide results
      requestAnimationFrame(() => inputRef.current?.scrollIntoView({ block: "start", behavior: "auto" }));
    }
  };
  const onBlur = () => { setOpen(false); setActive(-1); };

  const announce =
    state === 1 ? "Showing most searched projects."
    : state === 2 ? `${results.length} result${results.length === 1 ? "" : "s"} for ${q}.`
    : `No coverage yet for ${q}. Request a custom report, or view covered projects nearby.`;

  const hasPanel = state === 1 ? navItems.length > 0 : true;
  const showPanel = open && hasPanel;

  /* a project result / suggestion row */
  const ProjectRow = ({ p, i, doHighlight }: { p: OmniProject; i: number; doHighlight: boolean }) => {
    const segs = doHighlight ? highlightName(p.name, q) : [{ t: p.name, hit: false }];
    const meta = rowMeta(p);
    return (
      <li
        id={optId(i)}
        role="option"
        aria-selected={active === i}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActive(i)}
        onClick={() => go(p)}
        className={`flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-2 ${active === i ? "bg-[#e5dcc5]" : ""}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[16px] leading-tight text-[#1f1b12]">
            {segs.map((s, k) => (s.hit ? <b key={k} className="font-semibold">{s.t}</b> : <span key={k}>{s.t}</span>))}
          </span>
          {meta && <span className="mt-0.5 block truncate text-[11px] text-[#7c7364]">{meta}</span>}
        </span>
        {p.verdict && <VerdictChip v={p.verdict} />}
      </li>
    );
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <li role="presentation" className="px-4 pb-1.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[#8b8067]">
      {children}
    </li>
  );

  return (
    <div className="relative w-full max-w-[430px]">
      {/* search field — visuals preserved from the prior hero */}
      <form
        onSubmit={submit}
        role="search"
        className="flex h-[50px] w-full max-w-[420px] rounded-lg ring-1 ring-transparent transition-shadow duration-150 focus-within:ring-[#a07d2c] md:h-[52px]"
      >
        <label htmlFor="hero-search" className="sr-only">Search any Gurugram project</label>
        <div className="flex flex-1 items-center gap-2 rounded-l-lg bg-[#efe9dc] pl-3 md:gap-3 md:pl-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a6f56" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" className="shrink-0"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" /></svg>
          <input
            ref={inputRef}
            id="hero-search"
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={panelId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && active >= 0 ? optId(active) : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="h-full w-full min-w-0 bg-transparent pr-2 text-[13px] text-[#2a2318] placeholder:text-[#7a6f56] focus:outline-none min-[360px]:text-[15px]"
          />
        </div>
        <button type="submit" className="shrink-0 rounded-r-lg bg-[#2f6b4f] px-4 text-[13px] font-medium text-[#f6f1e8] transition-colors duration-150 hover:bg-[#285c44] min-[360px]:text-[15px] md:px-5">
          Get verdict
        </button>
      </form>

      {/* dropdown panel: in-flow on mobile (pushes content down), overlay on desktop */}
      {showPanel && (
        <ul
          id={panelId}
          role="listbox"
          aria-label="Project search"
          onMouseDown={(e) => e.preventDefault()}
          className="teh-search-panel mt-[7px] max-h-[min(66vh,440px)] w-full overflow-y-auto overscroll-contain rounded-lg bg-[#efe9dc] md:absolute md:left-0 md:top-full md:z-40"
          style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}
        >
          {/* ── State 1: nothing typed ── */}
          {state === 1 && (
            <>
              {recentProjects.length > 0 && <Label>Recent</Label>}
              {recentProjects.map((p, i) => <ProjectRow key={`r-${p.slug}`} p={p} i={i} doHighlight={false} />)}
              {mostSearched.length > 0 && <Label>Most searched</Label>}
              {mostSearched.map((p, k) => <ProjectRow key={`m-${p.slug}`} p={p} i={recentProjects.length + k} doHighlight={false} />)}
              <li role="presentation" className="border-t px-4 py-2.5 text-[11px] text-[#8b8067]" style={{ borderTopWidth: "0.5px", borderTopColor: "#d8cfb8" }}>
                {coveredCountLabel(projects)}
              </li>
            </>
          )}

          {/* ── State 2: matches found ── */}
          {state === 2 && results.map((p, i) => <ProjectRow key={p.slug} p={p} i={i} doHighlight />)}

          {/* ── State 3: no match — never an empty state ── */}
          {state === 3 && (
            <>
              <li role="presentation" className="px-4 pb-1 pt-3.5 text-[13px] leading-snug text-[#4d4535]">
                We haven&rsquo;t covered <b className="font-semibold">{q}</b> yet.
              </li>
              <li role="presentation" className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-3.5 pt-2.5">
                <button
                  type="button"
                  id={optId(0)}
                  role="option"
                  aria-selected={active === 0}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(0)}
                  onClick={requestReport}
                  className={`inline-flex min-h-[40px] items-center rounded-md bg-[#2f6b4f] px-3.5 text-[13px] font-medium text-[#f6f1e8] transition-colors duration-150 hover:bg-[#285c44] ${active === 0 ? "ring-2 ring-[#2f6b4f]/35" : ""}`}
                >
                  Request a custom report
                </button>
                {prioritised ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-[#6b6252]" aria-live="polite">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                    We&rsquo;ll prioritise it.
                  </span>
                ) : (
                  <button
                    type="button"
                    id={optId(1)}
                    role="option"
                    aria-selected={active === 1}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(1)}
                    onClick={prioritise}
                    className={`text-[13px] text-[#6b6252] underline underline-offset-2 transition-colors hover:text-[#4d4535] ${active === 1 ? "text-[#4d4535]" : ""}`}
                  >
                    Prioritise it for me
                  </button>
                )}
              </li>
              {nearby.length > 0 && (
                <>
                  <li role="presentation" className="border-t px-4 pb-1.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[#8b8067]" style={{ borderTopWidth: "0.5px", borderTopColor: "#d8cfb8" }}>
                    Covered nearby
                  </li>
                  {nearby.map((p, k) => <ProjectRow key={`n-${p.slug}`} p={p} i={(prioritised ? 1 : 2) + k} doHighlight={false} />)}
                </>
              )}
            </>
          )}
        </ul>
      )}

      {/* screen-reader announcement of result changes */}
      <div className="sr-only" role="status" aria-live="polite">{showPanel ? announce : ""}</div>
    </div>
  );
}
