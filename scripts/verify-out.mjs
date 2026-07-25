// post-build gate over the exported report pages.
//
// WHAT IT USED TO ASSERT, AND WHY THAT WAS WRONG: that every project page
// carries the Location Intelligence section. It cannot. That section is paid
// content — ProjectProfile renders <LockedReport> unless readAccess, and
// readAccess starts false and is only set in an effect, so the STATIC html of
// a real report is always the locked teaser. The check could never pass, and
// it printed "location-section:0" on every good build since it was written.
// Read as a product failure it says a pillar of the paid report is missing;
// what it actually says is that the paywall works.
//
// So each page is now checked against what it is SUPPOSED to contain:
//   locked report → the unlock teaser, and NOT the paid pillars
//   sample read   → the paid pillars, since it is never gated
//   legacy stub   → a redirect
import { readdirSync, readFileSync } from "node:fs";

const dirs = ["out/projects", "out/intelligence/projects"];
const files = dirs.flatMap((d) => {
  let names = [];
  try { names = readdirSync(d); } catch { console.log(`[verify-out] MISSING DIRECTORY ${d}`); }
  if (!names.length) console.log(`[verify-out] EMPTY ${d}`);
  return names.filter((f) => f.endsWith(".html")).map((f) => [d, f]);
});

const PAID_MARKER = "Will this address still be winning";
const LOCK_MARKER = 'id="unlock"';

let stubs = 0, locked = 0, samples = 0;
const leaked = [], unlockless = [], sampleBare = [];

for (const [dir, f] of files) {
  const s = readFileSync(`${dir}/${f}`, "utf8");
  if (s.includes("data-legacy-stub")) { stubs++; continue; }

  if (f.startsWith("sample-")) {
    samples++;
    // the one page that is never paywalled — it must show the analysis
    if (!s.includes(PAID_MARKER)) sampleBare.push(f);
    continue;
  }

  locked++;
  // paid pillars must NOT be in a public file
  if (s.includes(PAID_MARKER)) leaked.push(f);
  // and the unlock surface must be
  if (!s.includes(LOCK_MARKER)) unlockless.push(f);
}

console.log(`[verify-out] locked reports:${locked} samples:${samples} stubs:${stubs}`);
if (leaked.length) console.log(`[verify-out] PAID CONTENT IN PUBLIC HTML (${leaked.length}): ${leaked.slice(0, 5).join(", ")}`);
if (unlockless.length) console.log(`[verify-out] NO UNLOCK SURFACE (${unlockless.length}): ${unlockless.slice(0, 5).join(", ")}`);
if (sampleBare.length) console.log(`[verify-out] SAMPLE MISSING ITS ANALYSIS: ${sampleBare.join(", ")}`);
if (!locked) console.log("[verify-out] NO REPORT PAGES FOUND — the export or this path is wrong");
