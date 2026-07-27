/* ════════════════════════════════════════════════════════════════
   THE SAMPLE READ — an invented project, invented developer,
   invented numbers, top to bottom.

   The sample used to be DLF The Arbour with its paywall switched off.
   Two problems with that, and the second is the serious one:

   1. One real project's ENTIRE paid read — the developer audit, the
      legal signals, the ROI model — sat at a public URL for free. Every
      argument for charging ₹999 for the other ninety-six applied to it
      too.

   2. It published a named developer's forensic audit, including its
      litigation read, at a free address with no commercial relationship
      and no right of reply. A sample is a marketing asset; it should not
      be an unpriced verdict on somebody's company.

   So: Meridian Vantage by Northcrest Estates. Neither exists — checked
   against all 97 tracked projects and every developer in the catalogue
   before the names were chosen. The corridor is real, because Golf
   Course Extension is public geography rather than anybody's data, and
   an invented corridor would break the location map and read as absurd.

   ── Why the numbers are shaped the way they are ──
   A sample has one job: show a buyer what ₹999 buys. So the data is
   built to light up every section rather than to flatter the project —
   a strong developer record but a slipping build, one pillar in "watch",
   real legal flags, an ROI model that lands below its corridor
   benchmark. A sample where everything scores nine teaches nobody what
   the report is for.

   DELIBERATELY NOT REGISTERED ANYWHERE. Not in PROJECTS, not in OPS, not
   in DEVELOPERS. It is constructed here and referenced only by the
   sample route, so it cannot leak into the shortlist, the compare tool,
   the omni index or a search result — which is exactly what adding it to
   the real catalogue would have done.
   ════════════════════════════════════════════════════════════════ */
import type { DeveloperIntel } from "./developers";
import type { LiveLegalRead, ProjectIntel, RoiModel } from "./projects";

export const SAMPLE_NAME = "Meridian Vantage";
export const SAMPLE_DEVELOPER = "Northcrest Estates";

/* A dossier that reads like the real ones and describes nobody. The
   record is good but not spotless — a developer with a 100% history
   gives the Developer DNA section nothing to say. */
const sampleDeveloper: DeveloperIntel = {
  slug: "northcrest-estates",
  name: SAMPLE_DEVELOPER,
  est: "2004",
  listed: false,
  listedNote: "Privately held — accounts filed with the MCA, no quarterly disclosure.",
  tagline: "Mid-sized Gurugram developer, residential only.",
  about:
    "A Gurugram-focused residential developer with eleven completed projects across the Golf Course Extension and SPR corridors. Never diversified into commercial or retail, which keeps the balance sheet simple and the delivery record readable.",
  signature: ["Low-density plotting", "Landscape-led masterplans", "In-house facility management"],
  brandValue: "Known for finishing what it starts, slowly.",
  recent: ["Northcrest Willow Park (2023)", "Northcrest Aria (2022)", "Northcrest Grove Phase 2 (2021)"],
  pipeline: ["Meridian Vantage", "Northcrest Skyline (announced)"],
  performance: { launched: 14, delivered: 11, ongoing: 3, onTimePct: 71, avgDelayMonths: 9.4, lapsed: 0 },
  financials: { leverage: "moderate", coverage: "moderate", cash: "strong", margin: "moderate", inventory: "moderate" },
  finValues: {
    leverage: "Debt / equity 0.82",
    coverage: "Interest cover 3.4×",
    cash: "Current ratio 1.9",
    margin: "EBITDA margin 19%",
    inventory: "Unsold stock 2.1 years of sales",
  },
  finBand: { cash: "strong" },
  finNote:
    "Leverage sits above the listed-peer median but is covered comfortably by collections; liquidity is the strongest line on the sheet. Nothing here suggests a funding stop, and nothing suggests headroom for a third simultaneous launch either.",
  legal: "No insolvency proceedings. Two consumer matters on record, both disposed.",
  legalCases: [
    {
      title: "Homebuyers' association vs Northcrest Estates (delay compensation)",
      court: "Haryana RERA, Gurugram",
      status: "Disposed",
      relevance: "Contextual",
      impact: "Medium",
      scope: "developer",
      summary:
        "Buyers at an earlier Northcrest project sought compensation for a fourteen-month handover delay. The authority directed payment at the agreement rate and the developer complied without appeal.",
      buyerImpact:
        "The useful part is that they paid rather than litigated — but it establishes that delay is a live risk with this builder, and that the agreement rate is what you will actually get.",
      ref: "Illustrative — this project and this matter are invented for the sample.",
    },
    {
      title: "Northcrest Estates vs Municipal Corporation (EDC assessment)",
      court: "Punjab & Haryana High Court",
      status: "Disposed",
      relevance: "Indirect",
      impact: "Low",
      scope: "developer",
      summary:
        "A dispute over external development charge assessment on a neighbouring land parcel, settled by revised demand.",
      buyerImpact: "No bearing on title here, but EDC disputes are worth confirming are settled before you take possession.",
      ref: "Illustrative — invented for the sample.",
    },
  ],
  verdict:
    "A competent, unspectacular builder. They finish, they pay when they are late, and they are late about three times in ten. Price the delay in rather than assuming it away.",
};

/* Deliberately below the corridor benchmark: the execution adjustment is
   what the model is FOR, and a sample where the adjusted number beats
   the benchmark hides the mechanism it is meant to demonstrate. */
const sampleRoi: RoiModel = {
  horizonYears: 5,
  corridor3Y: "18–24%",
  benchCagr: 6.6,
  adjCagr: 5.2,
  ticketCr: 3.4,
  benchValueCr: 4.68,
  adjValueCr: 4.38,
  deltaCr: -0.3,
};

const sampleLegal: LiveLegalRead = {
  headline:
    "Project registration is current and the title chain is clean. Two open items sit with the developer rather than the land, and both are answerable before you pay.",
  keyFlags: [
    "Revised completion date filed with HARERA in Q1 2026 — later than the date in the current brochure",
    "Occupation certificate not yet applied for; no application is on record",
    "Two disposed consumer matters against the developer entity, neither on this project",
  ],
  lastUpdated: "12 Jul 2026",
  risks: [
    { label: "Title & ownership", level: "Low" },
    { label: "RERA registration", level: "Low" },
    { label: "Approvals & sanctions", level: "Medium" },
    { label: "Litigation exposure", level: "Medium" },
    { label: "Encumbrance", level: "Low" },
  ],
};

/* One "watch" pillar on purpose. The anatomy renders its weakest input in
   red with a rule down the side, and a sample that never triggers it
   leaves a buyer unaware the report will tell them bad news. */
export function sampleProjectIntel(): ProjectIntel {
  return {
    name: SAMPLE_NAME,
    developer: SAMPLE_DEVELOPER,
    market: "Golf Course Extension",
    marketShort: "GCE",
    marketSlug: "golf-course-extension",
    devSlug: "northcrest-estates",
    slug: "sample-read",
    configs: ["3 BHK", "4 BHK"],
    budget: [3.4, 5.1],
    truthScore: 74,
    recommendation: "Proceed with conditions",
    confidence: "Medium",
    tags: ["Capital Appreciation", "Location", "Legal Safety"],
    reason:
      "A well-located, fairly priced project from a builder who delivers late about three times in ten — the address is the asset, the schedule is the risk.",
    strengths: [
      "Corridor with the deepest resale pool in Gurugram",
      "Entry pricing sits inside the tracked band, not above it",
      "Clean title and current RERA registration",
      "Low density — 38 units per acre against a corridor norm nearer 55",
    ],
    watchouts: [
      "Build is running behind its own committed schedule",
      "Revised completion date filed with HARERA is later than the brochure's",
      "Developer's on-time record is 71%, with ~9 months' average slippage",
      "No occupation certificate application on record yet",
    ],
    /* Every number here has to tie to every other one — this is the one
       report where a reader sees all of them at once. The hero band is
       DERIVED (price.currentLow × the super-area range), so these are set
       so that derivation lands exactly on the ticket the Homes table
       quotes: 12,700 × 2,680 = ₹3.4 Cr and 12,700 × 4,020 = ₹5.1 Cr. The
       project's own psf also sits inside the corridor band rather than
       above it, which is what "entry pricing is inside the tracked band"
       in the strengths list is asserting. */
    psf: { low: 12400, avg: 13600, high: 15200 },
    sizeBand: "2,680–4,020 sq ft",
    /* delivery is the "watch" — everything else reads moderate to strong */
    anatomy: {
      delivery: "weak",
      legal: "strong",
      financials: "moderate",
      liquidity: "strong",
      pricing: "strong",
      construction: "moderate",
    },
    liveDeveloper: sampleDeveloper,
    liveRoi: sampleRoi,
    liveLegal: sampleLegal,
    ops: {
      address: "Sector 65, Golf Course Extension Road, Gurugram",
      reviewed: "12 Jul 2026",
      units: 642,
      towers: 4,
      floors: "26–30",
      landAcres: 16.8,
      openAreaPct: 81,
      density: 38,
      carpetSqft: 1690,
      launch: "Mar 2023",
      possession: "Dec 2028",
      /* Same 18-character shape every real registration in the catalogue
         uses (RERA-GRG-NNNN-YYYY). The first invention here was 26
         characters and pushed the report 23px off a 360px screen — the
         number is displayed in a non-wrapping monospace cell, so length
         is a layout constraint, not just a cosmetic choice. */
      reraId: "RERA-GRG-0000-2023",
      reraNote:
        "An invented registration number. Every figure on this page belongs to a project that does not exist — see the note at the top.",
      construction: {
        actualPct: 34,
        expectedPct: 46,
        absorptionPct: 68,
        reraDate: "Dec 2028",
        predictedDate: "Sep 2029",
        qpr: "Q2 2026",
        paceMonths: -9,
      },
      price: { launchPsf: 10800, launchDate: "Mar 2023", currentLow: 12700, currentHigh: 13400 },
      homes: [
        { config: "3 BHK", carpetSqft: 1690, superSqft: 2680, balconySqft: 210, priceCr: 3.4, beds: 3 },
        { config: "3 BHK + Study", carpetSqft: 1900, superSqft: 3010, balconySqft: 240, priceCr: 3.85, beds: 3 },
        { config: "4 BHK", carpetSqft: 2350, superSqft: 3740, balconySqft: 300, priceCr: 4.75, beds: 4 },
        { config: "4 BHK + Servant", carpetSqft: 2530, superSqft: 4020, balconySqft: 320, priceCr: 5.1, beds: 4 },
      ],
      media: {
        masterplan: {
          src: "images/demo/masterplan.webp",
          read: "Four towers held to the northern edge so the podium green runs uninterrupted to the south boundary — the low-density claim is legible in the plan rather than only in the brochure.",
        },
        brochure: ["images/demo/brochure-1.webp", "images/demo/brochure-2.webp", "images/demo/brochure-3.webp"],
        paymentPlan: {
          src: "images/demo/payment-plan.webp",
          read: "Construction-linked, with roughly 30% falling due in the first year and the balance tracking slab completion.",
        },
      },
      usps: [
        {
          title: "38 units per acre against a corridor norm nearer 55",
          body: "Genuine low density, and the one claim here that is contractual — the sanctioned plan fixes it, so it cannot be revised upward after you buy.",
        },
        {
          title: "Three-side open plots on the eastern towers",
          body: "Worth confirming against the sanctioned layout for your specific stack; the marketing plan and the filed plan are not always the same drawing.",
        },
        {
          title: "Clubhouse sized at 42,000 sq ft",
          body: "Large for the unit count, but check whether it is in the same phase as your tower. Amenities delivered in a later phase are a common source of dispute.",
        },
      ],
    },
  };
}
