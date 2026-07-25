/* ════════════════════════════════════════════════════════════════
   TRUTHGUIDE CHAT — tiered general-purpose AI chat for the site-wide
   TruthGuide (non-project-scoped). Powered by Gemini via the same
   challenge-router Edge Function, with a "general" mode.

   Three tiers:
     Layer 1  anonymous   2 messages/session, concise answers
     Layer 2  registered  unlimited, fuller answers + comparisons
     Layer 3  paid        20 messages/day, full forensic depth

   THE GATE IS ON DEPTH, NOT ON FACTS. The tracked scoreboard — project
   names, Truth Scores, developers, corridors, price bands, delivery
   years — is ALREADY public: the build publishes it as /omni-index.json
   and every visitor's browser can read it. Withholding it from the chat
   would make the chat useless without protecting anything. What the paid
   read actually sells is the FORENSIC AUDIT behind each score (pillar
   breakdown, ROI model, legal read, developer record) — that is what the
   tiers gate, mirroring the ₹999 wall on the project reports.

   Context comes from the LIVE index (the same rows the site renders),
   never a hand-typed list, so the chat can never drift from the database.

   All tier logic + message counting lives in localStorage (same pattern
   as the rest of the demo). Real enforcement moves to the server with auth.
   ════════════════════════════════════════════════════════════════ */
import { isSignedIn, isAllAccess, isMember, loadUnlocks, PROJECTS } from "@/lib/journey";
import type { OmniIndex } from "@/lib/omni";

export type TruthGuideTier = "anonymous" | "registered" | "paid";

export const ANON_MESSAGE_LIMIT = 2;
export const PAID_DAILY_LIMIT = 20;

const MSG_COUNT_KEY = "truthEstate.tgMsgCount";
const PAID_DAY_KEY = "truthEstate.tgPaidDay";
const PAID_DAY_COUNT_KEY = "truthEstate.tgPaidDayCount";

const BASE_PATH = "/Truth-Estate";
/* How many tracked rows ride in the prompt. The whole scoreboard is ~100 rows
   ≈ 12 KB ≈ 3k tokens, which is nothing against Flash's window — so this cap
   is only a runaway guard for a much larger future backlog. Keep it well above
   the live count: rows are ranked by score, so a tight cap would drop the
   LOWEST-scored projects, and those are the cheapest — precisely the ones a
   "best under ₹2 Cr" question needs. */
const MAX_CONTEXT_PROJECTS = 200;

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

/* ── The tracked universe, from the live index ──────────────────── */
export type GuideProject = {
  name: string;
  developer: string | null;
  location: string | null;
  score: number | null;
  minPriceCr: number | null;
  config: string | null;
  deliveryYear: number | null;
  redFlags: number | null;
  delayRisk: string | null;
  has3D: boolean;
};

/* One fetch of the public project index, cached for the session.
   Failure → null, and the caller falls back to the curated catalog. */
let omniCache: OmniIndex | null | undefined;
async function fetchOmni(): Promise<OmniIndex | null> {
  if (omniCache !== undefined) return omniCache;
  try {
    const res = await fetch(`${BASE_PATH}/omni-index.json`, { signal: AbortSignal.timeout(8000) });
    omniCache = res.ok ? ((await res.json()) as OmniIndex) : null;
  } catch {
    omniCache = null;
  }
  return omniCache;
}

/* Live rows first; the curated PROJECTS catalog is the offline fallback so
   the chat still knows real projects if the index can't be reached. */
async function trackedProjects(): Promise<GuideProject[]> {
  const idx = await fetchOmni();
  const live = (idx?.projects ?? [])
    .filter((p) => p.name)
    .map<GuideProject>((p) => ({
      name: p.name,
      developer: p.developer,
      location: p.location,
      score: p.score == null ? null : Math.round(p.score),
      minPriceCr: p.minPriceCr,
      config: p.config,
      deliveryYear: p.deliveryYear,
      redFlags: p.redFlags,
      delayRisk: p.delayRisk,
      has3D: p.has3D,
    }));
  if (live.length) return live;

  return PROJECTS.map<GuideProject>((p) => ({
    name: p.name,
    developer: p.developer,
    location: p.market,
    score: p.truthScore,
    minPriceCr: p.budget?.[0] ?? null,
    config: p.configs?.join(", ") ?? null,
    deliveryYear: null,
    redFlags: null,
    delayRisk: null,
    has3D: false,
  }));
}

/* Highest-scoring first — a truncated list should keep the best reads, and
   "which score highest" is the single most common question. */
function rankForContext(rows: GuideProject[]): GuideProject[] {
  return [...rows]
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, MAX_CONTEXT_PROJECTS);
}

/* Public scoreboard line — exactly the fields /omni-index.json already
   serves to every anonymous visitor. */
function publicLine(p: GuideProject): string {
  const bits = [p.name];
  if (p.developer) bits.push(p.developer);
  if (p.location) bits.push(p.location);
  if (p.score != null) bits.push(`Truth Score ${p.score}`);
  if (p.minPriceCr != null) bits.push(`from ₹${p.minPriceCr} Cr`);
  if (p.config) bits.push(p.config);
  if (p.deliveryYear) bits.push(`handover ${p.deliveryYear}`);
  return `- ${bits.join(" · ")}`;
}

/* Forensic signals — the paid layer. Counts and risk flags are the hooks
   the ₹999 read explains in full. */
function forensicLine(p: GuideProject): string | null {
  const bits: string[] = [];
  if (p.redFlags != null && p.redFlags > 0) bits.push(`${p.redFlags} red flag${p.redFlags === 1 ? "" : "s"} logged`);
  if (p.delayRisk) bits.push(`delay risk ${p.delayRisk}`);
  if (p.has3D) bits.push("Sun & Vastu 3D model available");
  return bits.length ? `- ${p.name}: ${bits.join("; ")}` : null;
}

/* ── Session identity ───────────────────────────────────────────
   A per-browser id so a conversation can be grouped, and so the whole
   anonymous history can later be claimed by a verified account. It is
   deliberately a plain random id in localStorage rather than a device
   fingerprint: a fingerprint would survive a cache clear, but it is
   personal data under the DPDP Act and browsers actively defeat it. The
   durable identity is the verified phone number, not the device. */
const SESSION_KEY = "truthEstate.tgSession";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "";
  }
}

/* Which projects this visitor has bought the read on. Depth is sold one
   report at a time, so this — not the account tier — is what unlocks
   forensic detail in the answer. */
export function unlockedProjectNames(): string[] {
  if (typeof window === "undefined") return [];
  return loadUnlocks();
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

/* The client no longer assembles the knowledge. It used to build the whole
   scoreboard here and POST it, which meant (a) it could only ever be as
   fresh as the last deploy, and (b) anyone could edit the payload in
   flight and have TruthGuide state invented projects as fact. The Edge
   Function now reads the database itself. We send the question and who is
   asking; the server decides what is true. */
export async function askTruthGuideRemote(
  question: string,
  history: { role: "user" | "bot"; text: string }[] = [],
): Promise<{ text: string } | null> {
  try {
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
        tier: getTier(),
        history: history.slice(-8),
        unlockedProjects: unlockedProjectNames(),
        sessionId: getSessionId(),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; text?: string };
    if (!data?.ok || typeof data.text !== "string") return null;
    return { text: data.text };
  } catch {
    return null;
  }
}

/* ── Deterministic fallback — used when Gemini is unreachable ─────
   Answers from the same live rows, so an outage degrades depth, not truth. */
const cr = (n: number | null) => (n == null ? "" : `₹${n} Cr`);

function topList(rows: GuideProject[], k = 5): string {
  return rows
    .filter((p) => p.score != null)
    .slice(0, k)
    .map((p) => `${p.name} (${p.score}${p.location ? `, ${p.location}` : ""})`)
    .join("; ");
}

export async function fallbackAnswer(question: string): Promise<string> {
  const q = question.toLowerCase();
  const rows = rankForContext(await trackedProjects());

  if (/truth\s*score|methodology|how.*score|how.*work/.test(q)) {
    return "Truth Score is our independent 0–100 rating built from five weighted pillars: Location (26%), Developer (25%), Construction (22%), Legal (15%) and USPs (12%). Re-scored quarterly — no builder can pay to move it. 90+ is Exceptional, 80–89 Strong, 70–79 Solid.";
  }

  const budget = q.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore)/);
  if (budget) {
    const cap = parseFloat(budget[1]);
    const fit = rows.filter((p) => p.minPriceCr != null && p.minPriceCr <= cap);
    if (fit.length) {
      return `Under ${cr(cap)}, the strongest reads we track are ${topList(fit)}. Those are entry tickets — tell me your preferred corridor or configuration and I'll narrow it further.`;
    }
    const cheapest = rows
      .filter((p) => p.minPriceCr != null)
      .sort((a, b) => (a.minPriceCr ?? 0) - (b.minPriceCr ?? 0))
      .slice(0, 3)
      .map((p) => `${p.name} (from ${cr(p.minPriceCr)})`)
      .join("; ");
    return `Nothing in our tracked set starts under ${cr(cap)} right now. The lowest entry tickets we hold are ${cheapest}.`;
  }

  if (/best|top|highest|score.*high|recommend|which project/.test(q)) {
    return rows.length
      ? `On our current reads the highest-scoring projects are ${topList(rows)}. Tell me your budget and corridor and I'll narrow it to the ones that actually fit.`
      : "I can rank our tracked projects by Truth Score once the index loads — try again in a moment.";
  }

  if (/compare|vs |versus/.test(q)) {
    return "Name the two projects and I'll put their Truth Scores, corridors and entry tickets side by side — for example \"DLF Arbour vs Godrej Aristocrat\".";
  }

  if (/developer|builder|dlf|godrej|m3m|smartworld|signature|puri|emaar|birla/.test(q)) {
    const devs = [...new Set(rows.map((p) => p.developer).filter(Boolean))].slice(0, 8).join(", ");
    return `We track developers on delivery record, financial strength and build quality. Currently covered: ${devs}. Ask me about a specific one and I'll share what our read shows.`;
  }

  if (/risk|safe|concern|worry|red flag/.test(q)) {
    return "The recurring risks in Gurugram are construction delay, developer financial stress and title/approval gaps. Each is scored inside the project's Truth Score, and the full forensic read sets out the specific findings. Which project are you evaluating?";
  }

  if (/location|corridor|micro.?market|spr|gcr|dwarka|sohna|golf course|new gurgaon|nh.?8/.test(q)) {
    /* Derived from the rows we hold, never a typed list. The previous
       hardcoded version was wrong on every band — it called Sohna Road the
       cheap corridor at ₹7–14k when it actually averages ₹19,250/sqft. */
    const byArea = new Map<string, number[]>();
    for (const p of rows) {
      if (!p.location || p.minPriceCr == null) continue;
      const k = p.location.split("·").pop()!.trim();
      const bucket = byArea.get(k) ?? [];
      bucket.push(p.minPriceCr);
      byArea.set(k, bucket);
    }
    const list = [...byArea.entries()]
      .sort((a, b) => Math.min(...b[1]) - Math.min(...a[1]))
      .slice(0, 8)
      .map(([k, v]) => `${k} (from ₹${Math.min(...v)} Cr)`)
      .join("; ");
    return list
      ? `The corridors we track: ${list}. Which are you weighing?`
      : "I track every Gurugram corridor — tell me which one you're weighing and I'll give you our read.";
  }

  if (/^(hi|hello|hey|namaste)\b/.test(q) && q.length < 20) {
    return `Hi — I'm TruthGuide, your independent advisor for Gurugram residential real estate. We currently track ${rows.length} projects, each with a Truth Score. Ask me about any project, developer, corridor or budget.`;
  }

  return `I answer from our independent research on ${rows.length} tracked Gurugram projects. Ask me for the highest scores, projects inside a budget, a head-to-head comparison, or a developer's delivery record.`;
}

/* Suggestion chips for the opening screen */
export const GUIDE_SUGGESTIONS = [
  "Which projects score highest right now?",
  "Best projects under ₹5 Cr",
  "Compare SPR vs Dwarka Expressway",
  "Which developers deliver on time?",
  "What should I watch out for in Gurugram?",
];
