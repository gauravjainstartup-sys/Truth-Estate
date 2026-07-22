"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LocEntity,
  idsFromMarkets,
  locationById,
  marketsFromIds,
  popularLocations,
  searchLocations,
} from "@/lib/locations";

const GMAPS_KEY = process.env.NEXT_PUBLIC_GMAPS_KEY ?? "";
const BIAS = { latitude: 28.45, longitude: 77.03 };

type Poi = { lat: number; lng: number; label: string };
type PlaceHit = { placeId: string; main: string; secondary: string };

export default function LocationPicker({
  value,
  onChange,
  poi,
  onPoiChange,
}: {
  value: string[];
  onChange: (markets: string[]) => void;
  poi?: Poi | null;
  onPoiChange?: (poi: Poi | null) => void;
}) {
  const [ids, setIds] = useState<string[]>(() => idsFromMarkets(value));
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selected = useMemo(
    () => ids.map((id) => locationById(id)).filter(Boolean) as LocEntity[],
    [ids]
  );
  const results = useMemo(() => searchLocations(query), [query]);
  const popular = useMemo(() => popularLocations(), []);

  useEffect(() => {
    if (results.length > 0 || query.trim().length < 3 || !GMAPS_KEY) {
      setPlaces([]);
      return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GMAPS_KEY },
          body: JSON.stringify({
            input: query,
            locationBias: { circle: { center: BIAS, radius: 30000 } },
          }),
        });
        if (!res.ok) { setPlaces([]); return; }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();
        setPlaces(
          (data.suggestions ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s: any) => s.placePrediction?.placeId)
            .slice(0, 5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((s: any) => ({
              placeId: s.placePrediction.placeId,
              main: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? "",
              secondary: s.placePrediction.structuredFormat?.secondaryText?.text ?? "",
            })),
        );
      } catch { setPlaces([]); }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [query, results.length]);

  const pickPlace = useCallback(async (hit: PlaceHit) => {
    if (!onPoiChange) return;
    setQuery("");
    setPlaces([]);
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${hit.placeId}`,
        { headers: { "X-Goog-Api-Key": GMAPS_KEY, "X-Goog-FieldMask": "location" } },
      );
      if (!res.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (data.location) {
        onPoiChange({ lat: data.location.latitude, lng: data.location.longitude, label: hit.main });
      }
    } catch { /* silent */ }
  }, [onPoiChange]);

  const isSelected = (id: string) => ids.includes(id);

  const commit = (next: string[]) => {
    setIds(next);
    onChange(marketsFromIds(next));
  };

  const add = (e: LocEntity) => {
    if (e.status !== "live" || ids.includes(e.id)) return;
    commit([...ids, e.id]);
    setQuery("");
    inputRef.current?.focus();
  };

  const remove = (id: string) => commit(ids.filter((x) => x !== id));

  const toggle = (e: LocEntity) => {
    if (e.status !== "live") return;
    if (ids.includes(e.id)) remove(e.id);
    else add(e);
  };

  const hasSelected = selected.length > 0 || !!poi;

  return (
    <div>
      {/* ── Search ── */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search an area or landmark…"
          className="w-full truncate border-b-2 border-[#1a1a1a]/15 bg-transparent py-4 font-serif text-[1.1rem] font-light text-[#1a1a1a] outline-none transition-colors duration-300 placeholder:text-[#1a1a1a]/30 focus:border-[#1e6b45]/50 md:text-[1.35rem]"
        />
        {query.trim() && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[300px] overflow-y-auto rounded-lg border border-[#1a1a1a]/12 bg-[#F5F0E8] shadow-xl shadow-black/[0.06]">
            {results.length > 0
              ? results.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => add(e)}
                    disabled={e.status !== "live"}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors duration-200 ${
                      e.status === "live" ? "hover:bg-[#1e6b45]/[0.06]" : "cursor-not-allowed"
                    }`}
                  >
                    <span className="min-w-0">
                      <span
                        className={`text-[0.98rem] font-light ${
                          e.status === "live" ? "text-[#1a1a1a]/80" : "text-[#1a1a1a]/40"
                        }`}
                      >
                        {e.name}
                      </span>
                      {e.kind === "landmark" && e.status === "live" ? (
                        <span className="ml-2 text-[0.78rem] font-light text-[#1a1a1a]/40">
                          → {e.resolvesTo[0]}
                        </span>
                      ) : e.hint ? (
                        <span className="ml-2 text-[0.78rem] font-light text-[#1a1a1a]/35">{e.hint}</span>
                      ) : null}
                    </span>
                    {e.status === "live" ? (
                      isSelected(e.id) ? (
                        <span className="shrink-0 text-[0.8rem] font-light text-[#1e6b45]">✓ Added</span>
                      ) : (
                        <span className="shrink-0 text-[0.8rem] font-light text-[#1a1a1a]/30">Add</span>
                      )
                    ) : (
                      <SoonBadge />
                    )}
                  </button>
                ))
              : places.length > 0
              ? places.map((h) => (
                  <button
                    key={h.placeId}
                    onClick={() => pickPlace(h)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors duration-200 hover:bg-[#1e6b45]/[0.06]"
                  >
                    <span className="min-w-0">
                      <span className="text-[0.98rem] font-light text-[#1a1a1a]/80">{h.main}</span>
                      {h.secondary && (
                        <span className="ml-2 text-[0.78rem] font-light text-[#1a1a1a]/40">{h.secondary}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-[0.8rem] font-light text-[#1a1a1a]/30">Add</span>
                  </button>
                ))
              : (
                <p className="px-5 py-4 text-[0.9rem] font-light text-[#1a1a1a]/45">
                  No match yet — we&rsquo;re expanding city by city.
                </p>
              )}
          </div>
        )}
      </div>

      {/* ── Selected ── */}
      {hasSelected && (
        <div className="mt-7">
          <p className="mb-3 text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">Selected</p>
          <div className="flex flex-wrap gap-2.5">
            {poi && onPoiChange && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#9a7a2e] bg-[#9a7a2e] py-2 pl-4 pr-2.5 text-[0.85rem] font-light text-white shadow-sm shadow-black/10">
                {poi.label}
                <button
                  onClick={() => onPoiChange(null)}
                  aria-label={`Remove ${poi.label}`}
                  className="grid h-4 w-4 place-items-center rounded-full text-[0.9rem] leading-none text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            {selected.map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center gap-2 rounded-full border border-[#1e6b45] bg-[#1e6b45] py-2 pl-4 pr-2.5 text-[0.85rem] font-light text-white shadow-sm shadow-black/10"
              >
                {e.name}
                {e.kind === "landmark" && <span className="text-white/65">· {e.resolvesTo[0]}</span>}
                <button
                  onClick={() => remove(e.id)}
                  aria-label={`Remove ${e.name}`}
                  className="grid h-4 w-4 place-items-center rounded-full text-[0.9rem] leading-none text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Popular quick-taps ── */}
      <div className="mt-8">
        <p className="mb-3 text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">Popular right now</p>
        <div className="flex flex-wrap gap-3">
          {popular.map((e) => {
            const sel = isSelected(e.id);
            const soon = e.status !== "live";
            return (
              <button
                key={e.id}
                onClick={() => toggle(e)}
                disabled={soon}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[0.85rem] font-light tracking-[0.02em] transition-all duration-300 md:text-[0.95rem] ${
                  sel
                    ? "border-[#1e6b45] bg-[#1e6b45] text-white shadow-md shadow-black/10"
                    : soon
                    ? "cursor-not-allowed border-[#1a1a1a]/10 text-[#1a1a1a]/30"
                    : "border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/45 hover:text-[#1a1a1a]"
                }`}
              >
                {e.name}
                {soon && <SoonBadge />}
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/40">
          Prefer to skip? Leave it blank — we&rsquo;ll guide you to the right micro-market.
        </p>
      </div>
    </div>
  );
}

function SoonBadge() {
  return (
    <span className="shrink-0 rounded-full bg-[#c9a96e]/15 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#c9a96e]">
      Soon
    </span>
  );
}
