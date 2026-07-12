/* ════════════════════════════════════════════════════════════════
   EXTRACT INTELLIGENCE — pull every flat's Sun·Heat·Vastu read out of a
   project's 3D advisor into DB-ready JSON for the chatbot.

   Runs the real advisor headless, computes the scores the same way the
   page does (computeScores2), then enriches each flat with within-project
   ranks, its weakest dimension, and the authoritative Vastu room reasons
   the engine itself emits. One engine run → the whole project's brain.

   Usage (from repo root):
     node .claude/skills/extract-intelligence/extract.mjs <html-path> [out.json]
   e.g.
     node .claude/skills/extract-intelligence/extract.mjs \
       public/tower-intel/signature-global-titanium-spr.html \
       scratchpad/advisor/signature-global-titanium-spr.intel.json

   Defensive by design: the Vastu enrichment is best-effort (try/catch per
   call) so the extractor still yields the core scores if a project file's
   engine differs slightly. Fail-soft, never a half-written file.
   ════════════════════════════════════════════════════════════════ */

import { chromium } from "/home/user/Truth-Estate/node_modules/playwright/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const htmlArg = process.argv[2];
if (!htmlArg) { console.error("usage: extract.mjs <html-path> [out.json]"); process.exit(1); }
const htmlPath = path.resolve(htmlArg);
const slug = path.basename(htmlPath).replace(/\.html$/, "");
const out = path.resolve(process.argv[3] || `scratchpad/advisor/${slug}.intel.json`);

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE.ERR:", m.text()); });

await page.goto("file://" + htmlPath, { waitUntil: "load", timeout: 60000 });
// engine globals are top-level const/let — bare names, not window.*
try {
  await page.waitForFunction(
    () => typeof computeScores2 === "function" && typeof towers !== "undefined" && towers[0]?.units?.length > 0,
    undefined, { timeout: 45000 },
  );
} catch {
  const probe = await page.evaluate(() => ({
    computeScores2: typeof computeScores2 === "function",
    computeScores_v1: typeof computeScores === "function",   // older engine
    towers: typeof towers !== "undefined",
  })).catch(() => ({}));
  console.error(`[extract] ${slug}: the current engine isn't exposed. Found ${JSON.stringify(probe)}.`);
  console.error(`This extractor targets the CURRENT engine (computeScores2). Older advisor files (e.g. dlf-arbour, which still has computeScores v1) predate it — regenerate them from the add-project template first, then extract.`);
  await browser.close();
  process.exit(2);
}

const raw = await page.evaluate(() => {
  const r6 = (x) => (typeof x === "number" ? Math.round(x * 1e6) / 1e6 : x);
  const safe = (fn, d) => { try { return fn(); } catch { return d; } };

  computeScores2();
  const weights = safe(() => WEIGHTS, null); // the engine's top-level `let WEIGHTS` (bare name; not on window)

  const flats = [];
  for (const row of scores) {
    const t = row.t;
    for (const o of row.us) {
      const u = o.u, fs = o.fs, sub = fs.sub || {};
      const cfg = safe(() => CONFIGS[t.cfg], {}) || {};
      const facing = safe(() => vfacing(t, u), fs.c);
      // Vastu room detail — the authoritative "why" the engine already knows
      const beds = cfg.beds ?? 3;
      const rooms = beds === 4
        ? ["entrance", "living", "masterBed", "kitchen", "bed2", "bed3", "pooja", "bathroom"]
        : ["entrance", "living", "masterBed", "kitchen", "bed2", "bed3", "bathroom"];
      const plateCfgVal = safe(() => plateCfg(t, u), t.cfg);
      const vastuRooms = {};
      for (const rk of rooms) {
        const rr = safe(() => vastuRoomScore(rk, facing, plateCfgVal, u.mir), null);
        if (rr) vastuRooms[rk] = { dir: rr.dir, score: rr.score, ideal: rr.ideal, reason: rr.reason };
      }
      const vastuOverall = safe(() => vastuFor(facing).n, null);

      flats.push({
        tower: t.id, unit: u.id, config: t.cfg,
        carpet_sqft: cfg.carpetSqft ?? null, super_sqft: cfg.saleable ?? null, balcony_sqft: cfg.balconySqft ?? null,
        score: fs.s, grade: fs.grade, facing,
        morning: sub.morning ?? null, cool: sub.cool ?? null, vastu: sub.vastu ?? null,
        view: sub.view ?? null, airflow: sub.vent ?? null, floor_score: sub.floor ?? null,
        sun_winter_h: r6(o.st?.rawAvg), sun_am_h: r6(o.st?.amAvg), sun_pm_h: r6(o.st?.pmAvg),
        is_lake: !!fs.lake, is_corner: !!fs.isEnd,
        vastu_overall: vastuOverall, vastu_rooms: vastuRooms,
      });
    }
  }
  return {
    tower_ranking: scores.map((r) => r.t.id),
    best: (() => { const b = [...flats].sort((a, c) => c.score - a.score)[0]; return b ? { tower: b.tower, unit: b.unit, score: b.score } : null; })(),
    weights,
    flats,
  };
});

await browser.close();

// ── within-project ranks + weakest dimension (computed in Node) ──
const DIMS = ["morning", "cool", "vastu", "view", "airflow", "floor_score"];
const flats = raw.flats;
const rankOf = (key) => {
  const order = [...flats].filter((f) => f[key] != null).sort((a, b) => b[key] - a[key]);
  const rank = new Map();
  order.forEach((f, i) => rank.set(f, i + 1));
  return rank;
};
const overallRank = rankOf("score");
const dimRanks = Object.fromEntries(DIMS.map((d) => [d, rankOf(d)]));
for (const f of flats) {
  f.rank = { overall: overallRank.get(f) ?? null, of: flats.length };
  for (const d of DIMS) f.rank[d === "floor_score" ? "floor" : d] = dimRanks[d].get(f) ?? null;
  // weakest of the six scored dimensions — the honest "but…"
  let weak = null, weakV = Infinity;
  for (const d of DIMS) if (f[d] != null && f[d] < weakV) { weakV = f[d]; weak = d === "floor_score" ? "floor" : d; }
  f.weakest_dim = weak;
}

const doc = {
  project: slug,
  generated_at: new Date().toISOString(),
  source: path.relative(process.cwd(), htmlPath),
  summary: { tower_ranking: raw.tower_ranking, best_flat: raw.best, weights: raw.weights },
  flats,
};

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
console.log(`INTEL written: ${flats.length} flats across ${raw.tower_ranking.length} towers → ${path.relative(process.cwd(), out)}`);
console.log(`best: ${raw.best?.tower}/${raw.best?.unit} (${raw.best?.score}) · ranking ${raw.tower_ranking.join(" › ")}`);
