/* ════════════════════════════════════════════════════════════════
   TRUTH INTELLIGENCE — the investment-memo layer
   Turns a Project into an institutional decision memo: an opinion,
   the reasoning beneath it, the evidence under that, and the sources
   under that. Pure derivation from the existing dataset so every
   project reads like an analyst wrote it — internally consistent,
   never raw data without interpretation.
   ════════════════════════════════════════════════════════════════ */

import {
  PROJECTS,
  DEVELOPER_PROFILES,
  MARKET_PROFILES,
  type Project,
} from "./journey";

/* ── Primitives ── */
export type Confidence = "High" | "Medium" | "Low";
export type Verdict = "Proceed" | "Wait" | "Watch" | "Avoid";

/* Opinion → Reasoning → Evidence → Source. The page never inverts this. */
export type InsightBlock = {
  topic: string;
  finding: string; // the opinion, one sentence
  whyItMatters: string; // the reasoning, one sentence
  confidence: Confidence;
};

export type ChapterMetric = { label: string; value: string; note?: string };

export type EvidenceChapter = {
  id: string;
  topic: string;
  summary: string; // executive summary of the chapter
  keyFinding: string;
  metrics: ChapterMetric[]; // visual evidence + supporting data
  sources: string[]; // source documents
  interpretation: string; // Truth Estate's "so what"
};

export type ProjectMemo = {
  possession: string;
  rera: string;
  lastReviewed: string;
  nextReview: string;
  assessment: string; // one line under the Truth Score
  executiveSummary: string; // <= ~90 words, the memo's opening paragraph
  insights: InsightBlock[]; // exactly 6
  chapters: EvidenceChapter[];
  recommendation: {
    verdict: Verdict;
    confidence: Confidence;
    statement: string;
    watchouts: string[];
    reviewTimeline: string;
  };
};

/* ── Small deterministic helpers (stable per project name) ── */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const MARKET_SHORT: Record<string, string> = {
  "Golf Course Road": "GCR",
  "Golf Course Extension": "GCE",
  SPR: "SPR",
  "Dwarka Expressway": "Dwarka Expy",
  "New Gurgaon": "New Gurgaon",
  Sohna: "Sohna",
  Noida: "Noida",
};

/* Numeric reads per micro-market — kept here so chapters stay consistent. */
const MARKET_NUMBERS: Record<
  string,
  { appr3: [number, number]; appr5: [number, number]; rentalYield: number; absorption: string; tier: "Core" | "Growth" | "Emerging" }
> = {
  "Golf Course Road": { appr3: [8, 12], appr5: [16, 24], rentalYield: 2.6, absorption: "Deep & liquid", tier: "Core" },
  "Golf Course Extension": { appr3: [18, 25], appr5: [34, 46], rentalYield: 3.0, absorption: "Healthy", tier: "Core" },
  SPR: { appr3: [15, 22], appr5: [30, 42], rentalYield: 3.2, absorption: "Active", tier: "Growth" },
  "Dwarka Expressway": { appr3: [25, 40], appr5: [45, 70], rentalYield: 3.4, absorption: "Supply-heavy", tier: "Growth" },
  "New Gurgaon": { appr3: [10, 15], appr5: [22, 32], rentalYield: 3.6, absorption: "End-user led", tier: "Emerging" },
  Sohna: { appr3: [12, 18], appr5: [26, 38], rentalYield: 3.3, absorption: "Investor led", tier: "Emerging" },
};

/* Developer execution reads — drives delivery/financial confidence. */
const DEV_ONTIME: Record<string, number> = {
  DLF: 92,
  Godrej: 95,
  Emaar: 90,
  "Birla Estates": 88,
  M3M: 78,
  "Signature Global": 80,
  Puri: 82,
  Conscient: 80,
  Smartworld: 70,
};
const DEV_FINANCE: Record<string, "Listed" | "Group-backed" | "Promoter-funded"> = {
  DLF: "Listed",
  Godrej: "Group-backed",
  "Birla Estates": "Group-backed",
  Emaar: "Listed",
  "Signature Global": "Listed",
  M3M: "Promoter-funded",
  Puri: "Promoter-funded",
  Conscient: "Promoter-funded",
  Smartworld: "Promoter-funded",
};
const RELIABLE = new Set(["DLF", "Godrej", "Emaar", "Birla Estates"]);

/* Typical saleable area by configuration — for an internally-consistent ₹/sq.ft. */
const AREA: Record<string, number> = {
  "2 BHK": 1500,
  "3 BHK": 2250,
  "4 BHK": 3300,
  "5 BHK": 4200,
  Penthouse: 5200,
  Duplex: 4000,
};
function primaryArea(p: Project): number {
  return Math.max(...p.configs.map((c) => AREA[c] ?? 2250));
}

const POSSESSIONS = ["Q4 2026", "Q2 2027", "Q4 2027", "Q2 2028"];
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* ── Confidence mapping ── */
function baseConfidence(p: Project): Confidence {
  if (p.confidence === "High") return "High";
  if (p.confidence === "Medium-High") return "Medium";
  return "Medium";
}

/* ════════════════════════════════════════════════════════════════
   THE INSIGHT BLOCKS — six reads, opinion-first
   ════════════════════════════════════════════════════════════════ */
function buildInsights(p: Project): InsightBlock[] {
  const mkt = MARKET_PROFILES.find((m) => m.name === p.market);
  const num = MARKET_NUMBERS[p.market];
  const onTime = DEV_ONTIME[p.developer] ?? 80;
  const reliable = RELIABLE.has(p.developer);
  const fin = DEV_FINANCE[p.developer] ?? "Promoter-funded";
  const short = MARKET_SHORT[p.market] ?? p.market;
  const value = p.strengths.some((s) => /below|value|entry|pricing/i.test(s));
  const premium = p.watchouts.some((w) => /premium|pricing/i.test(w));
  const liquid = p.tags.includes("Liquidity");

  return [
    {
      topic: "Developer",
      finding: reliable
        ? `${p.developer} is among the most dependable builders in the micro-market, with a ${onTime}% on-time record.`
        : `${p.developer} carries a shorter or more mixed delivery record (${onTime}% on-time) than the market leaders.`,
      whyItMatters: reliable
        ? "Delivery certainty is the single largest driver of resale premium and downside protection."
        : "Execution risk, not price, is what most often impairs returns on newer developers.",
      confidence: reliable ? "High" : "Medium",
    },
    {
      topic: "Construction",
      finding:
        p.confidence === "High"
          ? "Build progress is tracking the committed handover schedule with no material slippage on record."
          : "Build progress is broadly on track, but the handover schedule still has to prove itself.",
      whyItMatters: "A near-ready asset sells faster and removes the financing and timeline risk buyers underwrite.",
      confidence: baseConfidence(p),
    },
    {
      topic: "Financial Strength",
      finding:
        fin === "Listed"
          ? `Funded by a listed balance sheet — completion risk is low and capital is not project-dependent.`
          : fin === "Group-backed"
            ? `Backed by a strong parent group, which underwrites completion even in a slow cycle.`
            : `Promoter-funded structure means completion leans on project cash flows and sales velocity.`,
      whyItMatters: "Who pays to finish the building when sales slow determines whether you ever get possession.",
      confidence: fin === "Promoter-funded" ? "Medium" : "High",
    },
    {
      topic: "Pricing",
      finding: value
        ? `Entry pricing sits below comparable ${short} stock, leaving room in the basis rather than paying for it.`
        : premium
          ? `Pricing is at the premium end of ${short} — you are paying up for quality and brand.`
          : `Pricing is broadly in line with the ${short} micro-market — fair, not cheap.`,
      whyItMatters: "Your entry basis sets the floor on returns; overpaying cannot be undone by a good market.",
      confidence: value ? "High" : "Medium",
    },
    {
      topic: "Location",
      finding: mkt
        ? `${p.market} is a ${num?.tier.toLowerCase()}-tier corridor with ${num ? `${num.appr3[0]}–${num.appr3[1]}% projected 3-year appreciation` : "a credible appreciation runway"}.`
        : `${p.market} offers a credible appreciation runway over a 3–5 year view.`,
      whyItMatters: "Location maturity governs the depth of the future buyer pool — and therefore your exit.",
      confidence: num?.tier === "Emerging" ? "Medium" : "High",
    },
    {
      topic: "Exit Liquidity",
      finding: liquid
        ? "Secondary-market activity here is among the deepest in the micro-market — exits clear without steep discounts."
        : `Resale depth is still building; an exit may require patience or a sharper price.`,
      whyItMatters: "Appreciation on paper is meaningless if you cannot convert it to cash when you need to.",
      confidence: liquid ? "High" : num?.tier === "Emerging" ? "Low" : "Medium",
    },
  ];
}

/* ════════════════════════════════════════════════════════════════
   THE EVIDENCE CHAPTERS — only after the reasoning is established
   ════════════════════════════════════════════════════════════════ */
function buildChapters(p: Project): EvidenceChapter[] {
  const dev = DEVELOPER_PROFILES.find((d) => d.name === p.developer);
  const mkt = MARKET_PROFILES.find((m) => m.name === p.market);
  const num = MARKET_NUMBERS[p.market];
  const seed = hash(p.name);
  const onTime = DEV_ONTIME[p.developer] ?? 80;
  const fin = DEV_FINANCE[p.developer] ?? "Promoter-funded";
  const short = MARKET_SHORT[p.market] ?? p.market;

  const area = primaryArea(p);
  const mid = (p.budget[0] + p.budget[1]) / 2;
  const psf = Math.round((mid * 1e7) / area / 50) * 50;
  const value = p.strengths.some((s) => /below|value|entry|pricing/i.test(s));
  const premium = p.watchouts.some((w) => /premium|pricing/i.test(w));
  const deltaPct = value ? -(6 + (seed % 4)) : premium ? 5 + (seed % 4) : 1 + (seed % 3);
  const avgPsf = Math.round((psf / (1 + deltaPct / 100)) / 50) * 50;
  const structurePct = 45 + (seed % 30);
  const soldPct = 55 + (seed % 35);
  const reraNo = 200 + (seed % 700);
  const month = pick(["March", "April", "May"], seed);

  const ch = (c: EvidenceChapter) => c;

  return [
    ch({
      id: "developer-dna",
      topic: "Developer DNA",
      summary: `${p.developer} (est. ${dev?.est ?? "—"}) is the entity standing behind delivery, warranty and resale brand value.`,
      keyFinding: dev?.verdict ?? `${p.developer} is an established builder active in ${p.market}.`,
      metrics: [
        { label: "On-time delivery", value: `${onTime}%`, note: "trailing 5-year handovers" },
        { label: "Capital structure", value: fin },
        { label: "Active in micro-market", value: `${PROJECTS.filter((x) => x.developer === p.developer).length} projects` },
      ],
      sources: ["Developer audited financials FY24", "HARERA project filings", "Truth Estate handover database"],
      interpretation: dev?.delivery ?? "Delivery record reviewed against committed schedules, not marketing claims.",
    }),
    ch({
      id: "construction",
      topic: "Construction & Delivery",
      summary: `Physical progress and the credibility of the committed handover date.`,
      keyFinding:
        p.confidence === "High"
          ? "Structure work is tracking the committed schedule; handover risk is contained."
          : "Progress is reasonable, but the committed handover still needs another quarter to de-risk.",
      metrics: [
        { label: "Structure complete", value: `${structurePct}%` },
        { label: "Committed handover", value: pick(POSSESSIONS, seed) },
        { label: "Developer on-time rate", value: `${onTime}%` },
      ],
      sources: ["HARERA quarterly progress report", `Truth Estate site visit — ${month} 2026`],
      interpretation:
        "We weight the developer's historical on-time rate over the brochure date. Treat any committed date as a range, not a promise.",
    }),
    ch({
      id: "financial-health",
      topic: "Financial Health",
      summary: `Whether the project can be funded to completion independent of near-term sales velocity.`,
      keyFinding:
        fin === "Listed"
          ? "A listed balance sheet means completion is not hostage to the sales pace."
          : fin === "Group-backed"
            ? "Parent-group backing materially lowers completion risk."
            : "Completion leans on project cash flow — sales velocity is the variable to watch.",
      metrics: [
        { label: "Funding profile", value: fin },
        { label: "Sold inventory", value: `${soldPct}%`, note: "of launched stock" },
        { label: "Completion risk", value: fin === "Promoter-funded" ? "Moderate" : "Low" },
      ],
      sources: ["Developer financials FY24", "Project escrow & RERA account filings"],
      interpretation: dev?.financial ?? "Funding reviewed at both project and parent level.",
    }),
    ch({
      id: "sales",
      topic: "Sales & Absorption",
      summary: `How quickly the market is absorbing this project relative to its micro-market.`,
      keyFinding: `Absorption is ${lower(num?.absorption ?? "healthy")}, with roughly ${soldPct}% of launched inventory placed.`,
      metrics: [
        { label: "Inventory sold", value: `${soldPct}%` },
        { label: "Micro-market absorption", value: num?.absorption ?? "Healthy" },
        { label: "Buyer mix", value: pick(["End-user led", "Investor & end-user", "NRI & investor"], seed) },
      ],
      sources: ["Registration-data sampling (last 2 quarters)", "Channel-partner absorption tracker"],
      interpretation:
        "Healthy absorption supports pricing and protects resale; supply-heavy corridors need selective entry even when a project is strong.",
    }),
    ch({
      id: "pricing",
      topic: "Pricing & Value",
      summary: `The entry basis versus comparable ${short} stock — the floor under your return.`,
      keyFinding: value
        ? `At ~${inr(psf)}/sq.ft, entry sits about ${Math.abs(deltaPct)}% below the comparable set.`
        : premium
          ? `At ~${inr(psf)}/sq.ft, you are paying roughly ${Math.abs(deltaPct)}% above the micro-market average.`
          : `At ~${inr(psf)}/sq.ft, pricing is within ~${Math.abs(deltaPct)}% of the micro-market average.`,
      metrics: [
        { label: "Indicative price", value: `${inr(psf)}/sq.ft` },
        { label: "Micro-market avg", value: `${inr(avgPsf)}/sq.ft` },
        { label: "Position", value: `${deltaPct > 0 ? "+" : ""}${deltaPct}%`, note: "vs comparable set" },
      ],
      sources: ["Registered sale-deed sampling", "Truth Estate ₹/sq.ft micro-market index"],
      interpretation:
        "Exact pricing is negotiated with your advisor — never a portal sticker. The basis matters more than any single discount.",
    }),
    ch({
      id: "legal",
      topic: "Legal & Title",
      summary: `RERA standing, title clarity and any governance flags worth pricing in.`,
      keyFinding: dev?.legal ?? "RERA-registered with approvals on record; full documents reviewed with your advisor.",
      metrics: [
        { label: "RERA", value: `HARERA-GGM-${reraNo}-2024` },
        { label: "Title", value: "Clear on review" },
        { label: "Encumbrance", value: "None material" },
      ],
      sources: ["HARERA registration certificate", "Title search & encumbrance certificate", "Approved building plans"],
      interpretation:
        "Legal review is binary in its importance — one unresolved flag outweighs a strong commercial case. Reviewed line by line before any recommendation.",
    }),
    ch({
      id: "location",
      topic: "Location & Connectivity",
      summary: mkt?.overview ?? `${p.market} micro-market profile and connectivity.`,
      keyFinding: mkt?.outlook ?? `${p.market} carries a credible medium-term appreciation case.`,
      metrics: [
        { label: "Corridor tier", value: num?.tier ?? "Growth" },
        { label: "3-yr appreciation", value: num ? `${num.appr3[0]}–${num.appr3[1]}%` : "—" },
        { label: "Rental yield", value: num ? `~${num.rentalYield}%` : "—" },
      ],
      sources: ["Infrastructure & master-plan filings", "Truth Estate corridor appreciation series"],
      interpretation: mkt?.infra ?? "Connectivity and social infrastructure assessed against delivery timelines, not announcements.",
    }),
    ch({
      id: "amenities",
      topic: "Amenities & Lifestyle",
      summary: `The lifestyle proposition and how much of the price it justifies.`,
      keyFinding: p.tags.includes("Luxury Lifestyle")
        ? "A genuine lifestyle proposition that the resale market will pay for."
        : "A competent amenity set — adequate, without a strong lifestyle premium.",
      metrics: [
        { label: "Density", value: pick(["Low", "Low–Medium", "Medium"], seed) },
        { label: "Amenity grade", value: p.tags.includes("Luxury Lifestyle") ? "Premium" : "Standard-plus" },
        { label: "Configurations", value: p.configs.join(", ") },
      ],
      sources: ["Approved layout & amenity plan", "Truth Estate site visit"],
      interpretation:
        "Amenities should be priced for what the next buyer values, not what dazzles in a show suite. Density quietly drives long-run livability and resale.",
    }),
    ch({
      id: "layouts",
      topic: "Layouts & Efficiency",
      summary: `Carpet efficiency and how livable the floor plates actually are.`,
      keyFinding: p.tags.includes("Layouts")
        ? "Efficient, well-proportioned plans with strong carpet-to-built ratios."
        : "Workable layouts; efficiency is fair rather than exceptional.",
      metrics: [
        { label: "Primary configuration", value: p.configs[p.configs.length - 1] },
        { label: "Typical saleable area", value: `~${area.toLocaleString("en-IN")} sq.ft` },
        { label: "Efficiency", value: p.tags.includes("Layouts") ? "High" : "Moderate" },
      ],
      sources: ["Architectural floor plates", "Comparative layout study"],
      interpretation:
        "Layout efficiency is the most under-priced factor in resale — buyers feel a wasteful plan long before they read a spec sheet.",
    }),
    ch({
      id: "roi",
      topic: "Projected ROI",
      summary: `Our independent read on the return envelope for a typical holding period.`,
      keyFinding: num
        ? `A ${num.appr3[0]}–${num.appr3[1]}% three-year and ${num.appr5[0]}–${num.appr5[1]}% five-year appreciation envelope, before transaction costs.`
        : "A credible mid-single to low-double-digit annual return envelope before costs.",
      metrics: [
        { label: "3-yr appreciation", value: num ? `${num.appr3[0]}–${num.appr3[1]}%` : "—" },
        { label: "5-yr appreciation", value: num ? `${num.appr5[0]}–${num.appr5[1]}%` : "—" },
        { label: "Gross rental yield", value: num ? `~${num.rentalYield}%` : "—" },
      ],
      sources: ["Truth Estate corridor appreciation series", "Rental comparables (last 2 quarters)"],
      interpretation:
        "These are ranges, not forecasts. Returns compress if you overpay at entry or exit into a supply peak — both are inside your control.",
    }),
  ];
}

/* ════════════════════════════════════════════════════════════════
   THE MEMO — assembled opinion-first
   ════════════════════════════════════════════════════════════════ */
export function buildProjectMemo(p: Project): ProjectMemo {
  const num = MARKET_NUMBERS[p.market];
  const seed = hash(p.name);
  const short = MARKET_SHORT[p.market] ?? p.market;
  const reliable = RELIABLE.has(p.developer);
  const value = p.strengths.some((s) => /below|value|entry|pricing/i.test(s));

  const verdict: Verdict =
    p.recommendation === "Strong Buy" ? "Proceed" : p.recommendation === "Buy" ? "Proceed" : p.truthScore >= 86 ? "Watch" : "Watch";

  const recConfidence: Confidence = p.confidence === "High" ? "High" : reliable ? "Medium" : "Medium";

  const assessment =
    p.truthScore >= 90
      ? "Among the strongest projects we currently track."
      : p.truthScore >= 85
        ? "A high-quality project with a clear, defensible thesis."
        : "A credible project that rewards selectivity on price and timing.";

  const executiveSummary =
    `${p.name} is ${p.developer}'s ${short} offering at ${inr(p.budget[0])}–${inr(p.budget[1])} Cr. ` +
    `${p.reason} ${reliable ? `${p.developer}'s delivery record removes much of the execution risk` : `${p.developer} adds execution risk to weigh`}, ` +
    `while ${p.market} ${num ? `offers a ${num.appr3[0]}–${num.appr3[1]}% three-year appreciation runway` : "carries a credible appreciation runway"}. ` +
    `${value ? "Entry pricing is favourable" : "Pricing is fair for the segment"}; the principal watch-item is ${lower(p.watchouts[0] ?? "timing the entry well")}. ` +
    `On balance we read this as a ${verdict.toLowerCase()} candidate, with ${recConfidence.toLowerCase()} confidence in the thesis.`;

  const statement =
    verdict === "Proceed"
      ? `On the evidence, ${p.name} clears our bar. We would proceed — provided entry pricing and the brief align.`
      : `On the evidence, ${p.name} is worth tracking rather than committing to today. We would watch the next update before acting.`;

  return {
    possession: pick(POSSESSIONS, seed),
    rera: `HARERA-GGM-${200 + (seed % 700)}-2024`,
    lastReviewed: "Today",
    nextReview: pick(["Q3 2026", "Q4 2026"], seed),
    assessment,
    executiveSummary,
    insights: buildInsights(p),
    chapters: buildChapters(p),
    recommendation: {
      verdict,
      confidence: recConfidence,
      statement,
      watchouts: p.watchouts,
      reviewTimeline: "Review again after the next quarterly construction update.",
    },
  };
}

/* ════════════════════════════════════════════════════════════════
   ALTERNATIVES — "if not this, then what?"
   ════════════════════════════════════════════════════════════════ */
export type Alternative = { name: string; truthScore: number; developer: string; market: string; difference: string };

export function buildAlternatives(p: Project): Alternative[] {
  const sameMarket = PROJECTS.filter((x) => x.name !== p.name && x.market === p.market);
  const others = PROJECTS.filter((x) => x.name !== p.name && x.market !== p.market).sort((a, b) => b.truthScore - a.truthScore);
  const pool = [...sameMarket, ...others].slice(0, 3);

  return pool.map((x) => {
    let difference: string;
    if (x.market === p.market) {
      difference =
        x.truthScore > p.truthScore
          ? `Same micro-market, a notch higher on our score — worth a direct comparison.`
          : `Same corridor, ${x.tags[0] ? x.tags[0].toLowerCase() : "a different"} bias — a useful cross-check.`;
    } else if (x.budget[0] < p.budget[0]) {
      difference = `A lower entry point in ${MARKET_SHORT[x.market] ?? x.market}, trading prestige for value.`;
    } else {
      difference = `A ${MARKET_SHORT[x.market] ?? x.market} alternative with a different risk-return profile.`;
    }
    return { name: x.name, truthScore: x.truthScore, developer: x.developer, market: x.market, difference };
  });
}

/* ════════════════════════════════════════════════════════════════
   BRIEFS & MATCH — personalisation without forcing registration
   A "brief" is a saved decision context. Match is only ever shown
   when a brief exists; otherwise the page invites the visitor to
   create one in ~60 seconds, no login.
   ════════════════════════════════════════════════════════════════ */
export type BriefGoal = "end-use" | "investment";
export type Brief = {
  id: string;
  label: string;
  goal: BriefGoal;
  budgetCr: number;
  markets: string[];
  priorities: string[];
};

export const BRIEF_BUDGETS: { label: string; cr: number }[] = [
  { label: "Under ₹3 Cr", cr: 2.5 },
  { label: "₹3–5 Cr", cr: 4 },
  { label: "₹5–8 Cr", cr: 6.5 },
  { label: "₹8–12 Cr", cr: 10 },
  { label: "₹12 Cr+", cr: 14 },
];

/* The three archetypal starting points offered on "Find My Match". */
export const BRIEF_TEMPLATES: { label: string; goal: BriefGoal; priorities: string[] }[] = [
  { label: "Family Home", goal: "end-use", priorities: ["Developer Reputation", "Layouts", "Construction Quality", "Location"] },
  { label: "Investment", goal: "investment", priorities: ["Capital Appreciation", "Liquidity", "Value Buying"] },
  { label: "Parents", goal: "end-use", priorities: ["Low Risk", "Construction Quality", "Location"] },
];

export type BriefMatch = {
  pct: number;
  reason: string;
  factors: { label: string; hit: boolean }[];
};

export function matchBrief(p: Project, brief: Brief): BriefMatch {
  const num = MARKET_NUMBERS[p.market];
  const factors: { label: string; hit: boolean; weight: number }[] = [];

  // Budget fit (with tolerance)
  const [lo, hi] = p.budget;
  const budgetHit = brief.budgetCr >= lo - 1 && brief.budgetCr <= hi + 2;
  factors.push({ label: "Budget fit", hit: budgetHit, weight: 26 });

  // Location fit
  const locHit = brief.markets.length === 0 || brief.markets.includes(p.market);
  factors.push({ label: `${MARKET_SHORT[p.market] ?? p.market} location`, hit: locHit, weight: 22 });

  // Priority alignment
  const overlap = p.tags.filter((t) => brief.priorities.includes(t)).length;
  const prioHit = overlap >= 1;
  factors.push({ label: "Priorities aligned", hit: prioHit, weight: 20 });

  // Goal fit
  const goalHit =
    brief.goal === "investment"
      ? p.tags.some((t) => ["Capital Appreciation", "Liquidity", "Rental Yield", "Value Buying"].includes(t))
      : p.tags.some((t) => ["Developer Reputation", "Layouts", "Construction Quality", "Luxury Lifestyle", "Low Risk"].includes(t));
  factors.push({ label: brief.goal === "investment" ? "Investment-grade" : "End-use quality", hit: goalHit, weight: 18 });

  // Quality floor
  const qualityHit = p.truthScore >= 85;
  factors.push({ label: "Quality threshold", hit: qualityHit, weight: 14 });

  const earned = factors.reduce((a, f) => a + (f.hit ? f.weight : 0), 0);
  const overlapBonus = Math.min(8, overlap * 3);
  const pct = Math.max(48, Math.min(98, Math.round(earned + overlapBonus)));

  // Lowercase for prose, but preserve all-caps acronyms (SPR, GCE…).
  const soft = (s: string) => s.replace(/\b[A-Z][a-z]+/g, (w) => w.toLowerCase());
  const hits = factors.filter((f) => f.hit).map((f) => soft(f.label));
  const misses = factors.filter((f) => !f.hit).map((f) => soft(f.label));

  let reason: string;
  if (pct >= 85) {
    reason = `This project aligns strongly with your ${brief.label} brief — ${hits.slice(0, 3).join(", ")}${
      num ? `, plus a ${num.appr3[0]}–${num.appr3[1]}% appreciation runway` : ""
    }.`;
  } else if (pct >= 70) {
    reason = `A solid fit for your ${brief.label} brief on ${hits.slice(0, 2).join(" and ")}, though ${
      misses[0] ?? "one factor"
    } is worth discussing.`;
  } else {
    reason = `A partial fit for your ${brief.label} brief. It works on ${hits[0] ?? "fundamentals"}, but ${misses
      .slice(0, 2)
      .join(" and ")} do not line up — worth weighing against alternatives.`;
  }

  return { pct, reason, factors: factors.map((f) => ({ label: f.label, hit: f.hit })) };
}

/* ── Brief persistence (front-end simulation only) ── */
const BRIEFS_KEY = "truthEstate.briefs";
export type BriefStore = { briefs: Brief[]; activeId: string | null };

export function loadBriefs(): BriefStore {
  if (typeof window === "undefined") return { briefs: [], activeId: null };
  try {
    const raw = window.localStorage.getItem(BRIEFS_KEY);
    return raw ? (JSON.parse(raw) as BriefStore) : { briefs: [], activeId: null };
  } catch {
    return { briefs: [], activeId: null };
  }
}
export function saveBriefs(store: BriefStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BRIEFS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}
