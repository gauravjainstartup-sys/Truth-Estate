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
  | "curated"
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
  "curated",
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
  curated: "Intelligence ready",
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
export const callDone = (s: DealStage) => stageIndex(s) >= stageIndex("call_done");
export const isCurated = (s: DealStage) => stageIndex(s) >= stageIndex("curated");

/* ── Office sections (the URL buckets) ── */
export type SectionKey =
  | "home"
  | "requirements"
  | "recommendations"
  | "advice"
  | "questions"
  | "deal"
  | "documents"
  | "portfolio";

export const SECTIONS: { key: SectionKey; label: string; path: string; paidOnly?: boolean }[] = [
  { key: "home", label: "Home", path: "/office" },
  { key: "requirements", label: "My Requirements", path: "/office/requirements" },
  { key: "recommendations", label: "Recommendations", path: "/office/recommendations" },
  { key: "advice", label: "Independent Advice", path: "/office/advice" },
  { key: "questions", label: "Questions", path: "/office/questions" },
  { key: "deal", label: "My Deal", path: "/office/deal", paidOnly: true },
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

/* The curated intelligence our team prepares after the call. The teaser
   numbers are real and visible — what payment unlocks is the full depth. */
export type Curation = {
  tat: string; // turnaround, e.g. "about 48 hours"
  report: { pages: number; teasers: Chip[] };
  unit: { tags: string[]; teasers: Chip[] };
  deal: { headline: string; sub: string } | null; // best deal sourced (price-sensitive)
};

/* ── Deal execution (Phase 3): what happens after the mandate is paid. ── */
export type SiteVisit = {
  id: string;
  project: string;
  day: string;
  time: string;
  status: "proposed" | "confirmed" | "completed";
  verdict?: string; // advisor's read after the visit
  note?: string;
};

export type BuyMandate = {
  project: string;
  developer: string;
  config: string;
  tower: string;
  floorBand: string;
  carpet: string;
  note: string;
};

export type DealOffer = {
  id: string;
  source: string; // "Direct from developer" / "Resale — relocating owner"
  unit: string; // "Tower C · 18th floor · 2,140 sq ft"
  price: number; // all-in
  perSqft: number;
  vsQuoted: number; // lakhs saved vs the quoted price
  terms: string[]; // payment-plan highlights
  recommended?: boolean;
  status: "live" | "selected" | "passed";
};

export type Negotiation = {
  status: "wip" | "offers_in";
  tat: string;
  note: string;
  offers: DealOffer[];
};

export type SaleOffer = {
  unit: string;
  price: number;
  token: number;
  schedule: Chip[]; // payment milestones
  conditions: string[]; // T&C bullets
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
  curation: Curation | null;
  visits: SiteVisit[];
  mandate: BuyMandate | null;
  negotiation: Negotiation | null;
  saleOffer: SaleOffer | null;
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

const buyCuration: Curation = {
  tat: "about 48 hours",
  report: {
    pages: 32,
    teasers: [
      { label: "True price / sq ft", value: "₹12,400 — vs ₹13,200 quoted" },
      { label: "Possession risk", value: "Low · 92% on-time record" },
    ],
  },
  unit: {
    tags: ["3D unit views", "Vastu", "Air flow", "Livability index"],
    teasers: [
      { label: "Best stack", value: "Tower C · 17–22 floor" },
      { label: "Livability index", value: "8.6 / 10" },
    ],
  },
  deal: null,
};

const investCuration: Curation = {
  tat: "about 48 hours",
  report: {
    pages: 28,
    teasers: [
      { label: "True price / sq ft", value: "₹11,900 — vs ₹13,100 quoted" },
      { label: "Rental underwrite", value: "3.1% net today, building to 4.4%" },
    ],
  },
  unit: {
    tags: ["3D unit views", "Vastu", "Air flow", "Livability index"],
    teasers: [
      { label: "Best stack", value: "Tower C · 14–18 floor" },
      { label: "Livability index", value: "8.4 / 10" },
    ],
  },
  deal: { headline: "₹3.05 Cr sourced", sub: "₹22 lakh below the quoted price — held for you for 7 days" },
};

/* ── Deal execution seed — derived from the recommended project. ── */
const lakh = (n: number) => n * 100000;
const crore = (n: number) => n * 10000000;

function buildVisits(recs: OfficeRec[]): SiteVisit[] {
  const a = recs[0];
  const b = recs[1] ?? recs[0];
  if (!a) return [];
  return [
    {
      id: uid(),
      project: a.name,
      day: "This Saturday",
      time: "11:00 AM",
      status: "confirmed",
      note: `Accompanied by your advisor · ${a.market}`,
    },
    {
      id: uid(),
      project: b.name,
      day: "This Saturday",
      time: "3:30 PM",
      status: "proposed",
      note: `Back-to-back so you compare the same day · ${b.market}`,
    },
  ];
}

function buildMandate(recs: OfficeRec[], config: string): BuyMandate | null {
  const a = recs[0];
  if (!a) return null;
  return {
    project: a.name,
    developer: a.developer,
    config,
    tower: "Tower C",
    floorBand: "High floor · 17–22",
    carpet: "≈ 2,140 sq ft",
    note: "Park-facing stack, away from the service road. Locked as your primary target.",
  };
}

function buildNegotiation(recs: OfficeRec[], base: number): Negotiation {
  const a = recs[0];
  const name = a?.developer ?? "the developer";
  return {
    status: "offers_in",
    tat: "about 5 working days",
    note: "We pressed three channels and brought back the strongest terms — yours to choose.",
    offers: [
      {
        id: uid(),
        source: `Direct — ${name}`,
        unit: "Tower C · 19th floor · 2,140 sq ft",
        price: base,
        perSqft: Math.round(base / 2140),
        vsQuoted: 18,
        terms: ["10:80:10 plan", "Floor-rise waived", "2 covered parks"],
        recommended: true,
        status: "live",
      },
      {
        id: uid(),
        source: "Resale — relocating owner",
        unit: "Tower B · 21st floor · 2,140 sq ft",
        price: base - lakh(9),
        perSqft: Math.round((base - lakh(9)) / 2140),
        vsQuoted: 27,
        terms: ["Ready to move", "Lower price, full payment in 60 days", "Higher floor"],
        status: "live",
      },
    ],
  };
}

function buildSaleOffer(base: number): SaleOffer {
  return {
    unit: "Tower C · 19th floor · 2,140 sq ft",
    price: base,
    token: lakh(5),
    schedule: [
      { label: "On booking", value: "Token · ₹5,00,000" },
      { label: "Within 45 days", value: "Balance to 10%" },
      { label: "Construction-linked", value: "80%" },
      { label: "On possession", value: "10%" },
    ],
    conditions: [
      "Price held for 7 days from today.",
      "Floor-rise and one preferred-location charge waived in writing.",
      "All payments to the developer's RERA escrow — never to us.",
      "Fully refundable token if title due-diligence flags a red line.",
    ],
  };
}

/* The deal-room phases, in order, for the progress spine. The "Visits" phase
   spans the entry (paid) and the visiting stage (site_visits). */
export const DEAL_PHASES: { stage: DealStage; short: string; title: string }[] = [
  { stage: "site_visits", short: "Visits", title: "Site visits" },
  { stage: "buy_mandate", short: "Mandate", title: "Lock your unit" },
  { stage: "offers", short: "Offers", title: "We negotiate" },
  { stage: "sale_offer", short: "Terms", title: "Offer & terms" },
  { stage: "token", short: "Token", title: "Token" },
  { stage: "bba", short: "BBA", title: "Builder–Buyer Agreement" },
  { stage: "closed", short: "Owned", title: "Closed" },
];

/* Which deal phase is currently active (paid enters the Visits phase). */
export const dealPhaseIndex = (stage: DealStage) => {
  const i = DEAL_PHASES.findIndex((p) => stageIndex(stage) <= stageIndex(p.stage));
  return i >= 0 ? i : DEAL_PHASES.length - 1;
};

/* Documents that appear as the deal advances — derived from stage so the
   demo's preview-jumps and the live flow always stay in sync. */
export function dealDocs(t: OfficeThread): OfficeDoc[] {
  const out: OfficeDoc[] = [];
  if (isPaid(t.stage)) {
    out.push({ id: "inv", group: "Letters & Allotment", name: `Invoice — Mandate activation · ${INR(MANDATE_FEE)}`, status: "uploaded", note: "Paid · GST included · adjustable against closing fee" });
  }
  if (stageIndex(t.stage) >= stageIndex("token")) {
    out.push({ id: "tok", group: "Letters & Allotment", name: "Token receipt + allotment", status: "uploaded", note: "Paid to RERA escrow · countersigned" });
  }
  if (stageIndex(t.stage) >= stageIndex("bba")) {
    out.push({ id: "bba", group: "Legal & BBA", name: "Builder–Buyer Agreement (signed)", status: "uploaded", note: "Reviewed & annotated by your advisor before signing" });
  }
  return out;
}

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
        title: "We're building your decision matrix",
        body: `Your call went well. Our team is curating the full intelligence on your shortlist — ready in ${t.curation?.tat ?? "about 48 hours"}. We'll notify you.`,
        cta: "Review your call notes",
        section: "advice",
      };
    case "curated":
      return {
        title: "Your intelligence is ready",
        body: "See what our team curated — the real numbers, the tower- and unit-level intel, and the deal we sourced for you.",
        cta: "See what we found",
        section: "recommendations",
      };
    case "paid":
      return {
        title: "Let's see them in person",
        body: "Your mandate is active. We've lined up accompanied site visits so you judge the real thing — not the show flat.",
        cta: "Open your deal room",
        section: "deal",
      };
    case "site_visits":
      return {
        title: "Lock in your unit",
        body: "Visits done and noted. When you're ready, lock your target stack and we go negotiate the price.",
        cta: "Lock your unit",
        section: "deal",
      };
    case "buy_mandate":
      return {
        title: "We're sourcing your offers",
        body: "Your unit is locked. Our team is working every channel for the best price and terms — you'll choose from what comes back.",
        cta: "Track the negotiation",
        section: "deal",
      };
    case "offers":
      return {
        title: "Choose your offer",
        body: "The offers are in. Compare the terms side by side and pick the one we take forward.",
        cta: "Review your offers",
        section: "deal",
      };
    case "sale_offer":
      return {
        title: "Your offer & terms are ready",
        body: "Review the final price, payment schedule and protections — then accept and pay the token to hold it.",
        cta: "Review & accept",
        section: "deal",
      };
    case "token":
      return {
        title: "Token paid — the BBA is next",
        body: "Your unit is held and the allotment is in. We're preparing the Builder–Buyer Agreement for your review.",
        cta: "Continue to BBA",
        section: "deal",
      };
    case "bba":
      return {
        title: "You're at the finish line",
        body: "The BBA is signed and reviewed. We'll confirm registration and handover — then it moves to your portfolio.",
        cta: "Finish the close",
        section: "deal",
      };
    default:
      return {
        title: "You own it",
        body: "The deal is closed. Your property now lives in your portfolio, with everything we hold on it.",
        cta: "Open your portfolio",
        section: "portfolio",
      };
  }
}

/* Small "micro-win" stats for the Home header. */
export function wins(t: OfficeThread): { value: string; label: string }[] {
  const answered = `${t.questions.filter((q) => q.status === "answered").length}`;
  if (t.kind === "sell") {
    return [
      { value: "7", label: "Comparable exits" },
      { value: t.advisor.initials, label: "Advisor assigned" },
      { value: answered, label: "Questions answered" },
      { value: t.dna.length ? "Ready" : "—", label: "Exit brief" },
    ];
  }
  return [
    { value: String(t.recs.length || 3), label: "Projects investigated" },
    { value: t.advisor.initials, label: "Advisor assigned" },
    { value: answered, label: "Questions answered" },
    { value: t.dna.length ? "Complete" : "—", label: "Buyer DNA" },
  ];
}

/* ── Mandate (Phase 2): activation fee, adjustable against our fee at close. ── */
export const MANDATE_FEE = 50000;

export const INR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* Activation just advances the stage — the office (docs, deal room, premium
   re-skin) all derive from "paid", so preview-jumps and the live pay flow
   always agree. */
export function activateMandate(): Partial<OfficeThread> {
  return { stage: "paid" };
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

const DEMO_BUY2_RECS: OfficeRec[] = [
  { name: "Smartworld One DXP", developer: "Smartworld", market: "Dwarka Expressway", truthScore: 86, matchPct: 94, status: "recommended" },
  { name: "Signature Global Titanium SPR", developer: "Signature Global", market: "SPR", truthScore: 82, matchPct: 88, status: "investigating" },
  { name: "Emaar Urban Ascent", developer: "Emaar", market: "Dwarka Expressway", truthScore: 84, matchPct: 85, status: "rejected", note: "Stretched pricing vs. corridor comparables" },
];

const DEMO_BUY2: OfficeThread = {
  id: "buy2",
  label: "BUY 2",
  kind: "buy",
  title: "Dwarka Expressway · Investment",
  stage: "curated",
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
  recs: DEMO_BUY2_RECS,
  questions: [
    { id: uid(), q: "Is the rental demand on Dwarka Expressway real yet?", a: "Occupancy is still building — yields are a 2–3 year story, not immediate. We'd underwrite on appreciation first.", by: "Your advisor", status: "answered", at: Date.now() - 86400000 },
  ],
  docs: baseDocs(),
  curation: investCuration,
  visits: buildVisits(DEMO_BUY2_RECS),
  mandate: buildMandate(DEMO_BUY2_RECS, "2–3 BHK"),
  negotiation: buildNegotiation(DEMO_BUY2_RECS, crore(3.05)),
  saleOffer: buildSaleOffer(crore(3.05)),
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
  curation: null,
  visits: [],
  mandate: null,
  negotiation: null,
  saleOffer: null,
};

function seed(): OfficeState {
  const account = loadAccount();
  const consult = loadConsultation();

  let primary: OfficeThread;
  if (account) {
    const { archetype, chips, title } = dnaChipsFromBuy(account.buy);
    const recs = recsFromBuy(account.buy);
    const config = chips.find((c) => c.label === "Configuration")?.value ?? "3–4 BHK";
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
      recs,
      questions: [],
      docs: baseDocs(),
      curation: buyCuration,
      visits: buildVisits(recs),
      mandate: buildMandate(recs, config),
      negotiation: buildNegotiation(recs, crore(5.13)),
      saleOffer: buildSaleOffer(crore(5.13)),
    };
  } else {
    // No journey completed yet — a tasteful default so the office is alive.
    const recs: OfficeRec[] = [
      { name: "DLF Privana South", developer: "DLF", market: "SPR", truthScore: 94, matchPct: 98, status: "recommended" },
      { name: "M3M Golf Estate II", developer: "M3M", market: "Golf Course Extension", truthScore: 88, matchPct: 97, status: "investigating" },
      { name: "Conscient Parq", developer: "Conscient", market: "Golf Course Extension", truthScore: 83, matchPct: 97, status: "investigating" },
    ];
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
      recs,
      questions: [],
      docs: baseDocs(),
      curation: buyCuration,
      visits: buildVisits(recs),
      mandate: buildMandate(recs, "3–4 BHK"),
      negotiation: buildNegotiation(recs, crore(5.13)),
      saleOffer: buildSaleOffer(crore(5.13)),
    };
  }

  return { threads: [primary, DEMO_BUY2, DEMO_SELL], activeId: "buy1" };
}

/* ── Persistence ── */
const OFFICE_KEY = "truthEstate.office.v3";

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
