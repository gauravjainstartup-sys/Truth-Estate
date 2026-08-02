"use client";

import { useEffect, useState } from "react";
import type { DevLedgerItem } from "@/lib/developers";

/* Developer DNA · Part A — the full RERA project ledger behind the
   track-record stats. A CTA reveals the list: inline on desktop, a bottom
   sheet on mobile. Rows come from the `projects` table (BE source of truth);
   everything here is display-only formatting. */

const STATUS_ORDER: Record<string, number> = { delivered: 0, ongoing: 1, lapsed: 2 };

function firstWord(s: string): string {
  return s.trim().split(/\s+/)[0] || s;
}

/* Title-case the ALL-CAPS registry name, and drop a leading developer word
   ("Whiteland Blissville Phase 2" → "Blissville Phase 2") since the list is
   already scoped to that developer. */
function fmtName(raw: string, developer: string): string {
  let t = raw.trim().replace(/\s+/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const dw = firstWord(developer);
  if (dw && t.toLowerCase().startsWith(`${dw.toLowerCase()} `) && t.length > dw.length + 1) {
    t = t.slice(dw.length + 1);
  }
  return t;
}

/* Sector where we can read it; otherwise a tidy, truncated fallback so a raw
   address / entity string never blows out the column. */
function fmtLoc(loc: string | null): string {
  if (!loc) return "—";
  const m = loc.match(/sector\s*-?\s*(\d+\s*[a-z]?)/i);
  if (m) return `Sector ${m[1].replace(/\s+/g, "").toUpperCase()}`;
  const t = loc.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return t.length > 26 ? `${t.slice(0, 24)}…` : t;
}

function ocMonth(oc: string | null): string | null {
  if (!oc) return null;
  const d = new Date(oc);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

type Tone = "good" | "bad" | "mid";
function timeline(it: DevLedgerItem): { txt: string; tone: Tone } {
  const d = it.delayMonths;
  const delivered = (it.status ?? "").toLowerCase() === "delivered";
  const late = (it.isDelayed === true || (d != null && d >= 2)) && d != null && d > 0;
  const early = d != null && d <= -3;
  if (delivered) {
    const oc = ocMonth(it.ocDate);
    const base = late ? `+${d} mo late` : early ? "ahead of schedule" : "on time";
    return { txt: oc ? `OC ${oc} · ${base}` : base, tone: late ? "bad" : "good" };
  }
  if (late) return { txt: `forecast +${d} mo`, tone: "bad" };
  if (early) return { txt: `~${Math.abs(d as number)} mo ahead`, tone: "good" };
  return { txt: "on track", tone: "mid" };
}
const TONE: Record<Tone, string> = { good: "text-[#1e6b45]", bad: "text-[#b0503e]", mid: "text-[#1a1a1a]/50" };

function statusChip(status: string | null) {
  const st = (status ?? "").toLowerCase();
  if (st === "delivered") return { label: "Delivered", cls: "text-[#155a3a] bg-[#1e6b45]/[0.12] border-[#1e6b45]/30", dot: "bg-[#1e6b45]" };
  if (st === "lapsed") return { label: "Lapsed", cls: "text-[#9a4130] bg-[#b0503e]/[0.10] border-[#b0503e]/30", dot: "bg-[#b0503e]" };
  return { label: status ?? "Ongoing", cls: "text-[#8a6a1e] bg-[#9a7a2e]/[0.12] border-[#9a7a2e]/30", dot: "bg-[#9a7a2e]" };
}
function typeTag(type: string | null): { label: string; cls: string } | null {
  const t = (type ?? "").toLowerCase();
  if (t.startsWith("comm")) return { label: "Commercial", cls: "text-[#6d4d86] bg-[#6d4d86]/10 border-[#6d4d86]/30" };
  if (t.startsWith("res")) return { label: "Residential", cls: "text-[#3f5d78] bg-[#3f5d78]/10 border-[#3f5d78]/30" };
  return null;
}

function StatusChip({ status }: { status: string | null }) {
  const c = statusChip(status);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[0.58rem] font-bold uppercase tracking-[0.04em] ${c.cls}`}>
      <span className={`h-[5px] w-[5px] rounded-full ${c.dot}`} aria-hidden />
      {c.label}
    </span>
  );
}
function TypeTag({ type }: { type: string | null }) {
  const t = typeTag(type);
  if (!t) return null;
  return <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-[5px] border px-1.5 py-[2px] text-[0.55rem] font-bold uppercase tracking-[0.03em] ${t.cls}`}>{t.label}</span>;
}

export default function DeveloperLedger({ items, developer }: { items: DevLedgerItem[]; developer: string }) {
  const [open, setOpen] = useState(false);
  const rows = [...items].sort((a, b) => {
    const oa = STATUS_ORDER[(a.status ?? "").toLowerCase()] ?? 3;
    const ob = STATUS_ORDER[(b.status ?? "").toLowerCase()] ?? 3;
    return oa - ob || a.name.localeCompare(b.name);
  });
  const n = rows.length;

  // Lock the page behind the mobile sheet while it's open.
  useEffect(() => {
    if (!open) return;
    const mq = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (!mq) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-[#1a1a1a]/14 bg-white/70 px-4 py-2.5 text-[0.78rem] font-semibold text-[#1a1a1a]/75 transition-colors hover:border-[#1e6b45]/40 hover:text-[#1e6b45]"
      >
        {open ? "Hide" : "See all"} {n} project{n === 1 ? "" : "s"}
        <span className={`text-[#9a7a2e] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>⌄</span>
      </button>

      {/* Desktop — inline table */}
      {open && (
        <div className="mt-3 hidden overflow-hidden rounded-2xl border border-[#1a1a1a]/10 md:block">
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[minmax(0,2.4fr)_1fr_1.05fr_1.2fr] gap-3 border-b border-[#1a1a1a]/8 bg-[#f1ece0] px-5 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.07em] text-[#1a1a1a]/45">
                <span>Project</span><span>Location</span><span>Status</span><span>Timeline</span>
              </div>
              {rows.map((r, i) => {
                const tl = timeline(r);
                return (
                  <div key={i} className="grid grid-cols-[minmax(0,2.4fr)_1fr_1.05fr_1.2fr] items-center gap-3 border-b border-[#1a1a1a]/6 px-5 py-3 last:border-b-0">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-serif text-[0.95rem] text-[#1a1a1a]">{fmtName(r.name, developer)}</span>
                      <TypeTag type={r.type} />
                    </span>
                    <span className="text-[0.82rem] text-[#1a1a1a]/55">{fmtLoc(r.location)}</span>
                    <span><StatusChip status={r.status} /></span>
                    <span className={`text-[0.78rem] font-semibold ${TONE[tl.tone]}`}>{tl.txt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile — bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label={`${firstWord(developer)}'s projects`}>
          <div className="absolute inset-0 bg-[#141110]/45" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[82%] flex-col overflow-hidden rounded-t-[22px] bg-[#f4f1ea] shadow-[0_-10px_30px_rgba(0,0,0,0.18)]">
            <span className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-[#1a1a1a]/18" aria-hidden />
            <div className="flex shrink-0 items-center justify-between border-b border-[#1a1a1a]/10 px-4 pb-3 pt-2">
              <p className="font-serif text-[1.05rem]">{firstWord(developer)}&rsquo;s projects <span className="ml-1 text-[0.72rem] font-semibold text-[#1a1a1a]/45">{n}</span></p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-full bg-[#1a1a1a]/[0.06] text-[0.9rem] text-[#1a1a1a]/55">✕</button>
            </div>
            <div className="overflow-y-auto px-3.5 pb-6 pt-2">
              {rows.map((r, i) => {
                const tl = timeline(r);
                return (
                  <div key={i} className="mt-2.5 rounded-xl border border-[#1a1a1a]/8 bg-white/60 px-3.5 py-3 first:mt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-[0.98rem]">{fmtName(r.name, developer)}</span>
                      <StatusChip status={r.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2.5">
                      <TypeTag type={r.type} />
                      <span className="text-[0.78rem] text-[#1a1a1a]/55">{fmtLoc(r.location)}</span>
                    </div>
                    <div className={`mt-2 text-[0.8rem] font-semibold ${TONE[tl.tone]}`}>{tl.txt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
