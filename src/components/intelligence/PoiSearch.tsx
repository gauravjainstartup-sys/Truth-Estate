"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = process.env.NEXT_PUBLIC_GMAPS_KEY ?? "";
export const POI_ENABLED = !!KEY;

const BIAS = { latitude: 28.45, longitude: 77.03 };
const RADIUS = 30000;

export type Poi = { lat: number; lng: number; label: string };

type Suggestion = { placeId: string; main: string; secondary: string };

export default function PoiSearch({
  value,
  onChange,
}: {
  value: Poi | null;
  onChange: (poi: Poi | null) => void;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value?.label ?? ""); }, [value]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const search = useCallback(async (input: string) => {
    if (input.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY },
        body: JSON.stringify({
          input,
          locationBias: { circle: { center: BIAS, radius: RADIUS } },
        }),
      });
      if (!res.ok) { setSuggestions([]); return; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      setSuggestions(
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
      setOpen(true);
    } catch { setSuggestions([]); }
  }, []);

  const pick = useCallback(async (s: Suggestion) => {
    setOpen(false);
    setQuery(s.main);
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${s.placeId}`,
        { headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "location" } },
      );
      if (!res.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (data.location) {
        onChange({ lat: data.location.latitude, lng: data.location.longitude, label: s.main });
      }
    } catch { /* silent */ }
  }, [onChange]);

  const handleInput = (val: string) => {
    setQuery(val);
    if (!val.trim()) { onChange(null); setSuggestions([]); setOpen(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 300);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          placeholder="Near a landmark…"
          className="w-full rounded-full border border-black/[0.12] bg-white/80 py-2 pl-3.5 pr-8 text-[0.8rem] font-light outline-none placeholder:text-black/30 focus:border-[#1e6b45]"
        />
        {(value || query) && (
          <button
            type="button"
            onClick={() => { setQuery(""); onChange(null); setSuggestions([]); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.7rem] text-black/30 hover:text-black/60"
            aria-label="Clear landmark"
          >✕</button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="w-full px-3.5 py-2.5 text-left transition-colors hover:bg-[#1e6b45]/[0.06]"
              >
                <span className="block text-[0.8rem] font-normal text-[#1a1a1a]">{s.main}</span>
                {s.secondary && <span className="block text-[0.68rem] font-light text-[#1a1a1a]/45">{s.secondary}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
