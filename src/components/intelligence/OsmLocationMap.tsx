"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoCat, LocationGeo } from "@/lib/projects";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  basePath, CAT_ORDER, kmBetween, MapCard, MapChips, MapStyles,
  poiPinHtml, subjectPinHtml, trackedPinHtml,
  type LiveProject, type MapSel,
} from "./locationMapKit";

/* The free OSM edition of the location map — same founder-approved chrome as
   the Google edition (self-labelling subject pill, glyph teardrop POIs,
   two-tier Tracked layer, tap cards), on OpenStreetMap tiles with the
   provider-fallback chain for blocked networks. Renders when no Google key
   is baked, or as the runtime fallback when Google fails to load. */

export default function OsmLocationMap({ geo, projectName, slug }: { geo: LocationGeo; projectName: string; slug: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const poiLayersRef = useRef<Partial<Record<GeoCat, LayerGroup>>>({});
  const [active, setActive] = useState<Set<GeoCat>>(new Set(CAT_ORDER));
  const [showTracked, setShowTracked] = useState(true);
  const liveLayerRef = useRef<LayerGroup | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sel, setSel] = useState<MapSel | null>(null);
  const selRef = useRef<MapSel | null>(null);
  selRef.current = sel;
  const [ready, setReady] = useState(false);
  const [tilesDead, setTilesDead] = useState(false);

  /* build the map once */
  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !holderRef.current || mapRef.current) return;
      const map = L.map(holderRef.current, {
        center: [geo.center.lat, geo.center.lng], zoom: 14,
        scrollWheelZoom: false, attributionControl: true,
        zoomControl: false, // default top-left sits under the floating chip bar
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      map.attributionControl.setPrefix(false);
      map.on("click", () => setSel(null));
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

      /* kit pin HTML → a Leaflet divIcon anchored at its bottom-centre tip */
      const pinIcon = (html: string) => L.divIcon({
        className: "", html: `<div class="tem-anchor">${html}</div>`, iconSize: [0, 0], iconAnchor: [0, 0],
      });

      /* subject — the self-labelling pill; sector-level adds a soft circle
         under it so an unverified centre never reads as a precise plot */
      const approx = geo.provenance === "approximate";
      if (approx) {
        L.circle([geo.center.lat, geo.center.lng], { radius: 650, color: "#B29668", weight: 2, dashArray: "6 8", fillColor: "#B29668", fillOpacity: 0.14 }).addTo(map);
      }
      L.marker([geo.center.lat, geo.center.lng], { icon: pinIcon(subjectPinHtml(projectName)), zIndexOffset: 1000 })
        .addTo(map).on("click", () => setSel({ kind: "subject", approx }));

      /* backend POIs — glyph teardrops, one toggleable layer per category */
      const layers: Partial<Record<GeoCat, LayerGroup>> = {};
      for (const p of geo.nearby) {
        const lg = (layers[p.cat] ??= L.layerGroup().addTo(map));
        const km = kmBetween(geo.center.lat, geo.center.lng, p.lat, p.lng);
        L.marker([p.lat, p.lng], { icon: pinIcon(poiPinHtml(p.cat, p.name, km)), riseOnHover: true })
          .addTo(lg).on("click", () => setSel({ kind: "poi", name: p.name, sub: p.sub, cat: p.cat, km, rating: p.rating }));
      }
      poiLayersRef.current = layers;

      /* tracked projects — two tiers: ghost = under coverage, gold sun =
         Sun & Vastu 3D live (the pulse earns the eye, the tap deep-links) */
      const liveLayer = L.layerGroup().addTo(map);
      liveLayerRef.current = liveLayer;
      try {
        const res = await fetch(`${basePath}/projects-geo.json`);
        if (res.ok) {
          const data = (await res.json()) as { projects: LiveProject[] };
          for (const lp of data.projects ?? []) {
            if (lp.s === slug) continue;
            const d3 = lp.d3 === 1;
            const exact = lp.pv === "verified" || lp.pv === "consistent";
            const km = kmBetween(geo.center.lat, geo.center.lng, lp.lat, lp.lng);
            L.marker([lp.lat, lp.lng], { icon: pinIcon(trackedPinHtml(lp.n, d3)), riseOnHover: true, zIndexOffset: d3 ? 800 : 0 })
              .addTo(liveLayer).on("click", () => setSel({ kind: "tracked", name: lp.n, slug: lp.s, seoSlug: lp.q, km, ts: lp.ts, m: lp.m, d3, exact }));
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
    if (showTracked) { if (!map.hasLayer(lg)) map.addLayer(lg); }
    else if (map.hasLayer(lg)) map.removeLayer(lg);
  }, [showTracked, ready]);

  /* expand ⇄ collapse re-measures the map; Escape closes card, then overlay */
  useEffect(() => {
    mapRef.current?.invalidateSize();
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 320);
    if (!expanded) return () => clearTimeout(t);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selRef.current) setSel(null); else setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [expanded]);

  const counts = new Map<GeoCat, number>();
  for (const p of geo.nearby) counts.set(p.cat, (counts.get(p.cat) ?? 0) + 1);

  return (
    <div className={expanded ? "fixed inset-0 z-[120] flex flex-col bg-[#f4f0e8] p-3 md:p-5" : "mt-4"}>
      <MapStyles />
      <div className={`relative overflow-hidden rounded-2xl border border-[#1a1a1a]/10 ${expanded ? "min-h-0 flex-1" : ""}`}>
        <div ref={holderRef} className={expanded ? "h-full w-full" : "h-[380px] w-full md:h-[440px]"} style={{ filter: "saturate(0.72) contrast(0.97)" }} />
        <MapChips
          counts={counts} active={active}
          onToggle={(cat) => setActive((s) => { const n = new Set(s); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; })}
          showTracked={showTracked} onToggleTracked={() => setShowTracked((v) => !v)}
          dark={false}
          right={
            <button onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Close full screen" : "Expand map"}
              className="pointer-events-auto grid h-[34px] w-[34px] flex-none place-items-center rounded-full border border-white/60 bg-white/80 text-[0.8rem] text-[#1a1a1a] shadow-[0_6px_22px_rgba(0,0,0,0.18)] backdrop-blur-md transition-colors hover:border-[#B29668]">
              {expanded ? "✕" : "⛶"}
            </button>
          }
        />
        {sel && <MapCard sel={sel} projectName={projectName} onClose={() => setSel(null)} />}
        {tilesDead && (
          <div className="pointer-events-none absolute left-1/2 top-14 z-[500] w-max max-w-[90%] -translate-x-1/2 rounded-full border border-[#1a1a1a]/10 bg-white/95 px-4 py-2 text-[0.7rem] font-medium text-[#7a5c1e] shadow-sm">
            Street imagery is being blocked on this network — pin positions remain exact.
          </div>
        )}
      </div>
    </div>
  );
}
