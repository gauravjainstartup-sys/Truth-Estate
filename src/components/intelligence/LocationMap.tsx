"use client";

import { useMemo, useState } from "react";
import type { GeoCat, GeoPoi, LocationGeo } from "@/lib/projects";

/* A coordinate-accurate locality map. Every POI is projected from its real
   lat/lng to its true bearing & distance from the project (equirectangular,
   exact at this scale), so pins and the distance labels can never disagree.
   Fully self-contained SVG — no tiles, no external map API. Concentric rings
   read as "everything within N km"; category chips filter; hovering a pin and
   its list row highlight together. */

const CAT: Record<GeoCat, { label: string; color: string; glyph: string }> = {
  schools: { label: "Schools", color: "#2f8f5b", glyph: "M12 4 3 8l9 4 9-4-9-4Zm6 6.2V14c0 1.7-2.7 3-6 3s-6-1.3-6-3v-3.8" },
  offices: { label: "Workspaces", color: "#3f74a6", glyph: "M4 21V5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5V21M12 10h6.5A1.5 1.5 0 0 1 20 11.5V21M3 21h18M7 8h1M7 12h1M7 16h1" },
  hospitals: { label: "Hospitals", color: "#c0533e", glyph: "M12 8v8M8 12h8M5 21V6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V21M3 21h18" },
  retail: { label: "Retail & dining", color: "#bf942f", glyph: "M5 8h14l-1 12H6L5 8Zm3 0V6a4 4 0 0 1 8 0v2" },
  projects: { label: "Landmarks", color: "#8a6d9c", glyph: "M3 21h18M6 21V8l6-4 6 4v13M10 21v-5h4v5" },
};
const CAT_ORDER: GeoCat[] = ["schools", "offices", "hospitals", "retail", "projects"];

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const north = (b.lat - a.lat) * 111.32;
  const east = (b.lng - a.lng) * 111.32 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(north, east);
}

export default function LocationMap({ geo, projectName }: { geo: LocationGeo; projectName: string }) {
  const radiusKm = geo.radiusKm ?? 2;
  const [active, setActive] = useState<Set<GeoCat>>(new Set(CAT_ORDER));
  const [hover, setHover] = useState<number | null>(null);

  const S = 460; // viewBox size
  const C = S / 2;
  const ringPx = S * 0.42; // outer ring radius in px
  const scale = ringPx / radiusKm; // px per km

  // Project every POI, keep a stable index for hover sync.
  const pts = useMemo(
    () =>
      geo.nearby.map((p, i) => {
        const north = (p.lat - geo.center.lat) * 111.32;
        const east = (p.lng - geo.center.lng) * 111.32 * Math.cos((geo.center.lat * Math.PI) / 180);
        const d = Math.hypot(north, east);
        // clamp to the outer ring so far POIs sit on the rim with a chevron feel
        const clampK = Math.min(d, radiusKm) / (d || 1);
        return {
          i, poi: p, d,
          x: C + east * scale * clampK,
          y: C - north * scale * clampK,
          onRim: d > radiusKm,
        };
      }),
    [geo, scale, radiusKm],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    geo.nearby.forEach((p) => (c[p.cat] = (c[p.cat] ?? 0) + 1));
    return c;
  }, [geo]);

  const toggle = (cat: GeoCat) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next.size === 0 ? new Set(CAT_ORDER) : next;
    });

  const visible = pts.filter((p) => active.has(p.poi.cat));
  const list = [...visible].sort((a, b) => a.d - b.d);
  const rings = [0.5, 1, radiusKm].filter((r) => r <= radiusKm);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60">
      {/* filter chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1a1a1a]/8 px-4 py-3.5 md:px-6">
        <span className="mr-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">Within {radiusKm} km</span>
        {CAT_ORDER.map((cat) => {
          const on = active.has(cat);
          return (
            <button key={cat} onClick={() => toggle(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium transition-colors ${on ? "border-transparent text-white" : "border-[#1a1a1a]/12 bg-white text-[#1a1a1a]/45 hover:text-[#1a1a1a]/75"}`}
              style={on ? { background: CAT[cat].color } : undefined}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: on ? "rgba(255,255,255,0.85)" : CAT[cat].color }} />
              {CAT[cat].label} <span className={on ? "text-white/70" : "text-[#1a1a1a]/35"}>{counts[cat] ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_290px]">
        {/* the map */}
        <div className="relative border-b border-[#1a1a1a]/8 lg:border-b-0 lg:border-r">
          <svg viewBox={`0 0 ${S} ${S}`} className="block h-auto w-full" role="img" aria-label={`Map of what surrounds ${projectName} within ${radiusKm} km`}>
            <defs>
              <radialGradient id="land" cx="50%" cy="42%" r="70%">
                <stop offset="0%" stopColor="#eef2ea" />
                <stop offset="100%" stopColor="#e3e8dd" />
              </radialGradient>
              <radialGradient id="halo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(178,150,104,0.35)" />
                <stop offset="100%" stopColor="rgba(178,150,104,0)" />
              </radialGradient>
            </defs>
            <rect width={S} height={S} fill="url(#land)" onClick={() => setHover(null)} />
            {/* faint locality grid */}
            <g stroke="#1a1a1a" strokeOpacity="0.04" strokeWidth="1">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`v${i}`} x1={(S / 8) * i} y1="0" x2={(S / 8) * i} y2={S} />
              ))}
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={(S / 8) * i} x2={S} y2={(S / 8) * i} />
              ))}
            </g>
            {/* distance rings */}
            {rings.map((r) => (
              <g key={r}>
                <circle cx={C} cy={C} r={r * scale} fill="none" stroke="#1a1a1a" strokeOpacity="0.12" strokeDasharray="3 5" strokeWidth="1" />
                <text x={C} y={C - r * scale + 13} textAnchor="middle" className="fill-[#1a1a1a]/35" style={{ fontSize: 11, fontWeight: 500 }}>
                  {r < 1 ? `${r * 1000} m` : `${r} km`}
                </text>
              </g>
            ))}
            {/* N compass */}
            <text x={C} y="20" textAnchor="middle" className="fill-[#1a1a1a]/30" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>N</text>

            {/* project centre */}
            <circle cx={C} cy={C} r="34" fill="url(#halo)" />
            <g>
              <circle cx={C} cy={C} r="9" fill="#0B1F1A" />
              <circle cx={C} cy={C} r="9" fill="none" stroke="#B29668" strokeWidth="2" />
              <circle cx={C} cy={C} r="3.2" fill="#B29668" />
            </g>

            {/* POI pins — the invisible ring makes each pin a ~28px touch
                target on phones; tapping toggles the callout, tapping the
                map's empty ground dismisses it */}
            {visible.map((p) => {
              const hot = hover === p.i;
              const col = CAT[p.poi.cat].color;
              return (
                <g key={p.i} transform={`translate(${p.x} ${p.y})`} onMouseEnter={() => setHover(p.i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hot ? null : p.i)} style={{ cursor: "pointer" }}>
                  <circle r="17" fill="transparent" />
                  {hot && <circle r="15" fill={col} fillOpacity="0.18" />}
                  <circle r={hot ? 9 : 6.5} fill={col} stroke="#fff" strokeWidth="1.8" />
                </g>
              );
            })}

            {/* hover callout — drawn last so it sits on top */}
            {hover != null && (() => {
              const p = pts[hover];
              if (!p || !active.has(p.poi.cat)) return null;
              const w = 150, h = 46;
              const left = Math.min(Math.max(p.x - w / 2, 6), S - w - 6);
              const above = p.y - h - 14 > 0;
              const top = above ? p.y - h - 12 : p.y + 12;
              return (
                <g pointerEvents="none">
                  <rect x={left} y={top} width={w} height={h} rx="8" fill="#0B1F1A" />
                  <text x={left + 10} y={top + 18} className="fill-white" style={{ fontSize: 11.5, fontWeight: 600 }}>
                    {p.poi.name.length > 22 ? p.poi.name.slice(0, 21) + "…" : p.poi.name}
                  </text>
                  <text x={left + 10} y={top + 34} className="fill-white/60" style={{ fontSize: 10 }}>
                    {p.d.toFixed(2)} km{p.poi.rating ? ` · ★ ${p.poi.rating}` : ""}
                  </text>
                </g>
              );
            })()}
          </svg>
          <div className="pointer-events-none absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/35">
            <span className="h-[7px] w-[7px] rounded-full ring-2 ring-[#B29668]" style={{ background: "#0B1F1A" }} /> {projectName}
          </div>
        </div>

        {/* synced list */}
        <div className="max-h-[460px] overflow-y-auto p-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {list.map((p) => {
            const hot = hover === p.i;
            return (
              <button key={p.i} onMouseEnter={() => setHover(p.i)} onMouseLeave={() => setHover(null)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${hot ? "bg-[#1a1a1a]/[0.05]" : "hover:bg-[#1a1a1a]/[0.03]"}`}>
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: CAT[p.poi.cat].color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.78rem] font-medium text-[#1a1a1a]/85">{p.poi.name}</span>
                  <span className="block truncate text-[0.66rem] font-light text-[#1a1a1a]/45">{p.poi.sub}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-[0.72rem] font-medium text-[#1a1a1a]/70">{p.d.toFixed(1)} km</span>
                  {p.poi.rating ? <span className="block text-[0.6rem] text-[#9a7a2e]">★ {p.poi.rating}</span> : null}
                </span>
              </button>
            );
          })}
          {list.length === 0 && <p className="px-3 py-8 text-center text-[0.76rem] font-light text-[#1a1a1a]/40">No places in the selected categories.</p>}
        </div>
      </div>
    </div>
  );
}
