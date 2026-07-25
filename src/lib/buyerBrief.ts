/* ════════════════════════════════════════════════════════════════
   BUYER BRIEF — what we think this visitor is looking for.

   Two sources, in priority order:

     1. What they TOLD us — the brief captured in the journey
        (BuyData: purchaseType, budgetCr, configs, locations).
     2. What they SHOWED us — the reports they opened, returned to and
        paid for, inferred server-side from the event trail.

   Stated beats inferred, always. A guess exists to spare someone a form,
   never to overrule them.

   An adapter in the sense AGENTS.md means: it shapes DATA to fit the
   existing components, and returns "NA" rather than asking any component
   to change. Nothing here renders anything.
   ════════════════════════════════════════════════════════════════ */
import { getAnonId } from "@/lib/truthGuideChat";
import { loadBuyData, hasPreferences, type BuyData } from "@/lib/journey";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

export type Confidence = "strong" | "weak" | "none";

/* `source` is the whole point of this shape. The dashboard has to say
   "you told us" or "we'd guess, because…" — and it cannot do that from a
   value alone. A field that loses its provenance becomes a claim we
   cannot stand behind. */
export type Field<T> = {
  value: T | null;
  display: string;      // ready to render; "NA" when there is nothing
  evidence: string;     // the checkable reason, empty when stated
  source: "stated" | "inferred" | "unknown";
  confidence: Confidence;
};

export type BriefProject = {
  slug: string;
  name: string;
  microMarket: string | null;
  minPriceCr: number | null;
  bhk: number | null;
  truthScore: number | null;
  views: number;
  paid: boolean;
  enquired: boolean;
  lastAt: string;
};

export type BuyerBrief = {
  /* True when the visitor has stated a brief OR the trail is rich enough
     to infer one. False is the dashboard's State A: ask, don't guess. */
  known: boolean;
  /* We could not reach the trail — NOT the same as "there is nothing to
     find". Without this the dashboard tells someone who has read nine
     reports that they have not read enough, which is a false statement
     about them, made confidently, at the exact moment we know least. */
  unavailable: boolean;
  reportsRead: number;
  projects: BriefProject[];
  corridor: Field<string[]>;
  budgetCr: Field<{ min: number; max: number }>;
  config: Field<string>;
  purchaseType: Field<string>;
  timeline: Field<null>;
};

const NA = <T,>(evidence = ""): Field<T> => ({
  value: null, display: "NA", evidence, source: "unknown", confidence: "none",
});

const crBand = (b: { min: number; max: number }) =>
  b.min === b.max ? `₹${b.min} Cr` : `₹${b.min}–${b.max} Cr`;

/* ── What they told us ────────────────────────────────────────────── */
/* Read defensively: BuyData is written by several journey steps and a
   half-finished brief is the normal case, not an edge one. */
function fromStated(buy: BuyData | null): Partial<BuyerBrief> {
  if (!buy) return {};
  const out: Partial<BuyerBrief> = {};

  const locs = Array.isArray(buy.locations) ? buy.locations.filter(Boolean) : [];
  if (locs.length) {
    out.corridor = { value: locs, display: locs.join(" · "), evidence: "", source: "stated", confidence: "strong" };
  }
  /* budgetCr is NOT optional and defaults to 6 (emptyBuyData), so its
     presence proves nothing — reading it naively would report a stated
     budget of "₹5–7 Cr" for someone who has never answered a question.
     hasPreferences is the existing test for "this brief was actually
     touched"; only then is the number the visitor's rather than ours. */
  if (hasPreferences(buy) && typeof buy.budgetCr === "number" && buy.budgetCr > 0) {
    /* The journey captures a single number; the dashboard shows a band.
       ±15% is the width people actually mean by "around 7 crore". */
    const b = { min: Math.round(buy.budgetCr * 0.85 * 4) / 4, max: Math.round(buy.budgetCr * 1.15 * 4) / 4 };
    out.budgetCr = { value: b, display: crBand(b), evidence: "", source: "stated", confidence: "strong" };
  }
  const cfgs = Array.isArray(buy.configs) ? buy.configs.filter(Boolean) : [];
  if (cfgs.length) {
    out.config = { value: cfgs[0], display: cfgs.join(" · "), evidence: "", source: "stated", confidence: "strong" };
  }
  if (buy.purchaseType) {
    out.purchaseType = {
      value: buy.purchaseType, display: buy.purchaseType, evidence: "", source: "stated", confidence: "strong",
    };
  }
  /* Possession and timeline are two separate answers to the same
     question — "when do you need it" — captured at different points in
     the journey. Either one counts; the journey step is the only place
     this is ever known, since nothing anyone browses reveals it. */
  const when = buy.timeline ?? buy.possession;
  if (when) {
    out.timeline = { value: null, display: String(when), evidence: "", source: "stated", confidence: "strong" };
  }
  return out;
}

/* ── What they showed us ──────────────────────────────────────────── */
type RemoteGuess<T> = { value: T | null; evidence: string; confidence: Confidence };
type RemoteBrief = {
  enough: boolean;
  reportsRead: number;
  projects: BriefProject[];
  corridor: RemoteGuess<string[]>;
  budgetCr: RemoteGuess<{ min: number; max: number }>;
  config: RemoteGuess<string>;
  timeline: RemoteGuess<null>;
};

/* null means "ask failed", a RemoteBrief means "asked and answered".
   The caller must be able to tell those apart. */
async function fetchInferred(): Promise<RemoteBrief | null> {
  const anonId = getAnonId();
  if (!anonId) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/brief`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ anonId }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => null) as { ok?: boolean; brief?: RemoteBrief } | null;
    return data?.ok && data.brief ? data.brief : null;
  } catch {
    /* A dashboard that fails to load because the guess timed out is worse
       than one that quietly shows what the visitor already told us. */
    return null;
  }
}

function asField<T>(g: RemoteGuess<T> | undefined, display: (v: T) => string): Field<T> {
  if (!g || g.value == null) return NA<T>(g?.evidence ?? "");
  return { value: g.value, display: display(g.value), evidence: g.evidence, source: "inferred", confidence: g.confidence };
}

/* ── The brief ────────────────────────────────────────────────────── */
export async function loadBuyerBrief(): Promise<BuyerBrief> {
  const stated = fromStated(loadBuyData());
  const remote = await fetchInferred();

  const inferred: Partial<BuyerBrief> = remote
    ? {
        corridor: asField(remote.corridor, (v) => v.join(" · ")),
        budgetCr: asField(remote.budgetCr, crBand),
        config: asField(remote.config, (v) => v),
      }
    : {};

  const corridor = stated.corridor ?? inferred.corridor ?? NA<string[]>();
  const budgetCr = stated.budgetCr ?? inferred.budgetCr ?? NA<{ min: number; max: number }>();
  const config = stated.config ?? inferred.config ?? NA<string>();
  /* Neither browsing nor the reports reveal buy-to-live vs invest, or
     when possession is needed. They stay unknown until asked, which is
     exactly why the dashboard asks only these two outright. */
  const purchaseType = stated.purchaseType ?? NA<string>("we've not asked yet");
  const timeline = stated.timeline ?? NA<null>("we've no signal on this");

  return {
    known: [corridor, budgetCr, config].some((f) => f.value != null),
    /* Stated-only briefs are complete without the server, so an outage is
       only worth admitting when we actually needed it. */
    unavailable: remote === null && !Object.keys(stated).length,
    reportsRead: remote?.reportsRead ?? 0,
    projects: remote?.projects ?? [],
    corridor, budgetCr, config, purchaseType, timeline,
  };
}

/* The line the dashboard leads with. Deliberately here rather than in a
   component: it is a statement of what we believe about someone, and it
   should be reviewable in one place next to the evidence that produced
   it. Returns null when we know too little to say anything — the caller
   shows the capture flow instead. */
export function briefSentence(b: BuyerBrief): string | null {
  const bits: string[] = [];
  if (b.config.value) bits.push(b.config.display);
  if (b.corridor.value) bits.push(`on ${b.corridor.display}`);
  if (b.budgetCr.value) bits.push(`around ${b.budgetCr.display}`);
  if (!bits.length) return null;
  const lead = b.corridor.source === "stated" ? "You told us you're looking at" : "You're looking at";
  return `${lead} ${bits.join(" ")}.`;
}
