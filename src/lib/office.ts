/* ════════════════════════════════════════════════════════════════
   THE PRIVATE OFFICE — client portal model (front-end simulation)

   One routed office driven by a single deal STAGE. Modules unlock as
   the stage advances; "paid" later re-skins the office to a premium
   Mandate. Phase 1 ships the pre-call experience (booked) and the
   locked post-call teasers (call_done); later stages are modelled here
   so the UI can light them up without a schema change.
   ════════════════════════════════════════════════════════════════ */

import { deriveDNA, loadAccount, rankProjects, type BuyData } from "./journey";
import { advisorFor, loadConsultation, type ConsultAdvisor } from "./consultation";

/* ── Deal lifecycle ── */
export type DealStage =
  | "booked"
  | "call_done"
  | "paid"
  | "site_visits"
  | "buy_mandate"
  | "offers"
  | "sale_offer"
  | "token"
  | "bba"
  | "closed";

export const STAGE_ORDER: DealStage[] = [
  "booked",
  "call_done",
  "paid",
  "site_visits",
  "buy_mandate",
  "offers",
  "sale_offer",
  "token",
  "bba",
  "closed",
];

export const STAGE_LABEL: Record<DealStage, string> = {
  booked: "Consultation booked",
  call_done: "Consultation done",
  paid: "Mandate active",
  site_visits: "Site visits",
  buy_mandate: "Buy mandate",
  offers: "Offers in",
  sale_offer: "Sale offer",
  token: "Token paid",
  bba: "BBA signed",
  closed: "Owned",
};

/* The short milestones we draw on the journey arc. */
export const STAGE_ARC: { stage: DealStage; short: string }[] = [
  { stage: "booked", short: "Booked" },
  { stage: "call_done", short: "Consulted" },
  { stage: "paid", short: "Mandate" },
  { stage: "site_visits", short: "Visits" },
  { stage: "offers", short: "Offers" },
  { stage: "bba", short: "BBA" },
  { stage: "closed", short: "Owned" },
];

export const stageIndex = (s: DealStage) => STAGE_ORDER.indexOf(s);
export const isPaid = (s: DealStage) => stageIndex(s) >= stageIndex("paid");

/* ── Office sections (the URL buckets) ── */
export type SectionKey =
  | "home"
  | "requirements"
  | "recommendations"
  | "advice"
  | "questions"
  | "documents"
  | "portfolio";

export const SECTIONS: { key: SectionKey; label: string; path: string }[] = [
  { key: "home", label: "Home", path: "/office" },
  { key: "requirements", label: "My Requirements", path: "/office/requirements" },
  { key: "recommendations", label: "Recommendations", path: "/office/recommendations" },
  { key: "advice", label: "Independent Advice", path: "/office/advice" },
  { key: "questions", label: "Questions", path: "/office/questions" },
  { key: "documents", label: "Documents & Reports", path: "/office/documents" },
  { key: "portfolio", label: "My Portfolio", path: "/office/portfolio" },
];

/* ── Building blocks ── */
export type Chip = { label: string; value: string };

export type OfficeCall = {
  day: string;
  time: string;
  format: string;
  done?: boolean;
  summary?: string; // post-call synopsis (locked until paid)
};

export type OfficeQuestion = {
  id: string;
  q: string;
  a?: string;
  by?: "TruthGuide AI" | "Your advisor";
  status: "pending" | "answered";
  at: number;
};

export type DocGroup = "Project Reports" | "Legal & BBA" | "Letters & Allotment";
export type OfficeDoc = {
  id: string;
  group: DocGroup;
  name: string;
  status: "locked" | "ready" | "uploaded";
  note?: string;
};

export type RecStatus = "investigating" | "recommended" | "rejected" | "new";
export type OfficeRec = {
  name: string;
  developer: string;
  market: string;
  truthScore: number;
  matchPct: number;
  status: RecStatus;
  note?: string;
};

export type OfficeThread = {
  id: string;
  label: string; // BUY 1 / BUY 2 / SELL
  kind: "buy" | "sell";
  title: string; // human summary of the requirement
  stage: DealStage;
  archetype: string;
  dna: Chip[];
  advisor: ConsultAdvisor;
  call: OfficeCall | null;
  pastCalls: OfficeCall[];
  recs: OfficeRec[];
  questions: OfficeQuestion[];
  docs: OfficeDoc[];
};

export type OfficeState = { threads: OfficeThread[]; activeId: string };

/* ── Helpers ── */
const uid = () => Math.random().toString(36).slice(2, 9);

const baseDocs = (): OfficeDoc[] => [
  { id: uid(), group: "Project Reports", name: "Independent Project Report", status: "locked", note: "Unlocks after your consultation" },
  { id: uid(), group: "Project Reports", name: "Construction & RERA tracking", status: "locked", note: "Unlocks after your consultation" },
  { id: uid(), group: "Legal & BBA", name: "Builder–Buyer Agreement review", status: "locked", note: "Upload once you have a draft" },
  { id: uid(), group: "Legal & BBA", name: "Title & due-diligence", status: "locked", note: "Prepared by your advisor" },
  { id: uid(), group: "Letters & Allotment", name: "Allotment / offer letters", status: "locked", note: "Upload when received" },
];

/* The single most important thing to do next, by stage. */
export function nextStep(t: OfficeThread): { title: string; body: string; cta: string; section: SectionKey } {
  switch (t.stage) {
    case "booked":
      return {
        title: "Prepare for your consultation",
        body: `Your call with ${t.advisor.name} is set${t.call ? ` for ${t.call.day} · ${t.call.time}` : ""}. Add anything you'd like reviewed, or reschedule if needed.`,
        cta: "Review your call",
        section: "advice",
      };
    case "call_done":
      return {
        title: "Your consultation summary is ready",
        body: "See what your advisor found, the projects we'd pursue, and what we'd do next — unlock to continue.",
        cta: "See the summary",
        section: "recommendations",
      };
    default:
      return {
        title: "Continue your mandate",
        body: "Pick up where you left off.",
        cta: "Open recommendations",
        section: "recommendations",
      };
  }
}

/* Small "micro-win" stats for the Home header. */
export function wins(t: OfficeThread): { value: string; label: string }[] {
  return [
    { value: String(t.recs.length || 3), label: "Projects investigated" },
    { value: t.advisor.initials, label: "Advisor assigned" },
    { value: `${t.questions.filter((q) => q.status === "answered").length}`, label: "Questions answered" },
    { value: t.dna.length ? "Complete" : "—", label: "Buyer DNA" },
  ];
}

/* ── Seed: the real journey (if any) becomes BUY 1; demo threads show
   multi-thread + later stages without needing a backend. ── */
function dnaChipsFromBuy(buy: BuyData): { archetype: string; chips: Chip[]; title: string } {
  const d = deriveDNA(buy);
  return {
    archetype: d.archetype,
    title: `${d.markets.slice(0, 2).join(" · ") || "Gurugram"} · ${d.config}`,
    chips: [
      { label: "Budget", value: d.budgetRange },
      { label: "Markets", value: d.markets.length ? d.markets.slice(0, 3).join(", ") : "Open to guidance" },
      { label: "Configuration", value: d.config },
      { label: "Timeline", value: d.timeline },
      { label: "Priorities", value: d.topPriorities.slice(0, 2).join(", ") || "Balanced" },
    ],
  };
}

function recsFromBuy(buy: BuyData): OfficeRec[] {
  return rankProjects(buy)
    .slice(0, 3)
    .map((r, i) => ({
      name: r.name,
      developer: r.developer,
      market: r.market,
      truthScore: r.truthScore,
      matchPct: r.matchPct,
      status: i === 0 ? "recommended" : "investigating",
    }));
}

const DEMO_BUY2: OfficeThread = {
  id: "buy2",
  label: "BUY 2",
  kind: "buy",
  title: "Dwarka Expressway · Investment",
  stage: "call_done",
  archetype: "The Yield Seeker",
  dna: [
    { label: "Budget", value: "₹2–4 Cr" },
    { label: "Markets", value: "Dwarka Expressway, New Gurgaon" },
    { label: "Configuration", value: "2–3 BHK" },
    { label: "Timeline", value: "Within 6 months" },
    { label: "Priorities", value: "Rental Yield, Liquidity" },
  ],
  advisor: advisorFor("invest"),
  call: { day: "Last Tuesday", time: "6:30 PM", format: "Video", done: true, summary: "Strong rental corridor; two of four shortlisted projects carry avoidable delivery risk." },
  pastCalls: [{ day: "Last Tuesday", time: "6:30 PM", format: "Video", done: true }],
  recs: [
    { name: "Smartworld One DXP", developer: "Smartworld", market: "Dwarka Expressway", truthScore: 86, matchPct: 94, status: "recommended" },
    { name: "Signature Global Titanium SPR", developer: "Signature Global", market: "SPR", truthScore: 82, matchPct: 88, status: "investigating" },
    { name: "Emaar Urban Ascent", developer: "Emaar", market: "Dwarka Expressway", truthScore: 84, matchPct: 85, status: "rejected", note: "Stretched pricing vs. corridor comparables" },
  ],
  questions: [
    { id: uid(), q: "Is the rental demand on Dwarka Expressway real yet?", a: "Occupancy is still building — yields are a 2–3 year story, not immediate. We'd underwrite on appreciation first.", by: "Your advisor", status: "answered", at: Date.now() - 86400000 },
  ],
  docs: baseDocs(),
};

const DEMO_SELL: OfficeThread = {
  id: "sell1",
  label: "SELL",
  kind: "sell",
  title: "M3M Golf Estate · 3 BHK · Exit",
  stage: "booked",
  archetype: "The Considered Seller",
  dna: [
    { label: "Property", value: "M3M Golf Estate, 3 BHK" },
    { label: "Goal", value: "Time the exit well" },
    { label: "Timeline", value: "3–6 months" },
  ],
  advisor: advisorFor("sell"),
  call: { day: "Friday", time: "11:30 AM", format: "Phone" },
  pastCalls: [],
  recs: [],
  questions: [],
  docs: baseDocs(),
};

function seed(): OfficeState {
  const account = loadAccount();
  const consult = loadConsultation();

  let primary: OfficeThread;
  if (account) {
    const { archetype, chips, title } = dnaChipsFromBuy(account.buy);
    primary = {
      id: "buy1",
      label: "BUY 1",
      kind: "buy",
      title,
      stage: "booked",
      archetype,
      dna: chips,
      advisor: advisorFor(consult?.reason ?? "buy"),
      call: consult?.day
        ? { day: consult.day, time: consult.time ?? "—", format: consult.format ?? "Video" }
        : account.booking
        ? { day: account.booking.slot.split(" · ")[0] ?? account.booking.slot, time: account.booking.slot.split(" · ")[1] ?? "", format: "Video" }
        : { day: "Saturday", time: "11:30 AM", format: "Video" },
      pastCalls: [],
      recs: recsFromBuy(account.buy),
      questions: [],
      docs: baseDocs(),
    };
  } else {
    // No journey completed yet — a tasteful default so the office is alive.
    primary = {
      id: "buy1",
      label: "BUY 1",
      kind: "buy",
      title: "Golf Course Extension · 3–4 BHK",
      stage: "booked",
      archetype: "The Discerning First-Home Buyer",
      dna: [
        { label: "Budget", value: "₹4–7 Cr" },
        { label: "Markets", value: "Golf Course Extension, SPR" },
        { label: "Configuration", value: "3–4 BHK" },
        { label: "Timeline", value: "Within 3 months" },
        { label: "Priorities", value: "Construction Quality, Location" },
      ],
      advisor: advisorFor("buy"),
      call: { day: "Saturday", time: "11:30 AM", format: "Video" },
      pastCalls: [],
      recs: [
        { name: "DLF Privana South", developer: "DLF", market: "SPR", truthScore: 94, matchPct: 98, status: "recommended" },
        { name: "M3M Golf Estate II", developer: "M3M", market: "Golf Course Extension", truthScore: 88, matchPct: 97, status: "investigating" },
        { name: "Conscient Parq", developer: "Conscient", market: "Golf Course Extension", truthScore: 83, matchPct: 97, status: "investigating" },
      ],
      questions: [],
      docs: baseDocs(),
    };
  }

  return { threads: [primary, DEMO_BUY2, DEMO_SELL], activeId: "buy1" };
}

/* ── Persistence ── */
const OFFICE_KEY = "truthEstate.office.v1";

export function loadOffice(): OfficeState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(OFFICE_KEY);
    if (raw) return JSON.parse(raw) as OfficeState;
  } catch {
    /* ignore */
  }
  const fresh = seed();
  saveOffice(fresh);
  return fresh;
}

export function saveOffice(s: OfficeState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFICE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/* Rebuild from the latest journey/consultation (used by "reset demo"). */
export function reseedOffice(): OfficeState {
  const fresh = seed();
  saveOffice(fresh);
  return fresh;
}

export const newQuestion = (q: string): OfficeQuestion => ({
  id: uid(),
  q,
  status: "pending",
  at: Date.now(),
});
