/* ════════════════════════════════════════════════════════════════
   DEVELOPER INTELLIGENCE — independent dossiers.
   Structure: About · Track Record · Performance · Financials.
   Financials are shown as a signal (strong / moderate / strained) —
   never a raw number — so the read is honest without pretending to a
   precision we don't publish.
   ════════════════════════════════════════════════════════════════ */

export type FinRating = "strong" | "moderate" | "weak";

export const FIN_METRICS = [
  { key: "leverage",  label: "Leverage",         full: "Net Debt-to-Equity", meaning: "How much debt funds the business" },
  { key: "coverage",  label: "Interest Coverage", full: "Interest Coverage",  meaning: "Ability to service debt from earnings" },
  { key: "cash",      label: "Cash Conversion",   full: "OCF / EBITDA",       meaning: "Operating profit turning into real cash" },
  { key: "margin",    label: "Operating Margin",  full: "EBITDA Margin",      meaning: "Operating profit as a share of revenue" },
  { key: "inventory", label: "Inventory Cover",   full: "Inventory / Sales",  meaning: "Time to clear unsold inventory" },
] as const;

export type FinKey = (typeof FIN_METRICS)[number]["key"];

export type DeveloperIntel = {
  slug: string;
  name: string;
  est: string;
  listed: boolean;
  listedNote: string;
  tagline: string;
  about: string;
  signature: string[];
  brandValue: string;
  recent: string[];
  pipeline: string[];
  performance: { launched: number; delivered: number; ongoing: number; onTimePct: number; avgDelayMonths: number; lapsed?: number };
  financials: Record<FinKey, FinRating>;
  /* Headline financial values (from MCA / annual filings) shown on the audit
     cards; finBand upgrades a metric to "exceptional" where the number is
     genuinely top-decile. Optional — cards fall back to the rating alone. */
  finValues?: Partial<Record<FinKey, string>>;
  finBand?: Partial<Record<FinKey, "exceptional" | "strong" | "moderate" | "watch">>;
  finNote: string;
  legal: string;
  /* Developer-level litigation on public record — surfaced in the Legal
     section as "contextual" signals (the project can be clean while the
     developer carries history). Cited; not project-level defects. */
  legalCases?: LegalCase[];
  verdict: string;
};

export type LegalCase = {
  title: string;
  court: string;
  status: string; // e.g. "Disposed", "Active"
  relevance: string; // "Contextual" | "Indirect" | "Direct"
  impact: "High" | "Medium" | "Low";
  summary: string;
  buyerImpact: string;
  ref?: string;
};

export const DEVELOPERS: DeveloperIntel[] = [
  {
    slug: "dlf",
    name: "DLF",
    est: "1946",
    listed: true,
    listedNote: "Listed · NSE: DLF",
    tagline: "The benchmark for delivery certainty in Gurugram luxury.",
    about:
      "India's largest listed real-estate developer, founded in 1946. DLF built much of modern Gurugram and remains the city's benchmark for delivery certainty and resale liquidity in the luxury segment.",
    signature: ["DLF The Camellias", "DLF The Crest", "DLF Magnolias"],
    brandValue: "The most trusted name in Gurugram luxury — a DLF address commands a durable resale premium.",
    recent: ["DLF Privana South", "DLF Arbour"],
    pipeline: ["DLF Privana North", "DLF The Camellias II"],
    performance: { launched: 45, delivered: 38, ongoing: 7, onTimePct: 92, avgDelayMonths: 2, lapsed: 0 },
    financials: { leverage: "strong", coverage: "strong", cash: "moderate", margin: "strong", inventory: "strong" },
    finValues: { leverage: "−0.05×", coverage: "14.71×", cash: "2.07×", margin: "37.5%", inventory: "3.02 yr" },
    finBand: { leverage: "exceptional", coverage: "exceptional", cash: "exceptional", margin: "strong", inventory: "moderate" },
    finNote: "Consistent debt reduction over the cycle; recurring commercial rental income adds balance-sheet stability.",
    legal: "Clean RERA compliance and strong governance today — but a buyer should read DLF's history: a Supreme-Court possession-delay loss and a CCI penalty for one-sided buyer agreements both sit on the public record.",
    legalCases: [
      {
        title: "DLF v. Capital Greens Flat Buyers Assn.",
        court: "Supreme Court of India · 14 Dec 2020",
        status: "Disposed",
        relevance: "Contextual",
        impact: "High",
        summary: "The Supreme Court upheld an NCDRC order directing DLF to pay ~6% p.a. compensation for unjustified possession delay at Capital Greens, Gurugram. DLF's force-majeure defence was rejected and hundreds of buyers were compensated.",
        buyerImpact: "A confirmed, top-court loss for possession delay — same city, same type of project. Delivery risk here is documented, not hypothetical.",
        ref: "Civil Appeal Nos. 3864–3889/2020",
      },
      {
        title: "Belaire Owners' Assn. v. DLF — CCI penalty",
        court: "CCI → Appellate Tribunal → Supreme Court",
        status: "Disposed",
        relevance: "Indirect",
        impact: "High",
        summary: "The Competition Commission imposed a ₹630 crore penalty on DLF for abusing a dominant position through unfair, one-sided buyer agreements in Belaire & Park Place; the competition finding was upheld through appellate stages.",
        buyerImpact: "DLF's standard buyer contracts have been judicially found one-sided at the highest levels. Have a lawyer read the Agreement to Sell before you sign.",
        ref: "CCI order 2011 · SC deposit direction Aug 2014",
      },
    ],
    verdict:
      "The most reliable developer in Gurugram for both end-use and investment. Premium pricing is justified by delivery certainty and resale liquidity.",
  },
  {
    slug: "godrej",
    name: "Godrej",
    est: "1897",
    listed: true,
    listedNote: "Listed · backed by Godrej Industries",
    tagline: "Institutional-grade execution from a 125-year-old house.",
    about:
      "The real-estate arm of one of India's most respected business houses, building since 1990 under Godrej Properties. Known for institutional-grade execution and build quality that consistently exceeds segment norms.",
    signature: ["Godrej Icon", "Godrej Habitat"],
    brandValue: "A 125-year-old trust mark — buyers pay for assurance and build quality, not hype.",
    recent: ["Godrej Aristocrat", "Godrej Zenith"],
    pipeline: ["Godrej SPR Phase II"],
    performance: { launched: 28, delivered: 22, ongoing: 6, onTimePct: 90, avgDelayMonths: 3 },
    financials: { leverage: "strong", coverage: "strong", cash: "moderate", margin: "strong", inventory: "strong" },
    finNote: "Backed by Godrej Industries with a strong parent balance sheet and a conservative launch cadence.",
    legal: "Excellent RERA compliance. No adverse legal history. Transparent documentation.",
    verdict:
      "Institutional-grade execution with a low-risk delivery profile. Ideal for conservative buyers who prioritise build quality over pricing.",
  },
  {
    slug: "m3m",
    name: "M3M",
    est: "2010",
    listed: false,
    listedNote: "Privately held",
    tagline: "Lifestyle-led dominance of Golf Course Extension.",
    about:
      "An aggressive, design-led developer that has come to dominate the Golf Course Extension lifestyle segment since 2010. Strong on positioning and amenities, with a more variable delivery record than the listed majors.",
    signature: ["M3M Golf Estate", "M3M Merlin"],
    brandValue: "Lifestyle and location-led desirability — golf-facing inventory commands a clear premium.",
    recent: ["M3M Golf Estate II", "M3M Antalya Hills"],
    pipeline: ["M3M Golf Hills Phase II"],
    performance: { launched: 32, delivered: 18, ongoing: 14, onTimePct: 74, avgDelayMonths: 8 },
    financials: { leverage: "moderate", coverage: "moderate", cash: "moderate", margin: "moderate", inventory: "weak" },
    finNote: "Privately held; growth funded largely at project level. Read as indicative — assessed via available filings and channel signals.",
    legal: "Some historical compliance issues; recent RERA compliance improved. Project-level due diligence recommended.",
    verdict:
      "Strong lifestyle positioning and GCE dominance, with a higher risk-reward profile than DLF or Godrej. Best for buyers who value location and lifestyle.",
  },
  {
    slug: "birla",
    name: "Birla Estates",
    est: "2016",
    listed: true,
    listedNote: "Backed by the Aditya Birla Group",
    tagline: "Institutional backing, low-density luxury.",
    about:
      "The real-estate arm of the Aditya Birla Group, established 2016. A limited Gurugram history but strong national execution and an institutional parent that underwrites its credibility.",
    signature: ["Birla Centurion · Mumbai", "Birla Alokya · Bengaluru"],
    brandValue: "Aditya Birla Group backing — low-density luxury with institutional assurance.",
    recent: ["Birla Navya"],
    pipeline: ["Birla Estates GCE Phase II"],
    performance: { launched: 9, delivered: 4, ongoing: 5, onTimePct: 85, avgDelayMonths: 4 },
    financials: { leverage: "strong", coverage: "strong", cash: "moderate", margin: "moderate", inventory: "moderate" },
    finNote: "Underwritten by the Aditya Birla Group balance sheet, with conservative project-level financing.",
    legal: "Clean compliance. Institutional-grade documentation. No adverse legal history.",
    verdict:
      "Low-density luxury with brand-grade build quality. A limited Gurugram track record, but parent-group credibility provides strong assurance.",
  },
  {
    slug: "smartworld",
    name: "Smartworld",
    est: "2019",
    listed: false,
    listedNote: "Privately held · early-stage",
    tagline: "A young, fast-scaling builder on the value corridors.",
    about:
      "A young, well-capitalised developer (2019) that has scaled rapidly on Dwarka Expressway and SPR. Promising early execution — but a delivery record still being written.",
    signature: ["Smartworld One DXP"],
    brandValue: "Early-corridor pricing and modern product; brand still being established.",
    recent: ["Smartworld Orchard", "Smartworld Gems"],
    pipeline: ["Smartworld SPR Phase II"],
    performance: { launched: 6, delivered: 1, ongoing: 5, onTimePct: 80, avgDelayMonths: 5 },
    financials: { leverage: "moderate", coverage: "moderate", cash: "weak", margin: "moderate", inventory: "moderate" },
    finNote: "Privately held and early-stage; financials are indicative and lean on promoter strength and project-level funding.",
    legal: "RERA compliant. A clean start with no historical baggage.",
    verdict:
      "Early-corridor pricing with growth potential. Higher risk from the limited track record, but a strong value proposition for risk-tolerant investors.",
  },
  {
    slug: "emaar",
    name: "Emaar",
    est: "1997",
    listed: true,
    listedNote: "Listed · DFM: EMAAR",
    tagline: "Global governance at value-segment pricing.",
    about:
      "The India arm of Dubai's Emaar Properties, present in India since 1997. Global governance standards with a solid, value-segment delivery record in Gurugram.",
    signature: ["Emaar Palm Heights", "Emaar Gurgaon Greens"],
    brandValue: "Global credibility at value-segment pricing.",
    recent: ["Emaar Urban Ascent", "Emaar Digi Homes"],
    pipeline: ["Emaar Business District residences"],
    performance: { launched: 18, delivered: 12, ongoing: 6, onTimePct: 86, avgDelayMonths: 4 },
    financials: { leverage: "strong", coverage: "strong", cash: "strong", margin: "strong", inventory: "moderate" },
    finNote: "Listed parent with a strong international balance sheet; India operations are well-capitalised.",
    legal: "Clean RERA compliance. International governance standards applied.",
    verdict:
      "Global credibility with good India execution. Best for value-segment buyers who want reliability without premium pricing.",
  },
];

export function developerBySlug(slug: string): DeveloperIntel | undefined {
  return DEVELOPERS.find((d) => d.slug === slug);
}

/* Where a rating sits on the health spectrum (for the signal gauge) */
export const RATING_META: Record<FinRating, { label: string; pos: number; color: string }> = {
  strong: { label: "Strong", pos: 86, color: "#1e6b45" },
  moderate: { label: "Moderate", pos: 52, color: "#bd8b3c" },
  weak: { label: "Strained", pos: 24, color: "#b0503e" },
};
