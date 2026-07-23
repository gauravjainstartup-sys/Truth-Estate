/* ════════════════════════════════════════════════════════════════
   TRUTHGUIDE CHAT — tiered general-purpose AI chat for the site-wide
   TruthGuide (non-project-scoped). Powered by Gemini via the same
   challenge-router Edge Function, with a "general" mode.

   Three tiers:
     Layer 1  anonymous   2 messages/session, overview answers only,
                          restricted to Gurugram residential real estate
     Layer 2  registered  unlimited, moderate depth (no deep proprietary data)
     Layer 3  paid        20 messages/day, full depth from our own database

   All tier logic + message counting lives in localStorage (same pattern
   as the rest of the demo). Real enforcement moves to the server with auth.
   ════════════════════════════════════════════════════════════════ */
import { isSignedIn, isAllAccess, isMember } from "@/lib/journey";

export type TruthGuideTier = "anonymous" | "registered" | "paid";

export const ANON_MESSAGE_LIMIT = 2;
export const PAID_DAILY_LIMIT = 20;

const MSG_COUNT_KEY = "truthEstate.tgMsgCount";
const PAID_DAY_KEY = "truthEstate.tgPaidDay";
const PAID_DAY_COUNT_KEY = "truthEstate.tgPaidDayCount";

export function getTier(): TruthGuideTier {
  if (typeof window === "undefined") return "anonymous";
  if (isAllAccess() || isMember()) return "paid";
  if (isSignedIn()) return "registered";
  return "anonymous";
}

export function getSessionMessageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(window.localStorage.getItem(MSG_COUNT_KEY) ?? "0", 10);
  } catch { return 0; }
}

export function incrementSessionMessageCount(): number {
  if (typeof window === "undefined") return 0;
  const n = getSessionMessageCount() + 1;
  try { window.localStorage.setItem(MSG_COUNT_KEY, String(n)); } catch { /* */ }
  return n;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getPaidDailyCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const day = window.localStorage.getItem(PAID_DAY_KEY);
    if (day !== todayKey()) return 0;
    return parseInt(window.localStorage.getItem(PAID_DAY_COUNT_KEY) ?? "0", 10);
  } catch { return 0; }
}

export function incrementPaidDailyCount(): number {
  if (typeof window === "undefined") return 0;
  const today = todayKey();
  try {
    const day = window.localStorage.getItem(PAID_DAY_KEY);
    let n = 1;
    if (day === today) {
      n = parseInt(window.localStorage.getItem(PAID_DAY_COUNT_KEY) ?? "0", 10) + 1;
    }
    window.localStorage.setItem(PAID_DAY_KEY, today);
    window.localStorage.setItem(PAID_DAY_COUNT_KEY, String(n));
    return n;
  } catch { return 0; }
}

export type GateReason = "anon-limit" | "paid-daily-limit" | null;

export function checkGate(): GateReason {
  const tier = getTier();
  if (tier === "anonymous" && getSessionMessageCount() >= ANON_MESSAGE_LIMIT) return "anon-limit";
  if (tier === "paid" && getPaidDailyCount() >= PAID_DAILY_LIMIT) return "paid-daily-limit";
  return null;
}

export function remainingMessages(): number | null {
  const tier = getTier();
  if (tier === "anonymous") return Math.max(0, ANON_MESSAGE_LIMIT - getSessionMessageCount());
  if (tier === "paid") return Math.max(0, PAID_DAILY_LIMIT - getPaidDailyCount());
  return null;
}

export function trackMessage(): void {
  const tier = getTier();
  if (tier === "anonymous") incrementSessionMessageCount();
  if (tier === "paid") incrementPaidDailyCount();
}

/* ── General context for Gemini ─────────────────────────────────
   Unlike the project-scoped ChallengeChat, the general TruthGuide
   sends a market-wide context built from whatever public data the
   client holds. Tier determines depth. */
export type GeneralContext = {
  tier: TruthGuideTier;
  publicKnowledge: string;
  paidKnowledge: string | null;
};

export function buildGeneralContext(): GeneralContext {
  const tier = getTier();

  const publicKnowledge = [
    `ROLE: You are TruthGuide, the independent real estate advisor for Truth Estate. Truth Estate is a buyer-side-only advisory — no inventory, no developer commission, no paid placement.`,
    `SCOPE: Gurugram residential real estate ONLY. Politely decline anything outside this scope (commercial, other cities, non-real-estate).`,
    `COVERAGE: We track luxury and premium residential projects in Gurugram across corridors — Golf Course Road, SPR (Southern Peripheral Road), Dwarka Expressway, New Gurgaon (Sectors 76–95), Sohna Road, and Golf Course Extension. We cover developers like DLF, Godrej, M3M, Smartworld, Signature Global, Puri, Birla, Conscient, Emaar, and others.`,
    `METHODOLOGY: Each project gets a Truth Score (0–100) built from five weighted pillars: Location (26%), Developer (25%), Construction (22%), Legal (15%), USPs (12%). Re-scored quarterly. No builder can pay to move it.`,
    `SERVICES: Full forensic reads (₹999/project), Sun & Vastu 3D analysis (₹1,499/project), All-Access pass (₹9,999), free advisor calls with any package, and a Private Buyer's Office for registered users.`,
    `CORRIDORS:`,
    `- Golf Course Road (GCR): Gurugram's prime corridor; DLF Camellias, Magnolias, Aralias territory. Ultra-luxury, ₹25k–45k/sqft.`,
    `- SPR (Southern Peripheral Road): Emerging luxury corridor; DLF Privana South, Arbour, Puri Aravallis. ₹18k–28k/sqft. Strong appreciation.`,
    `- Dwarka Expressway: Mass luxury to mid-premium; Godrej, Emaar, Conscient. ₹12k–22k/sqft. Metro connectivity catalyst.`,
    `- New Gurgaon (Sec 76–95): Value corridor; Smartworld, Signature Global. ₹8k–16k/sqft. High volume.`,
    `- Golf Course Extension (GCX): Premium extension of GCR; M3M Golf Estate, Ireo. ₹16k–24k/sqft.`,
    `- Sohna Road: Emerging; mix of affordable and mid-premium. ₹7k–14k/sqft.`,
  ].join("\n");

  if (tier !== "paid") {
    return { tier, publicKnowledge, paidKnowledge: null };
  }

  const paidKnowledge = [
    `PAID CONTEXT — answer with full depth from this data:`,
    `TOP PROJECTS (our current reads):`,
    `- DLF Privana South: Truth Score 89/100, SPR corridor, 4-5 BHK + Penthouse, ₹9-18 Cr. Strong Buy. Developer: DLF (98% on-time). Top 5% of tracked.`,
    `- DLF Arbour: Truth Score 86/100, SPR corridor, 3-4 BHK, ₹5-9 Cr. Strong Buy. Same DLF pedigree at a lower ticket.`,
    `- Godrej Aristocrat: Truth Score 82/100, Dwarka Expressway, 3-4 BHK, ₹3-6 Cr. Good Buy. Godrej's track record is solid.`,
    `- Puri The Aravallis: Truth Score 78/100, SPR corridor, 3-4 BHK, ₹4-7 Cr. Qualified Buy. Watch construction pace.`,
    `- M3M Golf Estate: Truth Score 76/100, GCX, 3-4 BHK, ₹4-8 Cr. Qualified Buy. Premium location, watch developer financials.`,
    `- Smartworld One DXP: Truth Score 73/100, New Gurgaon, 2-3 BHK, ₹1.5-3 Cr. Fair. Value entry, newer developer.`,
    `- Emaar Digi Homes: Truth Score 71/100, Dwarka Expressway, 2-3 BHK, ₹2-4 Cr. Fair. Emaar brand, corridor appreciation play.`,
    `DEVELOPER INSIGHTS:`,
    `- DLF: Market leader. 98% on-time delivery, strong balance sheet, premium command. Verdict: highest conviction.`,
    `- Godrej: Institutional backing, 92% on-time, disciplined pricing. Strong buy-side developer.`,
    `- M3M: Aggressive growth, 75% on-time, financial leverage is a watch factor. Mixed conviction.`,
    `- Smartworld: New entrant, backed by experienced promoters. Limited track record. Moderate conviction.`,
    `- Signature Global: Volume player, aggressive pricing, 70% on-time. Watch construction and finish quality.`,
    `MARKET TRENDS:`,
    `- Gurugram luxury has appreciated 40-60% in 3 years (2022-2025). SPR leads.`,
    `- Dwarka Expressway metro connectivity is a 2025-26 catalyst.`,
    `- New supply is concentrated in SPR and Dwarka Expressway.`,
    `- NRI demand is up 35% YoY; FEMA-compliant structures standard at top developers.`,
  ].join("\n");

  return { tier, publicKnowledge, paidKnowledge };
}

/* ── Client bridge to the Edge Function ────────────────────────── */
const DEFAULT_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/challenge-router";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

function routerUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CHALLENGE_ROUTER_URL) {
    return process.env.NEXT_PUBLIC_CHALLENGE_ROUTER_URL;
  }
  if (typeof window !== "undefined") {
    const w = window as { __challengeRouterUrl?: string };
    if (typeof w.__challengeRouterUrl === "string") return w.__challengeRouterUrl;
  }
  return DEFAULT_URL;
}

export type ChatMsg = { id: string; role: "user" | "bot"; text: string; gate?: GateReason };

let n = 0;
export const msgId = () => `tg${Date.now().toString(36)}${(n++).toString(36)}`;

export async function askTruthGuideRemote(
  question: string,
  history: { role: "user" | "bot"; text: string }[] = [],
): Promise<{ text: string } | null> {
  try {
    const ctx = buildGeneralContext();
    const res = await fetch(routerUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        mode: "general",
        question,
        tier: ctx.tier,
        history: history.slice(-8),
        context: ctx,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; text?: string };
    if (!data?.ok || typeof data.text !== "string") return null;
    return { text: data.text };
  } catch {
    return null;
  }
}

/* Deterministic fallback — used when Gemini is unreachable */
export function fallbackAnswer(question: string): string {
  const q = question.toLowerCase();
  if (/truth\s*score|methodology|how.*score|how.*work/i.test(q)) {
    return "Truth Score is our independent 0–100 rating built from five weighted pillars: Location (26%), Developer (25%), Construction (22%), Legal (15%), and USPs (12%). Re-scored quarterly — no builder can pay to move it. Ask me about any specific project or corridor.";
  }
  if (/compare|vs |versus/i.test(q)) {
    return "I can help you compare projects, developers, or corridors. Try naming two specific ones — like \"DLF Arbour vs Puri Aravallis\" or \"SPR vs Dwarka Expressway\" — and I'll give you our read.";
  }
  if (/price|budget|how much|afford|cost/i.test(q)) {
    return "Gurugram luxury ranges from ₹8k–45k/sqft depending on the corridor. SPR (₹18k–28k) is the strongest appreciation corridor right now; Dwarka Expressway (₹12k–22k) is the metro-driven value play. Tell me your budget range and I can narrow it down.";
  }
  if (/developer|builder|dlf|godrej|m3m|smartworld|signature|puri/i.test(q)) {
    return "We track every major developer in Gurugram on delivery record, financial strength, and build quality. DLF and Godrej lead on execution. Ask me about a specific developer and I'll share what our read shows.";
  }
  if (/risk|safe|concern|worry/i.test(q)) {
    return "The key risks in Gurugram real estate are construction delays, developer financial stress, and legal title issues. Our Truth Score flags these at the project level. Tell me which project you're evaluating and I'll point you to the specific risks.";
  }
  if (/location|corridor|spr|gcr|dwarka|sohna|golf course/i.test(q)) {
    return "Gurugram has six main corridors: Golf Course Road (ultra-luxury), SPR (emerging luxury, strongest appreciation), Dwarka Expressway (metro catalyst play), New Gurgaon (value), Golf Course Extension (premium), and Sohna Road (affordable/mid). Which one are you considering?";
  }
  if (/hi|hello|hey|namaste/i.test(q) && q.length < 20) {
    return "Hi — I'm TruthGuide, your independent advisor for Gurugram residential real estate. Ask me about any project, developer, corridor, or investment question. No sales, no bias — just the facts from our independent read.";
  }
  return "I'm TruthGuide — I answer questions about Gurugram residential real estate from our independent research. Ask me about a specific project, developer, corridor, pricing, risks, or investment opportunity and I'll give you our read.";
}

/* Suggestion chips for the opening screen */
export const GUIDE_SUGGESTIONS = [
  "Which projects score highest right now?",
  "Is DLF Privana South worth the premium?",
  "Compare SPR vs Dwarka Expressway",
  "Best projects under ₹5 Cr",
  "Which developers deliver on time?",
  "What are the risks in Gurugram real estate?",
];
