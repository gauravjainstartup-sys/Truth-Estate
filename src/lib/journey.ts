/* ════════════════════════════════════════════════════════════════
   THE TRUTH ESTATE JOURNEY ENGINE — data model & intelligence
   Pure functions + mock dataset. No backend; everything is derived
   client-side so the visitor receives value before being asked
   for anything.
   ════════════════════════════════════════════════════════════════ */

export type Intent = "buy" | "sell" | "invest" | "research";

export type BuyData = {
  purchaseType: string | null;
  budgetCr: number; // 1..21  (21 == "20 Cr+")
  locations: string[];
  configs: string[];
  timeline: string | null;
  priorities: string[]; // up to 3
};

export const emptyBuyData: BuyData = {
  purchaseType: null,
  budgetCr: 6,
  locations: [],
  configs: [],
  timeline: null,
  priorities: [],
};

/* ── Option vocabularies ── */
export const PURCHASE_TYPES = ["First Home", "Upgrade", "Investment", "Holiday Home"];

export const LOCATIONS = [
  "Golf Course Road",
  "Golf Course Extension",
  "SPR",
  "Dwarka Expressway",
  "New Gurgaon",
  "Sohna",
  "Noida",
];

export const CONFIGS = ["2 BHK", "3 BHK", "4 BHK", "Penthouse", "Duplex", "No Preference"];

export const TIMELINES = [
  "Immediately",
  "Within 3 Months",
  "Within 6 Months",
  "Within 1 Year",
  "Exploring",
];

export const PRIORITIES = [
  "Capital Appreciation",
  "Construction Certainty",
  "Low Risk",
  "Developer Reputation",
  "Luxury Lifestyle",
  "Layouts",
  "Location",
  "Liquidity",
  "Rental Yield",
  "Value Buying",
  "Construction Quality",
];

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
  tags: string[]; // priorities this project genuinely serves
  reason: string;
};

export const PROJECTS: Project[] = [
  {
    name: "DLF Privana South",
    developer: "DLF",
    market: "SPR",
    configs: ["3 BHK", "4 BHK"],
    budget: [5, 8],
    truthScore: 94,
    tags: ["Capital Appreciation", "Developer Reputation", "Liquidity", "Location"],
    reason: "Strongest resale liquidity on SPR with a proven delivery record.",
  },
  {
    name: "DLF Arbour",
    developer: "DLF",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK"],
    budget: [5, 7],
    truthScore: 92,
    tags: ["Capital Appreciation", "Developer Reputation", "Construction Certainty", "Liquidity"],
    reason: "Priced ~8% below comparable GCE towers with high delivery certainty.",
  },
  {
    name: "M3M Golf Estate II",
    developer: "M3M",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK", "Penthouse"],
    budget: [6, 11],
    truthScore: 88,
    tags: ["Luxury Lifestyle", "Layouts", "Location"],
    reason: "Golf-facing layouts that command a durable lifestyle premium.",
  },
  {
    name: "Godrej Aristocrat",
    developer: "Godrej",
    market: "SPR",
    configs: ["3 BHK", "4 BHK"],
    budget: [4, 7],
    truthScore: 90,
    tags: ["Construction Certainty", "Developer Reputation", "Low Risk", "Construction Quality"],
    reason: "Institutional-grade execution with a low-risk delivery profile.",
  },
  {
    name: "Smartworld One DXP",
    developer: "Smartworld",
    market: "Dwarka Expressway",
    configs: ["2 BHK", "3 BHK", "4 BHK"],
    budget: [3, 6],
    truthScore: 84,
    tags: ["Capital Appreciation", "Value Buying", "Rental Yield"],
    reason: "Early-corridor pricing with the widest appreciation runway.",
  },
  {
    name: "Signature Global Titanium SPR",
    developer: "Signature Global",
    market: "SPR",
    configs: ["2 BHK", "3 BHK"],
    budget: [2, 4],
    truthScore: 82,
    tags: ["Value Buying", "Rental Yield", "Low Risk"],
    reason: "Best entry value on SPR with healthy rental demand.",
  },
  {
    name: "Puri Aravallis",
    developer: "Puri",
    market: "Sohna",
    configs: ["3 BHK", "4 BHK"],
    budget: [2, 4],
    truthScore: 80,
    tags: ["Value Buying", "Capital Appreciation", "Layouts"],
    reason: "Generous layouts at a value entry point along the Sohna belt.",
  },
  {
    name: "Birla Navya",
    developer: "Birla Estates",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK", "Duplex"],
    budget: [6, 12],
    truthScore: 89,
    tags: ["Luxury Lifestyle", "Developer Reputation", "Construction Quality", "Layouts"],
    reason: "Low-density luxury with brand-grade build quality.",
  },
  {
    name: "Conscient Parq",
    developer: "Conscient",
    market: "Golf Course Extension",
    configs: ["3 BHK", "4 BHK"],
    budget: [4, 7],
    truthScore: 83,
    tags: ["Luxury Lifestyle", "Location", "Layouts"],
    reason: "Boutique address with efficient, livable floor plans.",
  },
  {
    name: "Emaar Urban Ascent",
    developer: "Emaar",
    market: "New Gurgaon",
    configs: ["2 BHK", "3 BHK"],
    budget: [2, 4],
    truthScore: 81,
    tags: ["Value Buying", "Rental Yield", "Capital Appreciation"],
    reason: "New Gurgaon value play with steady rental absorption.",
  },
];

/* ── Scoring ── */
export type Scored = Project & { matchPct: number };

export function rankProjects(d: BuyData): Scored[] {
  const wantsConfig = (p: Project) =>
    d.configs.length === 0 ||
    d.configs.includes("No Preference") ||
    p.configs.some((c) => d.configs.includes(c));

  const raw = PROJECTS.map((p) => {
    let s = 0;

    // Location
    if (d.locations.length === 0 || d.locations.includes(p.market)) s += 30;
    else s += 6;

    // Budget overlap (with a little tolerance)
    const [lo, hi] = p.budget;
    if (d.budgetCr >= lo - 1 && d.budgetCr <= hi + 2) s += 26;
    else s += Math.max(0, 16 - Math.abs(d.budgetCr - (lo + hi) / 2) * 2.2);

    // Configuration
    if (wantsConfig(p)) s += 18;

    // Priority alignment
    const overlap = p.tags.filter((t) => d.priorities.includes(t)).length;
    s += overlap * 9;

    // Quality nudge
    s += (p.truthScore - 84) * 0.8;

    return { p, s };
  }).sort((a, b) => b.s - a.s);

  const max = raw[0]?.s || 1;
  return raw.map(({ p, s }) => ({
    ...p,
    matchPct: Math.min(99, Math.max(72, Math.round(86 + (s / max) * 12))),
  }));
}

/* ── Buyer DNA ── */
export type DNA = {
  archetype: string;
  risk: string;
  budgetRange: string;
  markets: string[];
  config: string;
  topPriorities: string[];
  timeline: string;
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
  const p = d.priorities;

  let archetype = "Considered Buyer";
  if (p.includes("Capital Appreciation") || p.includes("Liquidity") || p.includes("Rental Yield"))
    archetype = "Growth Investor";
  else if (p.includes("Luxury Lifestyle") || p.includes("Layouts"))
    archetype = "Lifestyle Connoisseur";
  else if (p.includes("Value Buying")) archetype = "Value Seeker";
  else if (d.purchaseType === "First Home") archetype = "First-Home Buyer";
  else if (d.purchaseType === "Upgrade") archetype = "Upgrade Buyer";

  let risk = "Medium";
  if (p.includes("Low Risk") || p.includes("Construction Certainty")) risk = "Conservative";
  if (d.purchaseType === "Investment" && p.includes("Capital Appreciation")) risk = "Medium–High";

  const config =
    d.configs.length === 0 || d.configs.includes("No Preference")
      ? "Open"
      : d.configs.join(" · ");

  const markets =
    d.locations.length === 0
      ? ["Open to guidance"]
      : d.locations.map((m) => MARKET_SHORT[m] ?? m);

  return {
    archetype,
    risk,
    budgetRange: budgetRange(d.budgetCr),
    markets,
    config,
    topPriorities: p.length ? p : ["To be discovered together"],
    timeline: d.timeline ?? "Exploring",
  };
}
