/* ════════════════════════════════════════════════════════════════
   LOCATION MODEL — search-first, resolve-to-micro-market.
   Everything a buyer types or taps (area, landmark, sector, city)
   resolves to the canonical micro-markets our intelligence is keyed to
   (the `resolvesTo` names match PROJECTS.market / MARKETS.name).

   Built to scale from one city today to pan-India later: add a city =
   add rows here, no UI change. `status: "soon"` surfaces uncovered
   places as "coming soon" so the picker never dead-ends and we learn
   where demand is.
   ════════════════════════════════════════════════════════════════ */

export type LocStatus = "live" | "soon";
export type LocKind = "market" | "landmark" | "city";

export type LocEntity = {
  id: string;
  kind: LocKind;
  name: string;
  city: string;
  status: LocStatus;
  resolvesTo: string[]; // canonical micro-market names
  aliases?: string[];
  hint?: string; // short context shown under the name
  popular?: boolean; // surfaced as a tap chip
};

export const LOCATIONS_DATA: LocEntity[] = [
  /* ── Gurugram · micro-markets (live) ── */
  { id: "gcr", kind: "market", name: "Golf Course Road", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Road"], aliases: ["GCR"], hint: "Established prime spine", popular: true },
  { id: "gce", kind: "market", name: "Golf Course Extension", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Extension"], aliases: ["GCE", "Golf Course Extension Road", "Golf Extension"], hint: "Most active luxury market", popular: true },
  { id: "spr", kind: "market", name: "SPR", city: "Gurugram", status: "live", resolvesTo: ["SPR"], aliases: ["Southern Peripheral Road"], hint: "Fast-growing value corridor", popular: true },
  { id: "dwarka-expy", kind: "market", name: "Dwarka Expressway", city: "Gurugram", status: "live", resolvesTo: ["Dwarka Expressway"], aliases: ["NPR", "Northern Peripheral Road", "Dwarka Expy"], hint: "Emerging value corridor", popular: true },
  { id: "new-gurgaon", kind: "market", name: "New Gurgaon", city: "Gurugram", status: "live", resolvesTo: ["New Gurgaon"], aliases: ["New Gurugram"], hint: "NH-8 beyond Manesar", popular: true },
  { id: "sohna", kind: "market", name: "Sohna", city: "Gurugram", status: "live", resolvesTo: ["Sohna"], hint: "Aravalli value belt" },

  /* ── Gurugram · landmarks & anchors (live) → resolve to micro-markets ── */
  { id: "cyber-city", kind: "landmark", name: "Cyber City", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Road"], aliases: ["DLF Cyber City", "Cybercity"], hint: "Golf Course Rd / NH-48", popular: true },
  { id: "cyber-hub", kind: "landmark", name: "DLF Cyber Hub", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Road"], aliases: ["Cyber Hub"], hint: "Golf Course Rd / NH-48" },
  { id: "mg-road", kind: "landmark", name: "MG Road", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Road"], aliases: ["Mehrauli-Gurgaon Road"], hint: "Golf Course Rd corridor" },
  { id: "ifc", kind: "landmark", name: "IFC / Two Horizon", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Road"], aliases: ["IFC", "DLF IFC", "Two Horizon Center", "WorldMark"], hint: "Golf Course Rd" },
  { id: "rapid-metro", kind: "landmark", name: "Rapid Metro", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Road"], hint: "Runs along Golf Course Rd" },
  { id: "sohna-road", kind: "landmark", name: "Sohna Road", city: "Gurugram", status: "live", resolvesTo: ["SPR"], aliases: ["Subhash Chowk"], hint: "Near SPR", popular: true },
  { id: "medanta", kind: "landmark", name: "Medanta Medicity", city: "Gurugram", status: "live", resolvesTo: ["SPR"], aliases: ["Medicity"], hint: "Sohna Rd / SPR" },
  { id: "sector-65", kind: "landmark", name: "Sector 65–67", city: "Gurugram", status: "live", resolvesTo: ["Golf Course Extension"], aliases: ["Sector 65", "Sector 66", "Sector 67"], hint: "Golf Course Extension" },
  { id: "milestone-32", kind: "landmark", name: "32nd Milestone", city: "Gurugram", status: "live", resolvesTo: ["New Gurgaon"], aliases: ["32 Milestone", "Thirty Second Milestone"], hint: "NH-8 corridor", popular: true },
  { id: "manesar", kind: "landmark", name: "Manesar", city: "Gurugram", status: "live", resolvesTo: ["New Gurgaon"], aliases: ["IMT Manesar"], hint: "IMT Manesar belt" },
  { id: "airport", kind: "landmark", name: "IGI Airport", city: "Gurugram", status: "live", resolvesTo: ["Dwarka Expressway"], aliases: ["Airport", "Delhi Airport", "Aerocity"], hint: "Closest: Dwarka Expressway" },

  /* ── Coming soon (next cities) ── */
  { id: "noida", kind: "city", name: "Noida", city: "Noida", status: "soon", resolvesTo: [], aliases: ["Greater Noida"], hint: "Coming soon", popular: true },
  { id: "delhi", kind: "city", name: "Delhi", city: "Delhi", status: "soon", resolvesTo: [], aliases: ["New Delhi", "South Delhi"], hint: "Coming soon" },
];

const byId = new Map(LOCATIONS_DATA.map((e) => [e.id, e]));
export const locationById = (id: string): LocEntity | undefined => byId.get(id);

export const popularLocations = (): LocEntity[] => LOCATIONS_DATA.filter((e) => e.popular);

/* Resolve a set of selected entity ids to canonical micro-market names. */
export function marketsFromIds(ids: string[]): string[] {
  return Array.from(new Set(ids.flatMap((id) => byId.get(id)?.resolvesTo ?? [])));
}

/* Map stored micro-market names back to their market-entity ids (for re-entry). */
export function idsFromMarkets(markets: string[]): string[] {
  return LOCATIONS_DATA.filter((e) => e.kind === "market" && e.resolvesTo.some((m) => markets.includes(m))).map((e) => e.id);
}

/* Type-ahead over names + aliases, ranked: exact → prefix → contains, popular first. */
export function searchLocations(q: string): LocEntity[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const score = (e: LocEntity) => {
    const hay = [e.name, ...(e.aliases ?? [])].map((x) => x.toLowerCase());
    if (hay.some((h) => h === s)) return 0;
    if (hay.some((h) => h.startsWith(s))) return 1;
    if (hay.some((h) => h.includes(s))) return 2;
    return 99;
  };
  return LOCATIONS_DATA.map((e) => ({ e, sc: score(e) }))
    .filter((x) => x.sc < 99)
    .sort((a, b) => a.sc - b.sc || Number(!!b.e.popular) - Number(!!a.e.popular))
    .slice(0, 8)
    .map((x) => x.e);
}
