/* ════════════════════════════════════════════════════════════════
   GENERATE — one command turns a current-engine advisor HTML into the
   complete DB-centric, access-gated 3D deliverable set for that project:

     db3d/projects/<slug>/pieces/*.json     the 7 DB pieces
     db3d/projects/<slug>/<slug>.model.json the gated API's full response
     db3d/projects/<slug>/seed-<slug>.sql   DB load (run after schema.sql)
     db3d/engine/engine-<slug>.html         the IP-free engine (leak-scanned)
     db3d/projects/<slug>/<slug>-3D-demo.zip one-command runnable demo (--zip)

   And PROVES it before finishing: gate suite + numeric site parity +
   per-flat three-way parity (new engine ↔ monolith ↔ stored intelligence).

   usage:
     node db3d/generate.mjs public/tower-intel/<slug>.html [--name "Exact DB Name"] [--zip] [--skip-parity]

   Works on current-engine advisors (FLATW + PLATE + subScores v2).
   Pre-v2 files (e.g. dlf-arbour) must be regenerated via the add-project
   skill first — extraction fails loudly on them by design.
   ════════════════════════════════════════════════════════════════ */
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const HTML = process.argv[2];
if (!HTML || !existsSync(HTML)) { console.error("usage: generate.mjs <advisor.html> [--name \"…\"] [--zip] [--skip-parity]"); process.exit(1); }
const SLUG = path.basename(HTML).replace(/\.html$/, "");
const DIR = `db3d/projects/${SLUG}`;
const nameIx = process.argv.indexOf("--name");
const ZIP = process.argv.includes("--zip");
const SKIP_PARITY = process.argv.includes("--skip-parity");
const run = (title, cmd, args) => {
  console.log(`\n━━ ${title} ━━`);
  execFileSync(cmd, args, { stdio: "inherit" });
};

// 1. geometry pieces
run("1/6 extract pieces", "node", ["db3d/extract-pieces.mjs", HTML, ...(nameIx > 0 ? ["--name", process.argv[nameIx + 1]] : [])]);

// 2. intelligence — run the REAL monolith headless (the scoring stays server-side)
run("2/6 pre-compute intelligence (headless engine run)", "node",
  [".claude/skills/extract-intelligence/extract.mjs", HTML, `${DIR}/pieces/intelligence.raw.json`]);

// 3. reshape to DB rows
run("3/6 reshape intelligence", "node", ["db3d/reshape-intelligence.mjs", SLUG]);

// 4. bundle + seed
run("4/6 bundle + seed", "node", ["db3d/make-bundle.mjs", SLUG]);

// 5. the IP-free engine (+ built-in leak scan)
run("5/6 build IP-free engine", "node", ["db3d/build-engine.mjs", HTML]);
if (!existsSync("db3d/engine/three.min.js")) copyFileSync("public/tower-intel/three.min.js", "db3d/engine/three.min.js");

// 6. proof: gate suite + parity against the monolith (mock started here)
if (!SKIP_PARITY) {
  console.log("\n━━ 6/6 prove it (gate suite + three-way parity) ━━");
  execFileSync("node", ["db3d/test-gate.mjs"], { stdio: "inherit" });
  const mock = spawn("node", ["db3d/mock-api.mjs", "--silent"], { stdio: "ignore", detached: false });
  try {
    await new Promise((r) => setTimeout(r, 1200));
    execFileSync("node", ["db3d/render-parity.mjs", SLUG, HTML], { stdio: "inherit" });
  } finally { mock.kill(); }
} else console.log("\n━━ 6/6 parity SKIPPED (--skip-parity) ━━");

// optional: the runnable demo zip (engine + gate + this project's pieces)
if (ZIP) {
  const zipPath = `${DIR}/${SLUG}-3D-demo.zip`;
  const py = `
import zipfile, os
z = zipfile.ZipFile(${JSON.stringify(zipPath)}, "w", zipfile.ZIP_DEFLATED)
base = ${JSON.stringify(SLUG + "-3D-demo")}
z.write("db3d/DEMO.md", f"{base}/README.md")
z.write("db3d/mock-api.mjs", f"{base}/mock-api.mjs")
for f in sorted(os.listdir(${JSON.stringify(DIR + "/pieces")})):
    z.write(${JSON.stringify(DIR + "/pieces")} + "/" + f, f"{base}/projects/${SLUG}/pieces/{f}")
z.write(${JSON.stringify("db3d/engine/engine-" + SLUG + ".html")}, f"{base}/engine/engine-${SLUG}.html")
z.write("db3d/engine/three.min.js", f"{base}/engine/three.min.js")
z.close()
p = ${JSON.stringify(zipPath)}
print("[zip]", p, f"{os.path.getsize(p)//1024} KB")
`;
  execFileSync("python3", ["-c", py], { stdio: "inherit" });
}

console.log(`\n━━ DONE — ${SLUG} ━━`);
for (const f of readdirSync(DIR).sort()) {
  const p = path.join(DIR, f);
  const sz = f === "pieces" ? `${readdirSync(p).length} files` : `${(readFileSync(p).length / 1024).toFixed(0)} KB`;
  console.log(`  ${p}  (${sz})`);
}
console.log(`  db3d/engine/engine-${SLUG}.html  (IP-free — leak-scanned)`);
console.log(`\nDemo: node db3d/mock-api.mjs → http://localhost:8791/engine-${SLUG}.html?sub=buyer@demo`);
