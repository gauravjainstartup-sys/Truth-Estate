/* ════════════════════════════════════════════════════════════════
   RESALE-PRICE CORE — pure logic, no Deno globals.

   One job: given a project name + city, return the CURRENT secondary-market
   (resale) asking price — grounded in live web search, never hallucinated.
   The Deal Room's step 2 shows it under the buyer's target so the target
   reads as "the number we drive the market BELOW".

   Truth-brand rule, enforced by the prompt AND the parser: a blank beats a
   wrong number. If Gemini cannot corroborate a project-specific figure it
   must answer NONE, and anything that does not look like a clean price is
   discarded to "".

   Kept free of Deno.* so it runs under Node for the offline harness
   (test-offline.mjs). index.ts wires Deno.serve / env / CORS around it.
   ════════════════════════════════════════════════════════════════ */

export type FetchLike = (url: string, init: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export type ResaleBody = { project?: string; city?: string; model?: string; debug?: boolean };
export type ResaleAnswer =
  | { ok: true; price: string; debug?: unknown }
  | { ok: false; debug?: unknown };

/* Ops/testing override: honour a caller-supplied model ONLY if it looks like a
   Gemini pro/flash id, else fall back to the configured default. Bounded so a
   request can never point us at an arbitrary or non-Gemini endpoint. */
export function pickModel(requested: string | undefined, fallback: string): string {
  const r = (requested ?? "").trim();
  return /^gemini-\d+(\.\d+)?-(pro|flash)(-[a-z0-9-]+)?$/.test(r) ? r : fallback;
}

/* THE PROMPT. The whole point of the feature — retrieval + refusal, never a
   guess. Google Search grounding (wired in getResalePrice) gives it live
   listings; these rules make it decline rather than invent when the data
   isn't there. */
export function resalePrompt(project: string, city: string): string {
  const where = city ? `${project}, ${city}` : project;
  return [
    `You are a precise real-estate data researcher. Use Google Search to find the CURRENT secondary-market (RESALE) price for ONE specific residential project. Search live listing portals (99acres, MagicBricks, Housing.com, NoBroker, Square Yards) and sources from roughly the last 6 months.`,
    ``,
    `PROJECT: "${project}"`,
    `CITY: "${city || "(not given — infer only if the project name is unambiguous)"}"`,
    ``,
    `TASK: Report the typical current resale asking price for a standard unit in THIS EXACT project (${where}).`,
    ``,
    `NON-NEGOTIABLE RULES — a blank beats a wrong number:`,
    `1. CORROBORATE. Only report a figure supported by at least two current, project-specific sources. Never substitute a sector/locality average or a different project's price.`,
    `2. VERIFY IDENTITY. Confirm the listings are for THIS project and city, not a similarly named one elsewhere.`,
    `3. REFUSE WHEN UNSURE. If you cannot find reliable, project-specific resale data, output exactly: NONE. Do not estimate, infer, extrapolate, or fall back to training data. Guessing is a failure.`,
    `4. STAY TIGHT. Give the single most-cited figure. Only give a range if sources genuinely cluster within ~15%.`,
    ``,
    `OUTPUT — exactly ONE line, nothing else (no reasoning, no sources, no labels, no markdown):`,
    `- A price with Indian comma grouping, prefixed with the rupee sign, plus a unit.`,
    `- Total-price form:  ₹2,25,00,000`,
    `- Per-square-foot form:  ₹18,500/sq ft`,
    `- If BOTH a total and a per-sq-ft rate are well supported, output them comma-separated:  ₹2,25,00,000, ₹18,500/sq ft`,
    `- If no reliable data:  NONE`,
  ].join("\n");
}

/* Defend the UI from anything that isn't a clean price. Returns "" for NONE,
   for prose, or for a stray no-digit reply — the UI treats "" as "show
   nothing", which is the honest outcome when the market can't be read. */
export function sanitizePrice(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[`*_#>]/g, "").trim();
  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Prefer the line that actually carries a rupee figure; else the last line with a digit.
  let line =
    lines.find((l) => /[₹]/.test(l)) ??
    [...lines].reverse().find((l) => /\d/.test(l)) ??
    "";
  line = line.replace(/^["'\s]+|["'\s.]+$/g, "");
  if (!line || /^none$/i.test(line) || !/\d/.test(line)) return "";
  // A real answer is short. If the model added prose, salvage only the ₹ tokens.
  if (line.length > 60 || !/[₹]/.test(line)) {
    const m = line.match(/₹\s?[\d,]+(?:\s*\/\s*sq\.?\s*ft)?(?:\s*,\s*₹\s?[\d,]+(?:\s*\/\s*sq\.?\s*ft)?)?/i);
    return m ? m[0].replace(/\s+/g, " ").trim() : "";
  }
  return line;
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: unknown;
};

export async function getResalePrice(
  body: ResaleBody,
  opts: { apiKey: string | undefined; model: string; fetchImpl: FetchLike; maxOutputTokens?: number },
): Promise<ResaleAnswer> {
  const project = (body.project ?? "").trim();
  const city = (body.city ?? "").trim();
  if (!project) {
    console.error("[resale-price] no project supplied");
    return { ok: false };
  }
  if (!opts.apiKey) {
    console.error("[resale-price] GEMINI_API_KEY not set");
    return { ok: false };
  }

  const model = pickModel(body.model, opts.model);
  const res = await opts.fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": opts.apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: resalePrompt(project, city) }] }],
        /* Live web grounding is what makes "without hallucination" real — the
           model retrieves current listings instead of leaning on training
           data. No ungrounded fallback: if grounding is unavailable we return
           blank rather than a guessed number. */
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: opts.maxOutputTokens ?? 8192,
          /* Top model, thinking ON (dynamic). gemini-2.5-pro reasons over the
             search hits to reject look-alike projects and stale posts before
             committing to a figure. -1 lets it think as much as the lookup
             needs; the visible reply is just one line. */
          thinkingConfig: { thinkingBudget: -1 },
        },
      }),
    },
  );

  if (!res.ok) {
    const errText = (await res.text()).slice(0, 500);
    console.error(`[resale-price] gemini HTTP ${res.status}: ${errText.slice(0, 300)}`);
    return body.debug ? { ok: false, debug: { model, httpStatus: res.status, error: errText } } : { ok: false };
  }

  const data = (await res.json()) as GeminiResponse;
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p.text ?? "").join("").trim() : "";
  const finish = data?.candidates?.[0]?.finishReason;
  if (!text) {
    console.error(
      `[resale-price] gemini empty text. candidates=${data?.candidates?.length ?? 0}` +
      ` finish=${finish ?? "?"} feedback=${JSON.stringify(data?.promptFeedback ?? null)}`,
    );
    return body.debug ? { ok: true, price: "", debug: { model, finish: finish ?? null, raw: "" } } : { ok: true, price: "" };
  }
  const price = sanitizePrice(text);
  console.log(`[resale-price] model=${model} project="${project}" city="${city}" finish=${finish ?? "?"} -> ${price ? `"${price}"` : "(blank)"}`);
  return body.debug ? { ok: true, price, debug: { model, finish: finish ?? null, raw: text.slice(0, 500) } } : { ok: true, price };
}
