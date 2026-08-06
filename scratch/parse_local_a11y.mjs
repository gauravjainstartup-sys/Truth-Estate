import fs from "fs";

function parseScores(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  const categories = json.categories;
  const audits = json.audits;

  const failedAudits = categories.accessibility.auditRefs
    .map((ref) => audits[ref.id])
    .filter((a) => a && a.score !== null && a.score < 1);

  return {
    a11yScore: Math.round(categories.accessibility.score * 100),
    perfScore: Math.round(categories.performance.score * 100),
    failedCount: failedAudits.length,
    audits,
  };
}

const prod = parseScores("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/lh-prod-desktop.json");
const localFinal = parseScores("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/lh-local-desktop-final.json");

console.log("=== ACCESSIBILITY COMPARISON: LIVE PROD VS LOCAL CODEBASE ===");
console.log(`Live Production (truthestate.in): Accessibility Score = ${prod.a11yScore} / 100`);
console.log(`New Local Codebase (localhost):    Accessibility Score = ${localFinal.a11yScore} / 100`);
console.log(`Improvement:                      +${localFinal.a11yScore - prod.a11yScore} points!`);

console.log("\n=== FAILED AUDIT BREAKDOWN ===");
console.log(`Live Prod Failed Audit Items: ${prod.failedCount}`);
console.log(`New Local Failed Audit Items:  ${localFinal.failedCount}`);
