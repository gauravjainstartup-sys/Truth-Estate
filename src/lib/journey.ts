/* ════════════════════════════════════════════════════════════════
   THE TRUTH ESTATE JOURNEY ENGINE — data model & intelligence
   Pure functions + mock dataset. No backend; everything is derived
   client-side so the visitor receives value before being asked
   for anything. Auth & returning users are simulated via localStorage.
   ════════════════════════════════════════════════════════════════ */

import { grantModelAccess, modelSlugFor, resolveModelSubject } from "./modelAccess";
import { serverHasAccess } from "./entitlementsCache";
import { CLEARED_ON_SIGN_OUT, KEEP_ON_DEMO_RESET } from "./durableKeys";
import { type Buyer, bucketOfChip } from "./matchEngine";

/* The primary CTA is configurable in one place — we may rename later. */
export const PRIMARY_CTA = "Start Your Journey";

/* No "sell". Truth Estate represents the buyer's side of the table — a
   seller journey put us on the other one, and it was never reachable from
   the UI anyway. Removed in full rather than hidden, so nobody rebuilds a
   product around dead code. */
export type Intent = "buy" | "invest" | "research";

/* ── Possession status ──
   A qualifying axis, not a preference. Truth Estate serves under-construction
   homes today; "open" is treated as served (UC is still on the table);
   "ready-to-move" routes to an honest off-ramp. Kept as data so we can also
   learn how much RTM demand we're turning away. */
export type Possession = "under-construction" | "ready-to-move" | "open";

export const POSSESSION_OPTIONS: { key: Possession; label: string; sub: string; served: boolean }[] = [
  { key: "under-construction", label: "Under construction", sub: "A new launch or an under-build project.", served: true },
  { key: "open", label: "Open to both / still deciding", sub: "Show me what fits — we'll weigh it together.", served: true },
  { key: "ready-to-move", label: "Ready to move", sub: "I want a completed, move-in-ready home.", served: false },
];

export const POSSESSION_LABEL: Record<Possession, string> = {
  "under-construction": "Under-construction",
  "ready-to-move": "Ready-to-move",
  open: "Open to both",
};

/* How the possession choice reads on the Buyer DNA summary. "Open to both"
   becomes "Open to guidance" — clearer, and honest that we'll guide them
   through under-construction (what we do) rather than implying we cover both. */
export const POSSESSION_DNA_LABEL: Record<Possession, string> = {
  "under-construction": "Under-construction focus",
  "ready-to-move": "Ready-to-move focus",
  open: "Open to guidance",
};

export type BuyData = {
  possession: Possession | null;
  purchaseType: string | null;
  budgetCr: number; // 1..21  (21 == "20 Cr+")
  locations: string[];
  configs: string[];
  timeline: string | null;
  priorities: string[]; // up to 3
  exitYears?: number | null; // investor hold horizon (captured in the report sheet)
  poi?: { lat: number; lng: number; label?: string } | null;
  notes?: string; // free-text: "in your own words" on the last onboarding step
};

export const emptyBuyData: BuyData = {
  possession: null,
  purchaseType: null,
  budgetCr: 6,
  locations: [],
  configs: [],
  timeline: null,
  priorities: [],
  notes: "",
};

/* ── Option vocabularies (configurable) ── */
export const GOALS = [
  { key: "buy" as Intent, icon: "🏡", label: "Buy Property", live: true },
  { key: "research" as Intent, icon: "🔍", label: "Research & Compare", live: true },
];

export const PURCHASE_TYPES = ["First Home", "Upgrade", "Investment", "Holiday Home"];

/* The 8 Gurugram corridors the pipeline files projects under (Sohna Road —
   the in-city corridor — is distinct from the Sohna belt south of the city;
   NH-48 is the highway frontage corridor), plus Noida. Keys must stay in sync
   with corridorKey below. */
export const LOCATIONS = [
  "Golf Course Road",
  "Golf Course Extension",
  "SPR",
  "Sohna Road",
  "Dwarka Expressway",
  "New Gurgaon",
  "NH-48",
  "Sohna",
  "Noida",
];

export const CONFIGS = ["1 BHK / Studio", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse", "Duplex", "Flexible"];

export const TIMELINES = [
  "Immediately",
  "Within 3 Months",
  "Within 6 Months",
  "Within 12 Months",
  "Just Exploring",
];

/* ── Expected delivery timeline ──
   Replaces the old purchase-urgency question. Buckets map to how soon the
   buyer wants handover; for an Investor the SAME step reads as a holding
   period. The value is stored in BuyData.timeline (the urgency field,
   repurposed — no schema change). Ready-to-move / commercial are handled as
   off-ramp links on the step, not options here. */
export const DELIVERY_TIMELINES = [
  "Within 1 year",
  "Within 3 years",
  "Within 5 years",
  "Beyond 5 years",
  "Flexible",
];
export const HOLDING_PERIODS = ["1–3 years", "3–5 years", "5–10 years", "10+ years", "Flexible"];
export const deliveryOptionsFor = (purchaseType: string | null): string[] =>
  purchaseType === "Investment" ? HOLDING_PERIODS : DELIVERY_TIMELINES;
export const deliveryHeading = (purchaseType: string | null): string =>
  purchaseType === "Investment" ? "Holding period" : "Expected delivery timeline";
export const deliverySub = (purchaseType: string | null): string =>
  purchaseType === "Investment"
    ? "How long do you plan to hold? Truth Estate focuses on under-construction homes in Gurugram."
    : "Truth Estate specialises in under-construction homes in Gurugram — how soon do you want handover?";

/* Priorities are tailored to the buyer's purchase type, so each list stays
   focused (max 10) instead of one generic wall of chips. A shared core —
   Location, On-Time Delivery, Legal Safety, Developer Reputation — appears
   for everyone; the rest is profile-specific.

   Selecting a priority is a soft signal. The property-attribute ones
   (On-Time Delivery, Legal Safety, Amenities…) are matched against project
   tags and move the shortlist; the deal-structure ones (Flexible Payment
   Plan, No EMI Till Possession) and services (Hands-Off Ownership) are
   carried into the advisor consultation instead — they're negotiation
   levers, not project filters. */
export const PRIORITIES_BY_TYPE: Record<string, string[]> = {
  "First Home": [
    "Value Buying",
    "Legal Safety",
    "On-Time Delivery",
    "Flexible Payment Plan",
    "No EMI Till Possession",
    "Location",
    "Construction Quality",
    "Layouts",
    "Developer Reputation",
    "Amenities & Wellness",
  ],
  Upgrade: [
    "Luxury Lifestyle",
    "Layouts",
    "Location",
    "Low-Density / Green",
    "Construction Quality",
    "On-Time Delivery",
    "Developer Reputation",
    "Amenities & Wellness",
    "Legal Safety",
    "Vaastu-Compliant",
  ],
  Investment: [
    "Capital Appreciation",
    "Rental Yield",
    "Early-Entry Pricing",
    "Liquidity",
    "Flexible Payment Plan",
    "On-Time Delivery",
    "Developer Reputation",
    "Legal Safety",
    "Location",
    "Hands-Off Ownership",
  ],
  "Holiday Home": [
    "Luxury Lifestyle",
    "Low-Density / Green",
    "Location",
    "Amenities & Wellness",
    "Hands-Off Ownership",
    "Capital Appreciation",
    "On-Time Delivery",
    "Legal Safety",
    "Developer Reputation",
    "Vaastu-Compliant",
  ],
};

/* Fallback pool if priorities is ever reached without a purchase type. */
export const PRIORITIES = [
  "Location",
  "On-Time Delivery",
  "Legal Safety",
  "Developer Reputation",
  "Capital Appreciation",
  "Value Buying",
  "Rental Yield",
  "Luxury Lifestyle",
  "Construction Quality",
  "Liquidity",
];

export function prioritiesFor(purchaseType: string | null): string[] {
  return (purchaseType && PRIORITIES_BY_TYPE[purchaseType]) || PRIORITIES;
}

export const MAX_PRIORITIES = 3;

/* ── The universe of active projects we track ── */
export const ACTIVE_PROJECT_COUNT = 127;

/* ── Mock project intelligence ── */
export type Project = {
  name: string;
  developer: string;
  market: string;
  configs: string[];
  budget: [number, number]; // Cr
  truthScore: number; // 0..100
  recommendation: string;
  confidence: string;
  tags: string[]; // priorities this project genuinely serves
  reason: string;
  strengths: string[];
  watchouts: string[];
};

export const PROJECTS: Project[] = [
  {
    name: "DLF Privana South",
    developer: "DLF",
    market: "SPR",
    configs: ["3 BHK", "4 BHK"],
    budget: [5, 8],
    truthScore: 94,
    recommendation: "Strong Buy",
    confidence: "High",
    tags: ["Capital Appreciation", "Developer Reputation", "Liquidity", "Location", "On-Time Delivery", "Legal Safety"],
    reason: "Strongest resale liquidity on SPR with a proven delivery record.",
    strengths: [
      "Best resale liquidity in the micro-market",
      "DLF brand depth and delivery record",
      "Strong end-user and investor demand",
    ],
    watchouts: ["Premium entry pricing for SPR", "Possession timeline still maturing"],
  },
  {
    name: "DLF Arbour",
    developer: "DLF",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK"],
    budget: [5, 7],
    truthScore: 92,
    recommendation: "Strong Buy",
    confidence: "High",
    tags: ["Capital Appreciation", "Developer Reputation", "On-Time Delivery", "Liquidity", "Legal Safety"],
    reason: "Priced ~8% below comparable GCE towers with high delivery certainty.",
    strengths: [
      "~8% below comparable GCE towers",
      "92% on-time delivery across Haryana",
      "High handover certainty",
    ],
    watchouts: ["Floor-rise premium structure", "Limited inventory in preferred stacks"],
  },
  {
    name: "M3M Golf Estate II",
    developer: "M3M",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK", "Penthouse"],
    budget: [6, 11],
    truthScore: 88,
    recommendation: "Buy",
    confidence: "Medium-High",
    tags: ["Luxury Lifestyle", "Layouts", "Location", "Amenities & Wellness"],
    reason: "Golf-facing layouts that command a durable lifestyle premium.",
    strengths: ["Golf-facing layouts", "Durable lifestyle premium", "Established M3M ecosystem"],
    watchouts: ["Higher maintenance and density", "Thinner near-term price upside"],
  },
  {
    name: "Godrej Aristocrat",
    developer: "Godrej",
    market: "SPR",
    configs: ["3 BHK", "4 BHK"],
    budget: [4, 7],
    truthScore: 90,
    recommendation: "Strong Buy",
    confidence: "High",
    tags: ["On-Time Delivery", "Developer Reputation", "Legal Safety", "Construction Quality"],
    reason: "Institutional-grade execution with a low-risk delivery profile.",
    strengths: [
      "Institutional-grade execution",
      "Low delivery risk profile",
      "Strong build-quality reputation",
    ],
    watchouts: ["Tighter unit availability", "Amenities still developing"],
  },
  {
    name: "Smartworld One DXP",
    developer: "Smartworld",
    market: "Dwarka Expressway",
    configs: ["2 BHK", "3 BHK", "4 BHK"],
    budget: [3, 6],
    truthScore: 84,
    recommendation: "Buy",
    confidence: "Medium",
    tags: ["Capital Appreciation", "Value Buying", "Rental Yield", "Early-Entry Pricing"],
    reason: "Early-corridor pricing with the widest appreciation runway.",
    strengths: ["Early-corridor pricing", "Widest appreciation runway", "Healthy rental demand"],
    watchouts: ["Corridor infrastructure maturing", "Developer record still building"],
  },
  {
    name: "Signature Global Titanium SPR",
    developer: "Signature Global",
    market: "SPR",
    configs: ["2 BHK", "3 BHK"],
    budget: [2, 4],
    truthScore: 82,
    recommendation: "Consider",
    confidence: "Medium",
    tags: ["Value Buying", "Rental Yield", "Legal Safety", "Early-Entry Pricing"],
    reason: "Best entry value on SPR with healthy rental demand.",
    strengths: ["Best entry value on SPR", "Healthy rental absorption", "Strong value-to-quality ratio"],
    watchouts: ["Mid-tier finishes", "Higher project density"],
  },
  {
    name: "Puri Aravallis",
    developer: "Puri",
    market: "Sohna",
    configs: ["3 BHK", "4 BHK"],
    budget: [2, 4],
    truthScore: 80,
    recommendation: "Consider",
    confidence: "Medium",
    tags: ["Value Buying", "Capital Appreciation", "Layouts", "Low-Density / Green"],
    reason: "Generous layouts at a value entry point along the Sohna belt.",
    strengths: ["Generous layouts", "Value entry point", "Sohna-belt appreciation potential"],
    watchouts: ["Longer appreciation horizon", "Connectivity still improving"],
  },
  {
    name: "Birla Navya",
    developer: "Birla Estates",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK", "Duplex"],
    budget: [6, 12],
    truthScore: 89,
    recommendation: "Buy",
    confidence: "Medium-High",
    tags: ["Luxury Lifestyle", "Developer Reputation", "Construction Quality", "Layouts", "Low-Density / Green", "Amenities & Wellness"],
    reason: "Low-density luxury with brand-grade build quality.",
    strengths: ["Low-density luxury", "Brand-grade build quality", "Efficient premium layouts"],
    watchouts: ["Premium pricing", "Smaller community scale"],
  },
  {
    name: "Conscient Parq",
    developer: "Conscient",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK"],
    budget: [4, 7],
    truthScore: 83,
    recommendation: "Consider",
    confidence: "Medium",
    tags: ["Luxury Lifestyle", "Location", "Layouts", "Low-Density / Green"],
    reason: "Boutique address with efficient, livable floor plans.",
    strengths: ["Boutique address", "Efficient, livable floor plans", "Strong GCE location"],
    watchouts: ["Boutique developer scale", "Limited amenity footprint"],
  },
  {
    name: "Emaar Urban Ascent",
    developer: "Emaar",
    market: "New Gurgaon",
    configs: ["2 BHK", "3 BHK"],
    budget: [2, 4],
    truthScore: 81,
    recommendation: "Buy",
    confidence: "Medium",
    tags: ["Value Buying", "Rental Yield", "Capital Appreciation", "Early-Entry Pricing"],
    reason: "New Gurgaon value play with steady rental absorption.",
    strengths: ["New Gurgaon value play", "Steady rental absorption", "Emaar delivery credibility"],
    watchouts: ["Longer growth horizon", "Submarket still maturing"],
  },
];

/* Corridor canonicalisation — the buyer picks from LOCATIONS ("SPR", "Golf
   Course Extension", "Sohna"), the mock PROJECTS carry the same vocab, but the
   LIVE pipeline names the same corridors differently ("Southern Peripheral Road
   (SPR Corridor)", "Golf Course Road Extension (GCRE)", "Sohna Road"). Reduce
   any of those forms to a stable key so a location preference actually weighs
   against a live project's corridor. No-op for the mock path (both sides already
   share the LOCATIONS vocab); this is data-side adaptation, not a UI change. */
export function corridorKey(s: string): string {
  const t = s.toLowerCase();
  if (t.includes("spr") || t.includes("southern peripheral")) return "spr";
  if (t.includes("dwarka") || t.includes("northern peripheral")) return "dwarka";
  if (t.includes("new gurgaon") || t.includes("new gurugram")) return "new-gurgaon";
  // "Sohna Road" (the in-city corridor) is a different corridor from the
  // Sohna belt south of Gurugram — the pipeline files both names.
  if (t.includes("sohna")) return t.includes("road") ? "sohna-road" : "sohna";
  if (t.includes("nh-48") || t.includes("nh48") || t.includes("nh 48")) return "nh48";
  if (t.includes("noida")) return "noida";
  if (t.includes("golf course")) {
    // "…Extension (GCRE)" / "Golf Course Extension" → GCE; bare "Golf Course Road" → GCR
    return t.includes("ext") || t.includes("gcre") || t.includes("gce") ? "gce" : "gcr";
  }
  return t.trim();
}

const sameCorridor = (a: string, b: string): boolean => corridorKey(a) === corridorKey(b);

/* ── Configuration matching ──
   A buyer's config chip ("3 BHK", "Penthouse", "Duplex", "1 BHK / Studio")
   against a project's offered configs. Tolerant of how the live pipeline
   files unit types: a BHK chip matches on the BHK *number*, so "4 BHK" also
   accepts "4 BHK+" or "4 BHK Premium" but never bleeds into "3.5 BHK"; the
   named types (Penthouse, Duplex, Studio) match as a case-insensitive
   substring. This is what lets configuration act as a real must-have (the
   gate in rankCore) without a formatting mismatch wrongly excluding a home
   the buyer actually wants. NOTE: it can only recognise a Penthouse/Duplex
   if the catalog's config string literally carries that word — today the
   tracked universe derives configs from the backlog `config` summary (plain
   "N BHK"), so those two chips only bite once the pipeline tags unit types. */
const bhkNumber = (s: string): string | null => {
  const m = s.toLowerCase().match(/(\d(?:\.\d)?)\s*bhk/);
  return m ? m[1] : null;
};
export const configMatches = (chip: string, cfg: string): boolean => {
  const w = chip.toLowerCase();
  const c = cfg.toLowerCase();
  if (w.includes("penthouse")) return c.includes("penthouse");
  if (w.includes("duplex")) return c.includes("duplex");
  if (w.includes("studio")) return c.includes("studio") || bhkNumber(cfg) === "1";
  const n = bhkNumber(chip);
  if (n) return bhkNumber(cfg) === n;
  return c === w;
};

/* ── Ranking v2 signals (docs/ranking-v2-spec.md) ──
   Trust tags are the objective safety signals the pipeline stamps on a project;
   personaOf reads the buyer's purchase intent so an investor and an end-user
   get different weights. Kept module-level and pure so the ranker stays
   auditable and unit-testable. */
const TRUST_TAGS = ["On-Time Delivery", "Legal Safety", "Developer Reputation"];
const bhkAdjacent = (chip: string, cfg: string): boolean => {
  const a = bhkNumber(chip);
  const b = bhkNumber(cfg);
  return a != null && b != null && Math.abs(Number(a) - Number(b)) === 1;
};
const normTruth = (t: number): number => Math.max(0, Math.min(1, (t - 60) / 35));

export type Persona = "investor" | "end-user";
export const personaOf = (d: BuyData): Persona =>
  d.purchaseType === "Investment" ? "investor" : "end-user";

/* ── Persona weight tables (docs/ranking-v2-spec.md) ──
   One profile per purchase type — each row sums to 100 so the raw score is an
   absolute 0..100. The weights ARE the persona's defaults: what this buyer
   cares about before they pick a single priority pill. The Investor axis
   (Capital-Appreciation / Liquidity tags) only carries weight for Investment.
   Priority PILLS also change per persona (PRIORITIES_BY_TYPE above). */
export type RankWeights = {
  budget: number;
  config: number;
  location: number;
  priority: number;
  trust: number;
  invest: number;
};
export const PERSONA_WEIGHTS: Record<string, RankWeights> = {
  "First Home": { budget: 28, config: 20, location: 14, priority: 18, trust: 20, invest: 0 },
  Upgrade: { budget: 20, config: 26, location: 16, priority: 18, trust: 20, invest: 0 },
  Investment: { budget: 24, config: 8, location: 12, priority: 12, trust: 20, invest: 24 },
  "Holiday Home": { budget: 24, config: 14, location: 24, priority: 20, trust: 18, invest: 0 },
};

/* The one-line "what this profile optimises for" shown wherever weights are. */
export const PERSONA_BRIEF: Record<string, string> = {
  "First Home": "Safety first — delivery certainty, legal cleanliness, staying affordable.",
  Upgrade: "Space first — the exact configuration and a better address, built well.",
  Investment: "Return first — appreciation, liquidity and entry price; config barely matters.",
  "Holiday Home": "Place first — the corridor and the lifestyle carry the weight.",
};

export function weightsFor(purchaseType: string | null): RankWeights {
  return (purchaseType && PERSONA_WEIGHTS[purchaseType]) || PERSONA_WEIGHTS["First Home"];
}

/* ── Hard requirements written in the buyer's own words ──
   "duplex is a must", "must be 4 BHK", "penthouse only", "need a duplex" —
   when the notes name a configuration with must/only/need language, that is a
   HARD filter: a project whose known configs don't offer it is out, no
   fallback (the founder's "duplex is a MUST" case — twice). Projects with no
   config data at all are also excluded: we cannot verify a must-have against
   a blank, and "closest there is" is exactly what the buyer said no to. */
const CONFIG_WORD = /(\d(?:\.\d)?\s*bhk|duplex|penthouse|studio|villa|independent floor)/gi;
const MUST_WORD = /\b(must|mandatory|required|non-?negotiable|only|needs?|has to|have to)\b/i;
export function mustHaveConfigsFrom(notes: string | undefined): string[] {
  if (!notes || !MUST_WORD.test(notes)) return [];
  const out = new Set<string>();
  for (const sentence of notes.split(/[.;\n]+/)) {
    if (!MUST_WORD.test(sentence)) continue;
    for (const m of sentence.matchAll(CONFIG_WORD)) {
      const w = m[1].toLowerCase();
      if (w.includes("bhk")) out.add(`${w.replace(/\s*bhk/, "").trim()} BHK`);
      else out.add(w.charAt(0).toUpperCase() + w.slice(1));
    }
  }
  return [...out];
}

/* ── Scoring ──
   rankCore ranks ANY catalog whose items carry the fields the heuristic
   reads (Rankable) — the hand-curated mock PROJECTS, or the live tracked
   universe (ProjectIntel) baked into match-catalog.json. matchPct is
   relative to the strongest item in the SAME set, so the shortlist copy
   ("fits you almost perfectly") stays honest whichever catalog is in play.
   rankProjects is the mock-typed shortcut used by the in-app journey. */
export type Rankable = {
  market: string;
  budget: [number, number];
  configs: string[];
  tags: string[];
  truthScore: number;
};

/* Per-axis diagnostic attached to every ranked item: the 0..1 fit on each
   dimension, its persona weight, and the weighted contribution (weight × fit).
   `score` is the honest absolute raw (Σ contributions, 0..100). Existing callers
   ignore these extra fields — they exist so the /test-rank harness can show WHY
   a project scored what it did without re-deriving the maths. */
export type RankAxis = "budget" | "config" | "location" | "priority" | "trust" | "invest";
export type RankFit = { fit: Record<RankAxis, number>; weight: Record<RankAxis, number>; contribution: Record<RankAxis, number> };
export type Scored = Project & { matchPct: number };

export type RankOpts = {
  /* Honest absolute Match % (docs/ranking-v2-spec.md, step 2) instead of the
     legacy relative clamp. OPT-IN — default stays the clamp so the live
     shortlist is unchanged until the honest numbers pass user testing. */
  honestPct?: boolean;
};

export function rankCore<T extends Rankable>(
  items: readonly T[],
  d: BuyData,
  opts: RankOpts = {},
): (T & { matchPct: number; _score: number; _fit: RankFit })[] {
  const configs = Array.isArray(d?.configs) ? d.configs : [];
  const locations = Array.isArray(d?.locations) ? d.locations : [];
  const priorities = Array.isArray(d?.priorities) ? d.priorities : [];
  const budgetCr = typeof d?.budgetCr === "number" ? d.budgetCr : 6;
  const notes = d?.notes || "";

  const wantsConfig = (p: T) => {
    if (configs.length === 0 || configs.includes("Flexible")) return true;
    const known = p.configs.filter((c) => c && c.toUpperCase() !== "NA");
    if (known.length === 0) return true;
    return configs.some((chip) => known.some((cfg) => configMatches(chip, cfg)));
  };

  const ceiling = budgetCr >= 21 ? Infinity : budgetCr + 2;
  const affordable = items.filter((p) => p.budget[0] <= ceiling);
  const affordablePool = affordable.length ? affordable : items;

  const cfgMatched = affordablePool.filter(wantsConfig);
  const cfgPool = cfgMatched.length ? cfgMatched : affordablePool;

  const musts = mustHaveConfigsFrom(notes);
  const pool = musts.length
    ? cfgPool.filter((p) => {
        const known = p.configs.filter((c) => c && c.toUpperCase() !== "NA");
        return known.length > 0 && musts.some((chip) => known.some((cfg) => configMatches(chip, cfg)));
      })
    : cfgPool;

  const W = weightsFor(d?.purchaseType ?? null);
  const investor = W.invest > 0;

  const budgetFit = (lo: number, hi: number): number => {
    if (budgetCr >= lo) return budgetCr <= hi ? 1 : 0.9;
    return Math.max(0, 1 - (lo - budgetCr) / 2.5);
  };
  const configFit = (p: T): number => {
    if (configs.length === 0 || configs.includes("Flexible")) return 1;
    const known = p.configs.filter((c) => c && c.toUpperCase() !== "NA");
    if (known.length === 0) return 0.5;
    if (configs.some((chip) => known.some((cfg) => configMatches(chip, cfg)))) return 1;
    if (configs.some((chip) => known.some((cfg) => bhkAdjacent(chip, cfg)))) return 0.45;
    return 0.2;
  };
  const locationFit = (p: T): number =>
    locations.length === 0 || locations.some((loc) => sameCorridor(loc, p.market)) ? 1 : 0.25;
  const priorityFit = (p: T): number => {
    if (priorities.length === 0) return 1;
    const served = p.tags.filter((t) => priorities.includes(t)).length;
    return served / priorities.length;
  };
  const trustFit = (p: T): number => {
    const tags = TRUST_TAGS.filter((t) => p.tags.includes(t)).length;
    return 0.7 * normTruth(p.truthScore) + 0.3 * (Math.min(3, tags) / 3);
  };
  const investorFit = (p: T): number => {
    const appreciation = p.tags.includes("Capital Appreciation") ? 0.55 : 0;
    const liquidity = p.tags.includes("Liquidity") ? 0.3 : 0;
    return Math.min(1, appreciation + liquidity + 0.15 * normTruth(p.truthScore));
  };

  const raw = pool
    .map((p) => {
      const [lo, hi] = p.budget;
      const fit: Record<RankAxis, number> = {
        budget: budgetFit(lo, hi),
        config: configFit(p),
        location: locationFit(p),
        priority: priorityFit(p),
        trust: trustFit(p),
        invest: investor ? investorFit(p) : 0,
      };
      const contribution: Record<RankAxis, number> = {
        budget: W.budget * fit.budget,
        config: W.config * fit.config,
        location: W.location * fit.location,
        priority: W.priority * fit.priority,
        trust: W.trust * fit.trust,
        invest: W.invest * fit.invest,
      };
      const s = (Object.values(contribution) as number[]).reduce((a, b) => a + b, 0);
      return { p, s, _fit: { fit, weight: W as Record<RankAxis, number>, contribution } };
    })
    .sort((a, b) => b.s - a.s || b.p.truthScore - a.p.truthScore);

  /* Display Match %. Two mappings, chosen by opts.honestPct:
     • honest (step 2, in user testing) — the weights sum to 100 so `s` already
       IS a 0..100 score; surface it directly (cap 99, never claim perfect).
     • legacy relative clamp (DEFAULT, still live on /shortlist) — `86 + s/max·12`
       floored at 72, which compressed every shortlist into ~86–99.
     Every item also carries `_score` (honest raw) and `_fit` (per-axis
     breakdown) for the /test-rank harness; existing callers ignore them. */
  const max = raw[0]?.s || 1;
  return raw.map(({ p, s, _fit }) => ({
    ...p,
    matchPct: opts.honestPct
      ? Math.min(99, Math.round(s))
      : Math.min(99, Math.max(72, Math.round(86 + (s / max) * 12))),
    _score: Math.round(s),
    _fit,
  })) as (T & { matchPct: number; _score: number; _fit: RankFit })[];
}

export function rankProjects(d: BuyData): Scored[] {
  return rankCore(PROJECTS, d);
}

/* ── Buyer DNA ── */
export type DNA = {
  archetype: string;
  insight: string;
  risk: string;
  budgetRange: string;
  markets: string[];
  config: string;
  topPriorities: string[];
  timeline: string;
  possession: string;
};

/* A second-person line that gives each archetype meaning — the "here's what
   this says about you" moment on the Buyer DNA screen. */
export const ARCHETYPE_INSIGHT: Record<string, string> = {
  "Upgrade Buyer":
    "You already own — this move is about more space, more calm and a better address. We'll weigh low-density living and signature design over the lowest price.",
  "Lifestyle Connoisseur":
    "You buy for how a home feels to live in. We'll lead with layouts, light and lifestyle, and treat the spreadsheet as the sanity check, not the goal.",
  "Growth Investor":
    "You're deploying capital, not just buying a home. We'll focus on appreciation runway, resale liquidity and the numbers behind every play.",
  "Value Seeker":
    "You want the most home for the money, bought right. We'll hunt for genuine entry-price value — not just the lowest sticker.",
  "First-Home Buyer":
    "This is a big first step, so certainty matters most. We'll lean on legal safety, delivery track record and payment ease before anything else.",
  "Considered Buyer":
    "You take your time and weigh the evidence. We'll hand you the full picture on every option — with no pressure to move before you're ready.",
};

export function budgetLabel(v: number): string {
  return v >= 21 ? "₹20 Cr+" : `₹${v} Cr`;
}

export function budgetRange(v: number): string {
  if (v >= 21) return "₹20 Cr+";
  const lo = Math.max(1, v - 1);
  const hi = v + 1;
  return `₹${lo}–${hi} Cr`;
}

const MARKET_SHORT: Record<string, string> = {
  "Golf Course Road": "GCR",
  "Golf Course Extension": "GCE",
  SPR: "SPR",
  "Dwarka Expressway": "Dwarka Expy",
  "New Gurgaon": "New Gurgaon",
  Sohna: "Sohna",
  Noida: "Noida",
};

export function deriveDNA(d: BuyData): DNA {
  const p = Array.isArray(d?.priorities) ? d.priorities : [];
  const configs = Array.isArray(d?.configs) ? d.configs : [];
  const locations = Array.isArray(d?.locations) ? d.locations : [];

  let archetype = "Considered Buyer";
  if (p.includes("Capital Appreciation") || p.includes("Liquidity") || p.includes("Rental Yield"))
    archetype = "Growth Investor";
  else if (p.includes("Luxury Lifestyle") || p.includes("Layouts"))
    archetype = "Lifestyle Connoisseur";
  else if (p.includes("Value Buying")) archetype = "Value Seeker";
  else if (d?.purchaseType === "First Home") archetype = "First-Home Buyer";
  else if (d?.purchaseType === "Upgrade") archetype = "Upgrade Buyer";

  let risk = "Medium";
  if (p.includes("Legal Safety") || p.includes("On-Time Delivery")) risk = "Conservative";
  if (d?.purchaseType === "Investment" && p.includes("Capital Appreciation")) risk = "Medium–High";

  const config =
    configs.length === 0 || configs.includes("Flexible") ? "Flexible" : configs.join(" · ");

  const markets =
    locations.length === 0
      ? ["Open to guidance"]
      : locations.map((m) => MARKET_SHORT[m] ?? m);

  return {
    archetype,
    insight: ARCHETYPE_INSIGHT[archetype] ?? ARCHETYPE_INSIGHT["Considered Buyer"],
    risk,
    budgetRange: budgetRange(d?.budgetCr ?? 6),
    markets,
    config,
    topPriorities: p.length ? p : ["To be discovered together"],
    timeline: d?.timeline ?? "Flexible",
    possession: d?.possession ? (POSSESSION_DNA_LABEL[d.possession] ?? "Under-construction focus") : "Under-construction focus",
  };
}

/* ── Advisor ──
   Founder-led: one accountable advisor, not a roster. Every advisor card —
   the consultation form, the office, and the journey's schedule step — shows
   the founder (see ADVISOR_BY_INTENT in lib/consultation.ts for the single-
   card surfaces). Booking slots stay so the schedule step still works. */
export type Advisor = {
  name: string;
  initials: string;
  specialisation: string;
  slots: string[];
};

export const ADVISORS: Advisor[] = [
  {
    name: "Gaurav Jain",
    initials: "GJ",
    specialisation: "Founder, Truth Estate",
    slots: ["Today · 6:00 PM", "Tomorrow · 11:30 AM", "Thu · 4:00 PM"],
  },
];

/* ── Account persistence (front-end simulation only) ── */
export type Booking = { advisorName: string; slot: string } | null;
export type Account = {
  name: string;
  createdAt: number;
  buy: BuyData;
  booking: Booking;
};

const ACCOUNT_KEY = "truthEstate.account";

export function loadAccount(): Account | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export function saveAccount(a: Account): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

export function clearAccount(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    /* ignore */
  }
}

/* ════════════════════════════════════════════════════════════════
   OFF-RAMP INTEREST CAPTURE
   When someone wants what we don't serve yet (ready-to-move / commercial),
   we don't dead-end them — we capture it. This doubles as a waitlist and a
   demand log ("how much RTM are we turning away?") that tells us which
   market to open next. Front-end simulation; swaps to a real CRM later.
   ════════════════════════════════════════════════════════════════ */
export type InterestKind = "ready-to-move" | "commercial";

export type Interest = {
  kind: InterestKind;
  email: string;
  locations?: string[];
  createdAt: number;
};

const INTEREST_KEY = "truthEstate.interests";

export function saveInterest(i: Interest): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(INTEREST_KEY);
    const list: Interest[] = raw ? (JSON.parse(raw) as Interest[]) : [];
    list.push(i);
    window.localStorage.setItem(INTEREST_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/* ════════════════════════════════════════════════════════════════
   REQUIREMENTS, LEADS & DEEP-INTEL UNLOCKS
   The report's Match Score reads saved requirements; the Tower & Unit
   Intelligence unlock captures a lead and records which projects a buyer
   has opened. All front-end simulation (localStorage) — swaps to a real
   CRM/entitlement service later.
   ════════════════════════════════════════════════════════════════ */
const BUY_KEY = "truthEstate.buy";

export function loadBuyData(): BuyData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BUY_KEY);
    return raw ? (JSON.parse(raw) as BuyData) : null;
  } catch {
    return null;
  }
}

export function saveBuyData(d: BuyData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUY_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
  /* Persist the stated brief to the account too — so it survives sign-out
     (which wipes localStorage) and follows the buyer across devices and login
     methods. This is the ONE writer every brief edit funnels through — the
     journey, the consult fold, the match-score screen, the dashboard's
     "confirm guess" — so putting the server write HERE is what guarantees no
     edit path can silently stay local (the bug: only the office modal's
     saveBrief persisted, so a brief set any other way was lost on the next
     sign-in). Dynamic import breaks the static journey → phoneAuth cycle;
     fire-and-forget, and a no-op when signed out (saveBriefToServer checks the
     session), so the anonymous journey is unaffected. */
  void import("@/lib/phoneAuth")
    .then(({ saveBriefToServer }) => saveBriefToServer(d))
    .catch(() => { /* best-effort — the localStorage copy is already saved */ });
}

export function hasPreferences(d: BuyData): boolean {
  return d.locations.length > 0 || d.configs.length > 0 || d.priorities.length > 0 || d.purchaseType != null;
}

/* A booked consultation is STATED intent — the buyer told us their budget,
   markets and timeline in the consult form. Fold those into the brief (stated
   beats inferred), so the office reflects what they just said rather than
   only what we infer. Budget/timeline are set (fresh explicit input);
   markets/priorities union in (never lose what was there). Writes both stores,
   mirroring office.saveBrief without importing it (which would cycle). */
const CONSULT_BUDGET_CR: Record<string, number> = {
  "Under ₹2 Cr": 2, "₹2–4 Cr": 3, "₹4–7 Cr": 6, "₹7–12 Cr": 10, "₹12 Cr+": 14,
};
export function foldConsultIntoBrief(details: Record<string, string | string[]> | undefined): void {
  if (!details) return;
  const next: BuyData = { ...emptyBuyData, ...(loadBuyData() ?? loadAccount()?.buy ?? {}) };
  let changed = false;

  const budgetStr =
    (typeof details.budget === "string" && details.budget) ||
    (typeof details.capital === "string" && details.capital) || "";
  if (budgetStr && CONSULT_BUDGET_CR[budgetStr]) { next.budgetCr = CONSULT_BUDGET_CR[budgetStr]; changed = true; }

  if (Array.isArray(details.markets) && details.markets.length) {
    next.locations = [...new Set([...next.locations, ...details.markets.filter(Boolean)])];
    changed = true;
  }
  if (typeof details.timeline === "string" && details.timeline) { next.timeline = details.timeline; changed = true; }
  /* Invest "goals" ARE priority tags (Capital Appreciation, Rental Yield …). */
  if (Array.isArray(details.goals) && details.goals.length) {
    next.priorities = [...new Set([...next.priorities, ...details.goals.filter(Boolean)])].slice(0, MAX_PRIORITIES);
    changed = true;
  }

  if (!changed) return;
  saveBuyData(next);
  const acct = loadAccount();
  if (acct) saveAccount({ ...acct, buy: next });
}

/* Absolute single-project fit — an honest 0–100 read of how well a project
   answers THIS buyer's stated needs (unlike the shortlist's relative rank). */
export function matchScoreFor(p: Project, d: BuyData): number {
  let s = 0;
  // Location (34)
  if (d.locations.length === 0) s += 22;
  else s += d.locations.some((loc) => sameCorridor(loc, p.market)) ? 34 : 6;
  // Budget (30)
  const [lo, hi] = p.budget;
  if (d.budgetCr >= lo - 1 && d.budgetCr <= hi + 2) s += 30;
  else s += Math.max(0, 22 - Math.abs(d.budgetCr - (lo + hi) / 2) * 3);
  // Configuration (20)
  const cfg = d.configs.length === 0 || d.configs.includes("Flexible") || p.configs.some((c) => d.configs.includes(c));
  s += cfg ? 20 : 5;
  // Priorities (18)
  if (d.priorities.length === 0) s += 10;
  else {
    const overlap = p.tags.filter((t) => d.priorities.includes(t)).length;
    s += Math.round((overlap / d.priorities.length) * 18);
  }
  return Math.max(8, Math.min(99, Math.round(s)));
}

/* BuyData → the match engine's Buyer. Persona from purchase intent; the chosen
   config maps to a BHK bucket; timeline/exit-year mapping lands with the
   Phase-2 sheet (until then those factors simply drop and renormalize). */
export function buyerFromBuyData(d: BuyData): Buyer {
  const bucket = d.configs.length && !d.configs.includes("Flexible") ? bucketOfChip(d.configs[0]) : null;
  return {
    persona: personaOf(d),
    budgetCr: d.budgetCr,
    bucket,
    corridors: d.locations.length ? d.locations : null,
    poi: d.poi ? { lat: d.poi.lat, lng: d.poi.lng } : null,
    byYear: null,
    exitYears: d.exitYears ?? null,
    priorities: d.priorities,
  };
}

export function matchLabel(pct: number): { label: string; tone: "good" | "fair" | "low" } {
  if (pct >= 82) return { label: "Ideal fit", tone: "good" };
  if (pct >= 68) return { label: "Strong fit", tone: "good" };
  if (pct >= 52) return { label: "Fair fit", tone: "fair" };
  return { label: "Limited fit", tone: "low" };
}

export type Lead = {
  name: string;
  email: string;
  phone?: string;
  project?: string;
  intent: "tower-intel" | "buyer-office" | "documents" | "report-error" | "feedback" | "shortlist-unlock" | "custom-report" | "consultation";
  docs?: string[]; // requested documents (intent: "documents")
  identity?: string; // who's reporting — Developer / Investor / End User / Broker (feedback flows)
  message?: string; // free-text detail (feedback / report-error / consultation flows)
  buy?: BuyData;
  payload?: unknown; // structured extras (e.g. the full consultation booking) → contact_leads.payload
  createdAt: number;
};

const LEAD_KEY = "truthEstate.leads";

const CAPTURE_LEAD_URL =
  "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/capture-lead";

/* Ship the lead to the backend. Fire-and-forget by design: the localStorage
   write above has already succeeded, so a network failure costs us the row
   but never the visitor's submission. `keepalive` matters because most of
   these forms navigate or unmount immediately after submit — without it the
   browser cancels the request in flight and the lead is lost. */
export function postLead(l: Lead): void {
  try {
    void fetch(CAPTURE_LEAD_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        name: l.name,
        email: l.email,
        phone: l.phone,
        intent: l.intent,
        project: l.project,
        docs: l.docs,
        identity: l.identity,
        message: l.message,
        payload: l.payload ?? l.buy ?? null,
        sessionId: readSessionId(),
        source: typeof location !== "undefined" ? location.pathname : undefined,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      }),
    }).catch(() => {
      /* lead capture must never surface an error to the visitor */
    });
  } catch {
    /* same */
  }
}

/* The chat's session id, read directly rather than imported, so this module
   stays free of a dependency on the chat library. */
function readSessionId(): string | undefined {
  try {
    return window.localStorage.getItem("truthEstate.tgSession") ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveLead(l: Lead): void {
  if (typeof window === "undefined") return;
  /* localStorage first and unconditionally. It is no longer the system of
     record — public.leads is — but it is what makes the write safe to treat
     as fire-and-forget, and it keeps the visitor's own history working
     offline. */
  try {
    const raw = window.localStorage.getItem(LEAD_KEY);
    const list: Lead[] = raw ? (JSON.parse(raw) as Lead[]) : [];
    list.push(l);
    window.localStorage.setItem(LEAD_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  postLead(l);
  /* Feedback and report-error are NOT enquiries. They are still recorded as
     leads (postLead, above), but they must not fire the funnel/inference
     event — leaving feedback on a report is not buying intent, and counting
     it would inflate that project's weight in the brief inference. */
  const isEnquiry = l.intent !== "feedback" && l.intent !== "report-error";
  /* The slug as well as the name. Reports are recorded under a slug
     (report_viewed), leads carried only a display name, so "DLF The
     Arbour" and "dlf-the-arbour" never joined — and every funnel question
     of the form "which report did they read before enquiring" came back
     empty. events.project_slug is the indexed column; it has to be set. */
  if (isEnquiry) {
    fireEvent("lead_captured", {
      projectName: l.project,
      ...(l.project ? { projectSlug: modelSlugFor(l.project) } : {}),
      props: { intent: l.intent, ...(l.docs?.length ? { docs: l.docs } : {}) },
    });
  }
  // a project-scoped lead is a 'lead'-tier model entitlement (no-op while dormant)
  if (l.project) grantModelAccess(modelSlugFor(l.project), l.phone || l.email, "lead");
}

/* Buyer Office membership — global (join once, unit intelligence unlocks
   everywhere). Separate from per-project unlocks. */
const MEMBER_KEY = "truthEstate.member";

export function isMember(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMember(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEMBER_KEY, "1");
  } catch {
    /* ignore */
  }
  // membership unlocks everywhere → one grant per project (server clamps the tier);
  // name → slug is the same dialect projects.ts tiSlug proves against page slugs
  grantModelAccess(PROJECTS.map((p) => modelSlugFor(p.name)), resolveModelSubject(), "member");
}

/* A Buyer Office advisor call — complimentary (part of free membership, not
   the paid formal consultation). One booking per member; front-end only. */
export type MemberCall = {
  advisor: string;
  initials: string;
  focus: string;
  day: string;
  time: string;
  format: string;
  project?: string;
  createdAt: number;
};

const MEMBER_CALL_KEY = "truthEstate.memberCall";

export function loadMemberCall(): MemberCall | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEMBER_CALL_KEY);
    return raw ? (JSON.parse(raw) as MemberCall) : null;
  } catch {
    return null;
  }
}

export function saveMemberCall(c: MemberCall): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEMBER_CALL_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

const UNLOCK_KEY = "truthEstate.unlocked";

export function loadUnlocks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(UNLOCK_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isUnlocked(slug: string): boolean {
  return loadUnlocks().includes(slug);
}

export function unlockProject(slug: string): void {
  if (typeof window === "undefined") return;
  fireEvent("report_unlocked", { projectSlug: slug });
  try {
    const list = loadUnlocks();
    if (!list.includes(slug)) {
      list.push(slug);
      window.localStorage.setItem(UNLOCK_KEY, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }
  // paid single-project unlock (server clamps to 'lead' until real payments carry the admin key)
  grantModelAccess(slug, resolveModelSubject(), "paid");
}

/* ── Tower & Unit Intelligence pricing (freemium wedge) ──
   Exploring the live 3D and the sample unit is free. The full per-unit
   verdict is paid: a single project (unlockProject) or site-wide
   All-Access (isMember), which also carries the advisory consultation.
   The single-project fee is credited toward it.

   MEMBERSHIP_INR is gone rather than corrected. It held an old membership
   price that no longer matched what All-Access actually cost, and the two
   sat a hundred and eighty lines apart agreeing about nothing. Deleting it
   leaves one source of truth for the price — the pricing table (migration
   0013), which razorpay-order charges from and getPackages() mirrors —
   instead of a second number waiting to be picked up by the next thing
   that needs one. */
export const PROJECT_UNLOCK_INR = 1499;

/* Full unit-intelligence access = a paid single-project unlock OR membership. */
export function hasFullAccess(slug: string): boolean {
  return isMember() || isUnlocked(slug);
}

/* ════════════════════════════════════════════════════════════════
   ACCESS & PACKAGES (v2) — the paid-content model.

   Registration (signed in) is free and opens the Private Office but
   unlocks no reads. Content access is bought:
     • read    ₹1,100 (list ₹2,100)   — one project's full read (no 3D)
     • read3d  ₹1,499                 — retired; read + its Sun & Vastu 3D
     • all     ₹5,100 (list ₹11,000)  — every read + every 3D (+ 2 on-demand)
   Seeded fallback only; the pricing table is the live authority.
   Custom packages (and any Deal-Room mandate fee) are set after the
   first free advisor call — never a fixed number on the site.

   Front-end simulation: entitlements live in localStorage and are
   wiped by the hard-refresh reset like everything else. Real access
   will be server-verified after Razorpay; this is the demo seam. */

export type PackageId = "read" | "read3d" | "all";
/* `inr` is the effective (charged) price; `mrp` is the struck list price
   when an offer is running, and the gap is the discount. Both are served
   live from the pricing table — see the overlay below. */
export type Package = { id: PackageId; label: string; inr: number; mrp?: number; discountLabel?: string | null; scope: "project" | "site"; includes3D: boolean; blurb: string };
/* WHAT WE SELL. Iterated by the unlock modal and the pricing page, so
   anything absent here is simply not offered anywhere. */
/* Effective prices + the inaugural discount, kept in step with the seed in
   migration 0013. This is the FALLBACK the bundle ships with; getPackages()
   / packageById() return the live overlay below, which the `pricing`
   function refreshes from the table without a redeploy. */
export const PACKAGES: Package[] = [
  { id: "read", label: "Full Read", inr: 1100, mrp: 2100, discountLabel: "Inaugural offer", scope: "project", includes3D: false, blurb: "This project's complete forensic read — every pillar, the price journey, ROI model and verdict." },
  { id: "all", label: "All-Access", inr: 5100, mrp: 11000, discountLabel: "Inaugural offer", scope: "site", includes3D: true, blurb: "Every read and every 3D across the site — plus 2 on-demand project reports & 3Ds." },
];

/* WHAT WE STILL HONOUR. Retired from sale, never from the ledger.
   The Sun & Vastu 3D advisor exists for a handful of projects and is
   still in beta, so a standalone SKU built around it was selling a promise
   the catalogue could not keep for most of it — founder's call to
   withdraw it. 3D does not disappear: All-Access includes it, and every
   3D the tier has already sold stays exactly where it is.

   It lives here rather than being deleted because deleting it would have
   been silent and expensive. packageById is what the client shows as an
   upgrade credit, and with read3d gone it would fall through to the read
   price — so a returning buyer who paid for the 3D tier would be
   under-credited against All-Access, quietly overcharging exactly the
   customers who bought the thing we withdrew. The server's own price
   table keeps its read3d row for the same reason. */
export const RETIRED_PACKAGES: Package[] = [
  { id: "read3d", label: "Read + Sun & Vastu 3D", inr: 1499, mrp: 1499, scope: "project", includes3D: true, blurb: "The full read plus the interactive Sun & Vastu 3D advisor for this project." },
];

/* ── LIVE PRICING OVERLAY ────────────────────────────────────────
   The prices and the inaugural discount live in the `pricing` table
   (migration 0013) and are served by the `pricing` function, so changing a
   number or ending the offer is a SQL update, not a redeploy. `_pricing`
   starts as the shipped fallback (PACKAGES), is hydrated from the last good
   response on load for an instant correct paint, and is replaced on the
   first fetch. The charge is always the server's — razorpay-order reads the
   table live — so a momentarily stale display can never mis-charge a card. */
const PRICING_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/pricing";
export const PRICING_EVENT = "truthEstate:pricing";

type EndpointPackage = {
  id: string; label: string; scope: "project" | "site";
  mrp: number; price: number; discountLabel: string | null;
  includes3D: boolean; blurb: string;
};

function mergePricing(rows: EndpointPackage[]): Package[] {
  const out: Package[] = [];
  for (const r of rows) {
    if (r.id !== "read" && r.id !== "read3d" && r.id !== "all") continue;
    const fb = PACKAGES.find((p) => p.id === r.id);
    out.push({
      id: r.id, label: r.label || fb?.label || r.id,
      inr: r.price, mrp: r.mrp, discountLabel: r.discountLabel ?? null,
      scope: r.scope, includes3D: !!r.includes3D, blurb: r.blurb || fb?.blurb || "",
    });
  }
  return out.length ? out : PACKAGES;
}

/* Starts — and stays, until a fetch — at the shipped fallback, on the
   server AND on the client's first render. That is what keeps static HTML
   and hydration byte-identical: the live overlay is only ever applied after
   mount (fetchPricing runs from a useEffect), never during SSR or the first
   paint, so a price changed in the database can never cause a hydration
   mismatch — it just updates a beat later. */
let _pricing: Package[] = PACKAGES;

let _pricingAt = 0;
let _pricingInflight: Promise<Package[]> | null = null;

/* Fetch live prices at most once a minute; the paywall calls this on mount.
   Never throws and never blanks the offer — any failure keeps whatever
   _pricing already holds. Fires PRICING_EVENT so mounted price displays
   re-read. */
export async function fetchPricing(): Promise<Package[]> {
  if (typeof window === "undefined") return _pricing;
  if (Date.now() - _pricingAt < 60_000) return _pricing;
  if (_pricingInflight) return _pricingInflight;
  _pricingInflight = (async () => {
    try {
      const res = await fetch(PRICING_URL, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json().catch(() => null) as { ok?: boolean; packages?: EndpointPackage[] } | null;
        if (data?.ok && Array.isArray(data.packages) && data.packages.length) {
          _pricing = mergePricing(data.packages);
          _pricingAt = Date.now();
          window.dispatchEvent(new Event(PRICING_EVENT));
        }
      }
    } catch { /* keep current _pricing */ }
    finally { _pricingInflight = null; }
    return _pricing;
  })();
  return _pricingInflight;
}

export function getPackages(): Package[] { return _pricing; }

export const packageById = (id: PackageId): Package =>
  _pricing.find((p) => p.id === id) ?? RETIRED_PACKAGES.find((p) => p.id === id) ?? _pricing[0];
/* Fallback only; live callers read packageById("read").inr. */
export const READ_FROM_INR = 1100;

/* The discount to render, or null when the list price equals the charge.
   One definition so every strike-through (pricing page, unlock modal,
   paywall, receipt) agrees on what "on offer" means and what % to show. */
export function discountOf(p: { inr: number; mrp?: number | null; discountLabel?: string | null }): { mrp: number; label: string; pct: number; off: number } | null {
  if (!p.mrp || p.mrp <= p.inr) return null;
  return { mrp: p.mrp, label: p.discountLabel || "Offer", pct: Math.round((1 - p.inr / p.mrp) * 100), off: p.mrp - p.inr };
}

const SIGNED_IN_KEY = "truthEstate.signedIn";
/* ── Where the reader stands on a project ───────────────────────
   Asked once, at the moment they unlock: do they already own here, or
   are they weighing it? It is the one thing about a reader the site
   cannot infer — everything else (what they read, shortlisted, compared)
   describes someone shopping, and an owner shopping and an owner
   checking on money already committed look identical in that data.

   Stored per project, because the same person is an owner of one tower
   and a prospect for the next one. */
export type Stake = "invested" | "considering";
const STAKE_KEY = "truthEstate.stake";

export function readStake(slug: string): Stake | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STAKE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, Stake>) : {};
    return map[slug] ?? null;
  } catch { return null; }
}

export function saveStake(slug: string, stake: Stake, projectName?: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STAKE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, Stake>) : {};
    map[slug] = stake;
    window.localStorage.setItem(STAKE_KEY, JSON.stringify(map));
  } catch { /* a full quota must not block the unlock behind this */ }
  fireEvent("stake_declared", { projectSlug: slug, projectName, props: { stake } });
}

const ACCESS_KEY = "truthEstate.access";
type AccessState = { all: boolean; reads: string[]; threeD: string[] };

function loadAccess(): AccessState {
  if (typeof window === "undefined") return { all: false, reads: [], threeD: [] };
  try {
    const raw = window.localStorage.getItem(ACCESS_KEY);
    const a = raw ? (JSON.parse(raw) as Partial<AccessState>) : {};
    return { all: !!a.all, reads: a.reads ?? [], threeD: a.threeD ?? [] };
  } catch {
    return { all: false, reads: [], threeD: [] };
  }
}
function saveAccess(a: AccessState): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ACCESS_KEY, JSON.stringify(a)); } catch { /* ignore */ }
}

/* Registration / session — opens the Private Office; unlocks no content. */
export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(SIGNED_IN_KEY) === "1" || isMember(); } catch { return false; }
}
export const AUTH_EVENT = "truthEstate:auth";

/* The other half of setSignedIn, and until now it did not exist. Nothing
   in the codebase cleared the session — the only thing that ever "logged
   anyone out" was the reload wipe in layout.tsx, which is demo
   scaffolding and takes no view on whether someone meant to leave.

   Clears the session and everything it entitles, and deliberately not the
   device id: the person leaves, the browser is still the same browser and
   its trail should stay continuous. */
export function signOut(): void {
  if (typeof window === "undefined") return;
  try {
    CLEARED_ON_SIGN_OUT.forEach((k) => window.localStorage.removeItem(k));
  } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(AUTH_EVENT)); } catch { /* ignore */ }
}

export function setSignedIn(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(SIGNED_IN_KEY, "1"); } catch { /* ignore */ }
  /* Sign-in can now happen mid-page — inline in the TruthGuide chat —
     so anything showing auth state has to be told. Without this the
     header keeps saying "Sign in" to someone who just signed in. */
  try { window.dispatchEvent(new Event(AUTH_EVENT)); } catch { /* ignore */ }
}

/* Paid-content checks — the single source of truth for the report + 3D gates.

   Local access is now the CACHE, not the record. The record lives in
   user_profiles.unlocked_reports and payments, and reaches here through
   lib/entitlements. Two things were broken by trusting localStorage
   alone: the reload script in layout.tsx clears the truthEstate.*
   namespace, so a purchase did not survive a refresh; and the 29
   profiles who bought on truthestate.in were unknown to this build
   entirely, so every one of them met a paywall for a report they owned.

   The server can only ever ADD. serverAccess returns null for "not
   known", never false, so a failed request or a signed-out visitor falls
   through to whatever this device already had. Someone who just paid
   must not lose access because the network blinked. */
function serverAccess(slug: string): boolean {
  return serverHasAccess(slug) === true;
}

export function hasReadAccess(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const a = loadAccess();
  return a.all || a.reads.includes(slug) || a.threeD.includes(slug) || isMember() || serverAccess(slug);
}
export function has3DAccess(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const a = loadAccess();
  /* The 3D tier is this build's own product; truthestate.in sells only
     the read, so a server entitlement grants the read and never the 3D.
     Inferring one from the other would hand away something nobody paid
     for. */
  return a.all || a.threeD.includes(slug) || isMember();
}
export function isAllAccess(): boolean {
  if (typeof window === "undefined") return false;
  return loadAccess().all || isMember() || serverAccess("*all*");
}


/* ── Funnel instrumentation ─────────────────────────────────────
   Hooked into the mutators rather than the call sites. grantPackage has
   three callers, saveLead has ten; instrumenting here means every one is
   covered and a new caller is instrumented by construction rather than
   by remembering.

   Imported dynamically because events.ts reaches truthGuideChat, which
   imports this module — a static import would close the cycle. */
function fireEvent(name: string, detail: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  void import("@/lib/events")
    .then((m) => m.track(name as never, detail as never))
    .catch(() => { /* a metric must never break a purchase */ });
}

/* Grant entitlements after a successful payment — or a free unlock. `receipt`
   carries what was actually collected so the Office invoice is truthful: a
   free first read passes { amountInr: 0, mrpInr: 2100, discountLabel: "First
   report free" } and the invoice reads ₹0, not the list price. Omitted → the
   package list price, the paid path's behaviour, unchanged. */
export function grantPackage(pkg: PackageId, slug?: string, receipt?: { amountInr?: number; mrpInr?: number; discountLabel?: string }): void {
  const a = loadAccess();
  if (pkg === "all") {
    a.all = true;
  } else if (slug) {
    if (!a.reads.includes(slug)) a.reads.push(slug);
    if (pkg === "read3d" && !a.threeD.includes(slug)) a.threeD.push(slug);
  }
  saveAccess(a);
  setSignedIn();
  /* The money moment. Every purchase path reaches here, so this is the
     one place the funnel needs to know about.

     PRICED FROM THE PACKAGE TABLE, not from three separate constants. The
     ternary this replaces read a MEMBERSHIP_INR for All-Access — a figure
     from an earlier membership price that PACKAGES was later set below and
     nobody reconciled. Razorpay prices server-side from the packageId, so
     buyers were charged correctly throughout; what was wrong was the number
     we then recorded, which overstated every All-Access sale in our own
     analytics. The other two arms happened to agree with the table, which
     is why it went unseen.

     Note this is the LIST price. A returning buyer paying the upgrade
     difference is charged less, and `payments` is the authority on what
     was actually collected — this event is the funnel's, not finance's. */
  fireEvent("payment_completed", {
    projectSlug: slug,
    props: {
      package: pkg,
      amountInr: receipt?.amountInr ?? packageById(pkg).inr,
    },
  });
  /* …and the access it bought. There are two unlock stores: unlockProject
     writes UNLOCK_KEY (the shortlist path) and fires report_unlocked;
     grantPackage writes access.reads (every paid path) and fired nothing.
     So a real purchase logged payment_completed and no report_unlocked,
     and "paid but never opened what they paid for" was unanswerable.
     All-access unlocks the catalogue, not one report, so it is reported
     as its own shape rather than 97 rows. */
  if (pkg === "all") {
    fireEvent("report_unlocked", { props: { package: pkg, scope: "all" } });
  } else if (slug) {
    fireEvent("report_unlocked", { projectSlug: slug, props: { package: pkg, scope: "project" } });
  }
  /* Client-side payment record — the Office's Documents tab generates the
     buyer's invoice from this (no server round-trip in the demo). Best-effort
     and dynamically imported so an invoice write can never break a purchase,
     and so journey.ts keeps no static dependency on the office layer (which
     reads the entitlement store this function just wrote). The report name is
     resolved from the view recorded when the buyer opened the report. */
  void import("@/lib/officeReports")
    .then((m) => {
      const amountInr = receipt?.amountInr ?? packageById(pkg).inr;
      const extra = { mrpInr: receipt?.mrpInr, discountLabel: receipt?.discountLabel };
      if (pkg === "all") {
        m.addPayment({ slug: null, item: "All-Access — every report & 3D across the site", amountInr, ...extra });
      } else if (slug) {
        const v = m.getView(slug);
        const item = v?.name ? `Full read — ${v.name}${v.market ? ` (${v.market})` : ""}` : "Full read";
        m.addPayment({ slug, item, amountInr, ...extra });
      }
    })
    .catch(() => {
      /* an invoice record must never break a purchase */
    });
  // fire-and-forget backend entitlement (dormant until the gate URL is set)
  if (pkg === "all") grantModelAccess(PROJECTS.map((p) => modelSlugFor(p.name)), resolveModelSubject(), "member");
  else if (slug) grantModelAccess(slug, resolveModelSubject(), "paid");
}

/* Full demo reset — wipe every truthEstate.* key (account, brief, membership,
   unlocks, leads, office) so the browser behaves like a first-time visitor. */
/* The device id survives a reset for the same reason it survives a refresh:
   it is not demo state. Clearing it makes the visitor a stranger to the
   event trail and orphans everything written before the reset. The list is
   shared with the layout's pre-hydration script — see durableKeys.ts. */
const IDENTITY_KEYS = new Set<string>(KEEP_ON_DEMO_RESET);

export function clearAllDemoData(): void {
  if (typeof window === "undefined") return;
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("truthEstate") && !IDENTITY_KEYS.has(k))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/* Copy for the two off-ramps — single source so both the Buy journey and the
   consultation flow tell the same honest story. */
export const OFFRAMP_COPY: Record<
  InterestKind,
  { kicker: string; title: string; body: string; cta: string; placeholder: string; done: string; reassure: string }
> = {
  "ready-to-move": {
    kicker: "An honest answer",
    title: "Ready-to-move isn't our focus — yet.",
    body: "We've chosen to go deep on under-construction rather than wide across everything. It's why our read is sharper than a generalist's — and why, for a move-in-ready home today, we'd rather point you straight than pretend.",
    cta: "Tell me when you cover ready-to-move",
    placeholder: "you@email.com",
    done: "Done. We'll be in touch the moment we cover ready-to-move.",
    reassure: "No spam. One message, when it's live.",
  },
  commercial: {
    kicker: "An honest answer",
    title: "We focus on homes, not commercial — for now.",
    body: "Our diligence is built for residential buyers. If commercial is what you need, leave your details and we'll reach out the moment we extend there.",
    cta: "Keep me posted",
    placeholder: "you@email.com",
    done: "Noted. We'll reach out when we extend into commercial.",
    reassure: "No spam. One message, when it's live.",
  },
};

/* ════════════════════════════════════════════════════════════════
   INVEST IN REAL ESTATE JOURNEY
   ════════════════════════════════════════════════════════════════ */

export type InvestData = {
  capitalCr: number;
  horizon: string | null;
  objective: string | null;
  risk: string | null;
  locations: string[];
  priorities: string[];
};

export const emptyInvestData: InvestData = {
  capitalCr: 5,
  horizon: null,
  objective: null,
  risk: null,
  locations: [],
  priorities: [],
};

export const INVEST_HORIZONS = [
  "1–3 Years",
  "3–5 Years",
  "5–7 Years",
  "7+ Years",
  "Flexible",
];

export const INVEST_OBJECTIVES = [
  "Capital Appreciation",
  "Rental Income",
  "Portfolio Diversification",
  "Safe Parking",
  "Legacy Asset",
];

export const INVEST_RISKS = [
  "Conservative",
  "Moderate",
  "Growth-Oriented",
  "Aggressive",
];

export const INVEST_PRIORITIES = [
  "Developer Track Record",
  "Resale Liquidity",
  "Construction Progress",
  "Location Premium",
  "Entry Pricing",
  "Rental Yield",
  "Low Maintenance",
  "Brand Value",
  "Tax Efficiency",
];

export const MAX_INVEST_PRIORITIES = 3;

export type InvestStrategy = {
  investmentStyle: string;
  horizon: string;
  riskProfile: string;
  capitalObjective: string;
  preferredOpportunity: string;
  marketPosition: string;
  view: string;
};

export function deriveInvestStrategy(d: InvestData): InvestStrategy {
  let investmentStyle = "Balanced Investor";
  if (d.objective === "Capital Appreciation" && (d.risk === "Growth-Oriented" || d.risk === "Aggressive"))
    investmentStyle = "Growth Investor";
  else if (d.objective === "Rental Income")
    investmentStyle = "Income Investor";
  else if (d.objective === "Safe Parking" || d.risk === "Conservative")
    investmentStyle = "Capital Preserver";
  else if (d.objective === "Portfolio Diversification")
    investmentStyle = "Strategic Allocator";
  else if (d.objective === "Legacy Asset")
    investmentStyle = "Legacy Builder";

  const horizonDesc: Record<string, string> = {
    "1–3 Years": "Short-term · Active monitoring",
    "3–5 Years": "Medium-term · Growth phase",
    "5–7 Years": "Long-term · Compounding window",
    "7+ Years": "Extended · Maximum patience",
    "Flexible": "Opportunistic · Exit on strength",
  };
  const horizon = horizonDesc[d.horizon ?? "Flexible"] ?? "Opportunistic";

  const riskDesc: Record<string, string> = {
    Conservative: "Conservative · Capital safety first",
    Moderate: "Moderate · Balanced risk-reward",
    "Growth-Oriented": "Growth · Volatility for upside",
    Aggressive: "Aggressive · Maximum exposure",
  };
  const riskProfile = riskDesc[d.risk ?? "Moderate"] ?? "Moderate";

  let capitalObjective = "Wealth growth through property";
  if (d.objective === "Capital Appreciation") capitalObjective = "Maximize appreciation over holding period";
  else if (d.objective === "Rental Income") capitalObjective = "Generate consistent rental income";
  else if (d.objective === "Portfolio Diversification") capitalObjective = "Diversify beyond equities and fixed income";
  else if (d.objective === "Safe Parking") capitalObjective = "Park capital in a tangible, appreciating asset";
  else if (d.objective === "Legacy Asset") capitalObjective = "Build a multi-generational property portfolio";

  const isShort = d.horizon === "1–3 Years";
  const isLong = d.horizon === "5–7 Years" || d.horizon === "7+ Years";
  let preferredOpportunity = "Balanced opportunities across stages";
  if (isShort && d.priorities.includes("Resale Liquidity"))
    preferredOpportunity = "Ready or near-ready with proven resale";
  else if (isShort)
    preferredOpportunity = "Late-construction with near-term exits";
  else if (isLong && d.priorities.includes("Entry Pricing"))
    preferredOpportunity = "Early-stage with runway for appreciation";
  else if (d.priorities.includes("Brand Value") || d.priorities.includes("Developer Track Record"))
    preferredOpportunity = "Branded residences with institutional backing";
  else if (d.priorities.includes("Rental Yield"))
    preferredOpportunity = "High-absorption corridors with rental demand";

  let marketPosition = "Stable with selective opportunity";
  if (d.priorities.includes("Location Premium")) marketPosition = "Premium corridor focus";
  else if (d.priorities.includes("Entry Pricing")) marketPosition = "Value corridor opportunity";

  let view: string;
  if (isShort) {
    view = `For a ${budgetRange(d.capitalCr)} deployment on a short horizon, we would focus on projects near delivery with proven secondary market activity. Speed of exit matters more than peak pricing — liquidity is your edge.`;
  } else if (isLong) {
    view = `With a ${(d.horizon ?? "flexible").toLowerCase()} view and ${budgetRange(d.capitalCr)} to deploy, the opportunity is in earlier-stage projects from established developers where pricing hasn't yet absorbed full market premiums. Patience will be your greatest advantage.`;
  } else {
    view = `At ${budgetRange(d.capitalCr)} with a ${(d.horizon ?? "flexible").toLowerCase()} horizon, we'd look for the intersection of developer quality and pricing discipline — projects where the risk-adjusted return justifies the capital commitment.`;
  }

  return { investmentStyle, horizon, riskProfile, capitalObjective, preferredOpportunity, marketPosition, view };
}

export type InvestRecommendation = Project & { truthMatch: number; investRationale: string };

export function rankInvestProjects(d: InvestData): InvestRecommendation[] {
  const priorityTagMap: Record<string, string[]> = {
    "Developer Track Record": ["Developer Reputation"],
    "Resale Liquidity": ["Liquidity"],
    "Construction Progress": ["On-Time Delivery"],
    "Location Premium": ["Location"],
    "Entry Pricing": ["Value Buying"],
    "Rental Yield": ["Rental Yield"],
    "Brand Value": ["Developer Reputation"],
    "Low Maintenance": ["Construction Quality"],
    "Tax Efficiency": ["Capital Appreciation"],
  };

  const raw = PROJECTS.map((p) => {
    let s = 0;
    if (d.locations.length === 0 || d.locations.includes(p.market)) s += 25;
    else s += 5;

    const [lo, hi] = p.budget;
    if (d.capitalCr >= lo - 1 && d.capitalCr <= hi + 2) s += 22;
    else s += Math.max(0, 14 - Math.abs(d.capitalCr - (lo + hi) / 2) * 2);

    const mapped = d.priorities.flatMap((pr) => priorityTagMap[pr] ?? []);
    s += p.tags.filter((t) => mapped.includes(t)).length * 8;

    if (d.objective === "Capital Appreciation" && p.tags.includes("Capital Appreciation")) s += 12;
    if (d.objective === "Rental Income" && p.tags.includes("Rental Yield")) s += 12;
    if (d.objective === "Safe Parking" && (p.tags.includes("Legal Safety") || p.tags.includes("Developer Reputation"))) s += 10;
    if (d.objective === "Legacy Asset" && p.tags.includes("Luxury Lifestyle")) s += 10;
    if (d.risk === "Conservative" && p.tags.includes("Legal Safety")) s += 8;
    if (d.risk === "Aggressive" && p.tags.includes("Capital Appreciation")) s += 6;

    s += (p.truthScore - 84) * 0.7;

    return { p, s };
  }).sort((a, b) => b.s - a.s);

  const max = raw[0]?.s || 1;
  return raw.slice(0, 3).map(({ p, s }) => {
    let rationale = p.reason;
    if (d.objective === "Capital Appreciation")
      rationale = `Strong appreciation profile: ${p.strengths[0]?.toLowerCase()}.`;
    else if (d.objective === "Rental Income")
      rationale = `High-absorption corridor with ${p.developer}'s delivery credibility.`;
    else if (d.objective === "Safe Parking")
      rationale = `Low-risk: ${(p.strengths.find((x) => /delivery|risk|quality|institutional/i.test(x)) ?? p.strengths[0])?.toLowerCase()}.`;

    return {
      ...p,
      truthMatch: Math.min(99, Math.max(74, Math.round(86 + (s / max) * 12))),
      investRationale: rationale,
    };
  });
}

/* ════════════════════════════════════════════════════════════════
   RESEARCH & COMPARE
   ════════════════════════════════════════════════════════════════ */

export type DeveloperProfile = {
  name: string;
  est: string;
  delivery: string;
  financial: string;
  completed: string;
  building: string;
  legal: string;
  verdict: string;
};

export const DEVELOPER_PROFILES: DeveloperProfile[] = [
  {
    name: "DLF",
    est: "1946",
    delivery: "92% on-time delivery rate across Haryana. Industry-leading handover consistency with minimal delays in last 5 years.",
    financial: "Listed entity (NSE: DLF). Strong balance sheet with consistent debt reduction. Commercial rental income provides stability.",
    completed: "DLF Phase 1–5, DLF The Crest, DLF Kings Court, DLF Aralias, DLF Magnolias, DLF Park Place",
    building: "DLF Privana South, DLF Arbour, DLF The Camellias Phase II",
    legal: "Clean RERA compliance. No material legal disputes. Strong governance framework.",
    verdict: "The most reliable developer in Gurugram for both end-use and investment. Premium pricing is justified by delivery certainty and resale liquidity.",
  },
  {
    name: "Godrej",
    est: "1897",
    delivery: "Strong delivery record with minimal delays. Known for build quality that exceeds industry standards.",
    financial: "Backed by Godrej Industries. Conservative approach to project launches. Strong parent balance sheet.",
    completed: "Godrej Icon, Godrej 101, Godrej Habitat, Godrej Oasis",
    building: "Godrej Aristocrat (SPR), Godrej Zenith",
    legal: "Excellent RERA compliance. No adverse legal history. Transparent documentation.",
    verdict: "Institutional-grade execution with a low-risk delivery profile. Ideal for conservative buyers who prioritise build quality over pricing.",
  },
  {
    name: "M3M",
    est: "2010",
    delivery: "Mixed record — some projects delivered on time, others with delays. Recent projects show improvement in execution.",
    financial: "Unlisted. Aggressive growth funded by project-level financing. Revenue scale has grown significantly.",
    completed: "M3M Golf Estate Phase I, M3M Merlin, M3M Woodshire",
    building: "M3M Golf Estate II, M3M Golf Hills, M3M Antalya Hills",
    legal: "Some historical compliance issues. Recent RERA compliance improved. Due diligence recommended on specific projects.",
    verdict: "Strong lifestyle positioning and GCE dominance. Higher risk-reward profile compared to DLF or Godrej. Best for buyers who value location and lifestyle.",
  },
  {
    name: "Birla Estates",
    est: "2016",
    delivery: "Limited Gurugram delivery history but strong execution in Mumbai and Bangalore. Parent group credibility adds confidence.",
    financial: "Backed by Aditya Birla Group. Conservative project-level financing with strong parent guarantee.",
    completed: "Birla Centurion (Mumbai), Birla Alokya (Bangalore)",
    building: "Birla Navya (Golf Course Extension)",
    legal: "Clean compliance. Institutional-grade documentation. No adverse legal history.",
    verdict: "Low-density luxury with brand-grade build quality. Limited Gurugram track record, but parent group credibility provides strong assurance.",
  },
  {
    name: "Smartworld",
    est: "2019",
    delivery: "Limited delivery history — most projects under construction. Early signs of execution commitment are positive.",
    financial: "Backed by strong promoter group. Aggressive but structured growth on Dwarka Expressway and SPR.",
    completed: "Limited completed inventory",
    building: "Smartworld One DXP, Smartworld Orchard, Smartworld Gems",
    legal: "RERA compliant. Clean start with no historical baggage.",
    verdict: "Early-corridor pricing with growth potential. Higher risk due to limited track record, but strong value proposition for risk-tolerant investors.",
  },
  {
    name: "Emaar",
    est: "1997",
    delivery: "Good delivery record in India. Emaar Palm Heights and Emaar Gurgaon Greens delivered successfully.",
    financial: "Listed globally (DFM: EMAAR). Strong international balance sheet. India operations well-capitalised.",
    completed: "Emaar Palm Heights, Emaar Gurgaon Greens, Emaar Emerald Hills",
    building: "Emaar Urban Ascent, Emaar Digi Homes",
    legal: "Clean RERA compliance. International governance standards applied.",
    verdict: "Global credibility with good India execution. Best for value-segment buyers who want reliability without premium pricing.",
  },
];

export type MarketProfile = {
  name: string;
  short: string;
  overview: string;
  infra: string;
  price: string;
  supply: string;
  demand: string;
  outlook: string;
  projects: string[];
};

export const MARKET_PROFILES: MarketProfile[] = [
  {
    name: "Golf Course Extension",
    short: "GCE",
    overview: "Gurugram's most active luxury micro-market. High concentration of premium developers. Strong end-user and investor demand. ₹4–12 Cr.",
    infra: "Excellent connectivity to Golf Course Road and NH-48. Metro Phase IV planned. Established schools, hospitals, and retail.",
    price: "18–25% appreciation over 3 years. Below Golf Course Road pricing, offering relative value in the luxury segment.",
    supply: "Moderate new supply from DLF Arbour, M3M Golf Estate II, Birla Navya, and Conscient Parq. Absorption rate healthy.",
    demand: "Strong from end-users upgrading and NRI investors. Rental demand growing steadily.",
    outlook: "Positive. Infrastructure completion and limited future land availability should support continued appreciation. Best for 3–5 year growth.",
    projects: ["DLF Arbour", "M3M Golf Estate II", "Birla Navya", "Conscient Parq"],
  },
  {
    name: "SPR",
    short: "SPR",
    overview: "Southern Peripheral Road — Gurugram's fastest-growing corridor. Mix of premium and mid-segment. ₹2–8 Cr.",
    infra: "SPR fully operational. Proximity to Sohna Road and NH-48. Social infrastructure developing rapidly.",
    price: "15–22% appreciation over 3 years. Still offers value relative to GCE and GCR.",
    supply: "Active from DLF Privana South, Godrej Aristocrat, Signature Global Titanium. New launches expected.",
    demand: "Growing from first-time buyers and investors. Emerging value alternative to GCE for quality projects.",
    outlook: "Strong growth trajectory. Infrastructure and developer investment signal long-term confidence. Best for 3–7 year horizon.",
    projects: ["DLF Privana South", "Godrej Aristocrat", "Signature Global Titanium SPR"],
  },
  {
    name: "Golf Course Road",
    short: "GCR",
    overview: "Gurugram's most established luxury address. Ultra-premium projects and commercial hubs. ₹8–25 Cr+.",
    infra: "Best connectivity — Rapid Metro, NH-48, all major arterials. Fully developed social infrastructure.",
    price: "Mature market with steady 8–12% annual appreciation. Limited new supply supports pricing.",
    supply: "Very limited new supply. Most inventory is resale. DLF Camellias Phase II is the only significant launch.",
    demand: "Ultra-high-net-worth end-users and institutional investors. Strongest rental demand in Gurugram.",
    outlook: "Stable with premium positioning. Limited supply ensures value retention. Best for capital preservation and rental income.",
    projects: ["DLF The Camellias", "DLF The Crest", "DLF Aralias", "DLF Magnolias"],
  },
  {
    name: "Dwarka Expressway",
    short: "Dwarka Expy",
    overview: "Gurugram's emerging value corridor connecting to Delhi. Mid-segment and affordable luxury. ₹1.5–6 Cr.",
    infra: "Expressway now operational. Metro extension planned. Airport proximity is key advantage.",
    price: "Highest appreciation corridor — 25–40% over 3 years. Still offers entry-level pricing.",
    supply: "High supply with multiple developers active. Absorption needs monitoring.",
    demand: "Strong from first-time buyers, Delhi investors, and NRIs seeking value.",
    outlook: "High growth potential with infrastructure catalysts. Higher risk due to supply volume. Selective picks critical.",
    projects: ["Smartworld One DXP", "Emaar Digi Homes", "Signature Global City 81"],
  },
  {
    name: "New Gurgaon",
    short: "New Gurgaon",
    overview: "Developing micro-market along NH-8 beyond Manesar. Affordable to mid-segment. ₹1–4 Cr.",
    infra: "NH-8 connectivity is primary. KMP Expressway access. Social infrastructure emerging.",
    price: "Moderate 10–15% appreciation over 3 years. Most affordable in Gurugram.",
    supply: "Healthy from Emaar, Signature Global, and emerging developers.",
    demand: "End-user driven. Strong rental demand from working population near IMT Manesar.",
    outlook: "Steady growth. Infrastructure development will drive next phase. Best for long-term value investment.",
    projects: ["Emaar Urban Ascent", "Emaar Digi Homes"],
  },
  {
    name: "Sohna",
    short: "Sohna",
    overview: "Emerging micro-market south of Gurugram along Sohna Road. Value positioning. ₹1–4 Cr.",
    infra: "Sohna Road and KMP Expressway connectivity. Natural topography with Aravalli proximity.",
    price: "Early-stage 12–18% appreciation over 3 years. Maximum entry-level value in the region.",
    supply: "Active from Puri, Central Park, and emerging developers. Land availability supports continued launches.",
    demand: "Primarily investor-driven with growing end-user interest. Weekend home demand from Delhi.",
    outlook: "Longer appreciation horizon. Infrastructure completion is key catalyst. Best for patient 5–7 year investors.",
    projects: ["Puri Aravallis", "Puri The Aravallis", "Central Park Flower Valley"],
  },
];

export const RESEARCH_SUGGESTIONS = [
  "Should I buy DLF Arbour?",
  "Compare DLF Arbour vs Puri The Aravallis",
  "Which developers deliver on time?",
  "Best luxury projects under ₹8 Cr",
  "Golf Course Road vs SPR",
  "How does Truth Score work?",
  "Construction delays in Gurugram",
  "DLF vs Godrej",
];

export const RESEARCH_PLACEHOLDERS = [
  "Should I buy DLF Arbour?",
  "Compare DLF Arbour with Puri The Aravallis",
  "Which developer has the strongest delivery record?",
  "Where should I invest ₹5 Cr?",
  "Which luxury projects are worth waiting for?",
  "What are the legal risks in this project?",
];

export const RESEARCH_TOPICS = [
  "Projects",
  "Developers",
  "Markets",
  "Pricing",
  "Construction",
  "Legal",
  "Investment",
  "Home Buying",
];

export type ResearchResult = {
  type: "project" | "developer" | "location" | "comparison" | "question";
  title: string;
  subtitle?: string;
  verdict?: string;
  score?: number;
  confidence?: string;
  highlights?: { label: string; value: string }[];
  sections: { label: string; body: string }[];
  strengths?: string[];
  watchouts?: string[];
  followUps: string[];
};

export function classifyAndResearch(query: string): ResearchResult {
  const q = query.toLowerCase();

  if (/\bvs\b|\bcompare\b|\bversus\b/i.test(query)) {
    const mp = PROJECTS.filter((p) => q.includes(p.name.toLowerCase()));
    if (mp.length >= 2) return buildProjectComparison(mp[0], mp[1]);
    const md = DEVELOPER_PROFILES.filter((d) => q.includes(d.name.toLowerCase()));
    if (md.length >= 2) return buildDeveloperComparison(md[0], md[1]);
    const ml = MARKET_PROFILES.filter((m) => q.includes(m.name.toLowerCase()) || q.includes(m.short.toLowerCase()));
    if (ml.length >= 2) return buildLocationComparison(ml[0], ml[1]);
  }

  const project = PROJECTS.find((p) => q.includes(p.name.toLowerCase()));
  if (project) return buildProjectResult(project);

  const dev = DEVELOPER_PROFILES.find((d) => q.includes(d.name.toLowerCase()));
  if (dev) return buildDeveloperResult(dev);

  const loc = MARKET_PROFILES.find((m) => q.includes(m.name.toLowerCase()) || q.includes(m.short.toLowerCase()));
  if (loc) return buildLocationResult(loc);

  return buildQuestionResult(query);
}

function buildProjectResult(p: Project): ResearchResult {
  const dev = DEVELOPER_PROFILES.find((d) => d.name === p.developer);
  const alts = PROJECTS.filter((x) => x.name !== p.name && x.market === p.market).map((x) => x.name);
  return {
    type: "project",
    title: p.name,
    subtitle: `${p.developer} · ${p.market} · ${p.configs.join(", ")}`,
    verdict: p.recommendation,
    score: p.truthScore,
    confidence: p.confidence,
    highlights: [
      { label: "Truth Score", value: `${p.truthScore}/100` },
      { label: "Recommendation", value: p.recommendation },
      { label: "Confidence", value: p.confidence },
      { label: "Budget Range", value: `₹${p.budget[0]}–${p.budget[1]} Cr` },
    ],
    sections: [
      { label: "Executive Summary", body: p.reason },
      { label: "Developer", body: dev ? `${p.developer} (est. ${dev.est}). ${dev.delivery}` : `${p.developer} — established developer with active projects in ${p.market}.` },
      { label: "Construction", body: `${p.recommendation} with ${p.confidence.toLowerCase()} confidence. Progress tracked against committed handover schedule.` },
      { label: "Legal", body: "RERA-registered with clear title and approvals on record. Full documents reviewed with your advisor." },
      { label: "Pricing", body: `${p.strengths.find((s) => /below|value|entry|pricing/i.test(s)) ?? "Positioned competitively for the segment"}. Exact pricing discussed with your advisor — never on a portal.` },
      { label: "ROI Alignment", body: `Aligned to ${p.tags.slice(0, 3).join(", ").toLowerCase()}. Our read on appreciation and liquidity for your specific horizon.` },
      { label: "Alternatives", body: alts.length ? alts.join(" · ") : "Reviewed against the full active set." },
    ],
    strengths: p.strengths,
    watchouts: p.watchouts,
    followUps: [
      `What are the risks with ${p.name}?`,
      `Is ${p.name} good for investment?`,
      `Tell me about ${p.developer}`,
      `Tell me about ${p.market}`,
    ],
  };
}

function buildDeveloperResult(d: DeveloperProfile): ResearchResult {
  const devProjects = PROJECTS.filter((p) => p.developer === d.name);
  return {
    type: "developer",
    title: d.name,
    subtitle: `Established ${d.est}`,
    highlights: [
      { label: "Active Projects", value: `${devProjects.length} tracked` },
      { label: "Avg Truth Score", value: devProjects.length ? `${Math.round(devProjects.reduce((a, p) => a + p.truthScore, 0) / devProjects.length)}/100` : "—" },
    ],
    sections: [
      { label: "Track Record", body: d.verdict },
      { label: "Delivery History", body: d.delivery },
      { label: "Financial Health", body: d.financial },
      { label: "Completed Projects", body: d.completed },
      { label: "Under Construction", body: d.building },
      { label: "Legal Signals", body: d.legal },
    ],
    followUps: [
      ...devProjects.slice(0, 2).map((p) => `Tell me about ${p.name}`),
      `Compare ${d.name} with ${DEVELOPER_PROFILES.find((x) => x.name !== d.name)?.name ?? "alternatives"}`,
      `Best ${d.name} project for investment?`,
    ],
  };
}

function buildLocationResult(m: MarketProfile): ResearchResult {
  return {
    type: "location",
    title: m.name,
    subtitle: m.overview,
    highlights: [
      { label: "Top Projects", value: `${m.projects.length} tracked` },
    ],
    sections: [
      { label: "Market Overview", body: m.overview },
      { label: "Infrastructure", body: m.infra },
      { label: "Price Trends", body: m.price },
      { label: "Supply", body: m.supply },
      { label: "Demand", body: m.demand },
      { label: "Future Outlook", body: m.outlook },
      { label: "Top Projects", body: m.projects.join(" · ") },
    ],
    followUps: [
      ...m.projects.slice(0, 2).map((p) => `Tell me about ${p}`),
      `Compare ${m.name} with ${MARKET_PROFILES.find((x) => x.name !== m.name)?.name ?? "alternatives"}`,
      `Best investment in ${m.short}?`,
    ],
  };
}

function buildProjectComparison(a: Project, b: Project): ResearchResult {
  const winner = a.truthScore >= b.truthScore ? a : b;
  const other = winner === a ? b : a;
  return {
    type: "comparison",
    title: `${a.name} vs ${b.name}`,
    subtitle: "Independent comparison based on our research",
    sections: [
      { label: "Executive Recommendation", body: `${winner.name} scores higher on our independent evaluation (Truth Score ${winner.truthScore} vs ${other.truthScore}). ${winner.reason} However, ${other.name} has its own strengths: ${other.strengths[0]?.toLowerCase()}.` },
      { label: a.name, body: `Truth Score ${a.truthScore}/100 · ${a.recommendation} · ${a.confidence} confidence. ${a.developer} · ${a.market}. ${a.reason}` },
      { label: b.name, body: `Truth Score ${b.truthScore}/100 · ${b.recommendation} · ${b.confidence} confidence. ${b.developer} · ${b.market}. ${b.reason}` },
      { label: "Key Differences", body: `${a.name} leads on ${a.tags[0]?.toLowerCase() ?? "fundamentals"}. ${b.name} leads on ${b.tags[0]?.toLowerCase() ?? "fundamentals"}. Budget overlap: ₹${a.budget[0]}–${a.budget[1]} Cr vs ₹${b.budget[0]}–${b.budget[1]} Cr.` },
      { label: "Who Should Buy Which?", body: `Choose ${a.name} if your priorities include ${a.tags.slice(0, 2).join(" and ").toLowerCase()}. Choose ${b.name} if you value ${b.tags.slice(0, 2).join(" and ").toLowerCase()}.` },
    ],
    followUps: [
      `Tell me more about ${a.name}`,
      `Tell me more about ${b.name}`,
      `Is ${winner.name} good for investment?`,
    ],
  };
}

function buildDeveloperComparison(a: DeveloperProfile, b: DeveloperProfile): ResearchResult {
  return {
    type: "comparison",
    title: `${a.name} vs ${b.name}`,
    subtitle: "Developer comparison based on independent analysis",
    sections: [
      { label: "Executive Recommendation", body: `Both are credible developers with distinct positioning. ${a.name} (est. ${a.est}) and ${b.name} (est. ${b.est}) serve different buyer profiles.` },
      { label: a.name, body: `${a.delivery} ${a.verdict}` },
      { label: b.name, body: `${b.delivery} ${b.verdict}` },
      { label: "Key Differences", body: `${a.name}: ${a.financial.split(".")[0]}. ${b.name}: ${b.financial.split(".")[0]}.` },
      { label: "Who Should Choose Which?", body: `Choose ${a.name} for: ${a.verdict.split(".")[0]?.toLowerCase()}. Choose ${b.name} for: ${b.verdict.split(".")[0]?.toLowerCase()}.` },
    ],
    followUps: [
      `Tell me more about ${a.name}`,
      `Tell me more about ${b.name}`,
      `Best ${a.name} project?`,
      `Best ${b.name} project?`,
    ],
  };
}

function buildLocationComparison(a: MarketProfile, b: MarketProfile): ResearchResult {
  return {
    type: "comparison",
    title: `${a.name} vs ${b.name}`,
    subtitle: "Market comparison based on independent research",
    sections: [
      { label: "Executive Recommendation", body: `Both markets offer distinct opportunities. ${a.name}: ${a.overview.split(".")[0]?.toLowerCase()}. ${b.name}: ${b.overview.split(".")[0]?.toLowerCase()}.` },
      { label: a.name, body: `${a.price} ${a.outlook}` },
      { label: b.name, body: `${b.price} ${b.outlook}` },
      { label: "Infrastructure", body: `${a.short}: ${a.infra.split(".")[0]}. ${b.short}: ${b.infra.split(".")[0]}.` },
      { label: "Key Differences", body: `${a.short} demand: ${a.demand.split(".")[0]?.toLowerCase()}. ${b.short} demand: ${b.demand.split(".")[0]?.toLowerCase()}.` },
      { label: "Who Should Invest Where?", body: `${a.name} for: ${a.outlook.split(".").slice(-1)[0]?.trim()?.toLowerCase() ?? "growth"}. ${b.name} for: ${b.outlook.split(".").slice(-1)[0]?.trim()?.toLowerCase() ?? "growth"}.` },
    ],
    followUps: [
      `Top projects in ${a.name}`,
      `Top projects in ${b.name}`,
      `Best investment in ${a.short}?`,
    ],
  };
}

function buildQuestionResult(query: string): ResearchResult {
  const q = query.toLowerCase();
  type QA = { answer: string; followUps: string[] };
  const answers: [RegExp, QA][] = [
    [/luxury.*under|under.*\bcr\b|best.*project/i, {
      answer: "Under ₹8 Cr, the strongest luxury value today sits with DLF Arbour (GCE, Truth Score 92), Godrej Aristocrat (SPR, Truth Score 90), and Conscient Parq (GCE, Truth Score 83). Each balances layout quality, developer strength, and a credible appreciation case without paying purely for a brand premium. For ultra-luxury above ₹10 Cr, M3M Golf Estate II and Birla Navya offer distinct lifestyle propositions.",
      followUps: ["Tell me about DLF Arbour", "Compare DLF Arbour vs Godrej Aristocrat", "Tell me about Golf Course Extension"],
    }],
    [/deliver|on.?time|reliable|track record/i, {
      answer: "On delivery certainty and build quality, our data favours DLF (92% on-time, est. 1946), Godrej (institutional-grade execution, est. 1897), and Birla Estates (parent-backed credibility, est. 2016) in the current Gurugram cycle. M3M leads on lifestyle positioning but has a more mixed delivery record. Emaar brings global credibility with good India execution. We weight RERA history, on-time ratios, and post-possession complaints — not marketing claims.",
      followUps: ["Tell me about DLF", "Compare DLF vs Godrej", "Tell me about M3M"],
    }],
    [/investment.*location|best.*location|where.*invest/i, {
      answer: "For growth-oriented investment: Golf Course Extension offers the best risk-adjusted returns with 18–25% appreciation over 3 years and strong developer concentration. SPR is the emerging value play with 15–22% appreciation and active new supply. Dwarka Expressway has the highest growth potential (25–40%) but higher risk due to supply volume. For capital preservation: Golf Course Road remains the most liquid and stable market.",
      followUps: ["Tell me about Golf Course Extension", "Compare Golf Course Extension vs SPR", "Tell me about Dwarka Expressway"],
    }],
    [/resale|value|appreciation|roi|return/i, {
      answer: "Resale value in Gurugram is driven by five factors, in order of impact: (1) Developer brand and delivery record — DLF and Godrej properties command 15–20% premiums in resale; (2) Location maturity — established corridors like GCR and GCE have the deepest buyer pools; (3) Construction progress — near-ready units sell faster; (4) Floor and facing — park-facing, higher floors command 8–12% premiums; (5) Market timing — avoid selling when new supply peaks in the same micro-market.",
      followUps: ["Which developers have best resale?", "Compare Golf Course Extension vs SPR", "Best project for investment?"],
    }],
    [/risk|safe|worry|concern/i, {
      answer: "The primary risks in Gurugram real estate today: (1) Over-supply on Dwarka Expressway could pressure near-term appreciation; (2) Developer execution risk with newer, unproven builders; (3) Interest rate sensitivity affecting demand cycles; (4) Infrastructure timeline delays impacting connectivity-dependent corridors. Mitigation: stick with established developers, proven micro-markets, and project-level due diligence. Never rely on projected timelines alone.",
      followUps: ["Which developers are most reliable?", "Tell me about DLF", "Best safe investment?"],
    }],
  ];

  for (const [re, qa] of answers) {
    if (re.test(q)) {
      return {
        type: "question",
        title: query,
        sections: [{ label: "Our View", body: qa.answer }],
        followUps: qa.followUps,
      };
    }
  }

  return {
    type: "question",
    title: query,
    sections: [
      { label: "Our View", body: "Here's how we'd approach this — grounded in delivery records, independent pricing analysis, and risk assessment rather than marketing claims. For a detailed, personalised analysis specific to your situation, speak with one of our independent advisors who can walk through the evidence." },
    ],
    followUps: [
      "Which developers are most reliable?",
      "Best investment locations in Gurugram",
      "Compare DLF Arbour vs Godrej Aristocrat",
      "What affects resale value?",
    ],
  };
}
