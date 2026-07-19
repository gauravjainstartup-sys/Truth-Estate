"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoCat, LocationGeo } from "@/lib/projects";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

const basePath = "/Truth-Estate";

/* The real-world street map (founder req): the subject project + its backend
   POIs + every live project with coordinates, on free OpenStreetMap tiles.
   Brand divIcon markers (no image assets), a muted tile treatment so the
   cartography stays editorial, category chips, and a full-screen expand. */

const CAT: Record<GeoCat, { label: string; color: string }> = {
  schools: { label: "Schools", color: "#2f8f5b" },
  offices: { label: "Workspaces", color: "#3f74a6" },
  hospitals: { label: "Hospitals", color: "#c0533e" },
  retail: { label: "Retail & dining", color: "#bf942f" },
  projects: { label: "Landmarks", color: "#8a6d9c" },
};
const CAT_ORDER: GeoCat[] = ["schools", "offices", "hospitals", "retail", "projects"];

type LiveProject = { n: string; s: string; lat: number; lng: number; ts?: number; m?: string; pv?: string };

export default function OsmLocationMap({ geo, projectName, slug }: { geo: LocationGeo; projectName: string; slug: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const poiLayersRef = useRef<Partial<Record<GeoCat, LayerGroup>>>({});
  const [active, setActive] = useState<Set<GeoCat>>(new Set(CAT_ORDER));
  const [showLive, setShowLive] = useState(true);
  const liveLayerRef = useRef<LayerGroup | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [tilesDead, setTilesDead] = useState(false);

  /* build the map once */
  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !holderRef.current || mapRef.current) return;
      const map = L.map(holderRef.current, { center: [geo.center.lat, geo.center.lng], zoom: 14, scrollWheelZoom: false, attributionControl: true });
      map.attributionControl.setPrefix(false);
      /* free tile providers, tried in order — some networks/blockers refuse a
         given tile host, so on repeated tile errors (with zero successes) the
         map hops to the next provider instead of showing a blank ground */
      const PROVIDERS: { url: string; attribution: string; options?: Record<string, unknown> }[] = [
        { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
        { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          options: { subdomains: "abcd" } },
        { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          attribution: "Tiles &copy; Esri" },
      ];
      let pi = 0;
      const mountTiles = () => {
        const p = PROVIDERS[pi]; if (!p) { setTilesDead(true); return; }
        let ok = false, bad = 0;
        const layer = L.tileLayer(p.url, { maxZoom: 19, attribution: p.attribution, ...(p.options ?? {}) });
        layer.on("tileload", () => { ok = true; setTilesDead(false); });
        layer.on("tileerror", () => { if (ok) return; if (++bad >= 3) { layer.remove(); pi++; mountTiles(); } });
        layer.addTo(map);
      };
      mountTiles();

      /* subject project — exact pin only when the coordinate has earned it;
         an approximate (sector-level) centre draws as a soft area circle so
         the map never presents an unverified point as a precise plot */
      const approx = geo.provenance === "approximate";
      if (approx) {
        L.circle([geo.center.lat, geo.center.lng], { radius: 650, color: "#B29668", weight: 2, dashArray: "6 8", fillColor: "#B29668", fillOpacity: 0.14 })
          .addTo(map).bindPopup(`<b>${projectName}</b><br/>sector-level position — exact plot pending verification`);
        L.marker([geo.center.lat, geo.center.lng], { zIndexOffset: 1000, icon: L.divIcon({ className: "", html: `<span style="display:block;width:13px;height:13px;border-radius:50%;background:#B29668;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)"></span>`, iconSize: [13, 13], iconAnchor: [6.5, 6.5], popupAnchor: [0, -8] }) })
          .addTo(map).bindPopup(`<b>${projectName}</b><br/>sector-level position — exact plot pending verification`);
      } else {
        const pin = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:34px;height:44px">
            <svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 1C8 1 1 8 1 17c0 11 16 26 16 26s16-15 16-26C33 8 26 1 17 1Z" fill="#0B1F1A" stroke="#B29668" stroke-width="2"/><circle cx="17" cy="17" r="5.5" fill="#B29668"/></svg></div>`,
          iconSize: [34, 44], iconAnchor: [17, 43], popupAnchor: [0, -40],
        });
        L.marker([geo.center.lat, geo.center.lng], { icon: pin, zIndexOffset: 1000 })
          .addTo(map).bindPopup(`<b>${projectName}</b><br/>the property under review`);
      }

      /* backend POIs, one toggleable layer per category */
      const dot = (color: string) => L.divIcon({
        className: "",
        html: `<span style="display:block;width:15px;height:15px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
        iconSize: [15, 15], iconAnchor: [7.5, 7.5], popupAnchor: [0, -8],
      });
      const layers: Partial<Record<GeoCat, LayerGroup>> = {};
      for (const p of geo.nearby) {
        const lg = (layers[p.cat] ??= L.layerGroup().addTo(map));
        const km = Math.hypot((p.lat - geo.center.lat) * 111.32, (p.lng - geo.center.lng) * 111.32 * Math.cos((geo.center.lat * Math.PI) / 180));
        L.marker([p.lat, p.lng], { icon: dot(CAT[p.cat].color) })
          .addTo(lg).bindPopup(`<b>${p.name}</b><br/>${p.sub ?? CAT[p.cat].label} · ${km.toFixed(1)} km${p.rating ? ` · ★ ${p.rating}` : ""}`);
      }
      poiLayersRef.current = layers;

      /* other live projects (build-emitted geo layer) */
      const liveLayer = L.layerGroup().addTo(map);
      liveLayerRef.current = liveLayer;
      try {
        const res = await fetch(`${basePath}/projects-geo.json`);
        if (res.ok) {
          const data = (await res.json()) as { projects: LiveProject[] };
          /* solid diamond = verified/consistent coordinate; hollow = sector-level */
          const sq = (exact: boolean) => L.divIcon({
            className: "",
            html: `<span style="display:block;width:13px;height:13px;transform:rotate(45deg);background:${exact ? "#B29668" : "transparent"};border:${exact ? "2px solid #fff" : "2.5px solid #B29668"};box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
            iconSize: [13, 13], iconAnchor: [6.5, 6.5], popupAnchor: [0, -8],
          });
          for (const lp of data.projects ?? []) {
            if (lp.s === slug) continue;
            const exact = lp.pv === "verified" || lp.pv === "consistent";
            L.marker([lp.lat, lp.lng], { icon: sq(exact) })
              .addTo(liveLayer)
              .bindPopup(`<b>${lp.n}</b>${lp.m ? `<br/>${lp.m}` : ""}${lp.ts != null ? `<br/>Truth Score ${lp.ts}` : ""}${exact ? "" : "<br/><i>sector-level position</i>"}<br/><a href="${basePath}/intelligence/projects/${lp.s}/">Open report →</a>`);
          }
        }
      } catch { /* the layer is optional — the map stands without it */ }

      /* fit: the subject + its POIs */
      const pts: [number, number][] = [[geo.center.lat, geo.center.lng], ...geo.nearby.map((p) => [p.lat, p.lng] as [number, number])];
      if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.18));
      mapRef.current = map;
      setReady(true);
    })();
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* category chip toggles drive layer visibility */
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    for (const cat of CAT_ORDER) {
      const lg = poiLayersRef.current[cat]; if (!lg) continue;
      if (active.has(cat)) { if (!map.hasLayer(lg)) map.addLayer(lg); }
      else if (map.hasLayer(lg)) map.removeLayer(lg);
    }
  }, [active, ready]);
  useEffect(() => {
    const map = mapRef.current, lg = liveLayerRef.current; if (!map || !lg) return;
    if (showLive) { if (!map.hasLayer(lg)) map.addLayer(lg); }
    else if (map.hasLayer(lg)) map.removeLayer(lg);
  }, [showLive, ready]);

  /* expand ⇄ collapse re-measures the map; Escape collapses */
  useEffect(() => {
    mapRef.current?.invalidateSize();
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 320);
    if (!expanded) return () => clearTimeout(t);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [expanded]);

  const chip = (on: boolean, color: string) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.68rem] font-medium transition-colors ${on ? "text-white shadow-sm" : "border-[#1a1a1a]/15 bg-white/80 text-[#1a1a1a]/45"}`;

  const counts = new Map<GeoCat, number>();
  for (const p of geo.nearby) counts.set(p.cat, (counts.get(p.cat) ?? 0) + 1);

  return (
    <div className={expanded ? "fixed inset-0 z-[120] flex flex-col bg-[#f4f0e8] p-3 md:p-5" : "mt-4"}>
      <div className={`flex flex-wrap items-center gap-2 ${expanded ? "pb-3" : "pb-3"}`}>
        {CAT_ORDER.filter((c) => counts.get(c)).map((cat) => {
          const on = active.has(cat);
          return (
            <button key={cat} onClick={() => setActive((s) => { const n = new Set(s); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; })}
              className={chip(on, CAT[cat].color)} style={on ? { background: CAT[cat].color, borderColor: CAT[cat].color } : undefined}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: on ? "#fff" : CAT[cat].color }} />
              {CAT[cat].label} {counts.get(cat)}
            </button>
          );
        })}
        <button onClick={() => setShowLive((v) => !v)} className={chip(showLive, "#B29668")} style={showLive ? { background: "#B29668", borderColor: "#B29668" } : undefined}>
          <span className="h-[7px] w-[7px] rotate-45" style={{ background: showLive ? "#fff" : "#B29668" }} />
          Live projects
        </button>
        <button onClick={() => setExpanded((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#1a1a1a]/15 bg-white/90 px-3.5 py-1.5 text-[0.7rem] font-semibold text-[#1a1a1a]/75 shadow-sm transition-colors hover:border-[#B29668]">
          {expanded ? "✕ Close" : "⛶ Expand map"}
        </button>
      </div>
      <div className={`relative overflow-hidden rounded-2xl border border-[#1a1a1a]/10 ${expanded ? "min-h-0 flex-1" : ""}`}>
        <div ref={holderRef} className={expanded ? "h-full w-full" : "h-[380px] w-full md:h-[440px]"} style={{ filter: "saturate(0.72) contrast(0.97)" }} />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-[500] rounded-full border border-[#1a1a1a]/10 bg-white/90 px-3 py-1.5 text-[0.66rem] text-[#5f594e] shadow-sm backdrop-blur">
          <b className="text-[#1a1a1a]">{projectName}</b>{geo.provenance === "approximate" ? " · sector-level position" : " · pins from verified coordinates"}
        </div>
        {tilesDead && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full border border-[#1a1a1a]/10 bg-white/95 px-4 py-2 text-[0.7rem] font-medium text-[#7a5c1e] shadow-sm">
            Street imagery is being blocked on this network — pin positions remain exact.
          </div>
        )}
      </div>
    </div>
  );
}
