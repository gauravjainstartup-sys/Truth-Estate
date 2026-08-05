/* ════════════════════════════════════════════════════════════════
   HERO SEARCH — pure helpers for the homepage search dropdown.

   Framework-agnostic: fuzzy matching, match highlighting, the
   most-searched / covered-nearby lists, and the small localStorage
   seams for recent searches and demand signals. The component in
   HeroSearch.tsx owns all rendering, state and accessibility; this
   file owns the logic so it stays testable and side-effect-free
   (except the explicitly-named storage helpers).
   ════════════════════════════════════════════════════════════════ */

import { AREA_ALIASES, scoreTag, type OmniProject, type ScoreTag } from "@/lib/omni";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/* chars of `needle` appear in `hay` in order (handles arbor→arbour) */
function isSubsequence(needle: string, hay: string): boolean {
  if (!needle) return true;
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) {
    if (hay[j] === needle[i]) i++;
  }
  return i === needle.length;
}

/* ── fuzzy search over name + developer + micro-market ──
   Triggered from the 2nd character. Every query token must land somewhere
   (as a substring of name/developer/location, or a subsequence of the name)
   or the candidate is dropped — so results stay relevant while "arbor",
   "arbour" and "dlf arb" all resolve to DLF The Arbour. */
export function fuzzySearch(query: string, projects: OmniProject[], limit = 6): OmniProject[] {
  const nq = norm(query);
  if (nq.length < 2) return [];
  const tokens = nq.split(" ").filter(Boolean);
  const scored: { p: OmniProject; rank: number }[] = [];

  for (const p of projects) {
    const name = norm(p.name);
    const dev = norm(p.developer ?? "");
    const loc = norm(p.location ?? "");
    let rank = 0;
    let ok = true;

    if (name.startsWith(nq)) rank += 120;
    else if (name.includes(nq)) rank += 80;

    for (const t of tokens) {
      if (name.startsWith(t)) rank += 30;
      else if (name.includes(t)) rank += 22;
      else if (dev.includes(t)) rank += 10;
      else if (loc.includes(t)) rank += 8;
      else if (isSubsequence(t, name)) rank += 6;
      else if (isSubsequence(t, dev)) rank += 3;
      else { ok = false; break; }
    }
    if (!ok) continue;

    if (p.score != null) rank += Math.min(p.score, 100) / 20; // gentle nudge to covered/high-scored
    if (p.has3D) rank += 2;
    scored.push({ p, rank });
  }

  scored.sort((a, b) => b.rank - a.rank || (b.p.score ?? 0) - (a.p.score ?? 0));
  return scored.slice(0, limit).map((s) => s.p);
}

/* Split a project name into segments, flagging which characters matched the
   query so the row can bold them. Falls back to the longest matching prefix of
   a token (so "arbor" still bolds "Arbo" within "Arbour"). */
export type NameSegment = { t: string; hit: boolean };
export function highlightName(name: string, query: string): NameSegment[] {
  const lname = name.toLowerCase();
  const mask = new Array(name.length).fill(false) as boolean[];
  const marks: [number, number][] = [];
  const nq = norm(query);

  const mark = (needle: string) => {
    let n = needle;
    while (n.length >= 2) {
      const idx = lname.indexOf(n);
      if (idx >= 0) { marks.push([idx, idx + n.length]); return; }
      n = n.slice(0, -1);
    }
  };

  if (nq && lname.includes(nq)) {
    const i = lname.indexOf(nq);
    marks.push([i, i + nq.length]);
  } else {
    for (const t of nq.split(" ").filter(Boolean)) mark(t);
  }
  for (const [a, b] of marks) for (let i = a; i < b; i++) mask[i] = true;

  const segs: NameSegment[] = [];
  let cur = "";
  let curHit = mask[0] ?? false;
  for (let i = 0; i < name.length; i++) {
    if (mask[i] === curHit) cur += name[i];
    else { if (cur) segs.push({ t: cur, hit: curHit }); cur = name[i]; curHit = mask[i]; }
  }
  if (cur) segs.push({ t: cur, hit: curHit });
  return segs;
}

/* scored = we hold a Truth Score for it (so it can show a verdict chip). */
export function coveredProjects(projects: OmniProject[]): OmniProject[] {
  return projects.filter((p) => p.score != null);
}

/* The footer count is every project a buyer can actually pull up — the whole
   searchable index, not only the scored ones — rounded down to the nearest ten.
   Fully dynamic: it tracks the live index size (100+ on production), never a
   hardcoded figure. */
export function coveredCountLabel(projects: OmniProject[]): string {
  /* The exact live index size. It was floored to the nearest ten, which
     under-counted (97 → "90+"); the exact number is honest and climbs itself
     as projects are added. */
  const n = projects.length;
  return n > 0 ? `${n} Gurugram projects covered` : "Gurugram projects covered";
}

const weight = (p: OmniProject) => (p.score ?? 0) + (p.has3D ? 4 : 0);
const devKey = (p: OmniProject) => (p.developer ?? p.name).toLowerCase().trim();
/* parse the last-updated date to a sortable ms; unknown/unparseable → 0 (sinks last) */
const updatedTime = (p: OmniProject) => {
  if (!p.updatedAt) return 0;
  const t = Date.parse(p.updatedAt);
  return Number.isNaN(t) ? 0 : t;
};
const nonGreenTag = (p: OmniProject) => {
  const t = scoreTag(p.score);
  return t === "Fair" || t === "Watch";
};

/* top by Truth Score (3D-modelled nudged up); falls back to any projects so a
   list is never empty even before scores land. Used for typed-state padding. */
export function topSearched(projects: OmniProject[], n = 6): OmniProject[] {
  const covered = coveredProjects(projects);
  const base = covered.length ? covered : projects;
  return [...base].sort((a, b) => weight(b) - weight(a)).slice(0, n);
}

/* ── the DEFAULT (nothing-typed) list ──
   Latest-updated first (freshest intelligence leads), capped at ≤2 projects per
   developer so no single builder dominates the resting list — independence is
   the brand. As a light safety net we keep at least one non-green tag
   (Fair/Watch) visible when the data has one, so the resting state never reads
   as all-endorsement. This shaping applies ONLY to the default state — once the
   user types, ranking is pure relevance (fuzzySearch). */
export function defaultList(projects: OmniProject[], limit: number): OmniProject[] {
  if (limit <= 0) return [];
  const covered = coveredProjects(projects);
  const pool = covered.length ? covered : projects;

  // newest-updated first; ties (and undated rows) fall back to Truth Score
  const sorted = [...pool].sort((a, b) => updatedTime(b) - updatedTime(a) || weight(b) - weight(a));

  const out: OmniProject[] = [];
  const counts = new Map<string, number>();
  for (const p of sorted) {
    if (out.length >= limit) break;
    const k = devKey(p);
    if ((counts.get(k) ?? 0) >= 2) continue; // ≤2 per developer
    counts.set(k, (counts.get(k) ?? 0) + 1);
    out.push(p);
  }

  // keep at least one non-green tag in view (only if one exists and isn't already shown)
  if (out.length && !out.some(nonGreenTag)) {
    const alt = sorted.find((p) => nonGreenTag(p) && !out.includes(p));
    if (alt) out[out.length - 1] = alt;
  }
  return out.slice(0, limit);
}

/* projects covered near the query — resolved via corridor/sector aliases; pads
   with top-searched so the "covered nearby" strip is always populated. */
export function coveredNearby(query: string, projects: OmniProject[], n = 3): OmniProject[] {
  const nq = norm(query);
  let needle: string | null = null;
  for (const [re, nd] of AREA_ALIASES) if (re.test(nq)) { needle = nd; break; }
  const sec = /sector\s*(\d+[a-z]?)/.exec(nq);
  if (!needle && sec) needle = `sector ${sec[1]}`;

  const covered = coveredProjects(projects);
  const near = needle ? covered.filter((p) => (p.location ?? "").toLowerCase().includes(needle!)) : [];
  const nearSet = new Set(near.map((p) => p.slug));
  const pad = topSearched(projects, n * 3).filter((p) => !nearSet.has(p.slug));
  return [...near, ...pad].slice(0, n);
}

/* Micro-market label for a row — the leading segment of the location, minus a
   trailing city suffix ("Sector 63A, Gurugram · Golf Course Ext" → "Sector 63A"). */
export function shortLocality(location: string | null): string | null {
  if (!location) return null;
  const first = location.split("·")[0].trim();
  const clean = first.replace(/,\s*(gurugram|gurgaon|haryana).*$/i, "").trim();
  return clean || null;
}

/* The corridor a project sits in, shortened for the row subtitle:
   "Golf Course Road (GCR)" → "GCR Corridor", "Southern Peripheral Road (SPR
   Corridor)" → "SPR Corridor", "New Gurgaon" → "New Gurgaon". Reads the part
   after the sector in `location` ("Sector 63 · <corridor>"); null when there
   is no distinct corridor part. A parenthetical CODE (GCR/GCRE/SPR) wins; a
   qualifier paren ("Sohna Town (South of Gurugram)") is dropped, keeping the
   name. A bare acronym gets a "Corridor" suffix for context. */
export function corridorLabel(location: string | null): string | null {
  if (!location) return null;
  const parts = location.split("·").map((s) => s.trim());
  if (parts.length < 2) return null;
  const raw = parts.slice(1).join(" · ");
  if (!raw) return null;
  const paren = raw.match(/\(([^)]+)\)/);
  let label: string;
  if (paren && /^[A-Z]{2,5}(\s+Corridor)?$/.test(paren[1].trim())) {
    label = paren[1].trim();
  } else {
    label = raw.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  }
  if (!label) return null;
  if (/^[A-Z]{2,5}$/.test(label)) label = `${label} Corridor`;
  return label;
}

/* Row metadata line: "Sector 63 · GCR Corridor" — the locality and the
   corridor it sits in (either part omitted if absent). */
export function rowMeta(p: OmniProject): string {
  const parts = [shortLocality(p.location), corridorLabel(p.location)].filter(Boolean);
  return parts.join(" · ");
}

/* Truth Score tag chip colours — the SAME three approved chip colours mapped
   onto the five tags: green (Exceptional/Strong/Solid), amber (Fair), red (Watch). */
export const TAG_CHIP: Record<ScoreTag, { text: string; border: string }> = {
  Exceptional: { text: "#245c3f", border: "#7fae94" },
  Strong: { text: "#245c3f", border: "#7fae94" },
  Solid: { text: "#245c3f", border: "#7fae94" },
  Fair: { text: "#8a4b1c", border: "#c39a70" },
  Watch: { text: "#8a2b1c", border: "#c37070" },
};

/* ── localStorage seams (truthEstate.* prefix, per site convention: cleared on
   a hard reload alongside all other demo state) ── */
const RECENT_KEY = "truthEstate.recentSearches";
const DEMAND_KEY = "truthEstate.demandSignals";
const RECENT_MAX = 4;

export function getRecentSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch { return []; }
}

export function pushRecentSlug(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    const next = [slug, ...getRecentSlugs().filter((s) => s !== slug)].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export type DemandSignal = { query: string; at: number };
export function pushDemand(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const raw = window.localStorage.getItem(DEMAND_KEY);
    const arr = raw ? (JSON.parse(raw) as DemandSignal[]) : [];
    const list = Array.isArray(arr) ? arr : [];
    list.unshift({ query: query.trim(), at: Date.now() });
    window.localStorage.setItem(DEMAND_KEY, JSON.stringify(list.slice(0, 20)));
  } catch { /* ignore */ }
}
