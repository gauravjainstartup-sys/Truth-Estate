/* ════════════════════════════════════════════════════════════════
   SHORTLIST-RERANK CORE — pure logic, no Deno globals.

   Path 2 of the recommendation engine (docs/shortlist-ai-rerank-spec.md):
   the deterministic rankCore proposes (affordability gate + weighted score →
   top ~10 candidates), Gemini disposes — a reasoned top-3 re-rank grounded
   ONLY in the fields the client sends, finally consuming the free-text
   "in your own words" notes the formula cannot read.

   The contract is strict and the client is the guardrail: every returned
   slug MUST be one of the supplied candidates; anything else — extra slugs,
   malformed JSON, missing key, model error — resolves to { ok:false } and
   the deterministic order stands. The model can re-order and explain; it
   can never introduce a project, change a price, or bypass the gate.

   Kept free of Deno.* so it runs under Node's TS type-stripping for the
   offline harness (test-offline.mjs). index.ts wires Deno.serve / env /
   CORS around rerankShortlist().
   ════════════════════════════════════════════════════════════════ */

export type Brief = {
  budgetCr?: number;
  locations?: string[];
  configs?: string[];
  priorities?: string[];
  purchaseType?: string | null;
  timeline?: string | null;
  possession?: string | null;
  notes?: string;
};

export type Candidate = {
  slug: string;
  name: string;
  market: string;
  entryCr: number;
  configs: string[];
  tags: string[];
  truthScore: number;
  matchPct: number;
  strengths?: string[];
  watchouts?: string[];
};

export type Body = { brief?: Brief; candidates?: Candidate[] };

export type RankedPick = { slug: string; why: string; confidence: string };
export type RerankAnswer = { ok: true; ranked: RankedPick[] } | { ok: false };

export type FetchLike = (url: string, init: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

const MAX_CANDIDATES = 12;
const MAX_PICKS = 3;

export function systemPrompt(): string {
  return [
    `You are the shortlist engine for Truth Estate, an independent BUYER-SIDE real-estate advisory. No inventory, no developer commission — you answer only to the buyer.`,
    ``,
    `TASK: from the CANDIDATES the buyer's deterministic screen already approved (all are affordable and pre-scored), pick and order the ${MAX_PICKS} best matches for THIS buyer's BRIEF.`,
    ``,
    `RULES:`,
    `1. Use ONLY the fields supplied. Never invent amenities, prices, availability, or facts. Every "why" must be traceable to a supplied field.`,
    `2. The buyer's free-text notes are the most specific signal — where notes and the structured chips conflict, the notes win.`,
    `3. Weigh real trade-offs: corridor fit, budget headroom (entryCr vs budgetCr), configuration, the priorities each project's tags genuinely serve, truthScore, strengths vs watchouts.`,
    `4. Be honest — a watchout that matters to this buyer should cost a project its rank.`,
    `5. "why": at most 2 short sentences, buyer-facing, grounded, no hype.`,
    `6. "confidence": one of "High", "Medium", "Low".`,
    ``,
    `OUTPUT: strict JSON only, no prose, no markdown fences, exactly this shape:`,
    `{"ranked":[{"slug":"…","why":"…","confidence":"High"}]}`,
    `"ranked" MUST contain 1 to ${MAX_PICKS} entries, each slug copied EXACTLY from a candidate. Never output a slug that is not in CANDIDATES.`,
  ].join("\n");
}

export function userPrompt(brief: Brief, candidates: Candidate[]): string {
  return [
    `BRIEF:`,
    JSON.stringify(brief),
    ``,
    `CANDIDATES (pre-screened, all affordable):`,
    JSON.stringify(candidates),
  ].join("\n");
}

export async function callGemini(
  apiKey: string,
  system: string,
  user: string,
  opts: { model: string; fetchImpl: FetchLike },
): Promise<string | null> {
  const res = await opts.fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) {
    console.error(`[shortlist-rerank] gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p.text ?? "").join("").trim() : "";
  return text || null;
}

/* Tolerant JSON extraction — models occasionally fence or preface despite
   responseMimeType; anything that still doesn't parse is a hard fail. */
function parseModelJson(text: string): unknown {
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const m = stripped.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

/* The validation wall: the model's output is only accepted when every pick is
   a real, distinct candidate slug with usable copy. Anything else → ok:false. */
export function validateRanked(raw: unknown, candidates: Candidate[]): RankedPick[] | null {
  const allowed = new Set(candidates.map((c) => c.slug));
  const obj = raw as { ranked?: unknown } | null;
  if (!obj || !Array.isArray(obj.ranked) || obj.ranked.length < 1) return null;
  const seen = new Set<string>();
  const out: RankedPick[] = [];
  for (const e of obj.ranked.slice(0, MAX_PICKS)) {
    const p = e as { slug?: unknown; why?: unknown; confidence?: unknown };
    if (typeof p?.slug !== "string" || !allowed.has(p.slug) || seen.has(p.slug)) return null;
    seen.add(p.slug);
    out.push({
      slug: p.slug,
      why: typeof p.why === "string" ? p.why.trim().slice(0, 320) : "",
      confidence: p.confidence === "High" || p.confidence === "Medium" || p.confidence === "Low" ? p.confidence : "Medium",
    });
  }
  return out.length ? out : null;
}

export async function rerankShortlist(
  body: Body,
  opts: { apiKey: string | undefined; model: string; fetchImpl: FetchLike },
): Promise<RerankAnswer> {
  const brief = body.brief;
  const candidates = (body.candidates ?? []).slice(0, MAX_CANDIDATES);
  if (!brief || candidates.length < 2) return { ok: false }; // nothing to re-rank
  if (!opts.apiKey) {
    console.error("[shortlist-rerank] GEMINI_API_KEY not set");
    return { ok: false };
  }
  const text = await callGemini(opts.apiKey, systemPrompt(), userPrompt(brief, candidates), {
    model: opts.model,
    fetchImpl: opts.fetchImpl,
  });
  if (!text) return { ok: false };
  const ranked = validateRanked(parseModelJson(text), candidates);
  return ranked ? { ok: true, ranked } : { ok: false };
}
