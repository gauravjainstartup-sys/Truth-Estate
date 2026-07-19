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
};
export type Msg = { role: "user" | "bot"; text: string };
export type Body = { question?: string; locked?: boolean; history?: Msg[]; context?: Ctx };
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
  opts: { model: string; fetchImpl: FetchLike },
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
        generationConfig: { temperature: 0.4, maxOutputTokens: 600, topP: 0.9 },
      }),
    },
  );
  if (!res.ok) {
    console.error(`[challenge-router] gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p.text ?? "").join("").trim() : "";
  return text || null;
}

export async function routeChallenge(
  body: Body,
  opts: { apiKey: string | undefined; model: string; fetchImpl: FetchLike },
): Promise<RouterAnswer> {
  const question = (body.question ?? "").trim();
  const ctx = body.context ?? {};
  const locked = Boolean(body.locked);
  if (!question || !ctx.publicKnowledge) return { ok: false };
  if (!opts.apiKey) {
    console.error("[challenge-router] GEMINI_API_KEY not set");
    return { ok: false };
  }
  const text = await callGemini(opts.apiKey, systemPrompt(ctx, locked), body.history, question, {
    model: opts.model,
    fetchImpl: opts.fetchImpl,
  });
  if (!text) return { ok: false };
  return { ok: true, text, gate: locked }; // client is authoritative on the gate
}
