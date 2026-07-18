/* ════════════════════════════════════════════════════════════════
   HERO SEARCH — pure helpers for the homepage search dropdown.

   Framework-agnostic: fuzzy matching, match highlighting, the
   most-searched / covered-nearby lists, and the small localStorage
   seams for recent searches and demand signals. The component in
   HeroSearch.tsx owns all rendering, state and accessibility; this
   file owns the logic so it stays testable and side-effect-free
   (except the explicitly-named storage helpers).
   ════════════════════════════════════════════════════════════════ */

import { AREA_ALIASES, type OmniProject, type Verdict3 } from "@/lib/omni";

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
  const n = projects.length;
  const floored = Math.max(10, Math.floor(n / 10) * 10);
  return `${floored}+ Gurugram projects covered`;
}

const weight = (p: OmniProject) => (p.score ?? 0) + (p.has3D ? 4 : 0);
const devKey = (p: OmniProject) => (p.developer ?? p.name).toLowerCase().trim();

/* top by Truth Score (3D-modelled nudged up); falls back to any projects so a
   list is never empty even before scores land. Used for typed-state padding. */
export function topSearched(projects: OmniProject[], n = 6): OmniProject[] {
  const covered = coveredProjects(projects);
  const base = covered.length ? covered : projects;
  return [...base].sort((a, b) => weight(b) - weight(a)).slice(0, n);
}

/* ── the DEFAULT (nothing-typed) list ──
   Independence is the brand, so the resting list must not be dominated by one
   builder. Round-robin across developers (≤2 each), preferring breadth, and
   guarantee at least one non-Proceed verdict in the visible set when the data
   has one. This shaping applies ONLY to the default state — once the user
   types, ranking is pure relevance (fuzzySearch). */
export function defaultList(projects: OmniProject[], limit: number): OmniProject[] {
  if (limit <= 0) return [];
  const covered = coveredProjects(projects);
  const pool = covered.length ? covered : projects;

  // group by developer, each group internally strongest-first
  const groups = new Map<string, OmniProject[]>();
  for (const p of [...pool].sort((a, b) => weight(b) - weight(a))) {
    const k = devKey(p);
    const g = groups.get(k);
    if (g) g.push(p); else groups.set(k, [p]);
  }
  // developers ordered by their strongest project
  const devs = [...groups.values()].sort((a, b) => weight(b[0]) - weight(a[0]));

  // round-robin: one per developer, then a second — never a third (≤2 each)
  const out: OmniProject[] = [];
  for (let round = 0; round < 2 && out.length < limit; round++) {
    for (const g of devs) {
      if (out.length >= limit) break;
      if (g[round]) out.push(g[round]);
    }
  }

  // ensure at least one non-Proceed verdict is visible (best-effort; only if the
  // data has one). Swap it in over an over-represented developer's slot.
  if (out.length && !out.some((p) => p.verdict && p.verdict !== "Proceed")) {
    const alt = pool
      .filter((p) => p.verdict && p.verdict !== "Proceed" && !out.includes(p))
      .sort((a, b) => weight(b) - weight(a))[0];
    if (alt) {
      const counts = new Map<string, number>();
      out.forEach((p) => counts.set(devKey(p), (counts.get(devKey(p)) ?? 0) + 1));
      let idx = out.length - 1;
      for (let i = out.length - 1; i >= 0; i--) {
        if ((counts.get(devKey(out[i])) ?? 0) >= 2) { idx = i; break; }
      }
      out[idx] = alt;
    }
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

/* Row metadata line: "Sector 63A · 9 sources" (either part omitted if absent). */
export function rowMeta(p: OmniProject): string {
  const parts = [
    shortLocality(p.location),
    p.sources != null && p.sources > 0 ? `${p.sources} source${p.sources === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/* verdict chip colours (spec-defined) */
export const VERDICT_CHIP: Record<Verdict3, { text: string; border: string }> = {
  Proceed: { text: "#245c3f", border: "#7fae94" },
  Caution: { text: "#8a4b1c", border: "#c39a70" },
  Avoid: { text: "#8a2b1c", border: "#c37070" },
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
