/* ════════════════════════════════════════════════════════════════
   OFFLINE HARNESS for shortlist-rerank core — no network, no key.

     node supabase/functions/shortlist-rerank/test-offline.mjs

   Drives rerankShortlist() with a mocked Gemini fetch and asserts the
   validation wall and the request contract:
   · a well-formed response re-orders → ok:true in model order
   · a hallucinated slug (not in candidates) → ok:false
   · a duplicated slug → ok:false
   · malformed JSON → ok:false
   · missing key / brief / <2 candidates → ok:false
   · the Gemini request shape (model URL, JSON mime, notes reach the prompt)
   Requires Node ≥ 22.18 (native TypeScript type-stripping).
   ════════════════════════════════════════════════════════════════ */
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const here = path.dirname(fileURLToPath(import.meta.url));
const { rerankShortlist, systemPrompt, validateRanked } = await import(path.join(here, "core.ts"));

const BRIEF = {
  budgetCr: 5, locations: ["SPR"], configs: ["3 BHK"], priorities: ["Legal Safety"],
  purchaseType: "First Home", timeline: "Within 6 Months", possession: "under-construction",
  notes: "parents live with us, need a vastu-friendly entry and morning light",
};
const CANDS = [
  { slug: "alpha", name: "Alpha Heights", market: "SPR", entryCr: 2.9, configs: ["3 BHK"], tags: ["Legal Safety"], truthScore: 82, matchPct: 94 },
  { slug: "beta", name: "Beta Greens", market: "SPR", entryCr: 4.9, configs: ["3 BHK"], tags: ["Vaastu-Compliant"], truthScore: 78, matchPct: 91 },
  { slug: "gamma", name: "Gamma One", market: "New Gurgaon", entryCr: 3.9, configs: ["2 BHK"], tags: [], truthScore: 74, matchPct: 84 },
];

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); console.log("✓", m); pass++; };

function fakeGemini(reply, capture) {
  return async (url, init) => {
    if (capture) { capture.url = url; capture.body = JSON.parse(init.body); }
    return {
      ok: true, status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: reply }] } }] }),
      text: async () => reply,
    };
  };
}

/* ── 1 · happy path: model re-orders, notes reach the prompt ── */
{
  const cap = {};
  const reply = JSON.stringify({ ranked: [
    { slug: "beta", why: "Vaastu-compliant homes match the notes.", confidence: "High" },
    { slug: "alpha", why: "Strong legal profile at ease of budget.", confidence: "High" },
  ]});
  const ans = await rerankShortlist({ brief: BRIEF, candidates: CANDS },
    { apiKey: "k", model: "gemini-2.5-flash", fetchImpl: fakeGemini(reply, cap) });
  ok(ans.ok === true, "well-formed response → ok:true");
  ok(ans.ranked[0].slug === "beta" && ans.ranked[1].slug === "alpha", "model order preserved");
  ok(cap.url.includes("gemini-2.5-flash:generateContent"), "hits the configured model endpoint");
  ok(cap.body.generationConfig.responseMimeType === "application/json", "requests strict JSON output");
  ok(JSON.stringify(cap.body).includes("vastu-friendly entry"), "buyer notes reach the model");
  ok(systemPrompt().includes("Never output a slug"), "prompt carries the subset rule");
}

/* ── 2 · the validation wall ── */
{
  const bad = await rerankShortlist({ brief: BRIEF, candidates: CANDS },
    { apiKey: "k", model: "m", fetchImpl: fakeGemini(JSON.stringify({ ranked: [{ slug: "omega", why: "", confidence: "High" }] })) });
  ok(bad.ok === false, "hallucinated slug → ok:false");

  const dup = await rerankShortlist({ brief: BRIEF, candidates: CANDS },
    { apiKey: "k", model: "m", fetchImpl: fakeGemini(JSON.stringify({ ranked: [{ slug: "alpha" }, { slug: "alpha" }] })) });
  ok(dup.ok === false, "duplicated slug → ok:false");

  const junk = await rerankShortlist({ brief: BRIEF, candidates: CANDS },
    { apiKey: "k", model: "m", fetchImpl: fakeGemini("I think Beta Greens is best for you!") });
  ok(junk.ok === false, "non-JSON prose → ok:false");

  const fenced = await rerankShortlist({ brief: BRIEF, candidates: CANDS },
    { apiKey: "k", model: "m", fetchImpl: fakeGemini("```json\n" + JSON.stringify({ ranked: [{ slug: "alpha", why: "x", confidence: "Low" }] }) + "\n```") });
  ok(fenced.ok === true && fenced.ranked[0].slug === "alpha", "fenced JSON still parses (tolerant extractor)");
}

/* ── 3 · guard rails on input ── */
{
  const noKey = await rerankShortlist({ brief: BRIEF, candidates: CANDS }, { apiKey: undefined, model: "m", fetchImpl: fakeGemini("{}") });
  ok(noKey.ok === false, "missing key → ok:false");
  const noBrief = await rerankShortlist({ candidates: CANDS }, { apiKey: "k", model: "m", fetchImpl: fakeGemini("{}") });
  ok(noBrief.ok === false, "missing brief → ok:false");
  const one = await rerankShortlist({ brief: BRIEF, candidates: CANDS.slice(0, 1) }, { apiKey: "k", model: "m", fetchImpl: fakeGemini("{}") });
  ok(one.ok === false, "<2 candidates → ok:false (nothing to re-rank)");
  ok(validateRanked({ ranked: [] }, CANDS) === null, "empty ranked → rejected");
}

console.log(`\nALL ${pass} ASSERTIONS PASSED`);
