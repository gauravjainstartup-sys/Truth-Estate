/* ════════════════════════════════════════════════════════════════
   OMNI — the Truth Intelligence omnibox brain, Phase 1 (deterministic).

   Conversational INPUT, forensic OUTPUT: this layer parses a free-text
   ask into visible filter chips and screens the build-time project
   index. No model, no generation — every number the canvas shows comes
   from a DB row carried in the index. Phase 2 swaps `parseAsk` for the
   LLM router; the chip/canvas contract stays identical.
   ════════════════════════════════════════════════════════════════ */

export type OmniUnit = {
  tower: string;
  unit: string;
  config: string;
  score: number;
  grade: string;
  facing: string;
  sunWinterH: number | null;
  vastu: number | null;
  view: number | null;
};

/* Three-way buyer verdict (legacy field, still emitted in the index for the
   omni-router; the hero dropdown now shows the canonical Truth Score tag). */
export type Verdict3 = "Proceed" | "Caution" | "Avoid";

/* The canonical Truth Score tag — identical banding to scoreGrade() on the
   project report, so the hero chip and the report never disagree. */
export type ScoreTag = "Exceptional" | "Strong" | "Solid" | "Fair" | "Watch";
export function scoreTag(score: number | null | undefined): ScoreTag | null {
  if (score == null || !Number.isFinite(score)) return null;
  return score >= 90 ? "Exceptional" : score >= 80 ? "Strong" : score >= 70 ? "Solid" : score >= 60 ? "Fair" : "Watch";
}

export type OmniProject = {
  /* Internal id — matches events.project_slug and the entitlement keys. */
  slug: string;
  /* Public address: /projects/<seoSlug>. Optional because an index built
     by an older deploy will not have it; call sites fall back to the
     internal slug, which still resolves through a redirect stub. */
  seoSlug?: string;
  name: string;
  developer: string | null;
  location: string | null;
  score: number | null;
  minPriceCr: number | null;
  minBhk: number | null;
  config: string | null;
  deliveryYear: number | null;
  redFlags: number | null;
  delayRisk: string | null;
  has3D: boolean;
  advisorFile: string | null;
  lat: number | null;
  lng: number | null;
  /* derived at build time for the hero search dropdown */
  verdict: Verdict3 | null; // legacy (omni-router); chip now derives scoreTag from `score`
  sources: number | null; // count of populated forensic modules on the row
  updatedAt: string | null; // last-updated date (QPR → legal → registration) for latest-first ordering
};

/* Truth Score → the three-way dropdown verdict. Thresholds are deliberately
   simple and tunable; every score itself still comes from a pipeline row. */
export function verdictFromScore(score: number | null | undefined): Verdict3 | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 80) return "Proceed";
  if (score >= 65) return "Caution";
  return "Avoid";
}

export type OmniIndex = {
  projects: OmniProject[];
  units: Record<string, OmniUnit[]>; // slug → top lines (modelled projects only)
  live: boolean; // true when built from the live backlog view
};

/* ── chips: the visible, removable query state ── */
export type Chip =
  | { key: "bhk"; bhk: number; label: string }
  | { key: "budget"; maxCr: number; label: string }
  | { key: "area"; needle: string; label: string }
  | { key: "sun"; label: string }
  | { key: "vastu"; label: string }
  | { key: "possession"; byYear: number; label: string }
  | { key: "lowrisk"; label: string };

export type Parsed = {
  intent: "navigate" | "units" | "screen" | "compare" | "question";
  chips: Chip[];
  project?: OmniProject; // navigate / units target
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/* corridor / locality aliases → substring needles matched against
   project.location (live text). Deterministic, no geocoding.
   Exported: the home hero renders corridor suggestions from the same list. */
export const AREA_ALIASES: [RegExp, string, string][] = [
  [/golf course ext|gce\b|golf course extension/, "golf course ext", "Golf Course Extension"],
  [/golf course road|gcr\b/, "golf course road", "Golf Course Road"],
  [/dwarka/, "dwarka", "Dwarka Expressway"],
  [/\bspr\b|southern peripheral/, "spr", "SPR"],
  [/sohna/, "sohna", "Sohna"],
  [/new gurgaon/, "new gurgaon", "New Gurgaon"],
];

export function matchProject(q: string, index: OmniIndex): OmniProject | undefined {
  const n = norm(q);
  if (n.length < 3) return undefined;
  // exact name containment either way (typing a prefix of the name, or the name inside a question)
  return (
    index.projects.find((p) => norm(p.name) === n) ??
    index.projects.find((p) => n.includes(norm(p.name))) ??
    index.projects.find((p) => norm(p.name).includes(n) && n.length >= 5)
  );
}

export function typeahead(q: string, index: OmniIndex, limit = 6): OmniProject[] {
  const n = norm(q);
  if (!n) return [];
  const starts = index.projects.filter((p) => norm(p.name).startsWith(n));
  const contains = index.projects.filter((p) => !norm(p.name).startsWith(n) && norm(p.name).includes(n));
  return [...starts, ...contains].slice(0, limit);
}

export function parseAsk(qRaw: string, index: OmniIndex): Parsed {
  const q = norm(qRaw);
  const chips: Chip[] = [];

  if (/\bvs\b|\bversus\b|compare/.test(q)) return { intent: "compare", chips };

  const bhk = /(\d(?:\.\d)?)\s*bhk/.exec(q);
  if (bhk) chips.push({ key: "bhk", bhk: parseFloat(bhk[1]), label: `${bhk[1]} BHK` });

  const budget = /(?:under|below|upto|up to|within|max|<|≤)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore)/.exec(q);
  if (budget) chips.push({ key: "budget", maxCr: parseFloat(budget[1]), label: `≤ ₹${budget[1]} Cr` });

  for (const [re, needle, label] of AREA_ALIASES) {
    if (re.test(q)) { chips.push({ key: "area", needle, label }); break; }
  }
  const sector = /sector\s*(\d+[a-z]?)/.exec(q);
  if (sector && !chips.some((c) => c.key === "area"))
    chips.push({ key: "area", needle: `sector ${sector[1]}`, label: `Sector ${sector[1].toUpperCase()}` });

  if (/morning sun|winter sun|sunlight|\bsun\b|sunny/.test(q)) chips.push({ key: "sun", label: "winter sun (modelled)" });
  if (/vastu|vaastu/.test(q)) chips.push({ key: "vastu", label: "vastu-scored (modelled)" });

  const poss = /(?:before|by|possession[^0-9]{0,12})\s*(20\d\d)/.exec(q);
  if (poss) chips.push({ key: "possession", byYear: parseInt(poss[1], 10), label: `possession ≤ ${poss[1]}` });

  if (/low risk|safe|no red flags|clean legal/.test(q)) chips.push({ key: "lowrisk", label: "low delivery risk" });

  const project = matchProject(q, index);
  const unitWords = /\b(flat|unit|line|floor|tower|which)\b|vastu|sun/.test(q);
  if (project && unitWords && index.units[project.slug]?.length) return { intent: "units", chips, project };
  if (project && chips.length === 0) return { intent: "navigate", chips, project };
  if (chips.length > 0) return { intent: "screen", chips, project };
  return { intent: "question", chips };
}

/* ── screening: filter + rank the index with visible reasons ── */
export type Ranked = { p: OmniProject; why: { label: string; warn?: boolean }[] };

export function screen(index: OmniIndex, chips: Chip[]): Ranked[] {
  const bhk = chips.find((c) => c.key === "bhk") as Extract<Chip, { key: "bhk" }> | undefined;
  const budget = chips.find((c) => c.key === "budget") as Extract<Chip, { key: "budget" }> | undefined;
  const area = chips.find((c) => c.key === "area") as Extract<Chip, { key: "area" }> | undefined;
  const poss = chips.find((c) => c.key === "possession") as Extract<Chip, { key: "possession" }> | undefined;
  const wantSun = chips.some((c) => c.key === "sun");
  const wantVastu = chips.some((c) => c.key === "vastu");
  const lowRisk = chips.some((c) => c.key === "lowrisk");

  const out: Ranked[] = [];
  for (const p of index.projects) {
    if (bhk != null) {
      // config text like "3 | 4" / "3, 4 BHK" or minBhk number — match either
      const inConfig = p.config ? p.config.toLowerCase().includes(String(bhk.bhk)) : false;
      const minOk = p.minBhk != null && p.minBhk <= bhk.bhk;
      if (!inConfig && !minOk) continue;
    }
    if (budget && p.minPriceCr != null && p.minPriceCr > budget.maxCr) continue;
    if (area && !(p.location ?? "").toLowerCase().includes(area.needle)) continue;
    if (poss && p.deliveryYear != null && p.deliveryYear > poss.byYear) continue;
    if (lowRisk && (p.redFlags ?? 0) > 0) continue;

    const units = index.units[p.slug] ?? [];
    const bestSun = units.length ? Math.max(...units.map((u) => u.sunWinterH ?? 0)) : null;
    if (wantSun && units.length && (bestSun ?? 0) < 2) continue; // modelled and provably sun-starved

    const why: Ranked["why"] = [];
    if (p.score != null) why.push({ label: `Truth Score ${p.score}` });
    if (p.config) why.push({ label: p.config.includes("BHK") ? p.config : `${p.config} BHK` });
    if (p.minPriceCr != null) why.push({ label: `from ₹${p.minPriceCr} Cr` });
    if (p.deliveryYear != null) why.push({ label: `possession ${p.deliveryYear}` });
    if (wantSun && bestSun != null) why.push({ label: `best line ${bestSun.toFixed(1)}h winter sun` });
    if (wantVastu && units.length) why.push({ label: "room-by-room vastu modelled" });
    if ((p.redFlags ?? 0) > 0) why.push({ label: `${p.redFlags} red flag${p.redFlags === 1 ? "" : "s"}`, warn: true });
    if (p.delayRisk && /high|elevated/i.test(p.delayRisk)) why.push({ label: `delay risk ${p.delayRisk.toLowerCase()}`, warn: true });

    // rank: score first; a sun ask nudges modelled sunny projects up
    const rank = (p.score ?? 0) + (wantSun && bestSun != null ? Math.min(bestSun, 10) : 0) + (p.has3D ? 2 : 0);
    out.push({ p, why });
    (out[out.length - 1] as Ranked & { rank?: number }).rank = rank;
  }
  out.sort((a, b) => ((b as Ranked & { rank?: number }).rank ?? 0) - ((a as Ranked & { rank?: number }).rank ?? 0));
  return out;
}

/* top lines for a modelled project, already sorted by composite in the index */
export function topUnits(index: OmniIndex, slug: string, n = 3): OmniUnit[] {
  return (index.units[slug] ?? []).slice(0, n);
}

/* ── wire helpers — shared by the client router and the Edge Function ──
   Chips that cross a network boundary (model output, HTTP body) are
   untrusted: rebuild them field-by-field so only well-formed chips with
   known keys survive, whatever arrived. */
const num = (v: unknown): number | null => {
  const x = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(x) ? x : null;
};

export function sanitizeChips(raw: unknown, max = 6): Chip[] {
  if (!Array.isArray(raw)) return [];
  const out: Chip[] = [];
  for (const c of raw) {
    if (out.length >= max || typeof c !== "object" || c == null) continue;
    const o = c as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.slice(0, 40).trim() : "";
    switch (o.key) {
      case "bhk": {
        const bhk = num(o.bhk);
        if (bhk != null && bhk >= 1 && bhk <= 6) out.push({ key: "bhk", bhk, label: label || `${bhk} BHK` });
        break;
      }
      case "budget": {
        const maxCr = num(o.maxCr);
        if (maxCr != null && maxCr > 0 && maxCr < 1000) out.push({ key: "budget", maxCr, label: label || `≤ ₹${maxCr} Cr` });
        break;
      }
      case "area": {
        const needle = typeof o.needle === "string" ? o.needle.toLowerCase().slice(0, 40).trim() : "";
        if (needle) out.push({ key: "area", needle, label: label || needle });
        break;
      }
      case "sun":
        out.push({ key: "sun", label: label || "winter sun (modelled)" });
        break;
      case "vastu":
        out.push({ key: "vastu", label: label || "vastu-scored (modelled)" });
        break;
      case "possession": {
        const byYear = num(o.byYear);
        if (byYear != null && byYear >= 2020 && byYear <= 2040)
          out.push({ key: "possession", byYear, label: label || `possession ≤ ${byYear}` });
        break;
      }
      case "lowrisk":
        out.push({ key: "lowrisk", label: label || "low delivery risk" });
        break;
    }
  }
  // one chip per key except area (corridor + sector can coexist)
  const seen = new Set<string>();
  return out.filter((c) => {
    const k = c.key === "area" ? `area:${c.needle}` : c.key;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* merge follow-up chips into the current set: a new chip replaces the
   existing chip of the same key (tightening a filter), everything else
   is kept — the canvas mutates, it doesn't append */
export function mergeChips(prev: Chip[], add: Chip[]): Chip[] {
  if (!add.length) return prev;
  const keys = new Set(add.map((c) => c.key));
  return [...prev.filter((c) => !keys.has(c.key)), ...add];
}

/* ── the Phase-2 wire contract: omni-router Edge Function → canvas ──
   The model only ever parses intent and composes the two prose fields;
   every card, score and dial still renders client-side from the same
   deterministic screen()/topUnits() over the local index. */
export type RouterAnswer = {
  intent: "screen" | "units" | "question" | "navigate";
  chips: Chip[];
  projectSlug: string | null; // units/navigate target — must exist in the index
  verdict: string; // ≤ 2 sentences; numbers only from index rows
  note: string; // one-line rail note (what was read to answer)
  refs: string[]; // slugs the verdict cites → the canvas shows their cards
};

const INTENTS = new Set(["screen", "units", "question", "navigate"]);

/* rebuild an untrusted answer (model output or HTTP body) field-by-field;
   null = unusable, caller falls back to the deterministic path */
export function sanitizeAnswer(raw: unknown, index: OmniIndex): RouterAnswer | null {
  if (typeof raw !== "object" || raw == null) return null;
  const o = raw as Record<string, unknown>;
  const intent = typeof o.intent === "string" && INTENTS.has(o.intent) ? (o.intent as RouterAnswer["intent"]) : null;
  if (!intent) return null;
  const chips = sanitizeChips(o.chips);
  const known = new Set(index.projects.map((p) => p.slug));
  const projectSlug = typeof o.projectSlug === "string" && known.has(o.projectSlug) ? o.projectSlug : null;
  const refs = Array.isArray(o.refs)
    ? o.refs.filter((s): s is string => typeof s === "string" && known.has(s)).slice(0, 8)
    : [];
  const verdict = typeof o.verdict === "string" ? o.verdict.trim().slice(0, 420) : "";
  const note = typeof o.note === "string" ? o.note.trim().slice(0, 200) : "";
  if ((intent === "units" || intent === "navigate") && !projectSlug) return null;
  if (intent === "question" && !verdict) return null;
  return { intent, chips, projectSlug, verdict, note, refs };
}
