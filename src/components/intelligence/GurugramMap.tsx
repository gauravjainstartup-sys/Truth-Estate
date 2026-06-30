"use client";

import { useState } from "react";
import { MARKETS, fmtPsf, type MarketIntel } from "@/lib/markets";

const basePath = "/Truth-Estate";

/* A geographically-informed schematic — not a survey map. Each micro-market
   is an organic zone placed by its real relative position in Gurugram,
   coloured by tier, labelled with what matters: projects and price. */

type Zone = { slug: string; cx: number; cy: number; rx: number; ry: number; seed: number };
const ZONES: Zone[] = [
  { slug: "dwarka-expressway",      cx: 185, cy: 130, rx: 96, ry: 70, seed: 1.2 },
  { slug: "new-gurgaon",            cx: 140, cy: 320, rx: 86, ry: 80, seed: 2.7 },
  { slug: "golf-course-road",       cx: 372, cy: 200, rx: 74, ry: 78, seed: 3.4 },
  { slug: "golf-course-extension",  cx: 452, cy: 350, rx: 92, ry: 80, seed: 4.1 },
  { slug: "spr",                    cx: 318, cy: 452, rx: 96, ry: 72, seed: 5.6 },
  { slug: "sohna",                  cx: 452, cy: 528, rx: 78, ry: 58, seed: 6.3 },
];

function smoothClosed(pts: number[][]) {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return d + "Z";
}
function blob(z: Zone) {
  const N = 11, pts: number[][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const j = 0.84 + 0.16 * Math.abs(Math.sin(z.seed + i * 1.9));
    pts.push([z.cx + Math.cos(a) * z.rx * j, z.cy + Math.sin(a) * z.ry * j]);
  }
  return smoothClosed(pts);
}
const PATHS: Record<string, string> = Object.fromEntries(ZONES.map((z) => [z.slug, blob(z)]));

const TIER_COLOR: Record<MarketIntel["tier"], string> = {
  Established: "#c9a96e",
  Growth: "#3e8e62",
  Value: "#9a8f73",
  Emerging: "#b9a989",
};

export default function GurugramMap() {
  const [active, setActive] = useState<string>("golf-course-extension");
  const m = MARKETS.find((x) => x.slug === active)!;
  const z = ZONES.find((x) => x.slug === active)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
      {/* Map */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-[#EFE9DE] p-2">
        <svg viewBox="0 0 600 600" className="h-auto w-full">
          {/* faint context roads */}
          <g stroke="#1a1a1a" strokeOpacity="0.12" fill="none" strokeWidth="1.4" strokeDasharray="2 5">
            <path d="M540 40 C420 160 240 320 70 470" />
            <path d="M210 30 C250 120 300 170 360 200" />
            <path d="M452 350 C420 430 440 490 452 528" />
          </g>
          <text x="92" y="486" fontSize="10" fill="#1a1a1a" fillOpacity="0.28" fontFamily="monospace" transform="rotate(-32 92 486)">NH-48</text>

          {/* zones */}
          {MARKETS.map((mk) => {
            const on = mk.slug === active;
            const c = TIER_COLOR[mk.tier];
            const zz = ZONES.find((x) => x.slug === mk.slug)!;
            return (
              <a key={mk.slug} href={`${basePath}/intelligence/markets/${mk.slug}`}
                 onMouseEnter={() => setActive(mk.slug)} className="cursor-pointer">
                <path
                  d={PATHS[mk.slug]}
                  fill={c}
                  fillOpacity={on ? 0.34 : 0.16}
                  stroke={c}
                  strokeOpacity={on ? 0.9 : 0.4}
                  strokeWidth={on ? 2 : 1.2}
                  style={{ transition: "fill-opacity .25s, stroke-opacity .25s" }}
                />
                <text x={zz.cx} y={zz.cy - 8} textAnchor="middle" fontSize="15" fontWeight="600" fill="#1a1a1a" fillOpacity={on ? 0.9 : 0.6}>
                  {mk.short}
                </text>
                <text x={zz.cx} y={zz.cy + 12} textAnchor="middle" fontSize="10.5" fontFamily="monospace" fill="#1a1a1a" fillOpacity="0.45">
                  {mk.projectCount} · {fmtPsf(mk.psf.avg)}
                </text>
              </a>
            );
          })}
        </svg>
        <p className="px-3 pb-2 pt-1 text-center text-[0.62rem] font-light tracking-[0.04em] text-[#1a1a1a]/30">
          Illustrative — zones reflect relative position, not survey boundaries. Tap a market for the full read.
        </p>
      </div>

      {/* Live readout */}
      <div>
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_COLOR[m.tier] }} />
          <span className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/45">{m.tier}</span>
        </div>
        <h3 className="mt-3 font-serif text-[2rem] font-medium leading-[1.05] tracking-[-0.01em] text-[#1a1a1a] md:text-[2.5rem]">{m.name}</h3>
        <p className="mt-3 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">{m.info}</p>

        <div className="mt-6 grid grid-cols-3 gap-4 border-y border-[#1a1a1a]/8 py-5">
          <div>
            <p className="font-mono text-[1.5rem] font-light leading-none text-[#1a1a1a]">{m.projectCount}</p>
            <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[#1a1a1a]/40">Projects</p>
          </div>
          <div>
            <p className="font-mono text-[1.5rem] font-light leading-none text-[#1a1a1a]">{fmtPsf(m.psf.avg)}</p>
            <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[#1a1a1a]/40">Avg / sq ft</p>
          </div>
          <div>
            <p className="font-mono text-[1.5rem] font-light leading-none text-[#3e8e62]">{m.appreciation3Y}</p>
            <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[#1a1a1a]/40">3Y trend</p>
          </div>
        </div>

        <p className="mt-5 font-serif text-[1.05rem] font-light italic leading-[1.5] text-[#1a1a1a]/70">&ldquo;{m.verdict}&rdquo;</p>

        <a href={`${basePath}/intelligence/markets/${m.slug}`} className="mt-7 inline-flex items-center gap-2 rounded-sm bg-[#1a1a1a] px-6 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#1e6b45]">
          {`Open ${m.short} intelligence `}&rarr;
        </a>
      </div>
    </div>
  );
}
