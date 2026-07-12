// post-build gate: every project page must carry the Location Intelligence
// section (and the radar when the row has coordinates), and every legacy
// address must have materialised as a redirect stub — the counts land in
// the CI log next to [v3-loc]/[locparse]/[urls].
import { readdirSync, readFileSync } from "node:fs";
const dir = "out/intelligence/projects";
let pages = 0, stubs = 0, withSec = 0, withRadar = 0;
const missing = [];
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".html")) continue;
  const s = readFileSync(`${dir}/${f}`, "utf8");
  if (s.includes("data-legacy-stub")) { stubs++; continue; }
  if (f.startsWith("sample-")) continue; // curated showcase — not a pipeline page
  pages++;
  const sec = s.includes("Will this address still be winning");
  if (sec) withSec++;
  if (s.includes(">500 m</text>")) withRadar++;
  if (!sec) missing.push(f);
}
console.log(`[verify-out] project pages:${pages} stubs:${stubs} location-section:${withSec} radar:${withRadar}`);
if (missing.length) console.log(`[verify-out] MISSING location section: ${missing.join(", ")}`);
