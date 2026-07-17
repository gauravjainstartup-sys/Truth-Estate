/* ════════════════════════════════════════════════════════════════
   OFFLINE HARNESS for the omni-router core — no network, no key.

     node supabase/functions/omni-router/test-offline.mjs

   Drives routeAsk() with SCRIPTED Claude transcripts (a fake create
   function) over a fixture index, and asserts:
   · the request contract (model, adaptive thinking, tools, loop
     mechanics — thinking blocks preserved, tool_result ids matched)
   · tool execution over the index (screen/find/top_units payloads)
   · the respond contract end-to-end incl. sanitization of malformed
     model output (bad slugs dropped, oversized verdict clamped,
     unusable answers → null → client falls back deterministically)
   · the vendored omni.ts is byte-identical to src/lib/omni.ts
   Requires Node ≥ 22.18 (native TypeScript type-stripping).
   ════════════════════════════════════════════════════════════════ */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const here = path.dirname(fileURLToPath(import.meta.url));
const { routeAsk, MODEL } = await import(path.join(here, "core.ts"));

/* ── 0 · vendor parity: the copy must match the source ── */
{
  const src = readFileSync(path.join(here, "../../../src/lib/omni.ts"), "utf8");
  const vend = readFileSync(path.join(here, "omni.ts"), "utf8");
  assert.ok(vend.endsWith(src), "VENDOR DRIFT: supabase/functions/omni-router/omni.ts != src/lib/omni.ts — re-copy it (keep the header)");
  console.log("✓ vendored omni.ts matches src/lib/omni.ts");
}

/* ── fixture index (shape = OmniIndex) ── */
const INDEX = {
  live: true,
  projects: [
    { slug: "birla-arika", name: "Birla Arika", developer: "Birla Estates", location: "Sector 31 · Gurugram", score: 88, minPriceCr: 8.5, minBhk: 4, config: "4 BHK", deliveryYear: 2031, redFlags: 0, delayRisk: "Low", has3D: true, advisorFile: "tower-intel/birla-arika.html", lat: 28.450497, lng: 77.046439 },
    { slug: "elan-the-presidential", name: "Elan The Presidential", developer: "Elan", location: "Sector 106 · Dwarka Expressway", score: 84, minPriceCr: 4.2, minBhk: 3, config: "3, 4 BHK", deliveryYear: 2029, redFlags: 0, delayRisk: "Low", has3D: true, advisorFile: "tower-intel/elan-the-presidential.html", lat: 28.502307, lng: 77.001726 },
    { slug: "risky-towers", name: "Risky Towers", developer: "X", location: "Sector 1 · Dwarka Expressway", score: 55, minPriceCr: 2.1, minBhk: 3, config: "3 BHK", deliveryYear: 2027, redFlags: 3, delayRisk: "High", has3D: false, advisorFile: null, lat: null, lng: null },
  ],
  units: {
    "birla-arika": [
      { tower: "T2", unit: "101", config: "", score: 90, grade: "A+", facing: "south", sunWinterH: 6.7, vastu: 92, view: 78 },
      { tower: "T1", unit: "101", config: "", score: 87, grade: "A", facing: "south", sunWinterH: 6.4, vastu: 90, view: 70 },
    ],
  },
};

/* fake create(): returns the scripted turn, records every request */
function scripted(turns) {
  const calls = [];
  let i = 0;
  const create = async (params) => {
    calls.push(structuredClone(params));
    if (i >= turns.length) throw new Error("fake Claude ran out of scripted turns");
    return turns[i++];
  };
  return { create, calls };
}
const tu = (id, name, input) => ({ type: "tool_use", id, name, input });

/* ── 1 · screen flow: tools then respond; contract + loop mechanics ── */
{
  const { create, calls } = scripted([
    { stop_reason: "tool_use", content: [
      { type: "thinking", thinking: "let me screen", signature: "sig1" },
      tu("t1", "screen_projects", { chips: [{ key: "bhk", bhk: 3 }, { key: "budget", maxCr: 5 }, { key: "area", needle: "dwarka" }] }),
    ]},
    { stop_reason: "tool_use", content: [ tu("t2", "respond", {
      intent: "screen",
      chips: [
        { key: "bhk", bhk: 3, label: "3 BHK" },
        { key: "budget", maxCr: 5, label: "≤ ₹5 Cr" },
        { key: "area", needle: "dwarka", label: "Dwarka Expressway" },
      ],
      projectSlug: null,
      verdict: "Elan The Presidential leads at Truth Score 84 from ₹4.2 Cr; Risky Towers also fits the budget but carries 3 red flags.",
      note: "Screened 3 tracked projects — 2 clear every filter.",
      refs: [],
    }) ]},
  ]);
  const out = await routeAsk({ create, index: INDEX }, { q: "3 bhk under 5 cr on dwarka expressway" });

  // request contract
  assert.equal(calls[0].model, MODEL);
  assert.equal(MODEL, "claude-opus-4-8");
  assert.deepEqual(calls[0].thinking, { type: "adaptive" });
  assert.ok(Array.isArray(calls[0].tools) && calls[0].tools.some((t) => t.name === "respond"));
  assert.ok(calls[0].system.includes("birla-arika"), "system prompt lists modelled slugs");
  // loop mechanics: turn 2 carries assistant content (thinking preserved) + matched tool_result
  const msgs = calls[1].messages;
  assert.equal(msgs.length, 3);
  assert.equal(msgs[1].role, "assistant");
  assert.equal(msgs[1].content[0].type, "thinking");
  assert.equal(msgs[2].content[0].type, "tool_result");
  assert.equal(msgs[2].content[0].tool_use_id, "t1");
  const toolPayload = JSON.parse(msgs[2].content[0].content);
  assert.equal(toolPayload.matches, 2, "screen over fixture: elan + risky match 3bhk ≤5cr dwarka");
  assert.equal(toolPayload.ranked[0].slug, "elan-the-presidential");
  assert.ok(toolPayload.ranked.find((r) => r.slug === "risky-towers").evidence.some((e) => e.includes("red flag")));
  // answer contract
  assert.equal(out.intent, "screen");
  assert.equal(out.chips.length, 3);
  assert.ok(out.verdict.includes("84"));
  console.log("✓ screen flow — request contract, loop mechanics, tool payloads, answer");
}

/* ── 2 · units flow: find_project → top_units → respond ── */
{
  const { create, calls } = scripted([
    { stop_reason: "tool_use", content: [ tu("f1", "find_project", { query: "birla arika" }) ] },
    { stop_reason: "tool_use", content: [ tu("u1", "top_units", { slug: "birla-arika" }) ] },
    { stop_reason: "tool_use", content: [ tu("r1", "respond", {
      intent: "units", chips: [], projectSlug: "birla-arika",
      verdict: "T2 Line 01 is the pick in Birla Arika — A+ 90 with 6.7 h of winter sun, south-facing.",
      note: "Read 2 modelled lines in Birla Arika.", refs: ["birla-arika"],
    }) ]},
  ]);
  const out = await routeAsk({ create, index: INDEX }, { q: "sabse achha flat birla arika mein konsa hai?" });
  const find = JSON.parse(calls[1].messages[2].content[0].content);
  assert.equal(find.slug, "birla-arika");
  assert.equal(find.modelledLines, 2);
  const units = JSON.parse(calls[2].messages[4].content[0].content);
  assert.equal(units.topLines[0].tower, "T2");
  assert.equal(units.topLines[0].winterSunH, 6.7);
  assert.equal(out.intent, "units");
  assert.equal(out.projectSlug, "birla-arika");
  console.log("✓ units flow — Hinglish ask, find→units→respond, per-line numbers from the index");
}

/* ── 3 · misbehaving model: text-only turn is nudged; dirty respond is sanitized ── */
{
  const { create, calls } = scripted([
    { stop_reason: "end_turn", content: [{ type: "text", text: "Here is my answer in prose…" }] },
    { stop_reason: "tool_use", content: [ tu("r2", "respond", {
      intent: "question",
      chips: [{ key: "hacked", label: "x" }, { key: "budget", maxCr: 4, label: "≤ ₹4 Cr" }],
      projectSlug: "not-a-real-slug",
      verdict: "Elan The Presidential is the safest pick at Truth Score 84. ".repeat(20),
      note: "n",
      refs: ["elan-the-presidential", "fake-slug", "risky-towers"],
    }) ]},
  ]);
  const out = await routeAsk({ create, index: INDEX }, { q: "which developer is safest?" });
  assert.ok(calls[1].messages.some((m) => typeof m.content === "string" && m.content.includes("respond tool")), "text-only turn gets the nudge");
  assert.equal(out.intent, "question");
  assert.deepEqual(out.chips.map((c) => c.key), ["budget"], "unknown chip key dropped");
  assert.equal(out.projectSlug, null, "unknown slug dropped");
  assert.deepEqual(out.refs, ["elan-the-presidential", "risky-towers"], "fake ref slug dropped");
  assert.ok(out.verdict.length <= 420, "verdict clamped");
  console.log("✓ misbehaving model — nudge + sanitization (chips, slug, refs, verdict clamp)");
}

/* ── 4 · unusable answers → null (client falls back deterministically) ── */
{
  // units intent without a slug
  const a = await routeAsk(
    { ...scripted([{ stop_reason: "tool_use", content: [tu("x", "respond", { intent: "units", chips: [], verdict: "v", note: "n" })] }]), index: INDEX },
    { q: "which flat?" },
  );
  assert.equal(a, null);
  // model never calls respond at all (runs the loop dry)
  const dry = scripted(Array.from({ length: 8 }, () => ({ stop_reason: "end_turn", content: [{ type: "text", text: "…" }] })));
  const b = await routeAsk({ create: dry.create, index: INDEX }, { q: "hello" });
  assert.equal(b, null);
  // empty ask never reaches the model
  const untouched = scripted([]);
  const c = await routeAsk({ create: untouched.create, index: INDEX }, { q: "   " });
  assert.equal(c, null);
  assert.equal(untouched.calls.length, 0);
  console.log("✓ unusable answers return null — deterministic fallback path");
}

console.log("\nALL OFFLINE ROUTER TESTS PASSED");
