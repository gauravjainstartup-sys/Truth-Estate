"use client";

/* Header search for project pages — a quiet magnifier that opens a command
   palette (⌘K / Ctrl-K too). Results come from the build-emitted
   /search-index.json (all project files + developer dossiers), filtered
   client-side, so it works fully on the static export and costs nothing
   until first opened. Centred card on desktop, full-screen sheet under md. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { basePath } from "@/lib/site";
import { projectHref } from "@/lib/projectHref";


type P = { n: string; s: string; q?: string; m?: string; d?: string; ts?: number };
type D = { n: string; s: string; c?: number };
type Index = { p: P[]; d: D[] };

let cached: Index | null = null;

type Hit = { kind: "p" | "d"; n: string; sub: string; chip: string; href: string };

function filter(ix: Index, q: string): Hit[] {
  const t = q.trim().toLowerCase();
  const rank = (hay: string) => (t === "" ? 1 : hay.startsWith(t) ? 0 : hay.includes(t) ? 1 : -1);
  const ps = ix.p
    .map((x) => ({ x, r: Math.min(...[x.n, x.d ?? "", x.m ?? ""].map((h) => { const v = rank(h.toLowerCase()); return v < 0 ? 9 : v; })) }))
    .filter((e) => e.r < 9)
    .sort((a, b) => a.r - b.r)
    .slice(0, 7)
    .map(({ x }): Hit => ({
      kind: "p",
      n: x.n,
      sub: [x.m, x.d].filter(Boolean).join(" · ") || "project file",
      chip: x.ts != null ? `${x.ts}/100` : "file",
      href: projectHref({ slug: x.s, seoSlug: x.q }),
    }));
  const ds = ix.d
    .map((x) => ({ x, r: rank(x.n.toLowerCase()) }))
    .filter((e) => e.r >= 0)
    .sort((a, b) => a.r - b.r)
    .slice(0, 3)
    .map(({ x }): Hit => ({
      kind: "d",
      n: x.n,
      sub: x.c != null ? `Developer · ${x.c} tracked projects` : "Developer dossier",
      chip: "dossier",
      href: `${basePath}/intelligence/developers/${x.s}`,
    }));
  return [...ps, ...ds];
}

/* `current` is the project whose page this is. Given it, the header stops
   being a bare magnifier and says where you are — the reader arriving from
   a search result had no confirmation on the page that the file they opened
   was the one they picked. Founder's mock: the project name sitting in the
   search field, with a way to start a new one.

   Opening ALWAYS starts empty rather than seeding the field with the
   current project. Seeding reads as a filter — search within this project —
   and the one thing a reader wants from a control labelled with where they
   already are is somewhere else. */
export default function SearchPalette({ className = "", current }: { className?: string; current?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [ix, setIx] = useState<Index | null>(cached);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const show = useCallback(() => {
    setOpen(true);
    setQ("");
    setSel(0);
    if (!cached)
      fetch(`${basePath}/search-index.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (j) { cached = j as Index; setIx(cached); } })
        .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);
  const hide = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); show(); }
      if (e.key === "Escape") hide();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [show, hide]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);

  const hits = useMemo(() => (ix ? filter(ix, q) : []), [ix, q]);
  useEffect(() => { setSel(0); }, [q]);

  const go = (h: Hit) => { window.location.href = h.href; };
  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && hits[sel]) go(hits[sel]);
  };

  const groups: { label: string; items: { h: Hit; i: number }[] }[] = [];
  hits.forEach((h, i) => {
    const label = h.kind === "p" ? "Projects" : "Developers";
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push({ h, i });
    else groups.push({ label, items: [{ h, i }] });
  });

  return (
    <>
      {current ? (
        <button
          onClick={show}
          aria-label={`Currently viewing ${current}. Search for another project or developer`}
          title="Search (⌘K)"
          className={`group flex h-9 min-w-0 max-w-[15rem] items-center gap-2 rounded-[10px] px-2.5 text-left text-[#1a1a1a]/60 ring-1 ring-[#1a1a1a]/12 transition-colors hover:bg-white hover:text-[#1a1a1a] hover:ring-[#1a1a1a]/20 sm:max-w-[22rem] ${className}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[15px] w-[15px] shrink-0">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" />
          </svg>
          <span className="truncate text-[0.82rem] font-medium text-[#1a1a1a]/85">{current}</span>
          <span className="ml-auto hidden shrink-0 rounded-[6px] bg-[#1a1a1a]/[0.06] px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#1a1a1a]/50 transition-colors group-hover:bg-[#1e6b45]/10 group-hover:text-[#1e6b45] sm:block">
            Change
          </span>
        </button>
      ) : (
        <button
          onClick={show}
          aria-label="Search projects and developers"
          title="Search (⌘K)"
          className={`grid h-9 w-9 place-items-center rounded-[10px] text-[#1a1a1a]/60 transition-colors hover:bg-white hover:text-[#1a1a1a] hover:ring-1 hover:ring-[#1a1a1a]/15 ${className}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[17px] w-[17px]">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" />
          </svg>
        </button>
      )}

      {/* portalled to <body>: the sticky header's transform would otherwise
          become the containing block for this fixed overlay */}
      {open && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-[#1a1a1a]/30 backdrop-blur-[2px]" onClick={hide} />
          <div className="absolute inset-0 flex flex-col bg-[#fbf8f1] md:inset-auto md:left-1/2 md:top-[15vh] md:block md:w-[560px] md:-translate-x-1/2 md:rounded-2xl md:border md:border-[#1a1a1a]/10 md:shadow-[0_30px_80px_-20px_rgba(26,26,26,0.45)]">
            <div className="flex items-center gap-3 border-b border-[#1a1a1a]/8 px-4 py-3.5 md:px-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4 shrink-0 text-[#1a1a1a]/40">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search projects, developers…"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30"
              />
              <span className="hidden rounded-md border border-[#1a1a1a]/15 px-1.5 py-1 font-mono text-[0.58rem] font-semibold text-[#1a1a1a]/40 md:inline">ESC</span>
              <button onClick={hide} className="font-mono text-[0.68rem] font-semibold tracking-[0.06em] text-[#9a7a2e] md:hidden">CANCEL</button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain md:max-h-[46vh]">
              {!ix && <p className="px-5 py-5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-[#1a1a1a]/35">Loading index…</p>}
              {ix && hits.length === 0 && <p className="px-5 py-5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-[#1a1a1a]/35">No matches — try a shorter query</p>}
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="px-4 pb-1 pt-2.5 font-mono text-[0.56rem] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/35 md:px-5">{g.label}</p>
                  {g.items.map(({ h, i }) => (
                    <button
                      key={h.href}
                      onClick={() => go(h)}
                      onMouseEnter={() => setSel(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left md:px-5 ${i === sel ? "bg-[#c9a96e]/[0.12]" : ""}`}
                    >
                      <span className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg text-[0.66rem] ${h.kind === "p" ? "bg-[#1e6b45]/10 text-[#1e6b45]" : "bg-[#c9a96e]/[0.16] text-[#8a6d1f]"}`}>
                        {h.kind === "p" ? "▦" : "◆"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[0.85rem] font-medium text-[#1a1a1a]">{h.n}</span>
                        <span className="block truncate font-mono text-[0.62rem] text-[#1a1a1a]/45">{h.sub}</span>
                      </span>
                      <span className={`ml-auto shrink-0 rounded-md px-1.5 py-1 font-mono text-[0.66rem] font-bold ${h.chip.endsWith("/100") ? "bg-[#1e6b45]/8 text-[#1e6b45]" : "bg-[#e0a02e]/10 text-[#a2701f]"}`}>{h.chip}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="hidden gap-4 border-t border-[#1a1a1a]/8 px-5 py-2.5 font-mono text-[0.6rem] text-[#1a1a1a]/38 md:flex">
              <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
