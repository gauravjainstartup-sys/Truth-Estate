/* ════════════════════════════════════════════════════════════════
   REQUEST INDEPENDENT ADVICE — data model for the consultation journey
   The bridge between intelligence and representation. Front-end only;
   everything is simulated so the experience feels like joining a
   private advisory practice rather than booking a call.
   ════════════════════════════════════════════════════════════════ */

import { LOCATIONS } from "./journey";

/* The reasons a visitor arrives — mirrors (but is independent from) the
   buy/sell/invest journeys so this flow can stand alone. */
export type ConsultIntent = "buy" | "invest" | "sell" | "advice" | "research";

/* Where the visitor came from. Preserved end-to-end so the advisor can
   "arrive prepared" — e.g. a DLF Arbour intelligence page. */
export type ConsultSourceKind =
  | "homepage"
  | "truthguide"
  | "intelligence"
  | "project"
  | "developer"
  | "location"
  | "journey";

/* A short, human-readable summary of requirements the visitor has already
   given us elsewhere (e.g. their Buyer DNA). Its presence is what makes a
   visitor "warm" — we fast-track them past the reason/situation steps. */
export type ConsultProfileChip = { label: string; value: string };

export type ConsultContext = {
  source?: string; // human label, e.g. "DLF Arbour"
  sourceKind?: ConsultSourceKind;
  intent?: ConsultIntent; // pre-selected reason, if known
  profile?: ConsultProfileChip[]; // a built requirements profile → warm fast-track
};

/* Returns the contextual preparation line, or null for a generic entry. */
export function consultPrepLine(ctx: ConsultContext | undefined): string | null {
  if (!ctx) return null;

  // Arriving from a completed buy/sell/invest journey — we already hold their DNA.
  if (ctx.sourceKind === "journey") {
    switch (ctx.intent) {
      case "buy":
        return "We've already reviewed your Buyer DNA. Your advisor will prepare before the consultation.";
      case "sell":
        return "We've reviewed your selling strategy. Your advisor will prepare before the consultation.";
      case "invest":
        return "We've reviewed your investment thesis. Your advisor will prepare before the consultation.";
      default:
        return "We've reviewed your responses. Your advisor will prepare before the consultation.";
    }
  }

  if (!ctx.source) return null;
  switch (ctx.sourceKind) {
    case "developer":
      return `We'll review ${ctx.source}'s track record before speaking.`;
    case "location":
      return `We'll prepare the ${ctx.source} market picture before speaking.`;
    default:
      return `We'll prepare specifically for ${ctx.source} before speaking.`;
  }
}

/* ── The four things this experience must keep reinforcing ── */
export const CONSULT_PILLARS = [
  "Independent Representation",
  "Prepared Advice",
  "No Sales Pressure",
  "Evidence Before Opinions",
];

/* ── Consultation framing ──
   Set CONSULT_FEE to a number (in ₹) to switch to paid; null = complimentary.
   Architected so payment can be inserted before scheduling without redesign. */
export const CONSULT_FEE: number | null = null;
export const CONSULT_DURATION = "45 Minute Consultation";
export const CONSULT_HEADLINE = "Complimentary First Consultation";

export const CONSULT_TIMELINE = [
  "Understand your goals",
  "Review your shortlisted opportunities",
  "Challenge assumptions",
  "Discuss risks and alternatives",
  "Recommend the best next step",
];

/* We never promise a "buy" recommendation. */
export const CONSULT_OUTCOMES = ["Proceed", "Wait", "Walk Away", "Continue Research", "Compare More Options"];

/* ── Step 2: what brings you here ── */
export type ConsultReason = { key: ConsultIntent; title: string; line: string };

export const CONSULT_REASONS: ConsultReason[] = [
  { key: "buy", title: "Buying a Home", line: "Independent guidance before you commit." },
  { key: "invest", title: "Investing", line: "Evaluate opportunities with clear eyes." },
  { key: "sell", title: "Selling a Property", line: "Position and time your exit well." },
  { key: "advice", title: "Need Independent Advice", line: "A considered second opinion, no agenda." },
  { key: "research", title: "Researching Options", line: "Make sense of the market first." },
];

/* ── Step 3: dynamic fields (max 5 per intent) ── */
export type ConsultFieldType = "text" | "chips" | "chips-multi";
export type ConsultField = {
  name: string;
  label: string;
  type: ConsultFieldType;
  placeholder?: string;
  options?: string[];
};

const BUDGETS = ["Under ₹2 Cr", "₹2–4 Cr", "₹4–7 Cr", "₹7–12 Cr", "₹12 Cr+"];
const TIMELINES = ["Immediately", "Within 3 months", "3–6 months", "Just exploring"];
const HORIZONS = ["Under 3 years", "3–5 years", "5–7 years", "7 years+"];

export const CONSULT_FIELDS: Record<ConsultIntent, ConsultField[]> = {
  buy: [
    { name: "budget", label: "Budget", type: "chips", options: BUDGETS },
    { name: "markets", label: "Preferred Markets", type: "chips-multi", options: LOCATIONS },
    { name: "timeline", label: "Timeline", type: "chips", options: TIMELINES },
    { name: "considering", label: "Projects already considering", type: "text", placeholder: "e.g. DLF Arbour, Godrej Aristocrat" },
  ],
  invest: [
    { name: "capital", label: "Capital", type: "chips", options: BUDGETS },
    { name: "horizon", label: "Investment Horizon", type: "chips", options: HORIZONS },
    { name: "goals", label: "Goals", type: "chips-multi", options: ["Capital Appreciation", "Rental Yield", "Safe Parking", "Diversification", "NRI Portfolio"] },
  ],
  sell: [
    { name: "property", label: "Property", type: "text", placeholder: "Project, configuration, location" },
    { name: "timeline", label: "Timeline", type: "chips", options: TIMELINES },
    { name: "reason", label: "Reason for selling", type: "text", placeholder: "e.g. Upgrading, relocating, liquidity" },
  ],
  advice: [
    { name: "clarity", label: "What would you like clarity on?", type: "text", placeholder: "The one decision you're weighing right now" },
    { name: "context", label: "Anything we should know?", type: "text", placeholder: "Optional — a sentence on your situation" },
  ],
  research: [
    { name: "clarity", label: "What would you like clarity on?", type: "text", placeholder: "e.g. Which corridor, which developer, when to enter" },
    { name: "markets", label: "Markets you're weighing", type: "chips-multi", options: LOCATIONS },
  ],
};

/* ── Step 5: premium scheduling ── */
export type DayPart = "Morning" | "Afternoon" | "Evening";
export const CONSULT_FORMATS = ["Video", "Phone"] as const;
export type ConsultFormat = (typeof CONSULT_FORMATS)[number];

export const CONSULT_DAYS = ["Today", "Tomorrow", "Thursday", "Friday", "Saturday"];

export const CONSULT_DAYPARTS: { part: DayPart; window: string; slots: string[] }[] = [
  { part: "Morning", window: "9 AM – 12 PM", slots: ["9:30 AM", "10:30 AM", "11:30 AM"] },
  { part: "Afternoon", window: "12 – 5 PM", slots: ["12:30 PM", "2:00 PM", "3:30 PM"] },
  { part: "Evening", window: "5 – 8 PM", slots: ["5:30 PM", "6:30 PM", "7:30 PM"] },
];

/* Advisor assignment — intelligent default by intent, with a graceful
   fallback. Mirrors the advisor roster used elsewhere in the product. */
export type ConsultAdvisor = { name: string; initials: string; focus: string };

const ADVISOR_BY_INTENT: Record<ConsultIntent, ConsultAdvisor> = {
  buy: { name: "Aarav Mehta", initials: "AM", focus: "Luxury end-use · Golf Course Extension" },
  invest: { name: "Nisha Kapoor", initials: "NK", focus: "Investment strategy · Emerging corridors" },
  sell: { name: "Rohan Verma", initials: "RV", focus: "Exit positioning · Resale liquidity" },
  advice: { name: "Aarav Mehta", initials: "AM", focus: "Independent advisory · Decision review" },
  research: { name: "Nisha Kapoor", initials: "NK", focus: "Market intelligence · Comparative research" },
};

export function advisorFor(intent: ConsultIntent | null): ConsultAdvisor {
  return intent ? ADVISOR_BY_INTENT[intent] : ADVISOR_BY_INTENT.advice;
}

/* ── The booking record, accumulated across the journey ── */
export type ConsultBooking = {
  reason: ConsultIntent | null;
  details: Record<string, string | string[]>;
  prep: string;
  day: string | null;
  time: string | null;
  format: ConsultFormat | null;
  name: string;
  mobile: string;
  email: string;
  context: ConsultContext;
  createdAt: number;
};

export const emptyConsultBooking = (context: ConsultContext = {}): ConsultBooking => ({
  reason: context.intent ?? null,
  details: {},
  prep: "",
  day: null,
  time: null,
  format: null,
  name: "",
  mobile: "",
  email: "",
  context,
  createdAt: 0,
});

/* ── Persistence (front-end simulation only) ── */
const CONSULT_KEY = "truthEstate.consultation";

export function saveConsultation(b: ConsultBooking): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSULT_KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

export function loadConsultation(): ConsultBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSULT_KEY);
    return raw ? (JSON.parse(raw) as ConsultBooking) : null;
  } catch {
    return null;
  }
}
