/* ════════════════════════════════════════════════════════════════
   CHALLENGE-ROUTER CORE — pure logic, no Deno globals.

   Kept free of Deno.* so it runs under Node's TS type-stripping for the
   offline harness (test-offline.mjs). index.ts wires Deno.serve / env /
   CORS around routeChallenge().
   ════════════════════════════════════════════════════════════════ */

export type Ctx = {
  slug?: string;
  name?: string;
  publicKnowledge?: string;
  paidKnowledge?: string | null;
  paidTopics?: string[];
  tier?: "anonymous" | "registered" | "paid";
};
export type Msg = { role: "user" | "bot"; text: string };
export type Body = { mode?: "project" | "general"; question?: string; locked?: boolean; tier?: string; history?: Msg[]; context?: Ctx };
export type RouterAnswer = { ok: true; text: string; gate: boolean } | { ok: false };

export type FetchLike = (url: string, init: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export function systemPrompt(ctx: Ctx, locked: boolean): string {
  const paid = !locked && ctx.paidKnowledge
    ? `\n\nPAID READ (the visitor has UNLOCKED this — use it fully):\n${ctx.paidKnowledge}`
    : "";
  const topics = (ctx.paidTopics ?? []).map((t) => `- ${t}`).join("\n");
  return [
    `You are TruthGuide, the independent, buyer-side advisor for the real-estate project "${ctx.name}". Truth Estate represents only the buyer — no inventory, no developer commission, no paid placement.`,
    ``,
    `RULES:`,
    `1. Answer ONLY from the context below. Never invent facts, numbers or findings. If something isn't in the context, say we haven't assessed it — do not guess.`,
    `2. Be concise and conversational — 2-4 sentences, like a sharp WhatsApp reply. No headings.`,
    `3. Be honest, even about weaknesses — conceding a weak pillar builds trust. You are not a salesperson.`,
    `4. Stay on this project and real-estate buying; politely decline anything else.`,
    locked
      ? `5. This visitor has NOT unlocked the paid read. For any question needing a PAID TOPIC, do NOT answer it — give a short honest teaser from the PUBLIC facts only, then say the full answer is inside the read. Never fabricate the paid answer.`
      : `5. This visitor HAS unlocked the full read — answer fully from the PAID READ section.`,
    ``,
    `PUBLIC FACTS (always usable):`,
    ctx.publicKnowledge ?? "(none provided)",
    paid,
    ``,
    `PAID TOPICS (these live inside the paid read):`,
    topics || "(none)",
  ].join("\n");
}

export async function callGemini(
  apiKey: string,
  system: string,
  history: Msg[] | undefined,
  question: string,
  opts: { model: string; fetchImpl: FetchLike; maxTokens?: number },
): Promise<string | null> {
  const contents = [
    ...(history ?? []).slice(-8).map((m) => ({ role: m.role === "bot" ? "model" : "user", parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: question }] },
  ];
  const res = await opts.fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: opts.maxTokens ?? 600, topP: 0.9 },
      }),
    },
  );
  if (!res.ok) {
    console.error(`[challenge-router] gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: unknown;
  };
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p.text ?? "").join("").trim() : "";
  if (!text) {
    console.error(
      `[challenge-router] gemini empty text. candidates=${data?.candidates?.length ?? 0}` +
      ` finish=${data?.candidates?.[0]?.finishReason ?? "?"} feedback=${JSON.stringify(data?.promptFeedback ?? null)}`,
    );
  }
  return text || null;
}

/* Output budget by tier — a shallow answer that gets truncated reads as
   evasive, which is exactly the failure we are fixing. */
export function generalTokenBudget(tier: string | undefined): number {
  return tier === "paid" ? 900 : tier === "registered" ? 700 : 400;
}

function generalSystemPrompt(ctx: Ctx): string {
  const tier = ctx.tier ?? "anonymous";
  const paid = tier === "paid" && ctx.paidKnowledge
    ? `\n\nFORENSIC LAYER (this visitor has PAID — use it fully):\n${ctx.paidKnowledge}`
    : "";

  /* The scoreboard in CONTEXT is public site data. Every tier may name
     projects and quote scores; the tiers differ in how far the ANALYSIS
     goes, and in the nudge that closes the answer. */
  const depthRule =
    tier === "anonymous"
      ? `6. DEPTH — this visitor is ANONYMOUS with a 2-question trial. ANSWER THE QUESTION PROPERLY: name the specific projects, quote their Truth Scores, respect their budget and corridor. Keep it tight (2-3 sentences, up to ~4 named projects). Do NOT walk through the pillar-by-pillar audit or ROI reasoning. Close with one short line that a free account unlocks unlimited questions. NEVER refuse to name projects and never answer with "it depends on your needs" — you have the scoreboard, use it.`
      : tier === "registered"
        ? `6. DEPTH — this visitor has a FREE ACCOUNT. Answer generously: rank and compare projects, quote Truth Scores, weigh corridors, discuss developer reputation and what the score bands mean. 3-5 sentences. The pillar-by-pillar forensic audit, the ROI model and the legal read live inside the ₹999 read — when a question genuinely needs those, give the honest public-level answer first, then mention the read in one clause. Never withhold a fact that is in the scoreboard.`
        : `6. DEPTH — this visitor has PAID. Go all the way: rank, compare, weigh red flags and delay risk, reason about trade-offs and what the pillar scores imply. Be thorough and specific. Never defer them to a purchase they have already made.`;

  return [
    `You are TruthGuide, the independent, buyer-side real estate advisor for Truth Estate. You answer questions about Gurugram residential real estate ONLY.`,
    ``,
    `RULES:`,
    `1. Answer ONLY from the context below. Never invent projects, scores or numbers. If a project isn't in the scoreboard, say we don't track it yet — do not guess.`,
    `2. Be direct and conversational, like a sharp WhatsApp reply from a knowledgeable friend. Plain prose, no headings, no markdown, no bullet characters.`,
    `3. LEAD WITH THE ANSWER. Name names and quote numbers in the first sentence. Never open with a caveat, never say the answer "depends on your needs", and never ask a clarifying question INSTEAD of answering — answer with what you have, then optionally offer to narrow it.`,
    `4. Be honest, including about weaknesses — conceding a weak point builds trust. You are NOT a salesperson, and at most ONE short nudge per answer.`,
    `5. ONLY discuss Gurugram residential real estate. Politely decline anything else (commercial property, other cities, non-real-estate topics) with: "I focus exclusively on Gurugram residential real estate — that's where our independent research runs deepest."`,
    depthRule,
    `7. Never say you are an AI, a language model, or Gemini. You are TruthGuide, the independent advisor.`,
    ``,
    `CONTEXT:`,
    ctx.publicKnowledge ?? "(none provided)",
    paid,
  ].join("\n");
}

export async function routeChallenge(
  body: Body,
  opts: { apiKey: string | undefined; model: string; fetchImpl: FetchLike },
): Promise<RouterAnswer> {
  const question = (body.question ?? "").trim();
  const ctx = body.context ?? {};
  const locked = Boolean(body.locked);
  const mode = body.mode ?? "project";
  const tier = ctx.tier ?? body.tier;
  console.log(
    `[challenge-router] mode=${mode} tier=${tier ?? "-"} ctxChars=${ctx.publicKnowledge?.length ?? 0} q=${question.slice(0, 60)}`,
  );
  if (!question || !ctx.publicKnowledge) {
    console.error(`[challenge-router] early exit: question=${!!question} publicKnowledge=${!!ctx.publicKnowledge}`);
    return { ok: false };
  }
  if (!opts.apiKey) {
    console.error("[challenge-router] GEMINI_API_KEY not set");
    return { ok: false };
  }

  const sys = mode === "general"
    ? generalSystemPrompt(ctx)
    : systemPrompt(ctx, locked);

  const text = await callGemini(opts.apiKey, sys, body.history, question, {
    model: opts.model,
    fetchImpl: opts.fetchImpl,
    ...(mode === "general" ? { maxTokens: generalTokenBudget(tier) } : {}),
  });
  if (!text) {
    console.error(`[challenge-router] no text returned for mode=${mode}`);
    return { ok: false };
  }
  return { ok: true, text, gate: locked };
}
