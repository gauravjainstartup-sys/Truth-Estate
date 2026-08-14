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
export type Body = {
  mode?: "project" | "general";
  question?: string;
  locked?: boolean;
  tier?: string;
  history?: Msg[];
  /* Only honoured for mode:"project". General mode builds its own context
     server-side and ignores whatever the client sends. */
  context?: Ctx;
  /* Project names the visitor has purchased the read on. Per-project, not
     per-account — depth is bought one report at a time. */
  unlockedProjects?: string[];
  sessionId?: string;
  /* Stable per browser across "start fresh" — links a device's separate
     conversations so they can be claimed together on verification. */
  anonId?: string;
  /* mode:"project" only — which project the "Challenge our read" chat is
     scoped to, so the logged turn records what it was about. */
  projectSlug?: string;
  projectName?: string;
};
export type RouterAnswer =
  | { ok: true; text: string; gate: boolean; followups?: string[] }
  | { ok: false };

/* ── Follow-up chips ────────────────────────────────────────────
   The model appends a trailer line rather than returning JSON. Structured
   output would mean an invalid parse costs the whole answer; here a
   malformed or missing trailer costs only the chips, and the answer is
   returned untouched. Worth the trade for a decorative feature. */
const FOLLOWUP_TAG = "\nFOLLOW-UPS:";

export function splitFollowups(raw: string): { text: string; followups: string[] } {
  const at = raw.lastIndexOf(FOLLOWUP_TAG);
  if (at === -1) return { text: raw.trim(), followups: [] };
  const text = raw.slice(0, at).trim();
  const followups = raw
    .slice(at + FOLLOWUP_TAG.length)
    .split("|")
    .map((s) => s.trim().replace(/^[-•*\d.\s]+/, ""))
    .filter((s) => s.length > 3 && s.length <= 60)
    .slice(0, 3);
  /* If the trailer ate the whole reply, the model misformatted — keep the
     original text and drop the chips rather than showing an empty bubble. */
  if (!text) return { text: raw.trim(), followups: [] };
  return { text, followups };
}

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
    `2. Be concise and conversational — 2-4 sentences for a simple question, like a sharp WhatsApp reply. For a comparison or a "final verdict", open with the recommendation, then give 3-5 short reasons (a few sentences, or one short line each). No headings, no markdown.`,
    `3. Be honest, even about weaknesses — conceding a weak pillar builds trust. You are not a salesperson.`,
    `4. You MAY compare "${ctx.name}" against any project in the TRACKED PROJECTS scoreboard below, using their public facts, when the visitor asks — name the other project and give a clear verdict with reasons. Otherwise stay on ${ctx.name} and real-estate buying; politely decline anything unrelated.`,
    locked
      ? `5. This visitor has NOT unlocked the paid read. For any question needing a PAID TOPIC, do NOT answer it — give a short honest teaser from the PUBLIC facts only, then say the full answer is inside the read. Never fabricate the paid answer.`
      : `5. This visitor HAS unlocked the full read — answer fully from the PAID READ section.`,
    `6. If the visitor asks for the brochure, price list, payment plan, site plan or floor plan and a DOCUMENTS link is provided below, share the DIRECT link. If no such link is in the context, say we don't have that document on file — never invent a URL.`,
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
  opts: { model: string; fetchImpl: FetchLike; maxTokens?: number; thinkingBudget?: number },
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
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: opts.maxTokens ?? 600,
          topP: 0.9,
          /* Gemini 2.5 spends "thinking" tokens from the SAME budget as the
             visible answer. Ranking 97 projects by price burned nearly all of
             an 800-token allowance on reasoning and the reply was cut off
             mid-number, while a single-corridor question answered fine — the
             failure scaled with how much filtering the question needed, which
             is exactly backwards. These answers are retrieval and formatting
             over a scoreboard we already supply, so the reasoning buys little
             and costs the whole reply. */
          ...(opts.thinkingBudget != null
            ? { thinkingConfig: { thinkingBudget: opts.thinkingBudget } }
            : {}),
        },
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
  const finish = data?.candidates?.[0]?.finishReason;
  /* A truncated answer still returns text, so it never trips the empty-text
     branch below — log it explicitly or a cut-off reply looks like a normal
     one in the logs. */
  if (text && finish === "MAX_TOKENS") {
    console.error(`[challenge-router] answer TRUNCATED at ${text.length} chars — raise maxTokens or lower thinkingBudget`);
  }
  if (!text) {
    console.error(
      `[challenge-router] gemini empty text. candidates=${data?.candidates?.length ?? 0}` +
      ` finish=${data?.candidates?.[0]?.finishReason ?? "?"} feedback=${JSON.stringify(data?.promptFeedback ?? null)}`,
    );
  }
  return text || null;
}

/* One output budget for everyone. Answer QUALITY does not vary with
   account status — signing in buys quota, not better answers. Depth is
   bought per project via the read, and that arrives as extra context
   rather than as a bigger allowance.

   Raised from 800 after live answers were truncated: Gemini 2.5 draws
   thinking tokens from this same budget, so the harder the filtering the
   shorter the visible reply. Paired with thinking disabled below, this is
   now the answer's own allowance rather than a shared one. */
export const GENERAL_MAX_TOKENS = 1500;

/* Thinking off. TruthGuide filters and formats a scoreboard that is already
   in the prompt — there is no multi-step reasoning for it to do, and the
   tokens come straight out of the reply. Also makes answers faster and
   cheaper. Flash accepts 0; Pro would need >= 128. */
export const GENERAL_THINKING_BUDGET = 0;

/* Project ("Challenge our read") mode used to fall back to the 600-token
   default with thinking ON, so a "final verdict comparing two projects" spent
   the budget on reasoning and clipped mid-sentence. It now gets the same
   generous, thinking-off allowance as the scoreboard chat — the answer is
   retrieval + judgement over facts we already supply, so this is the reply's
   own budget, not one shared with hidden reasoning. */
export const PROJECT_MAX_TOKENS = 1500;
export const PROJECT_THINKING_BUDGET = 0;

function generalSystemPrompt(ctx: Ctx): string {
  const paid = ctx.paidKnowledge
    ? `\n\n${ctx.paidKnowledge}`
    : "";

  return [
    `You are TruthGuide, the independent, buyer-side real estate advisor for Truth Estate. You answer questions about Gurugram residential real estate ONLY.`,
    ``,
    `RULES:`,
    `1. Answer ONLY from the context below. Never invent projects, scores or numbers. If a project isn't in the scoreboard, say we don't track it yet — do not guess.`,
    `2. LEAD WITH THE ANSWER. Name names and quote numbers in the first sentence. Never open with a caveat, never say the answer "depends on your needs", and never ask a clarifying question INSTEAD of answering — answer with what you have, then offer to narrow it.`,
    `3. FORMAT FOR SCANNING, NOT FOR READING. When you name two or more projects, write one short lead line, then ONE PROJECT PER LINE, each as: Name — Score · Corridor · from ₹X Cr. Separate lines with a real newline. Max 5 rows, then offer more. Use flowing prose ONLY for single-fact answers, methodology, and conversational replies. No markdown, no headings, no bullet characters — plain lines.`,
    `4. Be honest, including about weaknesses — conceding a weak point builds trust. You are NOT a salesperson, and at most ONE short nudge per answer.`,
    `5. ONLY discuss Gurugram residential real estate. Politely decline anything else (commercial property, other cities, non-real-estate topics) with: "I focus exclusively on Gurugram residential real estate — that's where our independent research runs deepest."`,
    `6. The scoreboard below is PUBLIC — every visitor sees the same facts. Never withhold a project name, Truth Score, price or corridor from anyone, and never imply a better answer exists behind an account. Depth on a SPECIFIC project is what the paid read adds, and only where a FORENSIC LAYER section appears below.`,
    `7. Never say you are an AI, a language model, or Gemini. You are TruthGuide, the independent advisor.`,
    `8. END EVERY REPLY with a final line in exactly this form, and nothing after it:`,
    `FOLLOW-UPS: question one|question two|question three`,
    `   Three short questions (max 8 words each) THIS visitor would plausibly ask next. Never repeat something already asked. Walk them deeper: from browsing toward a specific project, from a project toward its risks, from risks toward the forensic read. Phrase them as the visitor would type them.`,
    ``,
    `CONTEXT:`,
    ctx.publicKnowledge ?? "(none provided)",
    paid,
  ].join("\n");
}

export async function routeChallenge(
  body: Body,
  opts: {
    apiKey: string | undefined;
    model: string;
    fetchImpl: FetchLike;
    /* Server-side context builder for general mode. Supplied by index.ts,
       which owns the DB credentials. Absent in the offline harness. */
    generalContext?: (unlocked: string[]) => Promise<{ publicKnowledge: string; paidKnowledge: string | null; projectCount: number }>;
    /* Server-side documents/extended-details for ONE project, by slug or name.
       Used in project mode so the chat can quote real pricing and hand over a
       brochure/payment-plan/site-plan link. Also supplied by index.ts; absent
       offline. Returns null when the project has no extended row. */
    projectExtras?: (slugOrName: string) => Promise<string | null>;
  },
): Promise<RouterAnswer> {
  const question = (body.question ?? "").trim();
  const locked = Boolean(body.locked);
  const mode = body.mode ?? "project";

  if (!question) {
    console.error("[challenge-router] empty question");
    return { ok: false };
  }
  if (!opts.apiKey) {
    console.error("[challenge-router] GEMINI_API_KEY not set");
    return { ok: false };
  }

  let ctx: Ctx;
  if (mode === "general") {
    /* The client's context is DELIBERATELY DISCARDED here. It used to be
       assembled in the browser and POSTed, which let anyone edit the
       payload and have TruthGuide assert invented projects as fact. It is
       now built from the database, server-side, every time — so a stale
       or hostile client cannot influence what the model believes. */
    if (!opts.generalContext) {
      console.error("[challenge-router] general mode requested but no context builder wired");
      return { ok: false };
    }
    const built = await opts.generalContext(body.unlockedProjects ?? []);
    if (!built.projectCount) {
      console.error("[challenge-router] live context returned 0 projects");
      return { ok: false };
    }
    ctx = { publicKnowledge: built.publicKnowledge, paidKnowledge: built.paidKnowledge };
    console.log(
      `[challenge-router] mode=general projects=${built.projectCount} unlocked=${(body.unlockedProjects ?? []).length} ctxChars=${built.publicKnowledge.length} q=${question.slice(0, 60)}`,
    );
  } else {
    ctx = body.context ?? {};
    console.log(`[challenge-router] mode=project locked=${locked} q=${question.slice(0, 60)}`);
    if (!ctx.publicKnowledge) {
      console.error("[challenge-router] project mode: no publicKnowledge supplied");
      return { ok: false };
    }
    /* Enrich the single-project context so "Challenge our read" can (a) give a
       real head-to-head verdict against any other project the visitor names,
       and (b) hand over documents. Both are built SERVER-SIDE (the scoreboard
       and the extended row), so a stale or hostile client cannot influence
       them — and both fail SOFT: any error just answers without that block. */
    const extras: string[] = [];
    if (opts.generalContext) {
      try {
        const board = await opts.generalContext(body.unlockedProjects ?? []);
        if (board.projectCount) {
          extras.push(
            `\n\n── TRACKED PROJECTS (public scoreboard — you MAY compare "${ctx.name}" against any project below on these public facts) ──\n${board.publicKnowledge}`,
          );
        }
      } catch (e) {
        console.error("[challenge-router] project mode: scoreboard fetch failed", e instanceof Error ? e.message : e);
      }
    }
    if (opts.projectExtras && (ctx.slug || ctx.name)) {
      try {
        const docs = await opts.projectExtras(ctx.slug || ctx.name || "");
        if (docs) extras.push(`\n\n${docs}`);
      } catch (e) {
        console.error("[challenge-router] project mode: extras fetch failed", e instanceof Error ? e.message : e);
      }
    }
    if (extras.length) ctx = { ...ctx, publicKnowledge: `${ctx.publicKnowledge}${extras.join("")}` };
  }

  const sys = mode === "general"
    ? generalSystemPrompt(ctx)
    : systemPrompt(ctx, locked);

  const text = await callGemini(opts.apiKey, sys, body.history, question, {
    model: opts.model,
    fetchImpl: opts.fetchImpl,
    ...(mode === "general"
      ? { maxTokens: GENERAL_MAX_TOKENS, thinkingBudget: GENERAL_THINKING_BUDGET }
      : { maxTokens: PROJECT_MAX_TOKENS, thinkingBudget: PROJECT_THINKING_BUDGET }),
  });
  if (!text) {
    console.error(`[challenge-router] no text returned for mode=${mode}`);
    return { ok: false };
  }
  if (mode !== "general") return { ok: true, text, gate: locked };

  const { text: clean, followups } = splitFollowups(text);
  return { ok: true, text: clean, gate: locked, followups };
}
