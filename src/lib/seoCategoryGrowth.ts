import seoOverrides from "@/data/seo_category_growth_strategy.json";

export interface ProjectSeoInput {
  name: string;
  developer?: string | null;
  truthScore?: number | null;
  minPriceCr?: number | null;
  seoSlug?: string | null;
}

export interface ProjectSeoOutput {
  title: string;
  description: string;
  primaryEmotion: string;
}

const ANGLES = [
  "DECISION",
  "VERDICT",
  "CONFIDENCE",
  "RISK",
  "EDITORIAL",
  "NEGOTIATION",
  "CURIOSITY",
] as const;

// Create lookup map for pre-computed 107 curated project SEO overrides
const overrideMap = new Map<string, { title: string; desc: string; emotion: string }>();

// The override key is normalised the same way on both sides of the lookup:
// trimmed, internal runs of whitespace collapsed to one, lowercased. The
// snapshot `name` these overrides were generated from can carry a double
// space (e.g. "Birla Navya - Avik  (PHASE-2)") that the runtime project name
// renders with a single space — without collapsing, that one report would
// miss its curated title and fall through to the dynamic engine.
const normKey = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

(seoOverrides as Array<any>).forEach((item) => {
  if (item.projectName) {
    overrideMap.set(normKey(item.projectName), {
      title: item.seoTitle,
      desc: item.metaDescription,
      emotion: item.primaryEmotion,
    });
  }
});

/**
 * Category Design SEO Copy Generator
 * Generates high-CTR, high-intent SEO Titles (<= 60 chars) and Meta Descriptions (<= 155 chars)
 * for existing or newly deployed projects.
 */
export function getProjectSeoMeta(input: ProjectSeoInput): ProjectSeoOutput {
  const p = (input.name || "Project").trim();
  const d = (input.developer || "").trim();
  const s = input.truthScore;
  const pr = input.minPriceCr;

  // 1. Check if exact pre-curated override exists
  const key = normKey(p);
  if (overrideMap.has(key)) {
    const matched = overrideMap.get(key)!;
    const title = matched.title.length > 60 ? matched.title.slice(0, 57) + "..." : matched.title;
    const desc = matched.desc.length > 155 ? matched.desc.slice(0, 152) + "..." : matched.desc;
    return {
      title: title.trim(),
      description: desc.trim(),
      primaryEmotion: matched.emotion,
    };
  }

  // 2. Dynamic Category Design Engine for NEW Projects
  // Hash name to assign a deterministic psychological vector angle
  let hash = 0;
  for (let i = 0; i < p.length; i++) {
    hash = (hash << 5) - hash + p.charCodeAt(i);
    hash |= 0;
  }
  const angleIdx = Math.abs(hash) % ANGLES.length;
  const angle = ANGLES[angleIdx];

  const scoreText = s != null ? `Truth Score ${s}` : "";
  const shortScore = s != null ? `Score ${s}` : "";

  // Title Candidates (Target <= 60 chars)
  let titleCandidates: string[] = [];

  if (angle === "DECISION") {
    titleCandidates = [
      `${p} Review (2026): Buy, Wait or Avoid?`,
      `${p} Review: Buy, Wait or Avoid?`,
      `${p} Review: Buy or Avoid?`,
      `${p}: Buy, Wait or Avoid?`,
      `${p} Review (2026)`,
    ];
  } else if (angle === "VERDICT") {
    titleCandidates = [
      `${p}: Worth Buying or Marketing Hype?`,
      `${p} Review: Worth Buying or Hype?`,
      `Is ${p} Worth Buying? Review`,
      `${p} Review: Worth Buying?`,
      `${p}: Worth Buying?`,
      `${p} Review (2026)`,
    ];
  } else if (angle === "CONFIDENCE") {
    titleCandidates = [
      `${p} Review: Read Before You Book`,
      `${p} Review: Truth Before Booking`,
      `${p} Review: Read Before Booking`,
      `${p}: Read Before Booking`,
      `${p} Review (2026)`,
    ];
  } else if (angle === "RISK") {
    titleCandidates = [
      `${p} Review: Legal & Delivery Risks`,
      `${p} Review: Delivery & Legal Risks`,
      `${p} Review: Key Red Flags & Risks`,
      `${p}: Legal & Delivery Risks`,
      `${p} Review (2026)`,
    ];
  } else if (angle === "EDITORIAL") {
    titleCandidates = [
      `Would We Invest in ${p}? Review`,
      `Would We Buy ${p}? Independent Review`,
      `Is ${p} a Safe Invest? Review`,
      `Should You Invest in ${p}? Review`,
      `${p} Review (2026)`,
    ];
  } else if (angle === "NEGOTIATION") {
    titleCandidates = [
      `${p} Review: True Value or Overpriced?`,
      `${p} Review: Is Price Justified?`,
      `${p} Review: Fair Value Check`,
      `${p}: True Value or Overpriced?`,
      `${p} Review (2026)`,
    ];
  } else {
    titleCandidates = [
      `${p} Review: What Sales Won't Tell You`,
      `${p} Review: What Sales Hides`,
      `${p} Review: Truth Behind Brochure`,
      `${p}: What Sales Won't Tell You`,
      `${p} Review (2026)`,
    ];
  }

  const title =
    titleCandidates.find((t) => t.trim().length <= 60 && t.trim().length >= 40) ||
    titleCandidates.find((t) => t.trim().length <= 60) ||
    `${p} Review`;

  // Meta Description Candidates (Target 140 - 155 chars)
  const devPhrase = d ? `by ${d}` : "";
  const pricePhrase = pr ? `₹${pr} Cr+ pricing, ` : "";

  const descCandidates = [
    `Should you buy ${p} ${devPhrase}? Discover legal risks, construction progress, ${pricePhrase}developer track record and delivery outlook before booking.`,
    `Thinking of buying ${p} ${devPhrase}? Explore legal risks, construction progress, ${pricePhrase}developer history and delivery outlook before booking.`,
    `Planning to buy ${p} ${devPhrase}? Discover legal risks, construction progress, ${pricePhrase}developer track record and delivery outlook before you invest.`,
    `Considering an investment in ${p} ${devPhrase}? Uncover legal risks, construction progress, ${pricePhrase}and delivery outlook before booking.`,
    `Should you buy ${p}? Review legal risks, construction progress, pricing and delivery outlook before paying your booking amount.`,
    `Thinking of buying ${p}? Uncover legal risks, construction progress, pricing and delivery outlook before booking.`,
  ];

  let description =
    descCandidates.find((dText) => dText.trim().length >= 138 && dText.trim().length <= 155) ||
    `Should you buy ${p}? Discover legal risks, construction progress and delivery outlook before paying the booking amount.`;

  if (description.length > 155) {
    description = description.slice(0, 152) + "...";
  }

  return {
    title: title.trim(),
    description: description.trim(),
    primaryEmotion: angle,
  };
}
