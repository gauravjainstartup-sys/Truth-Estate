/* ════════════════════════════════════════════════════════════════
   CHALLENGE CHAT — the paywall-aware brain behind "Challenge our read".

   A project-scoped advisor that answers a buyer's questions ONLY from
   Truth Estate's own read of this project (no fabrication) — and that
   respects the unlock wall exactly like the rest of the report:

     • PUBLIC facts (score, grade, rank, vitals, corridor pricing, the
       pillar summary, methodology, independence) are answered in full,
       locked or not.
     • PAID findings (the verdict, ROI numbers, the deep pillar audit,
       the developer track record, the legal read) get a real, true
       TEASER when locked — proof the answer exists — then a gate to the
       ₹1,100 read. Once unlocked, the same question answers in full.

   This is the deterministic Phase-1 brain (works offline, ships today).
   Phase 2 swaps `answerChallenge` for a Gemini call in the Edge Function
   over the SAME access-tagged knowledge, with this as the fallback — see
   challengeRouter.ts. The gate contract (what's public vs paid) stays
   here so the wall can never drift between the two brains.
   ════════════════════════════════════════════════════════════════ */
import {
  type ProjectIntel,
  pillars,
  projectFaqs,
  roiModel,
  developerOf,
  marketOf,
  rankContext,
} from "@/lib/projects";
import { buildChatLinks, type ChatLink } from "@/lib/chatLinks";
import { AREA_ALIASES, type OmniIndex, type OmniUnit } from "@/lib/omni";
import { READ_FROM_INR } from "@/lib/journey";
import { basePath as BASE_PATH } from "@/lib/site";

export type ChatRole = "user" | "bot";
/* the gate a bot message carries: the ₹1,100 read, the Sun & Vastu 3D (All-Access), or none */
export type Gate = "read" | "3d" | null;
export type ChatMsg = { id: string; role: ChatRole; text: string; gate?: Gate };
export type ChallengeAnswer = { text: string; gate: Gate };
/* a corridor rival for in-chat head-to-heads — public scoreboard only
   (name + Truth Score); the deep audit stays behind each project's own read */
export type Peer = { name: string; score: number; sameCorridor: boolean };
/* per-unit Sun/Vastu intelligence — the Sun & Vastu 3D tier, via All-Access (has3DAccess only) */
export type UnitIntel = OmniUnit;
/* access the chat needs to gate correctly */
export type ChatAccess = { has3DModel: boolean; has3DAccess: boolean };


/* which corridor a free-text location belongs to (reuses the omni aliases) */
function corridorKey(loc: string | null | undefined): string | null {
  if (!loc) return null;
  const hit = AREA_ALIASES.find(([re]) => re.test(loc.toLowerCase()));
  return hit ? hit[1] : null;
}

/* One fetch of the public project index → this project's closest rivals
   (same corridor first, else top-scored) AND its per-unit Sun/Vastu lines.
   Scores/peer names are public; the unit lines are only SURFACED to a 3D-access
   visitor (the caller gates that). Cached per session; failure → empty. */
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

export async function loadChatData(p: ProjectIntel): Promise<{ peers: Peer[]; units: UnitIntel[]; links: ChatLink[] }> {
  const idx = await fetchOmni();
  if (!idx) return { peers: [], units: [], links: [] };
  const me = idx.projects.find((x) => x.slug === p.slug);
  const myKey = corridorKey(me?.location) ?? corridorKey(p.market) ?? corridorKey(p.marketShort);
  const scored = idx.projects.filter((x) => x.slug !== p.slug && typeof x.score === "number" && (x.score ?? 0) > 0);
  const same = myKey ? scored.filter((x) => corridorKey(x.location) === myKey) : [];
  const pool = (same.length >= 2 ? same : scored).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);
  const peers = pool.map((x) => ({ name: x.name, score: Math.round(x.score ?? 0), sameCorridor: !!myKey && corridorKey(x.location) === myKey }));
  const units = idx.units?.[p.slug] ?? [];
  return { peers, units, links: buildChatLinks(idx.projects) };
}

function peerLine(p: ProjectIntel, peers: Peer[]): string {
  if (!peers.length) return "";
  const named = peers.map((r) => `${r.name} (${r.score})`).join(", ");
  const scope = peers.every((r) => r.sameCorridor) ? `the ${p.marketShort} corridor` : "the projects we track";
  return `Closest rivals in ${scope}: ${named}. ${p.name} scores ${p.truthScore}.`;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const gradeOf = (s: number) =>
  s >= 90 ? "Exceptional" : s >= 80 ? "Strong" : s >= 70 ? "Solid" : s >= 60 ? "Fair" : "Watch";

function ticketLabel(p: ProjectIntel): string {
  if (!p.budget?.length) return "the ticket";
  return p.budget[0] === p.budget[1] ? `₹${p.budget[0]} Cr+` : `₹${p.budget[0]}–${p.budget[1]} Cr`;
}
function psfLabel(p: ProjectIntel): string | null {
  if (!p.psf) return null;
  return p.psf.low === p.psf.high
    ? `≈${inr(p.psf.avg)}/sq ft`
    : `${inr(p.psf.low)}–${inr(p.psf.high)}/sq ft`;
}

/* the one true line a locked user is allowed to see for a paid topic —
   drawn from the visible pillar summary, never the audit itself */
function pillarTease(p: ProjectIntel, key: string): string {
  const row = pillars(p).find((r) => r.key === key);
  if (!row) return "";
  const band = row.band === "watch" ? "one to watch" : row.band;
  return `${row.label} scored ${row.score.toFixed(1)}/10 (${band}) — ${row.why}`;
}

/* ── the challenge chips that seed a conversation, scoped to THIS project.
   the sharp ones (risk, worth, verdict) are paid → they open the funnel. */
export function openingChips(p: ProjectIntel): string[] {
  return [
    "Is this Truth Score fair?",
    "What's the biggest risk here?",
    `Is ${ticketLabel(p)} worth it?`,
    `How does ${p.name} compare nearby?`,
  ];
}

export function openingLine(p: ProjectIntel, locked: boolean): string {
  return locked
    ? `Ask me anything about ${p.name} — I've read the full file. I'll answer what I can here; the calls that decide the cheque live inside the read.`
    : `Ask me anything about ${p.name} — you've unlocked the full read, so I can go as deep as you like.`;
}

/* ── intent detection ──────────────────────────────────────────── */
type Intent =
  | "verdict" | "risk" | "roi" | "price" | "developer" | "construction" | "legal"
  | "location" | "score" | "compare" | "sunvastu" | "vitals" | "usps" | "method"
  | "greeting" | "unknown";

const has = (q: string, ...w: string[]) => w.some((x) => q.includes(x));

function classify(q: string): Intent {
  const n = q.toLowerCase();
  if (has(n, "hi", "hello", "hey", "thanks", "thank you", "namaste") && n.length < 16) return "greeting";
  if (has(n, "should i buy", "worth buying", "do you recommend", "verdict", "good buy", "go for it", "should i invest", "would you buy")) return "verdict";
  if (has(n, "risk", "red flag", "red-flag", "watch out", "watchout", "concern", "downside", "worst", "catch", "problem", "issue", "what's wrong", "whats wrong")) return "risk";
  // compare wins over incidental location/price words ("compare to nearby",
  // "better value than X") — but NOT over "should I buy A over B" (verdict, above)
  if (has(n, "compare", "vs ", "versus", "better than", "worse than", "alternative", "other project", "other projects", "instead of")) return "compare";
  // Sun/daylight/Vastu/ventilation/facing = the Sun & Vastu 3D tier (via All-Access)
  if (has(n, "sunlight", "daylight", "vastu", "ventilat", "facing", "airflow", "air flow", "natural light", "brightness", "cross vent", "morning sun", "which floor", "east-facing", "north-facing", "west-facing", "south-facing", " sun ", "sun?", "sunny")) return "sunvastu";
  if (has(n, "roi", "return", "appreciat", "cagr", "growth", "profit", "resale", "capital", "rental yield", "yield")) return "roi";
  if (has(n, "worth it", "overpriced", "expensive", "too costly", "value for money", "price fair", "fairly priced", "cheap", "premium")) return "price";
  if (has(n, "developer", "builder", "who is", "who's the", "track record", "delivered", "reputation", "trust the", "on time", "delay")) {
    // "on time / delay" leans construction unless the developer is named
    if (has(n, "developer", "builder", "track record", "reputation", "who")) return "developer";
    return "construction";
  }
  if (has(n, "construction", "progress", "built", "build", "possession", "handover", "ready", "rera date", "when will", "completion")) return "construction";
  if (has(n, "legal", "rera", "litigation", "court", "title", "dispute", "compliance", "approval", "clearance", "encumbrance")) return "legal";
  if (has(n, "location", "connectivity", "metro", "road", "highway", "area", "corridor", "nearby", "distance", "airport", "office", "school")) return "location";
  if (has(n, "price", "psf", "per sq", "rate", "cost", "budget", "how much")) return "price";
  if (has(n, "truth score", "score fair", "why ", "rating", "how did you", "how do you score", "is the score", "inflated")) return "score";
  if (has(n, "unit", "tower", "floor", "size", "sq ft", "sqft", "config", "bhk", "acre", "density", "launch", "how many")) return "vitals";
  if (has(n, "usp", "amenit", "feature", "special", "spec", "clubhouse", "facilit")) return "usps";
  if (has(n, "how do you work", "independent", "commission", "biased", "bias", "who are you", "trust you", "how are you", "methodology", "who pays")) return "method";
  return "unknown";
}

/* ── the answer builder. `locked` gates the paid topics. ─────────── */
export function answerChallenge(
  p: ProjectIntel,
  question: string,
  locked: boolean,
  peers: Peer[] = [],
  access: ChatAccess = { has3DModel: false, has3DAccess: false },
  units: UnitIntel[] = [],
): ChallengeAnswer {
  const intent = classify(question);
  const dev = developerOf(p);
  const market = marketOf(p);
  const roi = roiModel(p);
  const ctx = rankContext(p);
  const grade = gradeOf(p.truthScore);
  const ticket = ticketLabel(p);
  const psf = psfLabel(p);

  const gate = (text: string): ChallengeAnswer => ({ text, gate: "read" }); // ₹1,100 read wall
  const gate3D = (text: string): ChallengeAnswer => ({ text, gate: "3d" }); // Sun & Vastu 3D wall (via All-Access)
  const open = (text: string): ChallengeAnswer => ({ text, gate: null });

  switch (intent) {
    case "sunvastu": {
      // Sun / daylight / Vastu / ventilation = the Sun & Vastu 3D tier (via
      // All-Access), a SEPARATE gate from the ₹1,100 read. Even a read-only buyer hits it.
      if (!access.has3DModel)
        return open(`${p.name}'s Sun & Vastu 3D model isn't live yet — it's in production, so I can't grade daylight or Vastu per unit for it right now. Everything else about the project I can answer.`);
      if (!access.has3DAccess)
        return gate3D(`Great question — and it's exactly what the Sun & Vastu 3D model answers: every unit's daylight hours (summer→winter), a Vastu score with room-by-room reasoning, and cross-ventilation. It's a separate layer from the read${access.has3DModel ? " and it's built for this project" : ""}.`);
      // 3D-unlocked → answer from the per-unit intelligence
      if (units.length) {
        const top = [...units].sort((a, b) => (b.sunWinterH ?? 0) - (a.sunWinterH ?? 0)).slice(0, 3);
        const lines = top.map((u) => `${u.tower}-${u.unit} (${u.config}, ${u.facing}): ~${u.sunWinterH ?? "?"}h winter sun, Vastu ${u.vastu ?? "?"}/10`).join("; ");
        return open(`From the 3D model, the best-lit units here: ${lines}. Ask me about a specific tower, floor or facing and I'll pull its sun and Vastu read.`);
      }
      return open(`You're in — the Sun & Vastu 3D model grades every unit's daylight, Vastu and ventilation. Tell me the tower and unit (or facing) you're weighing and I'll pull its read.`);
    }

    case "greeting":
      return open(`Hi — I'm TruthGuide, the independent read on ${p.name}. Push me on anything: the score, the risks, the price, the builder, whether it's worth ${ticket}. What's on your mind?`);

    case "method":
      return open(
        `Fair challenge. We're buyer-side only — we take no inventory and no developer commission, so nothing here is paid placement. ${p.name}'s Truth Score (${p.truthScore}/100) is built from five weighted pillars — developer, construction, location, legal and USPs — re-scored quarterly. No builder can pay to move it. Ask me about any pillar.`,
      );

    case "vitals": {
      const o = p.ops;
      const bits: string[] = [];
      if (o?.units) bits.push(`${o.units.toLocaleString("en-IN")} units`);
      if (o?.towers) bits.push(`${o.towers} towers`);
      if (o?.floors) bits.push(`${o.floors} floors`);
      if (o?.landAcres) bits.push(`${o.landAcres} acres`);
      if (o?.density) bits.push(`${o.density}/acre density`);
      if (p.sizeBand) bits.push(`homes ${p.sizeBand}`);
      if (o?.launch) bits.push(`launched ${o.launch}`);
      const line = bits.length ? bits.join(" · ") : "the core vitals are on the report above";
      return open(`${p.name} at a glance: ${line}. Ticket runs ${ticket}${psf ? `, and the ${p.marketShort} corridor trades at ${psf}` : ""}. Anything specific — floor plans, config mix, possession?`);
    }

    case "score": {
      const rankLine = ctx.topPct <= 25 ? ` That puts it in the top ${ctx.topPct}% of the projects we track.` : "";
      const head = `${p.name} scores ${p.truthScore}/100 — "${grade}".${rankLine} It's a weighted composite: location ${pct(0.26)}, developer ${pct(0.25)}, construction ${pct(0.22)}, legal ${pct(0.15)}, USPs ${pct(0.12)}.`;
      if (locked) {
        return gate(`${head} What the number *doesn't* show you here is exactly what cost it the other ${Math.max(0, 100 - Math.round(p.truthScore))} points — the pillar-by-pillar audit behind each grade. That's the part that decides whether "${grade}" is good enough for your money.`);
      }
      const weak = pillars(p).reduce((a, b) => (b.score < a.score ? b : a), pillars(p)[0]);
      return open(`${head} The pillar we'd read hardest before signing is ${weak.label} (${weak.score.toFixed(1)}/10) — ${weak.why} Want the full audit on any pillar?`);
    }

    case "developer":
      if (locked) return gate(`Here's what I can show: ${pillarTease(p, "developer")} The full developer file — ${p.developer}'s delivery record, the financial-strength read and whether their balance sheet can finish this on time — is inside the read.`);
      return open(
        dev
          ? `${p.developer}: ${dev.performance.delivered} of ${dev.performance.launched} launched projects delivered, ${dev.performance.onTimePct}% on-time, ~${dev.performance.avgDelayMonths} months' average slippage. ${dev.finNote} ${dev.verdict}`
          : `${p.developer} is a regional developer with a limited public track record, so we lean on project-level construction tracking rather than a long delivery history. Ask me about the build progress.`,
      );

    case "construction": {
      const con = p.ops?.construction;
      const possession = p.ops?.possession ? `RERA-committed possession is ${p.ops.possession}. ` : "";
      if (locked) return gate(`${possession}${pillarTease(p, "construction")} The build-vs-promise detail — % complete against schedule, absorption, and our execution-adjusted handover estimate vs the RERA date — is in the read.`);
      return open(
        con
          ? `${possession}Construction is at ${con.actualPct}% against an expected ${con.expectedPct}%, and ${con.absorptionPct}% is sold. Our execution-adjusted estimate is ${con.predictedDate} vs the RERA-committed ${con.reraDate}.`
          : `${possession}We don't yet publish a quarterly build-tracking read for ${p.name}, so we grade this conservatively. Want the developer's on-time record instead?`,
      );
    }

    case "legal":
      if (locked) return gate(`${p.ops?.reraId ? `It's RERA-registered (${p.ops.reraId}). ` : ""}${pillarTease(p, "legal")} The title, RERA and litigation signals we'd want cleared before you sign are in the read.`);
      return open(
        p.liveLegal?.headline
          ? `${p.liveLegal.headline} ${p.liveLegal.keyFlags?.length ? `Key flags: ${p.liveLegal.keyFlags.slice(0, 3).join("; ")}.` : ""}${p.liveLegal.lastUpdated ? ` (as of ${p.liveLegal.lastUpdated})` : ""}`
          : `${p.ops?.reraId ? `${p.name} is RERA-registered (${p.ops.reraId}) and our developer-level legal signal is ${p.anatomy.legal}. ` : `Our legal signal for ${p.developer} is ${p.anatomy.legal}. `}We flag title, RERA and litigation issues in the Legal & Compliance section — nothing critical is outstanding on our current read.`,
      );

    case "location":
      if (locked) return gate(`${pillarTease(p, "location")} The full location intelligence — the metro, road and catalyst map that will actually move this price, and the last-mile realities — is in the read.`);
      return open(
        market
          ? `${p.marketShort} corridor: ${market.verdict} Tracked 3-year appreciation is ${market.appreciation3Y}${psf ? `, and it trades at ${psf}` : ""}. ${market.futureTrend}`
          : `${p.name} sits in the ${p.marketShort} corridor${psf ? `, trading at ${psf}` : ""}. The detailed connectivity and catalyst read is in the Location section.`,
      );

    case "price": {
      if (locked) return gate(`The ticket is ${ticket}${psf ? ` and the ${p.marketShort} corridor trades at ${psf}` : ""}. Whether that's *fair* for this address — our pricing & value call, and where it sits vs the corridor benchmark — is in the read. On our read, pricing & value grades ${p.anatomy.pricing}.`);
      const faq = projectFaqs(p).find((f) => /fairly priced/i.test(f.q));
      return open(faq ? faq.a : `${p.reason} We assess ${p.name}'s pricing & value as ${p.anatomy.pricing === "strong" ? "attractive" : "fair"} for the address${psf ? ` against the corridor's ${psf}` : ""}.`);
    }

    case "roi":
      if (locked) return gate(`This is the number most buyers come for. ${market ? `The ${p.marketShort} corridor's tracked 3-year appreciation is ${market.appreciation3Y}. ` : ""}The exact ${roi?.horizonYears ?? 8}-year CAGR we project for ${p.name} — expected, and risk-adjusted for its predicted delay — is inside the read.`);
      return open(
        roi
          ? `Our ${roi.horizonYears}-year model builds from the Gurgaon market rate (India 9% + Gurgaon 0.5%) and ${p.name}'s Truth Score: about ~${roi.benchCagr}% a year if it delivers on our forecast, ~${roi.adjCagr}% once its predicted delay is priced in${roi.adjValueCr != null ? ` — a ${ticket} entry modelling to ~${inr(roi.adjValueCr)} Cr` : ""}. A modelled outcome, not a guarantee.`
          : `We don't have a published ROI model for ${p.name} yet, so I won't invent a number. The corridor read in the Location section is your best guide.`,
      );

    case "risk": {
      const weak = pillars(p).reduce((a, b) => (b.score < a.score ? b : a), pillars(p)[0]);
      if (locked) return gate(`Straight answer: on our read the pillar to watch is ${weak.label} (${weak.score.toFixed(1)}/10) — ${weak.why} The specific red flags we'd want cleared before you sign — and how much they actually matter for ${p.name} — are itemised in the read.`);
      return open(
        p.watchouts?.length
          ? `The honest watch-list for ${p.name}: ${p.watchouts.slice(0, 3).join("; ")}. On our read the pillar to pressure-test is ${weak.label} (${weak.score.toFixed(1)}/10). None are dealbreakers on their own — it's about whether they fit your timeline and risk appetite.`
          : `On our read the pillar to watch is ${weak.label} (${weak.score.toFixed(1)}/10) — ${weak.why} Nothing critical is outstanding, but that's the one we'd read hardest.`,
      );
    }

    case "verdict":
      if (locked) return gate(`The honest answer is the whole point of the read. ${p.name} scores ${p.truthScore}/100 ("${grade}")${ctx.topPct <= 25 ? `, top ${ctx.topPct}% of what we track` : ""} — but "should *you* buy it" depends on your budget, timeline and risk appetite, and our tailored call for exactly that is inside the read (a free advisor call is included).`);
      return open(`On our read ${p.name} is a ${p.truthScore >= 80 ? "strong" : p.truthScore >= 65 ? "qualified" : "cautious"} ${p.truthScore}/100 ("${grade}"). ${p.reason} The one thing we'd pressure-test for your situation: ${p.watchouts?.[0] ?? "your timeline vs the possession date"}. Want to talk it through with an advisor? That call comes with your read.`);

    case "compare": {
      // We DO compare — never wall this off. Name the corridor rivals at the
      // scoreboard level (public), point to the free Compare tool, softly note
      // the read's deeper side-by-side. The pillar-by-pillar "why" + the "which
      // should YOU buy" verdict live behind the read (the verdict intent gates).
      const rankLine = ctx.topPct <= 25 ? `top ${ctx.topPct}% of the projects we track` : `#${ctx.rank} of ${ctx.total} tracked`;
      const corr = market ? `, and ${ctx.corridorRank <= 2 ? "among the strongest" : "mid-pack"} in the ${p.marketShort} corridor` : "";
      const rivals = peers.length ? ` ${peerLine(p, peers)}` : "";
      return open(`Yes — comparing is exactly what we do. ${p.name} ranks ${rankLine}${corr}.${rivals} You can line up any two side by side in our Compare tool, and ${locked ? "the full read carries the pillar-by-pillar split and which is the better buy for your brief" : "I can walk you through how it stacks up"}. Which one do you want it measured against?`);
    }

    case "usps":
      if (locked) return gate(`${pillarTease(p, "usps")} Which claims hold real value and which are just brochure gloss — that read is inside the file.`);
      return open(
        p.ops?.usps?.length
          ? `The USPs that actually move the needle here: ${p.ops.usps.slice(0, 3).map((u) => u.title).join(" · ")}. We grade which of these hold real value vs brochure gloss in the USP section.`
          : `${p.name} sits at standard segment specification on our read — no standout USP that changes the value case. The strengths we do credit: ${p.strengths?.slice(0, 2).join(", ") || "see the report"}.`,
      );

    case "unknown":
    default:
      return open(`I only speak from our own read of ${p.name}, so I won't guess at that one. But push me on what decides the cheque — the Truth Score, the biggest risk, whether ${ticket} is fair, the builder's record, or the 10-year return. Which one?`);
  }
}

const pct = (w: number) => `${Math.round(w * 100)}%`;

/* ── knowledge context for the Gemini router ─────────────────────────
   The wall lives here, not just in the prompt: publicKnowledge is always
   safe to send; paidKnowledge is assembled ONLY when the visitor is
   unlocked (the client already holds this data at that point) and is null
   otherwise, so a locked visitor's paid findings never leave the browser.
   paidTopics are just LABELS — enough for the model to tease + gate without
   any paid content. The Edge Function feeds Gemini exactly what it's given. */
export type ChallengeContext = {
  slug: string;
  name: string;
  publicKnowledge: string;
  paidKnowledge: string | null;
  paidTopics: string[];
};

export const PAID_TOPICS = [
  "The buy / no-buy verdict for the buyer's budget & risk",
  "The 10-year ROI and CAGR projection",
  "The developer's full delivery and financial record",
  "The title / RERA / litigation read",
  "The specific red flags to clear before signing",
  "The deep, pillar-by-pillar audit behind each grade",
];

export function buildChallengeContext(
  p: ProjectIntel,
  locked: boolean,
  peers: Peer[] = [],
  access: ChatAccess = { has3DModel: false, has3DAccess: false },
  units: UnitIntel[] = [],
): ChallengeContext {
  const dev = developerOf(p);
  const market = marketOf(p);
  const roi = roiModel(p);
  const ctx = rankContext(p);
  const o = p.ops;
  const grade = gradeOf(p.truthScore);
  const psf = psfLabel(p);

  const vitals = [
    o?.units && `${o.units.toLocaleString("en-IN")} units`,
    o?.towers && `${o.towers} towers`,
    o?.floors && `${o.floors} floors`,
    o?.landAcres && `${o.landAcres} acres`,
    o?.density && `${o.density}/acre`,
    p.sizeBand && `homes ${p.sizeBand}`,
    o?.launch && `launched ${o.launch}`,
    o?.possession && `RERA possession ${o.possession}`,
    o?.reraId && `RERA ${o.reraId}`,
  ].filter(Boolean).join(" · ");

  /* Per-configuration layout table — super area, carpet area and carpet-
     efficiency. This is PUBLIC (the compare pages show it openly and it is
     not in PAID_TOPICS), and WE DO HAVE IT for every project — so it belongs
     in the context. Without it the model wrongly told buyers we "haven't
     assessed layouts / units" when asked about sizes or efficiency. */
  const layouts = (o?.homes ?? [])
    .map((h) => {
      const carpet = h.carpetSqft != null ? `${h.carpetSqft.toLocaleString("en-IN")} sq ft carpet` : "carpet NA";
      const eff = h.carpetSqft != null && h.superSqft > 0 ? ` · ${Math.round((h.carpetSqft / h.superSqft) * 100)}% carpet-efficient` : "";
      return `- ${h.config}${h.variant ? ` (${h.variant})` : ""}: ${h.superSqft.toLocaleString("en-IN")} sq ft super, ${carpet}${eff}`;
    })
    .join("\n");

  /* The score and the band are the public scoreboard; the FINDING behind
     them is not. `why` carries the audit line — "2 RERA projects, 0
     delivered, 50% on-time" — and putting it in publicKnowledge meant an
     unpaid visitor only had to ask the chat politely to be told what the
     paywall was holding back. PAID_TOPICS in this same file already lists
     "the deep, pillar-by-pillar audit behind each grade" as paid, so this
     was the wall disagreeing with itself. */
  const pubPillars = pillars(p)
    .map((r) => `- ${r.label}: ${r.score.toFixed(1)}/10 (${r.band}) — ${locked ? r.about : r.why}`)
    .join("\n");

  const publicKnowledge = [
    `PROJECT: ${p.name} by ${p.developer}, ${p.marketShort} corridor.`,
    `TRUTH SCORE: ${p.truthScore}/100 ("${grade}")${ctx.topPct <= 25 ? `, top ${ctx.topPct}% of tracked projects` : `, ranks ${ctx.rank} of ${ctx.total} tracked`}.`,
    `TICKET: ${ticketLabel(p)}${psf ? ` · corridor ${psf}` : ""}.`,
    vitals && `VITALS: ${vitals}.`,
    layouts && `LAYOUTS / FLOOR PLANS (per configuration — super area, carpet area and carpet-efficiency; these ARE assessed and PUBLIC. Answer any layout / size / carpet / efficiency question directly from these; you may say which configuration is the most carpet-efficient here. For "better layouts than another project", give this project's layout facts, then point to the Compare tool or offer a call — do NOT claim we haven't assessed layouts):\n${layouts}`,
    `PILLAR SUMMARY (weights: location 26%, developer 25%, construction 22%, legal 15%, USPs 12%):\n${pubPillars}`,
    `COMPARISON: Truth Estate DOES compare projects — buyers can line up any two side-by-side in the Compare tool, and the full read carries a ranked side-by-side vs the closest alternatives. This project ranks ${ctx.topPct <= 25 ? `in the top ${ctx.topPct}%` : `#${ctx.rank} of ${ctx.total}`} of all tracked projects${market ? ` and #${ctx.corridorRank} in the ${p.marketShort} corridor` : ""}.${peers.length ? ` ${peerLine(p, peers)} (These peer names + Truth Scores are the PUBLIC scoreboard — use them for a head-to-head. You may say how ${p.name} ranks vs them by score.)` : ""} You hold only the SCORE-level scoreboard for other projects (name + Truth Score), NOT their deep audit/verdict/ROI — for those, point the buyer to that project's own read or the Compare tool. NEVER say Truth Estate doesn't compare.`,
    `SUN & VASTU: Per-unit sunlight/daylight hours, Vastu scores with room-by-room reasoning, and cross-ventilation are the "Sun & Vastu 3D" model — included with All-Access, NOT part of the ${inr(READ_FROM_INR)} read. ${access.has3DModel ? `It is available for ${p.name}.` : `Its 3D model is still in production for ${p.name}.`}${!access.has3DAccess ? ` This visitor has NOT unlocked it — if they ask about sun/daylight/Vastu/ventilation/facing, describe what the 3D model covers and point them to it; do NOT give per-unit specifics.` : ""}`,
    `METHODOLOGY: Truth Estate is buyer-side only — no inventory, no developer commission, no paid placement. The score is a weighted composite of five pillars, re-scored quarterly; no builder can pay to move it.`,
  ].filter(Boolean).join("\n");

  if (locked) return { slug: p.slug, name: p.name, publicKnowledge, paidKnowledge: null, paidTopics: PAID_TOPICS };

  const paid: string[] = [];
  if (dev) paid.push(`DEVELOPER RECORD: ${p.developer} — ${dev.performance.delivered} of ${dev.performance.launched} launched projects delivered, ${dev.performance.onTimePct}% on-time, ~${dev.performance.avgDelayMonths} months' average slippage. ${dev.finNote} ${dev.verdict}`);
  if (o?.construction) { const c = o.construction; paid.push(`CONSTRUCTION: ${c.actualPct}% built vs ${c.expectedPct}% expected, ${c.absorptionPct}% sold. Execution-adjusted handover ${c.predictedDate} vs RERA ${c.reraDate}.`); }
  if (market) paid.push(`LOCATION/MARKET: ${market.verdict} Tracked 3-yr appreciation ${market.appreciation3Y}. ${market.futureTrend}`);
  paid.push(`LEGAL: ${p.liveLegal?.headline ? `${p.liveLegal.headline}${p.liveLegal.keyFlags?.length ? ` Key flags: ${p.liveLegal.keyFlags.slice(0, 3).join("; ")}.` : ""}` : `Developer legal signal: ${p.anatomy.legal}${o?.reraId ? `; project RERA-registered (${o.reraId})` : ""}. Nothing critical outstanding on our current read.`}`);
  if (roi) paid.push(`ROI MODEL (${roi.horizonYears}-yr, anchored to our predicted delivery date): Gurgaon market rate + Truth Score → ~${roi.benchCagr}% CAGR if it delivers on forecast, ~${roi.adjCagr}% risk-adjusted once the predicted delay is priced in${roi.adjValueCr != null ? `; ${ticketLabel(p)} entry models to ~₹${roi.adjValueCr} Cr` : ""}. Modelled, not guaranteed.`);
  paid.push(`PRICING VERDICT: ${p.reason} Pricing & value graded ${p.anatomy.pricing}.`);
  if (p.watchouts?.length) paid.push(`RED FLAGS / WATCHOUTS: ${p.watchouts.join("; ")}.`);
  if (p.ops?.usps?.length) paid.push(`USPs: ${p.ops.usps.map((u) => u.title).join("; ")}.`);
  if (p.strengths?.length) paid.push(`STRENGTHS: ${p.strengths.join("; ")}.`);
  const faqs = projectFaqs(p, locked).map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n");
  if (faqs) paid.push(`FAQs:\n${faqs}`);

  // Per-unit Sun/Vastu is the Sun & Vastu 3D tier (via All-Access) — include it ONLY for a
  // 3D-access visitor (a ₹1,100 read-only buyer is NOT unlocked here, so it never leaks).
  if (access.has3DAccess && units.length) {
    const top = [...units].sort((a, b) => (b.sunWinterH ?? 0) - (a.sunWinterH ?? 0)).slice(0, 8);
    const lines = top.map((u) => `${u.tower}-${u.unit} (${u.config}, ${u.facing}): ~${u.sunWinterH ?? "?"}h winter sun, Vastu ${u.vastu ?? "?"}/10, view ${u.view ?? "?"}/10, overall ${u.grade}`).join("\n");
    paid.push(`SUN & VASTU 3D (visitor HAS unlocked this — answer per-unit fully):\n${lines}`);
  }

  return { slug: p.slug, name: p.name, publicKnowledge, paidKnowledge: paid.join("\n"), paidTopics: PAID_TOPICS };
}

/* stable id for a message */
let n = 0;
export const msgId = () => `m${Date.now().toString(36)}${(n++).toString(36)}`;

/* the gate CTA copy, shared with the UI — one per gate kind */
export const GATE_CTA = `Unlock the full read — ${inr(READ_FROM_INR)}`;
/* The 3D rides on All-Access now; naming the retired standalone 3D price
   here would promise a price the checkout no longer offers. */
export const GATE_CTA_3D = `Unlock Sun & Vastu 3D — with All-Access`;
