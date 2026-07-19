/* ════════════════════════════════════════════════════════════════
   OFFLINE HARNESS for challenge-router core — no network, no key.

     node supabase/functions/challenge-router/test-offline.mjs

   Drives routeChallenge()/systemPrompt() with a mocked Gemini fetch and
   asserts the WALL and the request contract:
   · locked context never carries paidKnowledge into the prompt
   · unlocked context does
   · missing key / question / publicKnowledge → ok:false (client falls back)
   · the Gemini request shape (system instruction, contents, model URL)
   · a well-formed candidate → ok:true text
   Requires Node ≥ 22.18 (native TypeScript type-stripping).
   ════════════════════════════════════════════════════════════════ */
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const here = path.dirname(fileURLToPath(import.meta.url));
const { routeChallenge, systemPrompt } = await import(path.join(here, "core.ts"));

const PUBLIC = "PROJECT: DLF The Arbour. TRUTH SCORE: 92/100. PILLAR SUMMARY: ...";
const PAID = "ROI MODEL: ~14% CAGR. VERDICT: proceed for GCE buyers. RED FLAGS: floor-rise premium.";
const TOPICS = ["The buy / no-buy verdict", "The 5-year ROI"];

const lockedCtx = { name: "DLF The Arbour", publicKnowledge: PUBLIC, paidKnowledge: null, paidTopics: TOPICS };
const unlockedCtx = { name: "DLF The Arbour", publicKnowledge: PUBLIC, paidKnowledge: PAID, paidTopics: TOPICS };

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); console.log("✓", m); pass++; };

/* ── 1 · the wall lives in the prompt ── */
{
  const locked = systemPrompt(lockedCtx, true);
  ok(!locked.includes(PAID), "locked prompt contains NO paid knowledge");
  ok(locked.includes("NOT unlocked"), "locked prompt carries the do-not-answer rule");
  ok(locked.includes(PUBLIC), "locked prompt carries public facts");
  ok(locked.includes("The 5-year ROI"), "locked prompt lists paid TOPIC LABELS (for the teaser)");

  const unlocked = systemPrompt(unlockedCtx, false);
  ok(unlocked.includes(PAID), "unlocked prompt DOES carry paid knowledge");
  ok(unlocked.includes("HAS unlocked"), "unlocked prompt allows full answers");
}

/* ── 2 · a scripted Gemini reply ── */
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

/* ── 3 · happy path (locked, public question) ── */
{
  const cap = {};
  const ans = await routeChallenge(
    { question: "How many towers?", locked: true, context: lockedCtx, history: [{ role: "user", text: "hi" }, { role: "bot", text: "hello" }] },
    { apiKey: "test-key", model: "gemini-2.5-flash", fetchImpl: fakeGemini("Five towers.", cap) },
  );
  ok(ans.ok === true && ans.text === "Five towers.", "returns ok:true with model text");
  ok(ans.gate === true, "locked → gate hint true (client is authoritative)");
  ok(cap.url.includes("gemini-2.5-flash:generateContent"), "hits the configured model endpoint");
  ok(cap.body.systemInstruction?.parts?.[0]?.text?.includes("TruthGuide"), "sends system instruction");
  ok(cap.body.contents.length === 3, "history + question mapped into contents");
  ok(cap.body.contents.at(-1).parts[0].text === "How many towers?", "final turn is the question");
  ok(cap.body.contents[1].role === "model", "bot turn mapped to role 'model'");
}

/* ── 4 · unlocked → gate false ── */
{
  const ans = await routeChallenge(
    { question: "Should I buy?", locked: false, context: unlockedCtx },
    { apiKey: "k", model: "m", fetchImpl: fakeGemini("On our read, yes for GCE buyers.") },
  );
  ok(ans.ok === true && ans.gate === false, "unlocked → gate false");
}

/* ── 5 · guards → ok:false (client falls back deterministically) ── */
{
  const noKey = await routeChallenge({ question: "x", context: lockedCtx }, { apiKey: undefined, model: "m", fetchImpl: fakeGemini("y") });
  ok(noKey.ok === false, "no API key → ok:false");
  const noQ = await routeChallenge({ question: "  ", context: lockedCtx }, { apiKey: "k", model: "m", fetchImpl: fakeGemini("y") });
  ok(noQ.ok === false, "empty question → ok:false");
  const noCtx = await routeChallenge({ question: "hi", context: {} }, { apiKey: "k", model: "m", fetchImpl: fakeGemini("y") });
  ok(noCtx.ok === false, "no public knowledge → ok:false");
}

/* ── 6 · Gemini error / empty → ok:false ── */
{
  const errFetch = async () => ({ ok: false, status: 429, json: async () => ({}), text: async () => "rate limited" });
  const ans = await routeChallenge({ question: "hi", context: lockedCtx }, { apiKey: "k", model: "m", fetchImpl: errFetch });
  ok(ans.ok === false, "gemini non-200 → ok:false");
  const empty = await routeChallenge({ question: "hi", context: lockedCtx }, { apiKey: "k", model: "m", fetchImpl: fakeGemini("") });
  ok(empty.ok === false, "empty candidate → ok:false");
}

console.log(`\n${pass} checks passed.`);
