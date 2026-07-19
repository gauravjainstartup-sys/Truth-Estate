"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoCat, LocationGeo } from "@/lib/projects";
import OsmLocationMap from "./OsmLocationMap";

const basePath = "/Truth-Estate";
const KEY = process.env.NEXT_PUBLIC_GMAPS_KEY;

/* The Google Maps edition of the location map — the familiar Google look
   (streets + Satellite toggle) under the same coordinate-trust rules:
   exact brand pin only for verified/consistent, soft circle for
   sector-level, suspect never reaches any map. If the key is absent or
   Google fails to load (blocked network, bad key), the free OSM map
   renders instead — the section can never go blank. */

const CAT: Record<GeoCat, { label: string; color: string }> = {
  schools: { label: "Schools", color: "#2f8f5b" },
  offices: { label: "Workspaces", color: "#3f74a6" },
  hospitals: { label: "Hospitals", color: "#c0533e" },
  retail: { label: "Retail & dining", color: "#bf942f" },
  projects: { label: "Landmarks", color: "#8a6d9c" },
};
const CAT_ORDER: GeoCat[] = ["schools", "offices", "hospitals", "retail", "projects"];

type LiveProject = { n: string; s: string; lat: number; lng: number; ts?: number; m?: string; pv?: string };

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
  const [showLive, setShowLive] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!KEY);

  useEffect(() => {
    if (!KEY) return;
    let disposed = false;
    (async () => {
      try {
        const g = await loadGoogle(KEY);
        if (disposed || !holderRef.current || mapRef.current) return;
        const { Map: GMap, InfoWindow, Circle } = await g.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");
        const map = new GMap(holderRef.current, {
          center: { lat: geo.center.lat, lng: geo.center.lng },
          zoom: 15,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: true, // the Map / Satellite toggle
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
        const info = new InfoWindow();
        const open = (marker: any, html: string) => { info.setContent(html); info.open({ map, anchor: marker }); };
        const el = (html: string) => { const d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild as HTMLElement; };

        /* subject — exact pin only when earned; sector-level draws a soft circle */
        if (geo.provenance === "approximate") {
          new Circle({ map, center: { lat: geo.center.lat, lng: geo.center.lng }, radius: 650,
            strokeColor: "#B29668", strokeWeight: 2, fillColor: "#B29668", fillOpacity: 0.14 });
          const m = new AdvancedMarkerElement({ map, position: { lat: geo.center.lat, lng: geo.center.lng }, zIndex: 1000,
            content: el(`<span style="display:block;width:13px;height:13px;border-radius:50%;background:#B29668;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)"></span>`) });
          m.addListener("click", () => open(m, `<b>${projectName}</b><br/>sector-level position — exact plot pending verification`));
        } else {
          const m = new AdvancedMarkerElement({ map, position: { lat: geo.center.lat, lng: geo.center.lng }, zIndex: 1000,
            content: el(`<svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 1C8 1 1 8 1 17c0 11 16 26 16 26s16-15 16-26C33 8 26 1 17 1Z" fill="#0B1F1A" stroke="#B29668" stroke-width="2"/><circle cx="17" cy="17" r="5.5" fill="#B29668"/></svg>`) });
          m.addListener("click", () => open(m, `<b>${projectName}</b><br/>the property under review`));
        }

        /* backend POIs — category dots */
        const layers: Partial<Record<GeoCat, any[]>> = {};
        for (const p of geo.nearby) {
          const km = Math.hypot((p.lat - geo.center.lat) * 111.32, (p.lng - geo.center.lng) * 111.32 * Math.cos((geo.center.lat * Math.PI) / 180));
          const m = new AdvancedMarkerElement({ map, position: { lat: p.lat, lng: p.lng },
            content: el(`<span style="display:block;width:15px;height:15px;border-radius:50%;background:${CAT[p.cat].color};border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`) });
          m.addListener("click", () => open(m, `<b>${p.name}</b><br/>${p.sub ?? CAT[p.cat].label} · ${km.toFixed(1)} km${p.rating ? ` · ★ ${p.rating}` : ""}`));
          (layers[p.cat] ??= []).push(m);
        }
        poiMarkersRef.current = layers;

        /* other live projects — solid diamond = verified/consistent, hollow = sector-level */
        try {
          const res = await fetch(`${basePath}/projects-geo.json`);
          if (res.ok) {
            const data = (await res.json()) as { projects: LiveProject[] };
            for (const lp of data.projects ?? []) {
              if (lp.s === slug) continue;
              const exact = lp.pv === "verified" || lp.pv === "consistent";
              const m = new AdvancedMarkerElement({ map, position: { lat: lp.lat, lng: lp.lng },
                content: el(`<span style="display:block;width:13px;height:13px;transform:rotate(45deg);background:${exact ? "#B29668" : "transparent"};border:${exact ? "2px solid #fff" : "2.5px solid #B29668"};box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`) });
              m.addListener("click", () => open(m, `<b>${lp.n}</b>${lp.m ? `<br/>${lp.m}` : ""}${lp.ts != null ? `<br/>Truth Score ${lp.ts}` : ""}${exact ? "" : "<br/><i>sector-level position</i>"}<br/><a href="${basePath}/intelligence/projects/${lp.s}/">Open report →</a>`));
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
    for (const m of liveMarkersRef.current) m.map = showLive ? map : null;
  }, [showLive, ready]);

  /* expand ⇄ collapse; Escape closes */
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [expanded]);

  if (failed) return <OsmLocationMap geo={geo} projectName={projectName} slug={slug} />;

  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.68rem] font-medium transition-colors ${on ? "text-white shadow-sm" : "border-[#1a1a1a]/15 bg-white/80 text-[#1a1a1a]/45"}`;
  const counts = new Map<GeoCat, number>();
  for (const p of geo.nearby) counts.set(p.cat, (counts.get(p.cat) ?? 0) + 1);

  return (
    <div className={expanded ? "fixed inset-0 z-[120] flex flex-col bg-[#f4f0e8] p-3 md:p-5" : "mt-4"}>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        {CAT_ORDER.filter((c) => counts.get(c)).map((cat) => {
          const on = active.has(cat);
          return (
            <button key={cat} onClick={() => setActive((s) => { const n = new Set(s); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; })}
              className={chip(on)} style={on ? { background: CAT[cat].color, borderColor: CAT[cat].color } : undefined}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: on ? "#fff" : CAT[cat].color }} />
              {CAT[cat].label} {counts.get(cat)}
            </button>
          );
        })}
        <button onClick={() => setShowLive((v) => !v)} className={chip(showLive)} style={showLive ? { background: "#B29668", borderColor: "#B29668" } : undefined}>
          <span className="h-[7px] w-[7px] rotate-45" style={{ background: showLive ? "#fff" : "#B29668" }} />
          Live projects
        </button>
        <button onClick={() => setExpanded((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#1a1a1a]/15 bg-white/90 px-3.5 py-1.5 text-[0.7rem] font-semibold text-[#1a1a1a]/75 shadow-sm transition-colors hover:border-[#B29668]">
          {expanded ? "✕ Close" : "⛶ Expand map"}
        </button>
      </div>
      <div className={`relative overflow-hidden rounded-2xl border border-[#1a1a1a]/10 ${expanded ? "min-h-0 flex-1" : ""}`}>
        <div ref={holderRef} className={expanded ? "h-full w-full" : "h-[380px] w-full md:h-[440px]"} />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-[5] rounded-full border border-[#1a1a1a]/10 bg-white/90 px-3 py-1.5 text-[0.66rem] text-[#5f594e] shadow-sm backdrop-blur">
          <b className="text-[#1a1a1a]">{projectName}</b>{geo.provenance === "approximate" ? " · sector-level position" : " · founder-verified coordinates"}
        </div>
      </div>
    </div>
  );
}
