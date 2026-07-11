// post-build gate: every live project page must carry the Location
// Intelligence section (and the radar when the row has coordinates) —
// the counts land in the CI log next to [v3-loc]/[locparse].
import { readdirSync, readFileSync } from "node:fs";
const dir = "out/intelligence/projects";
let total = 0, withSec = 0, withRadar = 0;
const missing = [];
for (const f of readdirSync(dir)) {
  if (!f.startsWith("live-") || !f.endsWith(".html")) continue;
  total++;
  const s = readFileSync(`${dir}/${f}`, "utf8");
  const sec = s.includes("Will this address still be winning");
  if (sec) withSec++;
  if (s.includes(">500 m</text>")) withRadar++;
  if (!sec) missing.push(f);
}
console.log(`[verify-out] live pages:${total} location-section:${withSec} radar:${withRadar}`);
if (missing.length) console.log(`[verify-out] MISSING location section: ${missing.join(", ")}`);
