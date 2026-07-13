/* Parity render — the DB-driven engine (fetching from the gated mock) vs the
   current monolithic file. Screenshots both overviews for side-by-side compare
   and reports any console/page errors from the new engine's boot. */
import { chromium } from "/home/user/Truth-Estate/node_modules/playwright/index.mjs";
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
    try { return { topH: topH(), FLOORS, FH, LOBBY, LAT: +LAT.toFixed(6), towers: towers.length, configs: Object.keys(CONFIGS).length }; } catch { return null; }
  }).catch(() => null);
  await page.close();
  console.log(`[${tag}] booted=${booted} · ${JSON.stringify(parity)} · shot→${out}${errs.length ? "\n  " + errs.slice(0, 6).join("\n  ") : "  · no errors"}`);
  return { booted, errs, parity };
}

const a = await shoot(NEW_URL, "db3d/engine/shot-new.png", "DB-engine");
const b = await shoot(CUR_URL, "db3d/engine/shot-current.png", "current ");
await browser.close();

const same = a.parity && b.parity && JSON.stringify(a.parity) === JSON.stringify(b.parity);
console.log(same
  ? `\n✓ numeric parity: identical — ${JSON.stringify(a.parity)}`
  : `\n✗ PARITY MISMATCH\n  DB-engine: ${JSON.stringify(a.parity)}\n  current:   ${JSON.stringify(b.parity)}`);
process.exit(a.booted && b.booted && same ? 0 : 1);
