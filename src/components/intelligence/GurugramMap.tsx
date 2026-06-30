"use client";

import { useState } from "react";
import { MARKETS, fmtPsf, type MarketIntel } from "@/lib/markets";

const basePath = "/Truth-Estate";

/* ════════════════════════════════════════════════════════════════
   A schematic of Gurugram drawn as a CONTIGUOUS partition — every
   micro-market is a bordered region that tiles against its neighbours
   along the city's primary corridors. Boundaries are shared (drawn
   once, traced by both adjoining zones) so they read as real extents,
   not floating blobs. Positions follow each corridor's true relative
   geography; the road skeleton (NH-48, Dwarka Expressway, Sohna Rd)
   is overlaid for orientation.
   ════════════════════════════════════════════════════════════════ */

type Pt = { x: number; y: number };

// 4 rows × 3 columns of intersection nodes — tilted & irregular so the
// partition reads like a map, not a grid.
const NODE: Pt[][] = [
  [{ x: 150, y: 78 }, { x: 388, y: 58 }, { x: 598, y: 128 }],
  [{ x: 104, y: 238 }, { x: 356, y: 224 }, { x: 582, y: 300 }],
  [{ x: 138, y: 398 }, { x: 372, y: 402 }, { x: 560, y: 468 }],
  [{ x: 198, y: 536 }, { x: 398, y: 556 }, { x: 536, y: 540 }],
];

// Each micro-market is a cell of the grid, mapped by real relative position.
const CELLS: { slug: string; corners: [number, number][] }[] = [
  { slug: "dwarka-expressway", corners: [[0, 0], [0, 1], [1, 1], [1, 0]] },
  { slug: "golf-course-road", corners: [[0, 1], [0, 2], [1, 2], [1, 1]] },
  { slug: "new-gurgaon", corners: [[1, 0], [1, 1], [2, 1], [2, 0]] },
  { slug: "golf-course-extension", corners: [[1, 1], [1, 2], [2, 2], [2, 1]] },
  { slug: "spr", corners: [[2, 0], [2, 1], [3, 1], [3, 0]] },
  { slug: "sohna", corners: [[2, 1], [2, 2], [3, 2], [3, 1]] },
];

// Deterministic control point for the curved border between two nodes.
// Sorting the endpoints makes ctrl(a,b) === ctrl(b,a), so a shared edge
// curves identically no matter which zone traces it.
function ctrl(a: Pt, b: Pt): Pt {
  const [p, q] = a.x < b.x || (a.x === b.x && a.y <= b.y) ? [a, b] : [b, a];
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
  const dx = q.x - p.x, dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = len * 0.05; // gentle bow on every seam
  return { x: mx + (-dy / len) * off, y: my + (dx / len) * off };
}

function cellPath(corners: [number, number][]): string {
  const pts = corners.map(([r, c]) => NODE[r][c]);
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const cp = ctrl(a, b);
    d += ` Q ${cp.x.toFixed(1)} ${cp.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d + " Z";
}

function centroid(corners: [number, number][]): Pt {
  const pts = corners.map(([r, c]) => NODE[r][c]);
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}

const GEO = CELLS.map((c) => ({ slug: c.slug, d: cellPath(c.corners), c: centroid(c.corners) }));
const geoOf = (slug: string) => GEO.find((g) => g.slug === slug)!;

const TIER_COLOR: Record<MarketIntel["tier"], string> = {
  Established: "#c9a96e",
  Growth: "#3e8e62",
  Value: "#9a8f73",
  Emerging: "#b9a989",
};

export default function GurugramMap() {
  const [active, setActive] = useState<string>("golf-course-extension");
  const m = MARKETS.find((x) => x.slug === active)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
      {/* Map */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-[#EFE9DE] p-2">
        <svg viewBox="0 0 640 600" className="h-auto w-full">
          {/* zones — boundaries shared along the partition seams */}
          {MARKETS.map((mk) => {
            const on = mk.slug === active;
            const col = TIER_COLOR[mk.tier];
            const g = geoOf(mk.slug);
            return (
              <a
                key={mk.slug}
                href={`${basePath}/intelligence/markets/${mk.slug}`}
                onMouseEnter={() => setActive(mk.slug)}
                onFocus={() => setActive(mk.slug)}
                className="cursor-pointer outline-none"
              >
                <path
                  d={g.d}
                  fill={col}
                  fillOpacity={on ? 0.42 : 0.18}
                  stroke={on ? col : "#1a1a1a"}
                  strokeOpacity={on ? 1 : 0.32}
                  strokeWidth={on ? 2.6 : 1.4}
                  strokeLinejoin="round"
                  style={{ transition: "fill-opacity .25s, stroke-opacity .25s, stroke-width .25s" }}
                />
              </a>
            );
          })}

          {/* primary corridors — orientation only, drawn above the fills */}
          <g fill="none" stroke="#1a1a1a" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="2 5">
            <path d="M598 150 C470 250 320 380 176 540" />
            <path d="M150 78 C300 96 430 70 598 128" />
          </g>
          <text x="372" y="330" fontSize="9.5" fill="#1a1a1a" fillOpacity="0.4" fontFamily="monospace" transform="rotate(38 372 330)">NH-48</text>
          <text x="300" y="84" fontSize="9.5" fill="#1a1a1a" fillOpacity="0.4" fontFamily="monospace">Dwarka Expressway</text>
          <text x="600" y="96" fontSize="9" fill="#1a1a1a" fillOpacity="0.3" fontFamily="monospace" textAnchor="end">DELHI →</text>

          {/* labels — name + projects · avg price, per zone */}
          {MARKETS.map((mk) => {
            const on = mk.slug === active;
            const g = geoOf(mk.slug);
            return (
              <g key={mk.slug} style={{ pointerEvents: "none" }}>
                <text x={g.c.x} y={g.c.y - 6} textAnchor="middle" fontSize="14.5" fontWeight="600" fill="#1a1a1a" fillOpacity={on ? 0.95 : 0.62}>
                  {mk.short}
                </text>
                <text x={g.c.x} y={g.c.y + 13} textAnchor="middle" fontSize="10.5" fontFamily="monospace" fill="#1a1a1a" fillOpacity={on ? 0.7 : 0.45}>
                  {mk.projectCount} · {fmtPsf(mk.psf.avg)}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="px-3 pb-2 pt-1 text-center text-[0.62rem] font-light tracking-[0.04em] text-[#1a1a1a]/35">
          Indicative micro-market extents along Gurugram&rsquo;s primary corridors. Tap a market for the full read.
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
