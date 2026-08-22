/* ════════════════════════════════════════════════════════════════
   THE SAMPLE READ — an invented project, invented developer,
   invented numbers, top to bottom.

   The sample used to be DLF The Arbour with its paywall switched off.
   Two problems with that, and the second is the serious one:

   1. One real project's ENTIRE paid read — the developer audit, the
      legal signals, the ROI model — sat at a public URL for free. Every
      argument for charging ₹1,100 for the other ninety-six applied to it
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
   A sample has one job: show a buyer what ₹1,100 buys — and what it saves
   them from. So this is deliberately a project that LOOKS good and reads
   badly once the file is opened: a genuinely strong address undermined by
   a developer who delivers late one time in two, a balance sheet under
   real strain, a build slipping ~16 months, live litigation on record and
   an ROI model that lands well below its corridor benchmark. The flags are
   stacked on purpose. A buyer should finish it thinking: if MY shortlisted
   project's report came back with this many red flags, I could lose money —
   which is exactly the ₹1,100 question.

   Rendered STATIC in a bottom sheet (frozen ProjectProfile) — the browsing
   preview — and never as a live page. Watermarked "SAMPLE READ · illustrative"
   throughout so no invented figure can be mistaken for a real verdict.

   DELIBERATELY NOT REGISTERED ANYWHERE. Not in PROJECTS, not in OPS, not
   in DEVELOPERS. It is constructed here and referenced only by the sample
   sheet, so it cannot leak into the shortlist, the compare tool, the omni
   index or a search result.
   ════════════════════════════════════════════════════════════════ */
import type { DeveloperIntel } from "./developers";
import type { LiveLegalRead, ProjectIntel, RoiModel } from "./projects";

export const SAMPLE_NAME = "Meridian Vantage";
export const SAMPLE_DEVELOPER = "Northcrest Estates";

/* A dossier that reads like the real ones and describes nobody. The record
   is poor, not catastrophic — a builder that finishes eventually but late,
   over-levered, with litigation trailing it. Exactly the profile a buyer
   needs the report to surface before the cheque, not after. */
const sampleDeveloper: DeveloperIntel = {
  slug: "northcrest-estates",
  name: SAMPLE_DEVELOPER,
  est: "2004",
  listed: false,
  listedNote: "Privately held — accounts filed with the MCA, no quarterly disclosure, so the balance sheet is read from annual filings and channel signals.",
  tagline: "Mid-sized Gurugram developer, residential only.",
  about:
    "A Gurugram-focused residential developer with nine completed projects across the Golf Course Extension and SPR corridors, and five running at once — a launch cadence that has outrun its balance sheet before. Never diversified into commercial or retail, so there is no rental annuity to cushion a slow sales quarter.",
  signature: ["Low-density plotting", "Landscape-led masterplans", "In-house facility management"],
  brandValue: "Finishes what it starts — eventually, and rarely on time.",
  recent: ["Northcrest Willow Park (2023, 16 mo late)", "Northcrest Aria (2022, 11 mo late)", "Northcrest Grove Phase 2 (2021, on time)"],
  pipeline: ["Meridian Vantage", "Northcrest Skyline (announced)", "Northcrest Aria II (announced)"],
  performance: { launched: 16, delivered: 9, ongoing: 5, onTimePct: 52, avgDelayMonths: 14.5, lapsed: 2 },
  financials: { leverage: "weak", coverage: "weak", cash: "moderate", margin: "weak", inventory: "weak" },
  finValues: {
    leverage: "Debt / equity 1.48",
    coverage: "Interest cover 1.4×",
    cash: "Current ratio 1.2",
    margin: "EBITDA margin 12%",
    inventory: "Unsold stock 4.2 years of sales",
  },
  finBand: { leverage: "watch", coverage: "strained", cash: "watch", margin: "watch", inventory: "strained" },
  finNote:
    "Leverage sits well above the listed-peer median and interest cover is thin — earnings barely clear the interest bill, so a single slow sales quarter tightens the screws fast. Five projects running at once against this sheet is the real risk: a funding stop on any one of them can pull cash from the others. Ask, in writing, how Meridian Vantage's construction is ring-fenced.",
  legal: "No insolvency proceedings yet, but a live High Court injunction touching an adjacent land parcel, a RERA compensation order paid under protest, and two consumer matters — one still open.",
  legalCases: [
    {
      title: "Homebuyers' association vs Northcrest Estates (possession delay + compensation)",
      court: "Haryana RERA, Gurugram",
      status: "Order passed — compensation directed",
      relevance: "Direct",
      impact: "High",
      scope: "developer",
      summary:
        "Buyers at an earlier Northcrest tower won a delay-compensation order after a 22-month slip. The authority directed interest at the prescribed rate; the developer paid under protest and sought a review.",
      buyerImpact:
        "This is the tell: the same builder, the same kind of tower, a two-year slip and a fought compensation claim. Assume delay is the base case here and get the penalty clause written into your agreement at the prescribed rate — not the token per-sq-ft figure builders prefer.",
      ref: "Illustrative — this project and this matter are invented for the sample.",
    },
    {
      title: "Injunction over Sector 65 land parcel (title / development rights)",
      court: "Punjab & Haryana High Court",
      status: "Active — interim injunction in force",
      relevance: "Indirect",
      impact: "High",
      scope: "developer",
      summary:
        "A live dispute over development rights on a parcel adjoining an earlier Northcrest scheme, with an interim injunction restraining further construction pending final hearing.",
      buyerImpact:
        "It doesn't sit on Meridian Vantage's land — but an active injunction against your developer's title on a neighbouring parcel is exactly the kind of thing that freezes bank funding and OC timelines. Confirm this project's title is entirely ring-fenced from it before you pay.",
      ref: "Illustrative — invented for the sample.",
    },
    {
      title: "Consumer complaint — sanctioned-plan deviation (clubhouse & tower siting)",
      court: "District Consumer Disputes Redressal Commission",
      status: "Pending",
      relevance: "Direct",
      impact: "Medium",
      scope: "developer",
      summary:
        "Allottees at a recent Northcrest project allege the delivered clubhouse and tower positions deviate from the sanctioned building plan they were sold against.",
      buyerImpact:
        "Relevant because Meridian Vantage's marketing leans on the same low-density, amenity-led pitch. Match your specific tower and the clubhouse against the SANCTIONED plan, not the brochure render, before booking.",
      ref: "Illustrative — invented for the sample.",
    },
    {
      title: "Northcrest Estates vs Municipal Corporation (EDC / IDC assessment)",
      court: "Punjab & Haryana High Court",
      status: "Disposed",
      relevance: "Indirect",
      impact: "Low",
      scope: "developer",
      summary:
        "A dispute over external and internal development charge assessment, settled by revised demand — a routine matter, resolved.",
      buyerImpact: "No bearing on title, but unpaid EDC/IDC can hold up an OC. Confirm the dues on THIS project are cleared before possession.",
      ref: "Illustrative — invented for the sample.",
    },
    {
      title: "MCA charge search — project SPV mortgage",
      court: "Ministry of Corporate Affairs registry",
      status: "Charge registered — open",
      relevance: "Direct",
      impact: "Medium",
      scope: "project",
      summary:
        "A registered charge (mortgage) sits over the project SPV in favour of a construction-finance lender — ordinary for a funded build, but the amount and repayment schedule matter.",
      buyerImpact:
        "A mortgaged project is normal; an over-mortgaged one is not. Insist on a no-objection / redemption letter from the lender for your specific unit before registry, so your flat conveys free of the charge.",
      ref: "Illustrative — invented for the sample.",
    },
  ],
  verdict:
    "A builder whose address quality writes cheques its balance sheet and delivery record struggle to cash. They finish, but late one time in two, they carry litigation, and they run five projects at once on thin cover. The location may still be worth it — but only at a price and on terms that price the execution risk in, not out.",
};

/* Deliberately well below the corridor benchmark: the execution adjustment is
   what the model is FOR, and a sample where the adjusted number beats the
   benchmark hides the mechanism it is meant to demonstrate. Here the gap is
   wide — a red flag in its own right. */
const sampleRoi: RoiModel = {
  horizonYears: 5,
  corridor3Y: "18–24%",
  benchCagr: 7.4,
  adjCagr: 3.6,
  ticketCr: 3.4,
  benchValueCr: 4.86,
  adjValueCr: 4.06,
  deltaCr: -0.8,
};

/* Project reads FLAGGED, not clean — the anatomy sets legal to weak, so the
   Legal pillar leads red, and the risk matrix carries genuine High/Critical
   rows. The Sources block is populated with the real public registries a live
   read cites — genuine public records, shown to demonstrate the feature; the
   invented cases themselves are labelled illustrative and carry no fabricated
   per-case links. */
const sampleLegal: LiveLegalRead = {
  headline:
    "This one carries problems of its own. The title chain is broadly clean, but a live High Court injunction touches the developer's adjacent land, a compensation order is under review, a registered mortgage sits over the project SPV, and the sanctioned plan is being litigated on a sister project. None of it is fatal — all of it is answerable in writing before you pay, and expensive to discover after.",
  keyFlags: [
    "Live P&H High Court injunction on a developer-owned parcel adjoining the project — funding & OC risk if title isn't ring-fenced",
    "HARERA compensation order against the developer for a 22-month delay on a comparable tower, paid under protest",
    "Registered mortgage (charge) over the project SPV — obtain a unit-level redemption/NOC before registry",
    "Consumer complaint pending on a sister project alleging sanctioned-plan deviation on clubhouse & tower siting",
    "Revised completion date filed with HARERA in Q1 2026 — later than the date in the current brochure",
    "Occupation certificate not yet applied for; no application on record with 28% of the build complete",
  ],
  lastUpdated: "1 Aug 2026",
  risks: [
    { label: "Title & ownership", level: "Medium" },
    { label: "RERA registration", level: "Medium" },
    { label: "Litigation exposure", level: "High" },
    { label: "Approvals & sanctions", level: "High" },
    { label: "Encumbrance / mortgage", level: "High" },
    { label: "Delivery / possession", level: "Critical" },
  ],
  sources: [
    { label: "Haryana RERA — project registration & QPR portal", url: "https://haryanarera.gov.in/" },
    { label: "Punjab & Haryana High Court — case status", url: "https://phhc.gov.in/" },
    { label: "Indian Kanoon — judgment & order search", url: "https://indiankanoon.org/" },
    { label: "Ministry of Corporate Affairs — charge / company search", url: "https://www.mca.gov.in/" },
    { label: "National Company Law Tribunal — case search", url: "https://nclt.gov.in/" },
  ],
};

/* A project that shows well and reads badly. Truth Score sits in the high 50s:
   a genuinely strong address dragged down by delivery, balance-sheet and legal
   risk. Several pillars render red — which is the point of the sample. */
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
    truthScore: 57,
    recommendation: "Proceed only with strict conditions",
    confidence: "Medium",
    tags: ["Capital Appreciation", "Location", "Execution Risk"],
    reason:
      "The address is genuinely good — but the developer's delivery record, a strained balance sheet, live litigation and a build already slipping ~16 months stack up into real downside. Worth it only at a negotiated price, with the paperwork answered before you commit capital.",
    strengths: [
      "Corridor with the deepest resale pool in Gurugram — the address is the one unarguable asset",
      "Genuinely low density — 38 units per acre against a corridor norm nearer 55, and contractually fixed in the sanctioned plan",
      "Broadly clean title chain on the project land itself",
    ],
    watchouts: [
      "Developer delivers on time just 52% of the time, with ~14.5 months' average slippage — and two lapsed registrations on record",
      "Balance sheet is stretched: debt/equity 1.48 and interest cover only 1.4× — thin protection if sales slow",
      "Five projects running at once against that sheet — a funding stop on any one can starve the others",
      "Build is 28% complete against a 48% RERA-scheduled mark — roughly 16 months behind its own plan",
      "Live High Court injunction on a developer-owned parcel next door — a funding and OC risk if title isn't ring-fenced",
      "HARERA has already ordered this developer to pay delay compensation on a comparable tower",
      "Registered mortgage over the project SPV — your unit needs a lender NOC to convey clean",
      "Our 10-year model lands at ~3.6% CAGR — well below the ~7.4% corridor benchmark once execution risk is priced in",
      "Revised HARERA completion date is later than the brochure's, and no OC application is on record yet",
    ],
    /* Every number here has to tie to every other one — this is the one
       report where a reader sees all of them at once. The hero band is
       DERIVED (price.currentLow × the super-area range), so these are set
       so that derivation lands exactly on the ticket the Homes table
       quotes: 12,700 × 2,680 = ₹3.4 Cr and 12,700 × 4,020 = ₹5.1 Cr. */
    psf: { low: 12400, avg: 13600, high: 15200 },
    sizeBand: "2,680–4,020 sq ft",
    /* delivery, construction, financials AND legal read weak — four red pillars,
       so the composed Truth Score lands in the high 50s and several sections
       render red. Liquidity and pricing hold the score off the floor. */
    anatomy: {
      delivery: "weak",
      legal: "weak",
      financials: "weak",
      liquidity: "moderate",
      pricing: "moderate",
      construction: "weak",
    },
    liveDeveloper: sampleDeveloper,
    liveRoi: sampleRoi,
    liveLegal: sampleLegal,
    ops: {
      address: "Sector 65, Golf Course Extension Road, Gurugram",
      reviewed: "1 Aug 2026",
      units: 642,
      towers: 4,
      floors: "26–30",
      landAcres: 16.8,
      openAreaPct: 81,
      density: 38,
      carpetSqft: 1690,
      launch: "Mar 2023",
      possession: "Dec 2028",
      reraId: "RERA-GRG-0000-2023",
      reraNote:
        "An invented registration number. Every figure on this page belongs to a project that does not exist — see the note at the top.",
      construction: {
        actualPct: 28,
        expectedPct: 48,
        absorptionPct: 54,
        reraDate: "Dec 2028",
        predictedDate: "Apr 2030",
        qpr: "Q2 2026",
        paceMonths: -16,
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
          read: "Four towers held to the northern edge so the podium green runs uninterrupted to the south boundary — the low-density claim is legible in the plan rather than only in the brochure. Confirm your tower and the clubhouse against THIS sanctioned drawing: a sister project is in consumer court over exactly this deviation.",
        },
        brochure: ["images/demo/brochure-1.webp", "images/demo/brochure-2.webp", "images/demo/brochure-3.webp"],
        paymentPlan: {
          src: "images/demo/payment-plan.webp",
          read: "Construction-linked, with roughly 30% falling due in the first year and the balance tracking slab completion — so on a build already 16 months behind, your money goes out faster than the tower goes up.",
        },
      },
      usps: [
        {
          title: "38 units per acre against a corridor norm nearer 55",
          body: "Genuine low density, and the one claim here that is contractual — the sanctioned plan fixes it, so it cannot be revised upward after you buy. This is the real reason to keep the file open despite the flags.",
        },
        {
          title: "Three-side open plots on the eastern towers",
          body: "Worth confirming against the sanctioned layout for your specific stack; the marketing plan and the filed plan are not always the same drawing — and on this developer, a sister project is being litigated over that exact gap.",
        },
        {
          title: "Clubhouse sized at 42,000 sq ft",
          body: "Large for the unit count, but check whether it is in the same phase as your tower AND matches the sanctioned plan. Amenities delivered in a later phase — or resited from the drawing — are a common source of dispute, and one this builder already carries.",
        },
      ],
    },
  };
}
