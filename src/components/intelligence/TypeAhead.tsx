"use client";

/* ────────────────────────────────────────────────────────────────────────
   TypeAhead — a small, accessible combobox for the intelligence surfaces.

   One brain, two jobs:
   • "select" mode (the Compare picker): a controlled field that shows the
     current selection, filters the given list as you type, and calls onPick
     with the chosen item. Replaces a native <select> with a searchable one.
   • "search" mode (the header search): no persistent value — type, pick, and
     onPick navigates; the field clears.

   Light intelligence palette (cream/ink/green), styled to echo the homepage
   HeroSearch without dragging in its projects-only, report-navigating brain.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type TAItem = { id: string; name: string; score?: number; meta?: string };

function filterItems(items: TAItem[], q: string, limit: number): TAItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return items.slice(0, limit);
  const starts: TAItem[] = [];
  const has: TAItem[] = [];
  for (const it of items) {
    const n = it.name.toLowerCase();
    if (n.startsWith(s)) starts.push(it);
    else if (n.includes(s) || (it.meta && it.meta.toLowerCase().includes(s))) has.push(it);
    if (starts.length + has.length >= limit + 8) break;
  }
  return [...starts, ...has].slice(0, limit);
}

export default function TypeAhead({
  items,
  value,
  onPick,
  placeholder = "Search…",
  ariaLabel,
  clearOnPick = false,
  limit = 8,
  size = "md",
}: {
  items: TAItem[];
  value?: string;                 // selected id (select mode)
  onPick: (item: TAItem) => void;
  placeholder?: string;
  ariaLabel?: string;
  clearOnPick?: boolean;          // search mode: wipe the field after choosing
  limit?: number;
  size?: "md" | "sm";
}) {
  const selectedName = useMemo(
    () => (value ? items.find((i) => i.id === value)?.name ?? "" : ""),
    [value, items],
  );
  const [query, setQuery] = useState(selectedName);
  const [dirty, setDirty] = useState(false); // has the user typed since focus?
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const panelId = `${uid}-panel`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  // keep the field in step when the selection changes from outside (tab switch)
  useEffect(() => { setQuery(selectedName); setDirty(false); }, [selectedName]);

  const results = useMemo(
    () => filterItems(items, dirty ? query : "", limit),
    [items, dirty, query, limit],
  );

  useEffect(() => { setActive(-1); }, [query, open]);
  useEffect(() => {
    if (open && active >= 0) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
  }, [active, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    setOpen(false);
    setActive(-1);
    setQuery(clearOnPick ? "" : selectedName);
    setDirty(false);
  }
  function pick(it: TAItem) {
    onPick(it);
    if (clearOnPick) { setQuery(""); setDirty(false); setOpen(false); setActive(-1); inputRef.current?.blur(); }
    else { setQuery(it.name); setDirty(false); setOpen(false); setActive(-1); inputRef.current?.blur(); }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = results.length;
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (n ? (a + 1) % n : -1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (n ? (a <= 0 ? n - 1 : a - 1) : -1)); }
    else if (e.key === "Enter") { if (open && active >= 0 && results[active]) { e.preventDefault(); pick(results[active]); } }
    else if (e.key === "Escape") { if (open) { e.preventDefault(); close(); } }
  };

  const pad = size === "sm" ? "px-3 py-2 text-[0.9rem]" : "px-4 py-3 text-[1.02rem]";

  return (
    <div ref={rootRef} className="relative">
      <div className={`flex items-center gap-2 rounded-sm border bg-white transition-colors ${open ? "border-[#c9a96e]" : "border-[#1a1a1a]/15"} ${pad}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a6f56" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" className="shrink-0"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" /></svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={panelId}
          aria-autocomplete="list"
          aria-label={ariaLabel ?? placeholder}
          aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setDirty(true); setOpen(true); }}
          onFocus={(e) => { setOpen(true); setDirty(false); e.currentTarget.select(); }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent font-serif font-light text-[#1a1a1a] placeholder:font-sans placeholder:font-normal placeholder:text-[#7a6f56] focus:outline-none"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          id={panelId}
          role="listbox"
          aria-label={ariaLabel ?? "Results"}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[52vh] overflow-y-auto overscroll-contain rounded-lg border border-[#1a1a1a]/10 bg-[#efe9dc]"
          style={{ boxShadow: "0 16px 40px rgba(60,42,10,0.28)" }}
        >
          {results.map((it, i) => (
            <li
              key={it.id}
              id={optId(i)}
              role="option"
              aria-selected={active === i}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(it); }}
              className={`flex min-h-[42px] cursor-pointer items-center gap-3 px-4 py-2 ${active === i ? "bg-[#e5dcc5]" : ""}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[15px] leading-tight text-[#1f1b12]">{it.name}</span>
                {it.meta && <span className="mt-0.5 block truncate text-[11px] text-[#7c7364]">{it.meta}</span>}
              </span>
              {it.score != null && (
                <span className="shrink-0 font-mono text-[0.72rem] font-bold tabular-nums text-[#1e6b45]">{it.score}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
