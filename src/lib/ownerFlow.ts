/* ════════════════════════════════════════════════════════════════
   THE OWNER PATH — someone who has already booked or bought.

   One question, asked once: which project. Two answers.

     FOUND     → their report, locked. The Truth Score and the score
                 anatomy are free; the five pillars are the ₹999.
     NOT FOUND → Google Places confirms the project is real, then the
                 custom-report request that already exists, prefilled.

   Deliberately NOT asked: when they booked, what they paid, how big the
   unit is. Founder's call, and the data agrees — launch_price is empty on
   all 97 rows, so a "what it's worth now" read would have been built on a
   number we asked them for and could not check.

   ── Places confirms; it does not gate ──
   Google's coverage of under-construction Indian residential is patchy: a
   tower that has not topped out often has no listing at all, or only its
   sales gallery does. If Places were allowed to decide whether a request
   is accepted, we would turn away real owners of real projects — the most
   valuable people in this flow. So every outcome still submits, and a
   miss is recorded as unverified rather than refused.

   Logic only. OwnedProjectPicker owns the rendering — the same split
   heroSearch.ts / HeroSearch.tsx already use.
   ════════════════════════════════════════════════════════════════ */
import { fuzzySearch } from "@/lib/heroSearch";
import { projectHref } from "@/lib/projectHref";
import type { OmniIndex, OmniProject } from "@/lib/omni";

const BASE_PATH = "/Truth-Estate";
/* Already public by design, and already shipped: three components call
   Places with this key today. Restriction is by HTTP referrer at the
   Google end, which is the only control a static export can have. */
const GMAPS_KEY = process.env.NEXT_PUBLIC_GMAPS_KEY ?? "";
/* Same centre and radius LocationPicker biases to. */
const BIAS = { latitude: 28.45, longitude: 77.03 };
const RADIUS_M = 30000;

/* Below this we do not call Places at all — a one or two letter query
   matches half of Gurugram and costs a request to learn nothing. */
export const MIN_CONFIRM_CHARS = 3;

export type PlaceCandidate = {
  placeId: string;
  name: string;
  address: string;
};

/* ── The catalogue ─────────────────────────────────────────────────
   The same index the homepage search reasons over, so "covered" means
   exactly the same thing in both places. Session-cached; a failure is
   null and the caller degrades to the unlisted path, which is the
   honest answer when we cannot see our own catalogue. */
let indexCache: OmniProject[] | null | undefined;

export async function trackedProjects(): Promise<OmniProject[] | null> {
  if (indexCache !== undefined) return indexCache;
  try {
    const res = await fetch(`${BASE_PATH}/omni-index.json`, { signal: AbortSignal.timeout(8000) });
    const idx = res.ok ? ((await res.json()) as OmniIndex) : null;
    indexCache = idx?.projects?.length ? idx.projects : null;
  } catch {
    indexCache = null;
  }
  return indexCache;
}

/* "arbor", "arbour" and "dlf arb" all have to reach DLF The Arbour —
   someone typing the name of a building they own from memory is exactly
   the case fuzzySearch was written for. */
export function searchTracked(query: string, projects: OmniProject[]): OmniProject[] {
  return fuzzySearch(query, projects, 6);
}

/* ── Places ────────────────────────────────────────────────────────
   Autocomplete only. The suggestion already carries the name and the
   address, which is everything the confirm step shows, so the billed
   Place Details call never fires — not per keystroke, not per confirm.

   Cached by normalised query for the life of the tab: going back a
   screen and forward again must not cost a second request. */
const placesCache = new Map<string, PlaceCandidate[]>();
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export async function confirmWithPlaces(query: string): Promise<PlaceCandidate[]> {
  const key = norm(query);
  if (key.length < MIN_CONFIRM_CHARS || !GMAPS_KEY) return [];
  const hit = placesCache.get(key);
  if (hit) return hit;

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GMAPS_KEY },
      body: JSON.stringify({
        input: query,
        /* Region and a 30 km bias around Gurugram, but NO type filter.
           Restricting to premise/subpremise reads like a tightening and
           behaves like a rejection: half the projects worth auditing are
           registered as something else, or only their sales office is on
           the map. Let the human confirm instead. */
        includedRegionCodes: ["in"],
        locationBias: { circle: { center: BIAS, radius: RADIUS_M } },
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const out: PlaceCandidate[] = (data.suggestions ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((s: any) => s.placePrediction?.placeId)
      .slice(0, 3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => ({
        placeId: s.placePrediction.placeId as string,
        name:
          s.placePrediction.structuredFormat?.mainText?.text ??
          s.placePrediction.text?.text ??
          "",
        address: s.placePrediction.structuredFormat?.secondaryText?.text ?? "",
      }))
      .filter((c: PlaceCandidate) => c.name);
    placesCache.set(key, out);
    return out;
  } catch {
    /* Blocked, throttled, key misconfigured — all the same answer here.
       We could not confirm, which is not the same as "not real". */
    return [];
  }
}

/* ── Where each answer goes ────────────────────────────────────────── */

/* Their report, told to address someone who has already bought. Everything
   about the page is the same — the sections, the price, the layout; only
   the paywall's copy stops assuming the purchase is still ahead of them. */
export function ownerReportHref(p: { slug: string; seoSlug?: string | null }): string {
  return `${projectHref(p)}?as=owner`;
}

/* The cities the request form offers as chips. Anything else stays in the
   address line rather than being forced into a chip that is not true. */
const KNOWN_CITIES = ["Gurugram", "Mumbai", "Bengaluru", "Pune", "Hyderabad", "Noida"];

export function cityFromAddress(address: string | null | undefined): string | null {
  const a = (address ?? "").toLowerCase();
  if (!a) return null;
  /* Gurgaon is still what most addresses and most owners say. */
  if (a.includes("gurgaon")) return "Gurugram";
  return KNOWN_CITIES.find((c) => a.includes(c.toLowerCase())) ?? null;
}

/* The request form already exists, already asks "looking to invest /
   already invested", and already accepts ?project=. Arriving with the
   persona pre-answered is the whole point of having asked on screen one:
   nobody should answer the same question twice. */
export function auditHref(o: { project: string; address?: string | null }): string {
  const address = o.address?.trim() ?? "";
  const q = new URLSearchParams({ project: o.project.trim(), intent: "invested" });
  /* Three states, and the desk has to be able to tell them apart:
       place=confirmed  Places matched, address attached
       place=unverified we asked Places and it had nothing — the project is
                        probably still real, so the request goes through
       (absent)         this lead never went past Places at all, e.g. the
                        homepage search. Recording it as "unverified" would
                        claim a check we never ran. */
  q.set("place", address ? "confirmed" : "unverified");
  if (address) q.set("address", address);
  const city = cityFromAddress(o.address);
  if (city) q.set("city", city);
  return `${BASE_PATH}/get-custom-project-report?${q.toString()}`;
}
