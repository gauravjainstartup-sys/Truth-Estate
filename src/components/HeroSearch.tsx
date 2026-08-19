"use client";

/* ────────────────────────────────────────────────────────────────────────
   Hero search — the input plus its results surface.

   Two surfaces, one brain:
   • Desktop (≥768px): a dropdown attached under the input. Default list capped
     so the whole panel (incl. the coverage footer) sits above the fold; panel
     is opaque and raised above the hero's trust chips.
   • Mobile (<768px): the input is a trigger that opens a dedicated full-screen
     search view (portalled to <body>), so the hero can't scroll or bleed
     through behind it and the on-screen keyboard never hides the last row.

   Verdict chips and source counts come straight from the build-time index and
   are rendered unchanged. The default (nothing-typed) list is diversified
   across developers (lib/heroSearch.defaultList); typed results are pure
   relevance (fuzzySearch).
   ──────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { scoreTag, type OmniIndex, type OmniProject, type ScoreTag } from "@/lib/omni";
import {
  fuzzySearch, highlightName, defaultList, coveredNearby, coveredCountLabel,
  rowMeta, TAG_CHIP, getRecentSlugs, pushRecentSlug, pushDemand,
  searchDevelopers, type DevRow,
} from "@/lib/heroSearch";
import { projectHref } from "@/lib/projectHref";
import { basePath } from "@/lib/site";
import { track } from "@/lib/events";

const DEBOUNCE_MS = 150;
const MOBILE_MQ = "(max-width: 767px)";

/* Developer dossiers come from the SAME /search-index.json the project-page
   palette reads — fetched once, lazily, on first open and cached for the tab. */
let devIndexCache: DevRow[] | null = null;

type NavItem =
  | { kind: "project"; p: OmniProject }
  | { kind: "developer"; d: DevRow }
  | { kind: "action"; action: "report" };

/* Truth Score chip — the score number, then the canonical tag pill (layout B). */
function ScoreTagChip({ score, tag }: { score: number; tag: ScoreTag }) {
  const s = TAG_CHIP[tag];
  return (
    <span className="flex shrink-0 items-center gap-2" style={{ color: s.text }}>
      <b className="text-[13px] font-bold tabular-nums leading-none">{score}</b>
      <span className="rounded-[11px] px-2 py-[3px] text-[10.5px] font-medium leading-none" style={{ border: `0.5px solid ${s.border}` }}>
        {tag}
      </span>
    </span>
  );
}

export default function HeroSearch({ index }: { index: OmniIndex }) {
  const projects = index.projects;

  const [devs, setDevs] = useState<DevRow[]>(() => devIndexCache ?? []);
  const [devsLoaded, setDevsLoaded] = useState<boolean>(devIndexCache != null);
  const devFetchedRef = useRef(false);
  /* Lazy, once-per-tab: pull the developer dossiers from the shared search
     index the first time the panel opens, so the resting page pays nothing.
     A non-OK/failed fetch leaves the cache null and clears the guard so the
     next open retries — never caches an empty list as if it were the answer. */
  const ensureDevs = useCallback(() => {
    if (devIndexCache) { setDevs(devIndexCache); setDevsLoaded(true); return; }
    if (devFetchedRef.current) return;
    devFetchedRef.current = true;
    fetch(`${basePath}/search-index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) { devFetchedRef.current = false; return; }
        const list = Array.isArray(j.d) ? (j.d as DevRow[]) : [];
        devIndexCache = list;
        setDevs(list);
        setDevsLoaded(true);
      })
      .catch(() => { devFetchedRef.current = false; });
  }, []);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);          // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // mobile full-screen view
  const [isMobile, setIsMobile] = useState(false);
  const [active, setActive] = useState(-1);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [placeholder, setPlaceholder] = useState("Search any Gurugram project");
  const [vvh, setVvh] = useState<number | null>(null); // visual-viewport height

  const triggerRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const searchStartedRef = useRef(false);
  const searchLoggedRef = useRef(""); // last settled query we logged a result for
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const panelId = `${uid}-panel`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  /* Analytics — fire once when the visitor first engages the home search:
     the first character typed, or the mobile search surface opened. */
  const markSearchStarted = useCallback(() => {
    if (searchStartedRef.current) return;
    searchStartedRef.current = true;
    track("search_started", { props: { source: "home" } });
  }, []);

  /* breakpoint + responsive placeholder */
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => {
      setIsMobile(mq.matches);
      setPlaceholder(mq.matches ? "Search any project" : "Search any Gurugram project");
    };
    const id = requestAnimationFrame(apply);
    mq.addEventListener("change", apply);
    return () => { cancelAnimationFrame(id); mq.removeEventListener("change", apply); };
  }, []);

  useEffect(() => { setRecentSlugs(getRecentSlugs()); }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const q = debounced;
  const typing = q.length >= 2;
  const results = useMemo(() => (typing ? fuzzySearch(q, projects, 6) : []), [q, typing, projects]);
  const devResults = useMemo(() => (typing ? searchDevelopers(q, devs, 3) : []), [q, typing, devs]);
  /* While the developer index is still loading, a no-project query is not yet
     "no coverage" — a matching developer may be about to appear — so hold in
     state 2 (which renders a "Searching…" row) rather than flashing state 3. */
  const state: 1 | 2 | 3 = !typing ? 1 : results.length > 0 || devResults.length > 0 ? 2 : devsLoaded ? 3 : 2;

  const variant: "mobile" | "desktop" = mobileOpen ? "mobile" : "desktop";
  const recentLimit = variant === "mobile" ? 4 : 3;
  const totalDefault = variant === "mobile" ? 8 : 5; // desktop: whole panel stays above the fold

  const recentProjects = useMemo(
    () => recentSlugs.map((s) => projects.find((p) => p.slug === s)).filter((p): p is OmniProject => !!p).slice(0, recentLimit),
    [recentSlugs, projects, recentLimit],
  );
  const mostList = useMemo(() => {
    const seen = new Set(recentProjects.map((p) => p.slug));
    const room = Math.max(0, totalDefault - recentProjects.length);
    return defaultList(projects.filter((p) => !seen.has(p.slug)), room);
  }, [projects, recentProjects, totalDefault]);
  const nearby = useMemo(() => (state === 3 ? coveredNearby(q, projects, 3) : []), [state, q, projects]);

  const navItems: NavItem[] = useMemo(() => {
    if (state === 1) return [...recentProjects, ...mostList].map((p) => ({ kind: "project", p }) as NavItem);
    if (state === 2) return [
      ...results.map((p) => ({ kind: "project", p }) as NavItem),
      ...devResults.map((d) => ({ kind: "developer", d }) as NavItem),
    ];
    return [
      { kind: "action", action: "report" },
      ...nearby.map((p) => ({ kind: "project", p }) as NavItem),
    ];
  }, [state, recentProjects, mostList, results, devResults, nearby]);

  useEffect(() => { setActive(-1); }, [q, state, variant]);

  /* Analytics — one event per SETTLED query (`q` is already debounced), with
     the hit count, and a distinct search_no_results when a real query matched
     nothing. Held until the result is FINAL: a zero-project query waits for the
     developer index (else a match about to appear would read as a miss). This is
     what makes "failed search → bounce" measurable — see events.ts. */
  useEffect(() => {
    if (!typing) return;
    const hits = results.length + devResults.length;
    const settled = hits > 0 || devsLoaded;
    if (!settled || searchLoggedRef.current === q) return;
    searchLoggedRef.current = q;
    track("search_performed", { props: { source: "home", query: q, hits } });
    if (hits === 0) track("search_no_results", { props: { source: "home", query: q } });
  }, [q, typing, results.length, devResults.length, devsLoaded]);

  useEffect(() => {
    if (active >= 0) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── mobile overlay lifecycle: scroll lock (position preserved) + focus + keyboard-aware height ── */
  useEffect(() => {
    if (!mobileOpen) return;
    const y = window.scrollY;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const vv = window.visualViewport;
    const applyH = () => setVvh(vv ? Math.round(vv.height) : window.innerHeight);
    applyH();
    vv?.addEventListener("resize", applyH);
    vv?.addEventListener("scroll", applyH);
    window.addEventListener("resize", applyH);

    const fid = requestAnimationFrame(() => overlayInputRef.current?.focus());

    return () => {
      body.style.overflow = prevOverflow;
      window.scrollTo(0, y); // return to the exact hero position, no shift
      vv?.removeEventListener("resize", applyH);
      vv?.removeEventListener("scroll", applyH);
      window.removeEventListener("resize", applyH);
      cancelAnimationFrame(fid);
      setVvh(null);
    };
  }, [mobileOpen]);

  const openMobile = useCallback(() => { triggerRef.current?.blur(); setMobileOpen(true); markSearchStarted(); ensureDevs(); }, [markSearchStarted, ensureDevs]);
  const closeMobile = useCallback(() => { setMobileOpen(false); setQuery(""); setActive(-1); }, []);

  const go = useCallback((p: OmniProject) => {
    pushRecentSlug(p.slug);
    /* projectHref, not the old path built by hand: reports moved to
       /projects/<seoSlug> and the old address now resolves as a redirect
       stub, so every homepage search was costing a hop. It falls back to
       the internal slug when the index predates the move. */
    window.location.href = projectHref(p);
  }, []);
  const requestReport = useCallback(() => {
    setMobileOpen(false); setOpen(false);
    const term = (query.trim() || q).trim();
    if (term) pushDemand(term);
    window.location.href = `${basePath}/get-custom-project-report${term ? `?project=${encodeURIComponent(term)}` : ""}`;
  }, [query, q]);

  const goDeveloper = useCallback((d: DevRow) => {
    window.location.href = `${basePath}/intelligence/developers/${d.s}`;
  }, []);

  const activate = useCallback((item: NavItem) => {
    if (item.kind === "project") go(item.p);
    else if (item.kind === "developer") goDeveloper(item.d);
    else requestReport();
  }, [go, goDeveloper, requestReport]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMobile) { openMobile(); return; }
    const term = query.trim();
    if (!term) return;
    const hits = fuzzySearch(term, projects, 1);
    if (hits.length) { go(hits[0]); return; }
    // no project matched — open a matching developer dossier before falling
    // back to the custom-report ask, so a developer-only query isn't a dead end
    const devHits = searchDevelopers(term, devs, 1);
    if (devHits.length) { goDeveloper(devHits[0]); return; }
    requestReport();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = navItems.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (n ? (a + 1) % n : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (n ? (a <= 0 ? n - 1 : a - 1) : -1));
    } else if (e.key === "Enter") {
      if (active >= 0 && navItems[active]) { e.preventDefault(); activate(navItems[active]); }
    } else if (e.key === "Escape") {
      if (mobileOpen) { e.preventDefault(); closeMobile(); }
      else if (open) { e.preventDefault(); setOpen(false); setActive(-1); }
    }
  };

  const totalHits = results.length + devResults.length;
  const announce =
    state === 1 ? "Showing suggested projects."
    : state === 2 ? `${totalHits} result${totalHits === 1 ? "" : "s"} for ${q}.`
    : `No coverage yet for ${q}. Request a custom report, or view covered projects nearby.`;

  const hasContent = state === 1 ? navItems.length > 0 : true;
  const desktopOpen = open && hasContent && !isMobile;

  /* ── shared row / label renderers (indices align with navItems) ── */
  const row = (p: OmniProject, i: number, doHighlight: boolean) => {
    const segs = doHighlight ? highlightName(p.name, q) : [{ t: p.name, hit: false }];
    const meta = rowMeta(p);
    return (
      <li
        key={`${p.slug}-${i}`}
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
        {p.score != null && scoreTag(p.score) && <ScoreTagChip score={p.score} tag={scoreTag(p.score)!} />}
      </li>
    );
  };
  const label = (text: string, withRule = false) => (
    <li
      role="presentation"
      className={`px-4 pb-1.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[#8b8067] ${withRule ? "border-t" : ""}`}
      style={withRule ? { borderTopWidth: "0.5px", borderTopColor: "#d8cfb8" } : undefined}
    >
      {text}
    </li>
  );
  /* developer row — same shell as a project row, with a Dossier chip in place
     of the Truth Score. Routes to the developer's dossier page. */
  const devRowEl = (d: DevRow, i: number) => {
    const segs = highlightName(d.n, q);
    return (
      <li
        key={`dev-${d.s}-${i}`}
        id={optId(i)}
        role="option"
        aria-selected={active === i}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActive(i)}
        onClick={() => goDeveloper(d)}
        className={`flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-2 ${active === i ? "bg-[#e5dcc5]" : ""}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[16px] leading-tight text-[#1f1b12]">
            {segs.map((s, k) => (s.hit ? <b key={k} className="font-semibold">{s.t}</b> : <span key={k}>{s.t}</span>))}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[#7c7364]">
            {d.c != null ? `Developer · ${d.c} tracked project${d.c === 1 ? "" : "s"}` : "Developer dossier"}
          </span>
        </span>
        <span className="shrink-0 rounded-[11px] px-2 py-[3px] text-[10.5px] font-medium leading-none" style={{ color: "#6a5410", border: "0.5px solid #c7a86a" }}>
          Dossier
        </span>
      </li>
    );
  };

  /* the listbox children for the current state — shared by both surfaces */
  const panelChildren = () => {
    if (state === 1) {
      return (
        <>
          {recentProjects.length > 0 && label("Recent")}
          {recentProjects.map((p, i) => row(p, i, false))}
          {mostList.length > 0 && label("Top rated")}
          {mostList.map((p, k) => row(p, recentProjects.length + k, false))}
          <li role="presentation" className="border-t px-4 py-2.5 text-[11px] text-[#8b8067]" style={{ borderTopWidth: "0.5px", borderTopColor: "#d8cfb8" }}>
            {coveredCountLabel(projects)}
          </li>
        </>
      );
    }
    if (state === 2) {
      // the only way both are empty here is the dev index still loading (see state selector)
      if (results.length === 0 && devResults.length === 0) {
        return <li role="presentation" className="px-4 py-3 text-[13px] text-[#8b8067]">Searching&hellip;</li>;
      }
      return (
        <>
          {results.length > 0 && (
            <>
              {devResults.length > 0 && label("Projects")}
              {results.map((p, i) => row(p, i, true))}
            </>
          )}
          {devResults.length > 0 && (
            <>
              {label("Developers", results.length > 0)}
              {devResults.map((d, k) => devRowEl(d, results.length + k))}
            </>
          )}
        </>
      );
    }
    return (
      <>
        <li role="presentation" className="px-4 pb-1 pt-3.5 text-[13px] leading-snug text-[#4d4535]">
          We haven&rsquo;t covered <b className="font-semibold">{q}</b> yet.
        </li>
        <li role="presentation" className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-3.5 pt-2.5">
          <button
            type="button" id={optId(0)} role="option" aria-selected={active === 0}
            onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(0)} onClick={requestReport}
            className={`inline-flex min-h-[44px] items-center rounded-md bg-[#2f6b4f] px-3.5 text-[13px] font-medium text-[#f6f1e8] transition-colors duration-150 hover:bg-[#285c44] ${active === 0 ? "ring-2 ring-[#2f6b4f]/35" : ""}`}
          >
            Request a custom report
          </button>
        </li>
        {nearby.length > 0 && (
          <>
            {label("Covered nearby", true)}
            {nearby.map((p, k) => row(p, 1 + k, false))}
          </>
        )}
      </>
    );
  };

  return (
    <div className="relative z-30 w-full max-w-[430px]">
      {/* search field — visuals preserved; on mobile it is a trigger for the full-screen view */}
      <form
        onSubmit={submit}
        role="search"
        className="flex h-[50px] w-full max-w-[420px] rounded-lg ring-1 ring-transparent transition-shadow duration-150 focus-within:ring-[#a07d2c] md:h-[52px]"
      >
        <label htmlFor="hero-search" className="sr-only">Search any Gurugram project</label>
        <div className="flex flex-1 items-center gap-2 rounded-l-lg bg-[#efe9dc] pl-3 md:gap-3 md:pl-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a6f56" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" className="shrink-0"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" /></svg>
          <input
            ref={triggerRef}
            id="hero-search"
            type="search"
            readOnly={isMobile}
            {...(!isMobile
              ? {
                  role: "combobox" as const,
                  "aria-expanded": desktopOpen,
                  "aria-controls": panelId,
                  "aria-autocomplete": "list" as const,
                  "aria-activedescendant": desktopOpen && active >= 0 ? optId(active) : undefined,
                }
              : { "aria-haspopup": "dialog" as const, "aria-expanded": mobileOpen })}
            autoComplete="off"
            value={query}
            onChange={(e) => { if (!isMobile) { setQuery(e.target.value); setOpen(true); if (e.target.value.trim()) markSearchStarted(); } }}
            onFocus={() => { if (!isMobile) { setOpen(true); ensureDevs(); } }}
            onBlur={() => { if (!isMobile) { setOpen(false); setActive(-1); } }}
            onClick={() => { if (isMobile) openMobile(); }}
            onKeyDown={(e) => {
              if (isMobile) { if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); openMobile(); } }
              else onKeyDown(e);
            }}
            placeholder={placeholder}
            className="h-full w-full min-w-0 cursor-text bg-transparent pr-2 text-[13px] text-[#2a2318] placeholder:text-[#7a6f56] focus:outline-none min-[360px]:text-[15px]"
          />
        </div>
        <button type="submit" className="shrink-0 rounded-r-lg bg-[#2f6b4f] px-4 text-[13px] font-medium text-[#f6f1e8] transition-colors duration-150 hover:bg-[#285c44] min-[360px]:text-[15px] md:px-5">
          Get verdict
        </button>
      </form>

      {/* ── desktop dropdown ── */}
      {desktopOpen && (
        <ul
          id={panelId}
          role="listbox"
          aria-label="Project search"
          onMouseDown={(e) => e.preventDefault()}
          className="teh-search-panel absolute left-0 top-full z-50 mt-[7px] max-h-[70vh] w-full overflow-y-auto overscroll-contain rounded-lg bg-[#efe9dc]"
          style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}
        >
          {panelChildren()}
        </ul>
      )}

      {/* ── mobile full-screen search view (portalled to body, above everything) ── */}
      {mobileOpen && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search projects"
          className="teh-search-overlay fixed inset-x-0 top-0 z-[100] flex flex-col bg-[#efe9dc]"
          style={{ height: vvh ? `${vvh}px` : "100dvh" }}
        >
          <div className="flex items-center gap-2 border-b px-2 py-2" style={{ borderBottomWidth: "0.5px", borderBottomColor: "#d8cfb8" }}>
            <button type="button" onClick={closeMobile} aria-label="Close search" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#4d4535] transition-colors hover:bg-[#e5dcc5]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className="flex h-11 flex-1 items-center gap-2 rounded-lg bg-white/70 pl-3" style={{ boxShadow: "inset 0 0 0 1px #d8cfb8" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a6f56" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" className="shrink-0"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" /></svg>
              <input
                ref={overlayInputRef}
                type="search"
                role="combobox"
                aria-expanded
                aria-controls={panelId}
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? optId(active) : undefined}
                autoComplete="off"
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim()) markSearchStarted(); }}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="h-full w-full min-w-0 bg-transparent pr-3 text-[16px] text-[#2a2318] placeholder:text-[#7a6f56] focus:outline-none"
              />
            </div>
          </div>
          <ul id={panelId} role="listbox" aria-label="Project search" className="flex-1 overflow-y-auto overscroll-contain">
            {panelChildren()}
          </ul>
        </div>,
        document.body,
      )}

      {/* screen-reader announcement of result changes */}
      <div className="sr-only" role="status" aria-live="polite">{desktopOpen || mobileOpen ? announce : ""}</div>
    </div>
  );
}
