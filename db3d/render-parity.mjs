/* Parity render — the DB-driven engine (fetching from the gated mock) vs the
   current monolithic file. Screenshots both overviews for side-by-side compare
   and reports any console/page errors from the new engine's boot. */
import { chromium } from "/home/user/Truth-Estate/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
import path from "node:path";

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const ENGINE_PORT = process.env.ENGINE_PORT || 8899;
const API_PORT = process.env.API_PORT || 8791;
const NEW_URL = `http://localhost:${ENGINE_PORT}/tower-engine.html?api=http://localhost:${API_PORT}&slug=signature-global-titanium-spr&sub=buyer@demo`;
const CUR_URL = "file://" + path.resolve("public/tower-intel/signature-global-titanium-spr.html");

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});

async function shoot(url, out, tag) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE.ERR: " + m.text()); });
  page.on("requestfailed", (r) => errs.push("REQFAIL: " + r.url() + " " + (r.failure()?.errorText || "")));
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  // both engines add body.booted ~1.5s after the overview renders
  let booted = true;
  try { await page.waitForFunction(() => document.body.classList.contains("booted"), undefined, { timeout: 40000 }); }
  catch { booted = false; }
  await page.waitForTimeout(4200); // let the scene settle / intro camera ease to the wide overview
  await page.screenshot({ path: out });
  // numeric parity: new engine exposes window.__PARITY; the current file's globals are bare
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
  console.log(`[${tag}] booted=${booted} · ${JSON.stringify(parity)} · shot→${out}${errs.length ? "\n  " + errs.slice(0, 6).join("\n  ") : "  · no errors"}`);
  return { booted, errs, parity };
}

const a = await shoot(NEW_URL, "db3d/engine/shot-new.png", "DB-engine");
const b = await shoot(CUR_URL, "db3d/engine/shot-current.png", "current ");
await browser.close();

// site-level parity (everything but the flats)
const strip = (p) => p && Object.fromEntries(Object.entries(p).filter(([k]) => k !== "flats"));
const siteSame = a.parity && b.parity && JSON.stringify(strip(a.parity)) === JSON.stringify(strip(b.parity));
console.log(siteSame
  ? `\n✓ site parity: identical — ${JSON.stringify(strip(a.parity))}`
  : `\n✗ SITE PARITY MISMATCH\n  DB-engine: ${JSON.stringify(strip(a.parity))}\n  current:   ${JSON.stringify(strip(b.parity))}`);

// per-flat parity, three-way: new engine ↔ current file ↔ stored intelligence
const stored = JSON.parse(readFileSync("db3d/pieces/intelligence.json", "utf8"))
  .map((r) => ({ t: r.tower_id, u: r.unit, s: r.composite, g: r.grade }))
  .sort((x, y) => x.t.localeCompare(y.t) || x.u.localeCompare(y.u));
const A = a.parity?.flats ?? [], B = b.parity?.flats ?? [];
let flatsSame = A.length === 16 && B.length === 16 && stored.length === 16;
const rows = [];
for (let i = 0; i < Math.max(A.length, B.length, stored.length); i++) {
  const n = A[i], c = B[i], s = stored[i];
  const okRow = n && c && s && n.t === c.t && n.u === c.u && s.t === n.t && s.u === n.u && n.s === c.s && n.s === s.s && n.g === c.g && n.g === s.g;
  if (!okRow) flatsSame = false;
  rows.push(`  ${okRow ? "✓" : "✗"} ${(n ?? c ?? s)?.t}/${(n ?? c ?? s)?.u}  new=${n?.s}${n?.g ?? ""} cur=${c?.s}${c?.g ?? ""} stored=${s?.s}${s?.g ?? ""}`);
}
console.log(`${flatsSame ? "✓" : "✗"} per-flat parity (new ↔ current ↔ stored), ${A.length} flats:`);
console.log(rows.join("\n"));
process.exit(a.booted && b.booted && siteSame && flatsSame ? 0 : 1);
