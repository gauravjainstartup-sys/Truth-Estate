/* Parity proof for one project — the DB-driven engine (served BY the running
   mock gate, same origin) vs that project's current monolithic advisor.
   Asserts: site numbers identical + per-flat (score, grade) identical
   three-way: new engine ↔ current file ↔ stored intelligence.

   usage: node db3d/render-parity.mjs <slug> <advisor-html>
   expects: mock-api already listening on :8791 (generate.mjs starts it). */
import { chromium } from "/home/user/Truth-Estate/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
import path from "node:path";

const SLUG = process.argv[2];
const CUR = process.argv[3];
if (!SLUG || !CUR) { console.error("usage: render-parity.mjs <slug> <advisor-html>"); process.exit(1); }
const API_PORT = process.env.API_PORT || 8791;
const NEW_URL = `http://localhost:${API_PORT}/engine-${SLUG}.html?sub=buyer@demo`;
const CUR_URL = "file://" + path.resolve(CUR);
const SHOTS = `db3d/projects/${SLUG}`;

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});

async function shoot(url, out, tag) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push("CONSOLE.ERR: " + m.text()); });
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  let booted = true;
  try { await page.waitForFunction(() => document.body.classList.contains("booted"), undefined, { timeout: 60000 }); }
  catch { booted = false; }
  await page.waitForTimeout(4200); // intro camera ease
  await page.screenshot({ path: out });
  const parity = await page.evaluate(() => {
    if (window.__PARITY) return window.__PARITY;
    try {
      if (!scores) computeScores2();
      return {
        topH: topH(), FLOORS, FH, LOBBY, LAT: +LAT.toFixed(6), towers: towers.length, configs: Object.keys(CONFIGS).length,
        flats: scores.flatMap((sc) => sc.us.map((o) => ({ t: sc.t.id, u: o.u.id, s: o.fs.s, g: o.fs.grade })))
          .sort((a, b) => a.t.localeCompare(b.t) || a.u.localeCompare(b.u)),
      };
    } catch { return null; }
  }).catch(() => null);
  await page.close();
  console.log(`[${tag}] booted=${booted} · flats=${parity?.flats?.length ?? "—"} · shot→${out}${errs.length ? "\n  " + errs.slice(0, 6).join("\n  ") : ""}`);
  return { booted, errs, parity };
}

const a = await shoot(NEW_URL, `${SHOTS}/shot-new.png`, "DB-engine");
const b = await shoot(CUR_URL, `${SHOTS}/shot-current.png`, "current ");
await browser.close();

const strip = (p) => p && Object.fromEntries(Object.entries(p).filter(([k]) => k !== "flats"));
const siteSame = a.parity && b.parity && JSON.stringify(strip(a.parity)) === JSON.stringify(strip(b.parity));
console.log(siteSame
  ? `✓ site parity: identical — ${JSON.stringify(strip(a.parity))}`
  : `✗ SITE PARITY MISMATCH\n  DB-engine: ${JSON.stringify(strip(a.parity))}\n  current:   ${JSON.stringify(strip(b.parity))}`);

const stored = JSON.parse(readFileSync(`db3d/projects/${SLUG}/pieces/intelligence.json`, "utf8"))
  .map((r) => ({ t: r.tower_id, u: r.unit, s: r.composite, g: r.grade }))
  .sort((x, y) => x.t.localeCompare(y.t) || x.u.localeCompare(y.u));
const A = a.parity?.flats ?? [], B = b.parity?.flats ?? [];
const want = stored.length;
let flatsSame = A.length === want && B.length === want && want > 0;
const bad = [];
for (let i = 0; i < Math.max(A.length, B.length, stored.length); i++) {
  const n = A[i], c = B[i], s = stored[i];
  const ok = n && c && s && n.t === c.t && n.u === c.u && s.t === n.t && s.u === n.u && n.s === c.s && n.s === s.s && n.g === c.g && n.g === s.g;
  if (!ok) { flatsSame = false; bad.push(`  ✗ ${(n ?? c ?? s)?.t}/${(n ?? c ?? s)?.u} new=${n?.s}${n?.g ?? ""} cur=${c?.s}${c?.g ?? ""} stored=${s?.s}${s?.g ?? ""}`); }
}
console.log(flatsSame
  ? `✓ per-flat parity (new ↔ current ↔ stored): ${want}/${want} exact`
  : `✗ PER-FLAT MISMATCH (${bad.length} of ${want}):\n${bad.slice(0, 12).join("\n")}`);
process.exit(a.booted && b.booted && siteSame && flatsSame ? 0 : 1);
