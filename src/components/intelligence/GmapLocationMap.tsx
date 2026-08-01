"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoCat, LocationGeo } from "@/lib/projects";
import OsmLocationMap from "./OsmLocationMap";
import {
  basePath, CAT_ORDER, kmBetween, MapCard, MapChips, MapStyles,
  poiPinHtml, subjectPinHtml, trackedPinHtml,
  type LiveProject, type MapSel,
} from "./locationMapKit";

const KEY = process.env.NEXT_PUBLIC_GMAPS_KEY;

/* The Google Maps edition of the location map — the familiar Google look
   (streets + Satellite toggle) wearing the founder-approved 2030 chrome:
   the subject announces itself with a labelled brand pill (no corner badge),
   POIs are glyph teardrops that match their chips 1:1, tracked projects come
   in two tiers (ghost = coverage, gold sun = Sun & Vastu 3D live), and every
   pin answers a tap with a bottom card — the only path touch users have.
   Coordinate-trust rules unchanged: exact pin only for verified/consistent,
   soft circle for sector-level, suspect never reaches any map. If the key is
   absent or Google fails to load, the free OSM map renders instead. */

/* one shared loader — the official async bootstrap, no npm dependency */
/* eslint-disable @typescript-eslint/no-explicit-any */
function loadGoogle(key: string): Promise<any> {
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (!w.__gmapsBoot) {
    w.__gmapsBoot = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("gmaps timeout")), 8000);
      w.__gmapsReady = () => { clearTimeout(t); resolve(w.google); };
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=__gmapsReady`;
      s.onerror = () => { clearTimeout(t); reject(new Error("gmaps script error")); };
      document.head.appendChild(s);
    });
  }
  return w.__gmapsBoot;
}

export default function GmapLocationMap({ geo, projectName, slug }: { geo: LocationGeo; projectName: string; slug: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const poiMarkersRef = useRef<Partial<Record<GeoCat, any[]>>>({});
  const liveMarkersRef = useRef<any[]>([]);
  const [active, setActive] = useState<Set<GeoCat>>(new Set(CAT_ORDER));
  const [showTracked, setShowTracked] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [sat, setSat] = useState(false);
  const [sel, setSel] = useState<MapSel | null>(null);
  const selRef = useRef<MapSel | null>(null);
  selRef.current = sel;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!KEY);

  useEffect(() => {
    if (!KEY) return;
    let disposed = false;
    (async () => {
      try {
        const g = await loadGoogle(KEY);
        if (disposed || !holderRef.current || mapRef.current) return;
        const { Map: GMap, Circle } = await g.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");
        const map = new GMap(holderRef.current, {
          center: { lat: geo.center.lat, lng: geo.center.lng },
          zoom: 15,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: false, // we render our own Map / Satellite control
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
        map.addListener("click", () => setSel(null));
        const el = (html: string) => { const d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild as HTMLElement; };
        /* raise a hovered marker above its neighbours so its label wins */
        const hoverRise = (m: any, base: number) => {
          const c: HTMLElement | null = m.content;
          c?.addEventListener("mouseenter", () => { m.zIndex = 5000; });
          c?.addEventListener("mouseleave", () => { m.zIndex = base; });
        };

        /* subject — the self-labelling pill; sector-level adds a soft circle
           under it so an unverified centre never reads as a precise plot */
        const approx = geo.provenance === "approximate";
        if (approx) {
          new Circle({ map, center: { lat: geo.center.lat, lng: geo.center.lng }, radius: 650,
            strokeColor: "#B29668", strokeWeight: 2, fillColor: "#B29668", fillOpacity: 0.14 });
        }
        const sm = new AdvancedMarkerElement({ map, position: { lat: geo.center.lat, lng: geo.center.lng }, zIndex: 1000,
          content: el(subjectPinHtml(projectName)) });
        sm.addListener("click", () => setSel({ kind: "subject", approx }));

        /* backend POIs — glyph teardrops, one colour+icon per category */
        const layers: Partial<Record<GeoCat, any[]>> = {};
        for (const p of geo.nearby) {
          const km = kmBetween(geo.center.lat, geo.center.lng, p.lat, p.lng);
          const m = new AdvancedMarkerElement({ map, position: { lat: p.lat, lng: p.lng }, zIndex: 600,
            content: el(poiPinHtml(p.cat, p.name, km)) });
          m.addListener("click", () => setSel({ kind: "poi", name: p.name, sub: p.sub, cat: p.cat, km, rating: p.rating }));
          hoverRise(m, 600);
          (layers[p.cat] ??= []).push(m);
        }
        poiMarkersRef.current = layers;

        /* tracked projects — two tiers: ghost = under coverage, gold sun =
           Sun & Vastu 3D live (the pulse earns the eye, the tap deep-links) */
        try {
          const res = await fetch(`${basePath}/projects-geo.json`);
          if (res.ok) {
            const data = (await res.json()) as { projects: LiveProject[] };
            for (const lp of data.projects ?? []) {
              if (lp.s === slug) continue;
              const d3 = lp.d3 === 1;
              const exact = lp.pv === "verified" || lp.pv === "consistent";
              const km = kmBetween(geo.center.lat, geo.center.lng, lp.lat, lp.lng);
              const m = new AdvancedMarkerElement({ map, position: { lat: lp.lat, lng: lp.lng }, zIndex: d3 ? 800 : 500,
                content: el(trackedPinHtml(lp.n, d3)) });
              m.addListener("click", () => setSel({ kind: "tracked", name: lp.n, slug: lp.s, seoSlug: lp.q, km, ts: lp.ts, m: lp.m, d3, exact }));
              hoverRise(m, d3 ? 800 : 500);
              liveMarkersRef.current.push(m);
            }
          }
        } catch { /* optional layer */ }

        /* fit the subject + its POIs */
        if (geo.nearby.length) {
          const b = new g.maps.LatLngBounds();
          b.extend({ lat: geo.center.lat, lng: geo.center.lng });
          for (const p of geo.nearby) b.extend({ lat: p.lat, lng: p.lng });
          map.fitBounds(b, 48);
        }
        mapRef.current = map;
        setReady(true);
      } catch {
        if (!disposed) setFailed(true); // blocked / bad key → OSM fallback below
      }
    })();
    return () => { disposed = true; mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* chip toggles */
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    for (const cat of CAT_ORDER) for (const m of poiMarkersRef.current[cat] ?? []) m.map = active.has(cat) ? map : null;
  }, [active, ready]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    for (const m of liveMarkersRef.current) m.map = showTracked ? map : null;
  }, [showTracked, ready]);

  /* our Map / Satellite control drives the engine */
  const setView = (toSat: boolean) => {
    setSat(toSat);
    mapRef.current?.setMapTypeId(toSat ? "hybrid" : "roadmap");
  };

  /* expand ⇄ collapse; Escape closes the card first, then the overlay */
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selRef.current) setSel(null); else setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [expanded]);

  if (failed) return <OsmLocationMap geo={geo} projectName={projectName} slug={slug} />;

  const counts = new Map<GeoCat, number>();
  for (const p of geo.nearby) counts.set(p.cat, (counts.get(p.cat) ?? 0) + 1);

  const glassBtn = sat
    ? "border-white/15 bg-[#12140f]/60 text-white"
    : "border-white/60 bg-white/80 text-[#1a1a1a]";
  const segBtn = (on: boolean) =>
    `rounded-full px-3 py-1 text-[0.66rem] font-bold transition-all ${on ? (sat ? "bg-white text-[#0B1F1A] shadow" : "bg-[#0B1F1A] text-white shadow") : "opacity-70"}`;

  return (
    <div className={expanded ? "fixed inset-0 z-[120] flex flex-col bg-[#f4f0e8] p-3 md:p-5" : "mt-4"}>
      <MapStyles />
      <div className={`relative overflow-hidden rounded-2xl border border-[#1a1a1a]/10 ${expanded ? "min-h-0 flex-1" : ""}`}>
        <div ref={holderRef} className={expanded ? "h-full w-full" : "h-[380px] w-full md:h-[440px]"} />
        <MapChips
          counts={counts} active={active}
          onToggle={(cat) => setActive((s) => { const n = new Set(s); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; })}
          showTracked={showTracked} onToggleTracked={() => setShowTracked((v) => !v)}
          dark={sat}
          right={
            <div className="pointer-events-auto flex flex-none items-center gap-2">
              <div className={`flex items-center gap-0.5 rounded-full border p-1 shadow-[0_6px_22px_rgba(0,0,0,0.18)] backdrop-blur-md ${glassBtn}`}>
                <button className={segBtn(!sat)} onClick={() => setView(false)}>Map</button>
                <button className={segBtn(sat)} onClick={() => setView(true)}>Satellite</button>
              </div>
              <button onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Close full screen" : "Expand map"}
                className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-full border text-[0.8rem] shadow-[0_6px_22px_rgba(0,0,0,0.18)] backdrop-blur-md transition-colors hover:border-[#B29668] ${glassBtn}`}>
                {expanded ? "✕" : "⛶"}
              </button>
            </div>
          }
        />
        {sel && <MapCard sel={sel} projectName={projectName} onClose={() => setSel(null)} />}
      </div>
    </div>
  );
}
