"use client";

import { PROJECTS } from "@/lib/journey";

/* A Bloomberg-style live ticker — independent market & project intelligence
   scrolling past, signalling depth of data without a word of marketing. */

const MARKETS = [
  { s: "GCE", v: "+18–25%", w: "3Y" },
  { s: "SPR", v: "+15–22%", w: "3Y" },
  { s: "GCR", v: "+8–12%", w: "1Y" },
  { s: "DWARKA EXPY", v: "+25–40%", w: "3Y" },
  { s: "NEW GURGAON", v: "+10–15%", w: "3Y" },
  { s: "SOHNA", v: "+12–18%", w: "3Y" },
];

type Item = { label: string; value: string; up: boolean | null };

const items: Item[] = [
  ...MARKETS.map((m) => ({ label: m.s, value: `${m.v} · ${m.w}`, up: true })),
  ...PROJECTS.map((p) => ({
    label: p.name.toUpperCase(),
    value: `TS ${p.truthScore} · ${p.recommendation}`,
    up: p.recommendation !== "Consider",
  })),
];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2.5 px-6 font-mono text-[0.72rem] tracking-[0.06em] text-white/40">
          <span className="text-white/65">{it.label}</span>
          <span className={it.up ? "text-[#7fb98a]" : "text-white/45"}>
            {it.up ? "▲" : "▪"} {it.value}
          </span>
          <span className="text-white/12">|</span>
        </span>
      ))}
    </div>
  );
}

export default function MarketPulse() {
  return (
    <div className="relative w-full overflow-hidden border-y border-white/8 bg-white/[0.02] py-3">
      <div className="flex w-max animate-ticker">
        <Row />
        <Row />
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
    </div>
  );
}
