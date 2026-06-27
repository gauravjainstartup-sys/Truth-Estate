/* ════════════════════════════════════════════════════════════════
   THE TRUTH ESTATE JOURNEY ENGINE — data model & intelligence
   Pure functions + mock dataset. No backend; everything is derived
   client-side so the visitor receives value before being asked
   for anything. Auth & returning users are simulated via localStorage.
   ════════════════════════════════════════════════════════════════ */

/* The primary CTA is configurable in one place — we may rename later. */
export const PRIMARY_CTA = "Start Your Journey";

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

/* ── Option vocabularies (configurable) ── */
export const GOALS = [
  { key: "buy" as Intent, icon: "🏡", label: "Buy Property", live: true },
  { key: "sell" as Intent, icon: "🏷", label: "Sell Property", live: true },
  { key: "invest" as Intent, icon: "📈", label: "Invest", live: false },
  { key: "research" as Intent, icon: "🔍", label: "Research & Compare", live: false },
];

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

export const CONFIGS = ["2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse", "Duplex", "Flexible"];

export const TIMELINES = [
  "Immediately",
  "Within 3 Months",
  "Within 6 Months",
  "Within 12 Months",
  "Just Exploring",
];

export const PRIORITIES = [
  "Capital Appreciation",
  "Low Risk",
  "Construction Progress",
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
    tags: ["Capital Appreciation", "Developer Reputation", "Liquidity", "Location"],
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
    tags: ["Capital Appreciation", "Developer Reputation", "Construction Progress", "Liquidity"],
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
    tags: ["Luxury Lifestyle", "Layouts", "Location"],
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
    tags: ["Construction Progress", "Developer Reputation", "Low Risk", "Construction Quality"],
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
    tags: ["Capital Appreciation", "Value Buying", "Rental Yield"],
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
    tags: ["Value Buying", "Rental Yield", "Low Risk"],
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
    tags: ["Value Buying", "Capital Appreciation", "Layouts"],
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
    tags: ["Luxury Lifestyle", "Developer Reputation", "Construction Quality", "Layouts"],
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
    tags: ["Luxury Lifestyle", "Location", "Layouts"],
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
    tags: ["Value Buying", "Rental Yield", "Capital Appreciation"],
    reason: "New Gurgaon value play with steady rental absorption.",
    strengths: ["New Gurgaon value play", "Steady rental absorption", "Emaar delivery credibility"],
    watchouts: ["Longer growth horizon", "Submarket still maturing"],
  },
];

/* ── Scoring ── */
export type Scored = Project & { matchPct: number };

export function rankProjects(d: BuyData): Scored[] {
  const wantsConfig = (p: Project) =>
    d.configs.length === 0 ||
    d.configs.includes("Flexible") ||
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
  if (p.includes("Low Risk") || p.includes("Construction Progress")) risk = "Conservative";
  if (d.purchaseType === "Investment" && p.includes("Capital Appreciation")) risk = "Medium–High";

  const config =
    d.configs.length === 0 || d.configs.includes("Flexible") ? "Flexible" : d.configs.join(" · ");

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
    timeline: d.timeline ?? "Just Exploring",
  };
}

/* ── Advisors ── */
export type Advisor = {
  name: string;
  initials: string;
  experience: string;
  specialisation: string;
  languages: string[];
  slots: string[];
};

export const ADVISORS: Advisor[] = [
  {
    name: "Aarav Mehta",
    initials: "AM",
    experience: "14 years",
    specialisation: "Golf Course Extension · Luxury",
    languages: ["English", "Hindi"],
    slots: ["Today · 6:00 PM", "Tomorrow · 11:30 AM", "Thu · 4:00 PM"],
  },
  {
    name: "Nisha Kapoor",
    initials: "NK",
    experience: "11 years",
    specialisation: "SPR · Investment Strategy",
    languages: ["English", "Hindi", "Punjabi"],
    slots: ["Tomorrow · 10:00 AM", "Tomorrow · 5:30 PM", "Fri · 1:00 PM"],
  },
  {
    name: "Rohan Verma",
    initials: "RV",
    experience: "9 years",
    specialisation: "New Gurgaon · Value Buying",
    languages: ["English", "Hindi"],
    slots: ["Today · 7:30 PM", "Wed · 12:00 PM", "Sat · 11:00 AM"],
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
   SELL PROPERTY JOURNEY
   ════════════════════════════════════════════════════════════════ */

export type SellData = {
  project: string | null;
  config: string | null;
  tower: string;
  floor: string;
  facing: string;
  parking: string;
  timeline: string | null;
  priorities: string[];
};

export const emptySellData: SellData = {
  project: null,
  config: null,
  tower: "",
  floor: "",
  facing: "",
  parking: "",
  timeline: null,
  priorities: [],
};

export const SELL_CONFIGS = ["2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse", "Duplex"];

export const SELL_TIMELINES = [
  "Immediately",
  "Within 3 Months",
  "Within 6 Months",
  "No Fixed Timeline",
];

export const SELL_PRIORITIES = [
  "Maximum Selling Price",
  "Fast Transaction",
  "Low Negotiation",
  "Upgrade to Another Property",
  "Capital Reallocation",
  "Just Exploring",
];

export const MAX_SELL_PRIORITIES = 2;

export const SELL_PROJECTS = [
  "DLF Privana South",
  "DLF Arbour",
  "DLF The Camellias",
  "DLF The Crest",
  "DLF Kings Court",
  "DLF Aralias",
  "DLF Magnolias",
  "M3M Golf Estate",
  "M3M Golf Estate II",
  "M3M Golf Hills",
  "M3M Merlin",
  "M3M Antalya Hills",
  "Godrej Aristocrat",
  "Godrej Icon",
  "Godrej 101",
  "Smartworld One DXP",
  "Smartworld Orchard",
  "Smartworld Gems",
  "Signature Global Titanium SPR",
  "Signature Global City 81",
  "Puri Aravallis",
  "Puri The Aravallis",
  "Puri Diplomatic Greens",
  "Birla Navya",
  "Birla Estates Gurugram",
  "Conscient Parq",
  "Conscient Hines Elevate",
  "Emaar Urban Ascent",
  "Emaar Digi Homes",
  "Emaar Palm Heights",
  "Ireo Victory Valley",
  "Ireo Grand Arch",
  "Bestech Park View Grand Spa",
  "Bestech Park View Sanskruti",
  "SS Hibiscus",
  "Adani Samsara",
  "Central Park Flower Valley",
  "Paras Irene",
  "Vatika City",
  "Tata Primanti",
];

export type SellStrategy = {
  marketPosition: string;
  demand: string;
  competition: string;
  pricingApproach: string;
  sellingWindow: string;
  watchout: string;
  summary: string;
};

export function deriveSellStrategy(d: SellData): SellStrategy {
  const isUrgent = d.timeline === "Immediately" || d.timeline === "Within 3 Months";
  const wantsMax = d.priorities.includes("Maximum Selling Price");
  const wantsFast = d.priorities.includes("Fast Transaction");

  let marketPosition = "Healthy";
  let demand = "Strong";
  let competition = "Moderate";
  let pricingApproach = "Patient";
  let sellingWindow = "45–75 Days";
  let watchout = "Avoid pricing above current buyer appetite.";

  if (wantsFast && isUrgent) {
    pricingApproach = "Market-Aligned";
    sellingWindow = "30–50 Days";
    watchout = "Speed requires precise pricing — overpricing by even 5% can double your selling time.";
  } else if (wantsMax) {
    pricingApproach = "Patient";
    sellingWindow = "60–90 Days";
    watchout = "Maximum price requires patience and the discipline to wait for the right buyer.";
  } else if (d.priorities.includes("Upgrade to Another Property")) {
    pricingApproach = "Strategic";
    sellingWindow = "45–75 Days";
    watchout = "Coordinate selling and buying timelines carefully to avoid bridge financing.";
  } else if (d.priorities.includes("Capital Reallocation")) {
    pricingApproach = "Decisive";
    sellingWindow = "40–65 Days";
    watchout = "Focus on net realisable value after tax — not gross selling price.";
  }

  if (d.priorities.includes("Low Negotiation")) {
    competition = "Low";
    watchout = "Price at a point where the first serious offer is close to your floor.";
  }

  const premium = ["DLF The Camellias", "DLF The Crest", "DLF Aralias", "DLF Magnolias", "DLF Kings Court"];
  if (d.project && premium.includes(d.project)) {
    marketPosition = "Strong";
    demand = "Very Strong";
    competition = "Low";
  }

  const summary = isUrgent
    ? `Based on what you've shared, your property is well positioned for a timely transaction. Success will depend more on pricing precision and presentation than urgency alone.`
    : `Based on what you've shared, we believe your property is well positioned, but success will depend more on pricing strategy and timing than urgency.`;

  return { marketPosition, demand, competition, pricingApproach, sellingWindow, watchout, summary };
}
