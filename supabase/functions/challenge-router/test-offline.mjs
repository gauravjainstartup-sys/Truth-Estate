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

/* ── 7 · project mode: raised budget, thinking off, scoreboard + docs ── */
{
  const cap = {};
  const ans = await routeChallenge(
    { mode: "project", question: "this project or M3M Golf Hills — final verdict", locked: false, context: unlockedCtx },
    {
      apiKey: "k",
      model: "gemini-2.5-flash",
      fetchImpl: fakeGemini("Verdict: Arbour, on delivery and score.", cap),
      // stub the server-side builders (real ones hit the DB)
      generalContext: async () => ({
        publicKnowledge:
          "TRACKED PROJECTS (2):\n- DLF The Arbour · 92\n- M3M Golf Hills · Truth Score 71 · SPR · from ₹3.2 Cr",
        paidKnowledge: null,
        projectCount: 2,
      }),
      projectExtras: async () =>
        "── EXTENDED DETAILS & DOCUMENTS (this project) ──\nDOCUMENTS:\n- Brochure: https://x/brochure.pdf",
    },
  );
  ok(ans.ok === true, "project mode returns ok:true");
  ok(cap.body.generationConfig.maxOutputTokens === 1500, "project mode raises maxOutputTokens 600 → 1500 (fixes truncation)");
  ok(cap.body.generationConfig.thinkingConfig?.thinkingBudget === 0, "project mode disables thinking (budget is the reply's own)");
  const sys = cap.body.systemInstruction.parts[0].text;
  ok(sys.includes("M3M Golf Hills"), "project prompt now carries the scoreboard → can compare a second project");
  ok(sys.includes("Brochure: https://x/brochure.pdf"), "project prompt now carries the brochure link → can hand it over");
  ok(/compare/i.test(sys), "project prompt permits comparison");
}

/* ── 8 · project mode still answers with NO server builders (fail-soft) ── */
{
  const cap = {};
  const ans = await routeChallenge(
    { mode: "project", question: "how many towers?", locked: true, context: lockedCtx },
    { apiKey: "k", model: "m", fetchImpl: fakeGemini("Five.", cap) },
  );
  ok(ans.ok === true && ans.text === "Five.", "project mode works without generalContext/projectExtras (offline-safe)");
  ok(cap.body.generationConfig.maxOutputTokens === 1500, "raised budget applies even without the extra context");
  ok(!cap.body.systemInstruction.parts[0].text.includes("public scoreboard"), "no scoreboard block appended when the builder is absent");
}

/* ── 9 · News & Updates (project_intelligence_wire) into the context ── */
const ctxMod = await import(path.join(here, "context.ts"));
const { buildProjectNews, matchWire, fetchWireRows, resetWireCache, renderContext } = ctxMod;

const wireRow = (over = {}) => ({
  project_slug: "gurugram-real-estate-m3m-capital-dwarka-expressway-sector-113",
  project_name: "M3M Capital",
  event_date: "2026-08-12",
  category: "REGULATORY",
  headline: "RERA extension granted for Phase 1",
  verified_facts: "HRERA order dated 12 Aug 2026 extends registration to Dec 2027.",
  forensic_impact_type: "CAUTION",
  forensic_impact_summary: "Handover moves out a year.",
  source_name: "HRERA Gurugram",
  status: "PUBLISHED",
  is_pinned: false,
  ...over,
});

function fakeDb(rowsByPath) {
  return {
    url: "http://db",
    key: "k",
    fetchImpl: async (url) => {
      const hit = Object.entries(rowsByPath).find(([p]) => url.includes(p));
      return {
        ok: hit != null,
        status: hit ? 200 : 404,
        json: async () => (hit ? hit[1] : []),
        text: async () => "",
      };
    },
  };
}

{
  const sibling = wireRow({
    project_slug: "gurugram-real-estate-m3m-capital-phase-2-dwarka-expressway-sector-113",
    project_name: "M3M Capital Phase 2",
    headline: "Phase 2 tower crane erected",
    event_date: "2026-08-15",
  });
  const rows = [sibling, wireRow()];

  const mine = matchWire(rows, "gurugram-real-estate-m3m-capital-dwarka-expressway-sector-113");
  ok(mine.length === 1 && mine[0].project_name === "M3M Capital", "exact slug match returns ONLY its own rows");
  const sib = matchWire(rows, "gurugram-real-estate-m3m-capital-phase-2-dwarka-expressway-sector-113");
  ok(sib.length === 1 && sib[0].project_name === "M3M Capital Phase 2", "sibling keeps its own rows (no cross-steal)");
  const byName = matchWire(rows, "M3M Capital Phase 2");
  ok(byName.length === 1 && byName[0].headline.includes("crane"), "project-NAME fallback matches exactly by name");
}

{
  resetWireCache();
  const deps = fakeDb({ "project_intelligence_wire": [wireRow(), wireRow({ status: "DRAFT", headline: "DRAFT LEAK" })] });
  const news = await buildProjectNews(deps, "gurugram-real-estate-m3m-capital-dwarka-expressway-sector-113");
  ok(news != null && news.includes("NEWS & UPDATES"), "project news block renders");
  ok(news.includes("RERA extension granted"), "block carries the headline");
  ok(news.includes("12 Aug 2026") && news.includes("CAUTION"), "block carries date + impact type");
  ok(news.includes("HRERA Gurugram"), "block carries the source");
  ok(!news.includes("DRAFT LEAK"), "a DRAFT row never reaches the model (defence in depth)");
  const none = await buildProjectNews(deps, "gurugram-real-estate-unrelated-project-sector-1");
  ok(none === null, "project with no events → null (section simply absent)");
}

{
  resetWireCache();
  const many = Array.from({ length: 14 }, (_, i) =>
    wireRow({ event_date: `2026-07-${String(28 - i).padStart(2, "0")}`, headline: `Event ${i}` }));
  const deps = fakeDb({ "project_intelligence_wire": many });
  const news = await buildProjectNews(deps, "M3M Capital");
  ok(news.includes("older events not shown"), "per-project cap of 10 announces what it dropped");
  const pinned = await (async () => {
    resetWireCache();
    const d2 = fakeDb({ "project_intelligence_wire": [wireRow({ headline: "FRESH EVENT" }), wireRow({ event_date: "2026-01-01", is_pinned: true, headline: "PINNED OLD" })] });
    return buildProjectNews(d2, "M3M Capital");
  })();
  ok(pinned.indexOf("PINNED OLD") < pinned.indexOf("FRESH EVENT"), "pinned event floats first (mirrors the site)");
}

{
  resetWireCache();
  const deps = fakeDb({ nothing: [] }); // wire path 404s → fails soft
  const news = await buildProjectNews(deps, "M3M Capital");
  ok(news === null, "wire read failure → null, never a throw");
}

{
  const data = {
    projects: [{ name: "DLF The Arbour", developer: "DLF", location: null, microMarket: "GCE", truthScore: 92, min_price_cr: 6.5, avg_cost_sqft: 22000, config: "4 BHK", deliveryYear: "2027", redFlags: null, delayRisk: null }],
    corridors: [], developers: ["DLF"], fetchedAt: 0,
  };
  const withWire = renderContext(data, [], [wireRow()]);
  ok(withWire.publicKnowledge.includes("NEWS & UPDATES"), "general context carries the cross-project news digest");
  ok(withWire.publicKnowledge.includes("M3M Capital — REGULATORY · CAUTION"), "digest line names project, category and impact");
  const withoutWire = renderContext(data, []);
  ok(!withoutWire.publicKnowledge.includes("NEWS & UPDATES"), "no wire rows → no news section (unchanged prompt)");
  const capped = renderContext(data, [], Array.from({ length: 40 }, (_, i) => wireRow({ headline: `E${i}` })));
  ok(capped.publicKnowledge.includes("25 most recent of 40"), "general digest caps at 25 and says so");
}

console.log(`\n${pass} checks passed.`);
