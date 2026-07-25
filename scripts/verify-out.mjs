// post-build gate: every project page must carry the Location Intelligence
// section (and the radar when the row has coordinates), and every legacy
// address must have materialised as a redirect stub — the counts land in
// the CI log next to [v3-loc]/[locparse]/[urls].
import { readdirSync, readFileSync } from "node:fs";
/* Reports moved to /projects/<seo slug>; /intelligence/projects keeps the
   redirect stubs for the address this build used to serve.

   BOTH are checked. Pointing this at one directory reported "project
   pages:0" on a perfectly good build and went unnoticed — which is how a
   missing Location Intelligence section survived on all 97 reports. A
   verifier that cannot fail is worse than no verifier, so an empty
   directory is now an explicit complaint rather than a silent zero. */
const dirs = ["out/projects", "out/intelligence/projects"];
let pages = 0, stubs = 0, withSec = 0, withRadar = 0;
const missing = [];
const files = dirs.flatMap((d) => {
  let names = [];
  try { names = readdirSync(d); } catch { console.log(`[verify-out] MISSING DIRECTORY ${d}`); }
  if (!names.length) console.log(`[verify-out] EMPTY ${d}`);
  return names.filter((f) => f.endsWith(".html")).map((f) => [d, f]);
});
for (const [dir, f] of files) {
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
