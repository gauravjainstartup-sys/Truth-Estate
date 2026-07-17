/* ════════════════════════════════════════════════════════════════
   OMNI-ROUTER CORE — the Claude layer of Truth Intelligence.

   Runtime-agnostic on purpose: no Deno, no Node, no SDK import.
   index.ts (Deno entry) injects the real Anthropic client; the
   offline harness injects scripted transcripts, so the loop, the
   tools and the contract are testable without a network.

   Division of labour (the forensic guarantee):
   · Claude parses the ask (any language, any phrasing) into the SAME
     chip vocabulary the deterministic parser emits, and composes a
     ≤2-sentence verdict — using only numbers returned by its tools.
   · Every card, score and dial the canvas shows is still rendered
     client-side by the deterministic screen()/topUnits() over the
     published index. The model never invents a row.
   ════════════════════════════════════════════════════════════════ */
import {
  screen,
  topUnits,
  matchProject,
  sanitizeChips,
  sanitizeAnswer,
  type OmniIndex,
  type RouterAnswer,
} from "./omni.ts";

export const MODEL = "claude-opus-4-8";
const MAX_TURNS = 6;

/* the injected Claude call — shaped like client.messages.create */
export type CreateFn = (params: Record<string, unknown>) => Promise<ClaudeMessage>;
type ClaudeMessage = { content: ContentBlock[]; stop_reason: string | null };
type ContentBlock = {
  type: string;
  id?: string;
  name?: string;
  input?: unknown;
  text?: string;
  [k: string]: unknown;
};

export type AskBody = { q?: unknown; chips?: unknown; project?: unknown };

/* ── tool schemas (model-facing) ── */
const CHIP_SCHEMA = {
  type: "object",
  properties: {
    key: { type: "string", enum: ["bhk", "budget", "area", "sun", "vastu", "possession", "lowrisk"] },
    label: { type: "string", description: "short human label shown on the chip, e.g. '3 BHK', '≤ ₹5 Cr'" },
    bhk: { type: "number", description: "key=bhk only" },
    maxCr: { type: "number", description: "key=budget only — max budget in ₹ crore" },
    needle: { type: "string", description: "key=area only — lowercase substring matched against project location, e.g. 'dwarka', 'sector 63'" },
    byYear: { type: "number", description: "key=possession only — latest acceptable possession year" },
  },
  required: ["key"],
} as const;

const TOOLS = [
  {
    name: "screen_projects",
    description:
      "Filter and rank the tracked projects with structured chips — the exact screen the canvas will re-run. Returns ranked matches with their evidence labels (Truth Score, price, possession, red flags, modelled winter sun).",
    input_schema: {
      type: "object",
      properties: { chips: { type: "array", items: CHIP_SCHEMA } },
      required: ["chips"],
    },
  },
  {
    name: "find_project",
    description: "Resolve a (possibly partial or misspelt) project name to its index row.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "top_units",
    description:
      "Per-line intelligence for a MODELLED project: composite score, grade, facing, winter-benchmark sun hours, vastu and view sub-scores for its best lines.",
    input_schema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "respond",
    description:
      "Your ONLY way to answer. Call exactly once, when you have the evidence. The canvas renders cards deterministically from your chips/refs; verdict and note are the only prose shown.",
    input_schema: {
      type: "object",
      properties: {
        intent: { type: "string", enum: ["screen", "units", "question", "navigate"] },
        chips: { type: "array", items: CHIP_SCHEMA },
        projectSlug: { type: ["string", "null"], description: "units/navigate target slug" },
        verdict: { type: "string", description: "≤2 sentences, plain text; every number must come from a tool result" },
        note: { type: "string", description: "one line for the conversation rail: what you read to answer" },
        refs: { type: "array", items: { type: "string" }, description: "slugs your verdict cites (question intent) — their cards are shown" },
      },
      required: ["intent", "chips", "verdict", "note"],
    },
  },
];

/* ── tool execution over the index (pure) ── */
function runTool(name: string, input: unknown, index: OmniIndex): string {
  const inp = (typeof input === "object" && input != null ? input : {}) as Record<string, unknown>;
  if (name === "screen_projects") {
    const chips = sanitizeChips(inp.chips);
    const ranked = screen(index, chips).slice(0, 12).map((r) => ({
      slug: r.p.slug,
      name: r.p.name,
      truthScore: r.p.score,
      location: r.p.location,
      minPriceCr: r.p.minPriceCr,
      possession: r.p.deliveryYear,
      redFlags: r.p.redFlags,
      modelled3D: r.p.has3D,
      evidence: r.why.map((w) => w.label),
    }));
    return JSON.stringify({ chipsApplied: chips, matches: ranked.length, ranked });
  }
  if (name === "find_project") {
    const q = typeof inp.query === "string" ? inp.query : "";
    const p = matchProject(q, index);
    if (!p) return JSON.stringify({ found: false });
    return JSON.stringify({
      found: true,
      slug: p.slug,
      name: p.name,
      truthScore: p.score,
      location: p.location,
      developer: p.developer,
      minPriceCr: p.minPriceCr,
      config: p.config,
      possession: p.deliveryYear,
      redFlags: p.redFlags,
      delayRisk: p.delayRisk,
      modelled3D: p.has3D,
      modelledLines: (index.units[p.slug] ?? []).length,
    });
  }
  if (name === "top_units") {
    const slug = typeof inp.slug === "string" ? inp.slug : "";
    const units = topUnits(index, slug, 4);
    return JSON.stringify({
      slug,
      modelledLines: (index.units[slug] ?? []).length,
      topLines: units.map((u) => ({
        tower: u.tower,
        line: u.unit,
        composite: u.score,
        grade: u.grade,
        facing: u.facing,
        winterSunH: u.sunWinterH,
        vastu: u.vastu,
        view: u.view,
      })),
    });
  }
  return JSON.stringify({ error: `unknown tool ${name}` });
}

/* ── prompt ── */
function systemPrompt(index: OmniIndex): string {
  const modelled = index.projects
    .filter((p) => p.has3D)
    .map((p) => `${p.slug} (${p.name}, ${index.units[p.slug]?.length ?? 0} modelled lines)`)
    .join("; ");
  return [
    "You are the intent router of Truth Intelligence — Truth Estate's forensic real-estate research canvas for Gurugram, India.",
    "",
    `Index: ${index.projects.length} tracked projects (${index.live ? "live pipeline rows" : "curated desk set"}).`,
    `Modelled projects with per-line 3D intelligence (winter-solstice sun benchmark, room-by-room vastu): ${modelled || "none"}.`,
    "",
    "The user typed a free-text ask (English, Hindi or Hinglish). The canvas that shows your answer is DETERMINISTIC: it re-runs the same screening locally from your chips and renders every card, score and dial from index rows. You only decide intent, chips, and the two prose fields.",
    "",
    "Intents:",
    "· navigate — the ask is just a project name → set projectSlug, no chips, empty verdict fine.",
    "· units — which flat/line/tower/floor inside ONE project → projectSlug MUST be a modelled slug from the list above (check with find_project / top_units first). If the project is not modelled, use intent question and say its 3D advisor is not live yet.",
    "· screen — the ask constrains the market (BHK, budget, corridor, sun, vastu, possession year, risk) → translate constraints into chips. Chip vocabulary is fixed: bhk, budget (maxCr in ₹ crore), area (needle = lowercase location substring like 'dwarka', 'golf course ext', 'spr', 'sohna', 'new gurgaon', 'sector 63'), sun, vastu, possession (byYear), lowrisk.",
    "· question — anything else → answer with a verdict grounded in tool results and cite the project slugs you relied on in refs.",
    "",
    "Hard rules:",
    "· Never invent a number, name, score or fact. Every figure in verdict/note must appear in a tool result from THIS conversation. If the index doesn't answer the ask, say exactly that.",
    "· verdict ≤ 2 sentences, plain text (no markdown, no bullet lists). note = one short line describing what you read (e.g. 'Screened 97 projects, 6 clear every filter').",
    "· Budget figures are ₹ crore. '5 cr' = maxCr 5. Lakhs: 90 lakh = 0.9 cr.",
    "· ALWAYS finish by calling respond, exactly once. Never answer in plain text.",
  ].join("\n");
}

/* ── the loop ── */
export async function routeAsk(
  deps: { create: CreateFn; index: OmniIndex },
  body: AskBody,
): Promise<RouterAnswer | null> {
  const { create, index } = deps;
  const q = typeof body.q === "string" ? body.q.trim().slice(0, 300) : "";
  if (!q) return null;
  const context = {
    ask: q,
    activeChips: sanitizeChips(body.chips),
    activeProject: typeof body.project === "string" ? body.project.slice(0, 80) : null,
  };

  const messages: Record<string, unknown>[] = [
    { role: "user", content: JSON.stringify(context) },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await create({
      model: MODEL,
      max_tokens: 3000,
      thinking: { type: "adaptive" },
      system: systemPrompt(index),
      tools: TOOLS,
      messages,
    });

    const toolUses = res.content.filter((b) => b.type === "tool_use");
    const final = toolUses.find((b) => b.name === "respond");
    if (final) return sanitizeAnswer(final.input, index);

    if (res.stop_reason === "tool_use" && toolUses.length) {
      // full assistant content goes back (preserves thinking blocks)
      messages.push({ role: "assistant", content: res.content });
      messages.push({
        role: "user",
        content: toolUses.map((t) => ({
          type: "tool_result",
          tool_use_id: t.id,
          content: runTool(t.name ?? "", t.input, index),
        })),
      });
      continue;
    }

    // text-only turn — nudge once toward the contract, then give up
    if (turn >= MAX_TURNS - 2) break;
    messages.push({ role: "assistant", content: res.content });
    messages.push({ role: "user", content: "Reply by calling the respond tool — it is the only channel the canvas can render." });
  }
  return null;
}
