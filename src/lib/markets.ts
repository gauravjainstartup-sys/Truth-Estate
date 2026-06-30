/* ════════════════════════════════════════════════════════════════
   LOCATION INTELLIGENCE — Gurugram & its micro-markets.
   One honest read per corridor: verdict, the numbers (projects, price
   band), where it's headed, and the projects we track within it.
   ════════════════════════════════════════════════════════════════ */

import { PROJECTS } from "./journey";

export const GURUGRAM_OVERVIEW = {
  headline: "Gurugram, decoded.",
  body:
    "Gurugram is not one market — it is a dozen of them, each with its own price, risk and trajectory. A flat in DLF's Golf Course Road and a launch on the Dwarka Expressway can differ 3x in price and a generation in maturity. Most buyers see a city; we map the corridors. Below is every micro-market we track — the established spines, the value plays, and the high-growth bets — read independently, on the data.",
  stats: [
    { k: "Micro-markets tracked", v: "6" },
    { k: "Active projects", v: "127" },
    { k: "Price range", v: "₹7K–38K / sq ft" },
  ],
};

export type MarketIntel = {
  slug: string;
  name: string;
  short: string;
  tier: "Established" | "Growth" | "Value" | "Emerging";
  info: string;
  verdict: string;
  projectCount: number;
  psf: { low: number; avg: number; high: number };
  unitBand: string;
  appreciation3Y: string;
  currentTrend: string;
  futureTrend: string;
  infra: string;
  demand: string;
  bestFor: string;
  projectNames: string[];
};

export const MARKETS: MarketIntel[] = [
  {
    slug: "golf-course-road",
    name: "Golf Course Road",
    short: "GCR",
    tier: "Established",
    info: "Gurugram's most established ultra-luxury address — the prime spine, fully built-out, with the deepest buyer pool in the city.",
    verdict: "Capital preservation and the deepest resale liquidity in Gurugram. You pay for certainty.",
    projectCount: 14,
    psf: { low: 18000, avg: 26000, high: 38000 },
    unitBand: "₹8–25 Cr+",
    appreciation3Y: "+8–12%",
    currentTrend: "Mature and stable. Very limited new supply; most activity is resale at firm prices.",
    futureTrend: "Scarcity-led. Limited land keeps values resilient — steady rather than spectacular.",
    infra: "Best-in-city: Rapid Metro, NH-48, all arterials. Fully developed social infrastructure.",
    demand: "Ultra-HNI end-users and institutional investors. The strongest rental demand in Gurugram.",
    bestFor: "Capital preservation · rental income · trophy assets",
    projectNames: ["DLF The Camellias", "DLF The Crest", "DLF Aralias", "DLF Magnolias"],
  },
  {
    slug: "golf-course-extension",
    name: "Golf Course Extension",
    short: "GCE",
    tier: "Established",
    info: "Gurugram's most active luxury micro-market — a dense cluster of premium developers between Golf Course Road and Sohna Road.",
    verdict: "The best risk-adjusted luxury entry in Gurugram today — GCR quality at a relative discount.",
    projectCount: 28,
    psf: { low: 14000, avg: 18000, high: 23000 },
    unitBand: "₹4–12 Cr",
    appreciation3Y: "+18–25%",
    currentTrend: "Prices firming on strong end-user and NRI absorption; healthy launch pipeline.",
    futureTrend: "Metro Phase IV and dwindling land should sustain appreciation over a 3–5 year view.",
    infra: "Excellent links to Golf Course Road and NH-48. Metro Phase IV planned. Established schools, hospitals, retail.",
    demand: "Strong from upgraders and NRI investors; rental demand growing steadily.",
    bestFor: "Luxury end-use · 3–5 year appreciation",
    projectNames: ["DLF Arbour", "M3M Golf Estate II", "Birla Navya", "Conscient Parq"],
  },
  {
    slug: "spr",
    name: "SPR",
    short: "SPR",
    tier: "Growth",
    info: "Southern Peripheral Road — Gurugram's fastest-growing corridor, blending premium and mid-segment along a now-operational arterial.",
    verdict: "The smart value play — quality projects at a clear discount to GCE, with room to run.",
    projectCount: 24,
    psf: { low: 11000, avg: 13500, high: 16000 },
    unitBand: "₹2–8 Cr",
    appreciation3Y: "+15–22%",
    currentTrend: "Active launches and brisk absorption; emerging as the value alternative to GCE.",
    futureTrend: "Infrastructure and developer investment signal long-term confidence; best on a 3–7 year horizon.",
    infra: "SPR fully operational. Proximity to Sohna Road and NH-48. Social infrastructure developing rapidly.",
    demand: "Growing from first-time buyers and investors seeking quality at value pricing.",
    bestFor: "Value buying · 3–7 year growth",
    projectNames: ["DLF Privana South", "Godrej Aristocrat", "Signature Global Titanium SPR"],
  },
  {
    slug: "dwarka-expressway",
    name: "Dwarka Expressway",
    short: "Dwarka Expy",
    tier: "Growth",
    info: "Gurugram's emerging value corridor connecting to Delhi — mid-segment and affordable luxury along a freshly opened expressway.",
    verdict: "Highest growth potential — and highest supply risk. Reward the disciplined, selective buyer.",
    projectCount: 31,
    psf: { low: 9000, avg: 12000, high: 15000 },
    unitBand: "₹1.5–6 Cr",
    appreciation3Y: "+25–40%",
    currentTrend: "Highest appreciation in the region — but heavy supply means absorption needs watching.",
    futureTrend: "Airport proximity, metro extension and the expressway are real catalysts; selective picks critical.",
    infra: "Expressway now operational. Metro extension planned. Airport proximity is the key advantage.",
    demand: "Strong from first-time buyers, Delhi investors and value-seeking NRIs.",
    bestFor: "Growth investors · selective entry",
    projectNames: ["Smartworld One DXP", "Emaar Digi Homes", "Signature Global City 81"],
  },
  {
    slug: "new-gurgaon",
    name: "New Gurgaon",
    short: "New Gurgaon",
    tier: "Value",
    info: "A developing micro-market along NH-8 beyond Manesar — affordable to mid-segment, end-user led.",
    verdict: "Patient, end-user value with dependable rental demand near the industrial belt.",
    projectCount: 18,
    psf: { low: 8000, avg: 10000, high: 12500 },
    unitBand: "₹1–4 Cr",
    appreciation3Y: "+10–15%",
    currentTrend: "Steady, end-user-driven demand; affordable entry relative to core Gurugram.",
    futureTrend: "Infrastructure build-out will drive the next phase; best for long-term value.",
    infra: "NH-8 connectivity is primary, with KMP Expressway access. Social infrastructure emerging.",
    demand: "End-user driven, with strong rental demand from the working population near IMT Manesar.",
    bestFor: "Long-term value · rental yield",
    projectNames: ["Emaar Urban Ascent", "Emaar Digi Homes"],
  },
  {
    slug: "sohna",
    name: "Sohna",
    short: "Sohna",
    tier: "Emerging",
    info: "An emerging belt south of Gurugram along the Aravallis — the region's maximum entry-level value.",
    verdict: "Long-horizon value for patient investors willing to wait for infrastructure to arrive.",
    projectCount: 12,
    psf: { low: 7000, avg: 8500, high: 10500 },
    unitBand: "₹1–4 Cr",
    appreciation3Y: "+12–18%",
    currentTrend: "Early-stage and investor-led, with growing weekend-home interest from Delhi.",
    futureTrend: "Infrastructure completion is the key catalyst; rewards a patient 5–7 year hold.",
    infra: "Sohna Road and KMP Expressway connectivity. Natural Aravalli topography.",
    demand: "Primarily investor-driven with growing end-user and weekend-home interest.",
    bestFor: "Patient 5–7 year investors",
    projectNames: ["Puri Aravallis", "Central Park Flower Valley", "Signature Global City 81"],
  },
];

export function marketBySlug(slug: string): MarketIntel | undefined {
  return MARKETS.find((m) => m.slug === slug);
}

/* Projects we actively score within a market (from the journey dataset) */
export function scoredProjectsIn(name: string) {
  return PROJECTS.filter((p) => p.market === name).sort((a, b) => b.truthScore - a.truthScore);
}

export const fmtPsf = (n: number) => `₹${n.toLocaleString("en-IN")}`;
