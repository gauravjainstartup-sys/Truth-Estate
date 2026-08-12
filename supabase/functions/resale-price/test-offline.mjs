/* ════════════════════════════════════════════════════════════════
   OFFLINE HARNESS for resale-price core — no network, no key.

     node supabase/functions/resale-price/test-offline.mjs

   Drives getResalePrice()/sanitizePrice()/resalePrompt() with a mocked
   Gemini fetch and asserts:
   · the prompt carries the refuse-when-unsure rule
   · a clean price candidate → ok:true with the price
   · NONE / prose / no-digit replies → ok:true price:""  (UI shows nothing)
   · missing project / missing key → ok:false
   · HTTP error → ok:false
   · the request enables Google Search grounding + thinking, hits the model URL
   Requires Node ≥ 22.18 (native TypeScript type-stripping).
   ════════════════════════════════════════════════════════════════ */
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const here = path.dirname(fileURLToPath(import.meta.url));
const { getResalePrice, sanitizePrice, resalePrompt, pickModel } = await import(path.join(here, "core.ts"));

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); console.log("✓", m); pass++; };
const eq = (a, b, m) => { assert.equal(a, b, `${m} (got ${JSON.stringify(a)})`); console.log("✓", m); pass++; };

/* ── 1 · the prompt refuses rather than guesses ── */
{
  const p = resalePrompt("M3M Mansion", "Gurugram");
  ok(p.includes("M3M Mansion") && p.includes("Gurugram"), "prompt carries project + city");
  ok(/NONE/.test(p), "prompt tells the model to output NONE when unsure");
  ok(/Google Search/i.test(p), "prompt asks it to ground on Google Search");
  ok(/comma/i.test(p) || p.includes("2,25,00,000"), "prompt specifies Indian comma format");
}

/* ── 2 · sanitizePrice defends the UI ── */
{
  eq(sanitizePrice("₹2,25,00,000"), "₹2,25,00,000", "clean total passes through");
  eq(sanitizePrice("₹2,25,00,000, ₹18,500/sq ft"), "₹2,25,00,000, ₹18,500/sq ft", "total + rate pass through");
  eq(sanitizePrice("`₹18,500/sq ft`"), "₹18,500/sq ft", "strips markdown backticks");
  eq(sanitizePrice("NONE"), "", "NONE → blank");
  eq(sanitizePrice("none"), "", "none → blank");
  eq(sanitizePrice(""), "", "empty → blank");
  eq(sanitizePrice("I could not find reliable data for this project."), "", "prose with no price → blank");
  eq(
    sanitizePrice("Based on current listings the resale price is around ₹2,25,00,000 for a 3 BHK."),
    "₹2,25,00,000",
    "salvages the ₹ token out of a prose reply",
  );
}

/* ── 2b · pickModel is bounded to gemini pro/flash ids ── */
{
  eq(pickModel(undefined, "gemini-2.5-pro"), "gemini-2.5-pro", "no override → fallback");
  eq(pickModel("gemini-2.5-flash", "gemini-2.5-pro"), "gemini-2.5-flash", "valid override honoured");
  eq(pickModel("gemini-3-pro", "gemini-2.5-pro"), "gemini-3-pro", "future gemini id honoured");
  eq(pickModel("gpt-4o", "gemini-2.5-pro"), "gemini-2.5-pro", "non-gemini id rejected → fallback");
  eq(pickModel("../evil", "gemini-2.5-pro"), "gemini-2.5-pro", "junk rejected → fallback");
}

/* ── 3 · a scripted Gemini reply → ok:true price ── */
{
  let seenUrl = "", seenBody = null;
  const fetchImpl = async (url, init) => {
    seenUrl = url; seenBody = JSON.parse(init.body);
    return { ok: true, status: 200, text: async () => "", json: async () => ({ candidates: [{ content: { parts: [{ text: "₹2,25,00,000" }] }, finishReason: "STOP" }] }) };
  };
  const r = await getResalePrice({ project: "M3M Mansion", city: "Gurugram" }, { apiKey: "k", model: "gemini-2.5-pro", fetchImpl });
  ok(r.ok === true && r.price === "₹2,25,00,000", "clean candidate → ok:true with price");
  ok(seenUrl.includes("gemini-2.5-pro:generateContent"), "request hits the configured model URL");
  ok(Array.isArray(seenBody.tools) && JSON.stringify(seenBody.tools).includes("google_search"), "request enables Google Search grounding");
  ok(seenBody.generationConfig?.thinkingConfig?.thinkingBudget === -1, "request enables thinking (dynamic)");
  eq(seenBody.generationConfig?.temperature, 0, "temperature is 0 for a factual lookup");
}

/* ── 4 · NONE reply → ok:true, blank ── */
{
  const fetchImpl = async () => ({ ok: true, status: 200, text: async () => "", json: async () => ({ candidates: [{ content: { parts: [{ text: "NONE" }] } }] }) });
  const r = await getResalePrice({ project: "Some Unknown Society", city: "Nowhere" }, { apiKey: "k", model: "gemini-2.5-pro", fetchImpl });
  ok(r.ok === true && r.price === "", "NONE reply → ok:true price:'' (UI blank)");
}

/* ── 5 · guards → ok:false ── */
{
  const never = async () => { throw new Error("must not call gemini"); };
  const noProj = await getResalePrice({ project: "  ", city: "Gurugram" }, { apiKey: "k", model: "m", fetchImpl: never });
  ok(noProj.ok === false, "missing project → ok:false (no gemini call)");
  const noKey = await getResalePrice({ project: "M3M Mansion" }, { apiKey: undefined, model: "m", fetchImpl: never });
  ok(noKey.ok === false, "missing key → ok:false (no gemini call)");
  const httpErr = await getResalePrice({ project: "M3M Mansion" }, { apiKey: "k", model: "m", fetchImpl: async () => ({ ok: false, status: 429, text: async () => "rate limited", json: async () => ({}) }) });
  ok(httpErr.ok === false, "HTTP error → ok:false");
}

console.log(`\n${pass} checks passed.`);
