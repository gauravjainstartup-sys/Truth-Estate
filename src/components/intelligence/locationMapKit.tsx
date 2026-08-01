"use client";

import type { GeoCat } from "@/lib/projects";
import { projectHref } from "@/lib/projectHref";
import { basePath } from "@/lib/site";

/* Shared kit for the two street-map editions (Google + OSM fallback), so the
   founder-approved 2030 treatment exists exactly once: category glyphs that
   ride both the chip and the pin, the self-labelling subject pill (replaces
   the old "founder-verified coordinates" badge), the two-tier Tracked layer
   (ghost = coverage, gold sun = Sun & Vastu 3D live — the conversion tier),
   and the tap card that replaces hover popups on touch. */


/* ── category meta — chip and pin share glyph + colour 1:1 ─────────── */
export const CAT: Record<GeoCat, { label: string; color: string; glyph: string }> = {
  schools: { label: "Schools", color: "#2f8f5b", glyph: "school" },
  offices: { label: "Offices", color: "#3f74a6", glyph: "office" },
  hospitals: { label: "Hospitals", color: "#c0533e", glyph: "hosp" },
  retail: { label: "Shops & food", color: "#bf942f", glyph: "retail" },
  projects: { label: "Landmarks", color: "#8a6d9c", glyph: "flag" },
};
export const CAT_ORDER: GeoCat[] = ["schools", "offices", "hospitals", "retail", "projects"];

export type LiveProject = { n: string; s: string; lat: number; lng: number; ts?: number; m?: string; pv?: string; d3?: number };

/* ── glyph library (24-box stroke icons, inherit currentColor) ─────── */
const GLYPHS: Record<string, string> = {
  school: '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M6 10.5V15c0 0 2.5 2 6 2s6-2 6-2v-4.5"/>',
  office: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><path d="M3 12.5h18"/>',
  hosp: '<path d="M12 7v10M7 12h10"/>',
  retail: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 3.5L16 11H5"/>',
  bldg: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  track: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 11.5v1"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
};
export const glyphSvg = (name: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[name] ?? ""}</svg>`;
const GlyphIcon = ({ name, className }: { name: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}
    dangerouslySetInnerHTML={{ __html: GLYPHS[name] ?? "" }} />
);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── pin HTML builders (plain DOM strings → gmaps content / leaflet divIcon) ── */
export function subjectPinHtml(name: string): string {
  return `<div class="tem-pin tem-subject">
    <span class="tem-halo"></span>
    <span class="tem-spill"><span class="tem-smk">${glyphSvg("home")}</span><span class="tem-snm">${esc(name)}</span></span>
    <span class="tem-stem"></span>
  </div>`;
}
export function poiPinHtml(cat: GeoCat, name: string, km: number): string {
  const c = CAT[cat];
  return `<div class="tem-pin">
    <span class="tem-tear" style="background:${c.color}">${glyphSvg(c.glyph)}</span>
    <span class="tem-lbl">${esc(name)}<span class="tem-d">${km.toFixed(1)} km</span></span>
  </div>`;
}
export function trackedPinHtml(name: string, d3: boolean): string {
  if (d3)
    return `<div class="tem-pin tem-p3">
      <span class="tem-ring"></span>
      <span class="tem-tear tem-sunpin">${glyphSvg("sun")}</span>
      <span class="tem-lbl">${esc(name)}<span class="tem-tag3">Sun &amp; Vastu 3D</span></span>
    </div>`;
  return `<div class="tem-pin">
    <span class="tem-tear tem-ghost">${glyphSvg("bldg")}</span>
    <span class="tem-lbl">${esc(name)}</span>
  </div>`;
}

/* equirectangular distance — same maths the old popups used, kept so pins
   and cards never disagree with the radar's stated distances */
export const kmBetween = (aLat: number, aLng: number, bLat: number, bLng: number) =>
  Math.hypot((bLat - aLat) * 111.32, (bLng - aLng) * 111.32 * Math.cos((aLat * Math.PI) / 180));

/* ── selection → the tap card (replaces popups; the only mobile path) ── */
export type MapSel =
  | { kind: "subject"; approx: boolean }
  | { kind: "poi"; name: string; sub?: string; cat: GeoCat; km: number; rating?: number }
  | { kind: "tracked"; name: string; slug: string; km: number; ts?: number; m?: string; d3: boolean; exact: boolean };

export function MapCard({ sel, projectName, onClose }: { sel: MapSel; projectName: string; onClose: () => void }) {
  return (
    <div className="absolute bottom-3 left-3 z-[600] w-[min(340px,calc(100%-24px))] rounded-2xl border border-[#1a1a1a]/10 bg-white/95 p-4 shadow-[0_14px_44px_-12px_rgba(20,18,12,0.45)] backdrop-blur">
      <button onClick={onClose} aria-label="Close"
        className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full text-[#1a1a1a]/45 transition-colors hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a]">✕</button>
      {sel.kind === "subject" && (
        <>
          <div className="pr-6 text-[0.9rem] font-bold text-[#0B1F1A]">{projectName}</div>
          <div className="mt-0.5 text-[0.72rem] text-[#5f594e]">
            {sel.approx ? "Shown at sector level — exact plot pending verification" : "The property under review"}
          </div>
        </>
      )}
      {sel.kind === "poi" && (
        <>
          <div className="flex items-start gap-2.5 pr-6">
            <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full text-white" style={{ background: CAT[sel.cat].color }}>
              <GlyphIcon name={CAT[sel.cat].glyph} className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[0.85rem] font-bold leading-snug text-[#1a1a1a]">{sel.name}</div>
              <div className="mt-0.5 text-[0.7rem] text-[#5f594e]">
                {sel.sub || CAT[sel.cat].label} · {sel.km.toFixed(1)} km{sel.rating ? ` · ★ ${sel.rating}` : ""}
              </div>
            </div>
          </div>
        </>
      )}
      {sel.kind === "tracked" && (
        <>
          <div className="flex items-start justify-between gap-2 pr-5">
            <div className="text-[0.85rem] font-bold leading-snug text-[#1a1a1a]">{sel.name}</div>
            {sel.ts != null && (
              <span className="mt-0.5 flex-none rounded-full bg-[#B29668]/15 px-2 py-0.5 text-[0.6rem] font-extrabold tracking-wide text-[#8a6f3e]">
                Truth Score {sel.ts}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-[#5f594e]">
            {sel.m ? `${sel.m} · ` : ""}{sel.km.toFixed(1)} km from {projectName}{sel.exact ? "" : " · sector-level position"}
          </div>
          <div className="mt-3 flex gap-2">
            {sel.d3 && (
              <a href={`${projectHref(sel)}/#tower-intel`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#B29668] bg-[#0B1F1A] px-3 py-2.5 text-[0.72rem] font-bold text-white transition-opacity hover:opacity-90">
                <GlyphIcon name="sun" className="h-3.5 w-3.5 text-[#B29668]" />
                Sun &amp; Vastu 3D
              </a>
            )}
            <a href={`${basePath}/intelligence/projects/${sel.slug}/`}
              className={`inline-flex items-center justify-center rounded-xl border border-[#1a1a1a]/15 px-3 py-2.5 text-[0.72rem] font-semibold text-[#1a1a1a] transition-colors hover:border-[#B29668] ${sel.d3 ? "flex-none" : "flex-1"}`}>
              {sel.d3 ? "Report" : "Open report →"}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ── the frosted control bar (chips left, view controls right) ─────── */
export function MapChips({ counts, active, onToggle, showTracked, onToggleTracked, dark, right }: {
  counts: Map<GeoCat, number>;
  active: Set<GeoCat>;
  onToggle: (c: GeoCat) => void;
  showTracked: boolean;
  onToggleTracked: () => void;
  dark: boolean; // satellite view → dark glass
  right?: React.ReactNode;
}) {
  const glass = dark ? "border-white/15 bg-[#12140f]/60 text-white" : "border-white/60 bg-white/80 text-[#1a1a1a]";
  const chip = (on: boolean) =>
    `inline-flex flex-none items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[0.68rem] font-semibold transition-all ${on ? "" : "opacity-50"}`;
  const ic = (on: boolean, color: string): React.CSSProperties =>
    on ? { background: color, color: "#fff" } : { background: dark ? "rgba(255,255,255,.18)" : "rgba(20,18,12,.12)", color: "inherit" };
  return (
    <div className="pointer-events-none absolute left-2.5 right-2.5 top-2.5 z-[600] flex items-start gap-2">
      <div className={`pointer-events-auto flex max-w-full flex-1 items-center gap-0.5 overflow-x-auto rounded-full border p-1 shadow-[0_6px_22px_rgba(0,0,0,0.18)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${glass}`}>
        {CAT_ORDER.filter((c) => counts.get(c)).map((cat) => {
          const on = active.has(cat);
          return (
            <button key={cat} onClick={() => onToggle(cat)} className={chip(on)} aria-pressed={on}>
              <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full transition-colors" style={ic(on, CAT[cat].color)}>
                <GlyphIcon name={CAT[cat].glyph} className="h-3 w-3" />
              </span>
              <span className="whitespace-nowrap">{CAT[cat].label} <span className="opacity-70">{counts.get(cat)}</span></span>
            </button>
          );
        })}
        <button onClick={onToggleTracked} className={chip(showTracked)} aria-pressed={showTracked}>
          <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full transition-colors" style={ic(showTracked, "#B29668")}>
            <GlyphIcon name="track" className="h-3 w-3" />
          </span>
          <span className="whitespace-nowrap">Tracked</span>
        </button>
      </div>
      {right}
    </div>
  );
}

/* ── marker CSS — one copy, both map engines ───────────────────────── */
export const MAP_CSS = `
.tem-anchor{position:absolute;left:0;top:0;transform:translate(-50%,-100%)}
.tem-pin{position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer}
.tem-tear{width:34px;height:34px;border-radius:50% 50% 50% 3px;transform:rotate(45deg);display:grid;place-items:center;
  border:2.5px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.38),0 1px 3px rgba(0,0,0,.3);margin-bottom:5px}
.tem-tear svg{transform:rotate(-45deg);width:17px;height:17px;color:#fff;display:block}
.tem-ghost{width:26px;height:26px;background:rgba(255,255,255,.94);border-color:#B29668}
.tem-ghost svg{width:13px;height:13px;color:#8a6f3e}
.tem-sunpin{width:36px;height:36px;background:linear-gradient(135deg,#c9a96b,#9a7a45);border-color:#fff}
.tem-ring{position:absolute;left:50%;bottom:-2px;width:54px;height:54px;transform:translate(-50%,50%);border-radius:50%;
  border:2px solid rgba(178,150,104,.9);animation:tem-ring 2.8s ease-out infinite;pointer-events:none}
@keyframes tem-ring{0%{transform:translate(-50%,50%) scale(.5);opacity:.9}100%{transform:translate(-50%,50%) scale(1.45);opacity:0}}
.tem-lbl{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);white-space:nowrap;
  background:rgba(18,20,16,.92);color:#fff;font-size:.66rem;font-weight:600;padding:5px 9px;border-radius:8px;
  opacity:0;pointer-events:none;transition:opacity .15s ease;box-shadow:0 4px 14px rgba(0,0,0,.35);z-index:5}
.tem-pin:hover .tem-lbl{opacity:1}
.tem-d{opacity:.65;font-weight:500;margin-left:5px;font-variant-numeric:tabular-nums}
.tem-tag3{display:inline-block;background:#B29668;color:#0B1F1A;font-weight:800;font-size:.58rem;padding:2px 6px;border-radius:5px;margin-left:6px;vertical-align:1px}
.tem-spill{position:relative;display:inline-flex;align-items:center;gap:8px;background:#0B1F1A;color:#fff;
  border:1.5px solid #B29668;border-radius:999px;padding:6px 13px 6px 7px;box-shadow:0 8px 22px rgba(0,0,0,.4);z-index:2}
.tem-smk{width:24px;height:24px;border-radius:50%;background:#B29668;display:grid;place-items:center;flex:none}
.tem-smk svg{width:14px;height:14px;color:#0B1F1A;display:block}
.tem-snm{font-size:.74rem;font-weight:700;letter-spacing:.01em;white-space:nowrap}
.tem-stem{width:2px;height:9px;background:#B29668}
.tem-halo{position:absolute;left:50%;bottom:-5px;width:64px;height:64px;transform:translate(-50%,50%);border-radius:50%;
  background:radial-gradient(closest-side,rgba(178,150,104,.5),rgba(178,150,104,0));animation:tem-halo 2.8s ease-in-out infinite;pointer-events:none}
@keyframes tem-halo{0%,100%{transform:translate(-50%,50%) scale(.8);opacity:.55}50%{transform:translate(-50%,50%) scale(1.25);opacity:.2}}
@media (prefers-reduced-motion:reduce){.tem-ring{animation:none;opacity:.35}.tem-halo{animation:none;opacity:.35}}
`;

export const MapStyles = () => <style dangerouslySetInnerHTML={{ __html: MAP_CSS }} />;

export { basePath };
