import fs from "fs";

const raw = fs.readFileSync("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/lh-prod-desktop.json", "utf-8");
const json = JSON.parse(raw);

const a11yAudits = json.categories.accessibility.auditRefs;
const audits = json.audits;

console.log("=== FAILED ACCESSIBILITY AUDITS ON HOMEPAGE ===");
for (const ref of a11yAudits) {
  const audit = audits[ref.id];
  if (audit && audit.score !== null && audit.score < 1) {
    console.log(`\n❌ [${audit.id}] ${audit.title} (Score: ${audit.score})`);
    console.log(`   Description: ${audit.description}`);
    if (audit.details && audit.details.items) {
      console.log(`   Affected Elements (${audit.details.items.length}):`);
      audit.details.items.slice(0, 5).forEach((item, idx) => {
        console.log(`     ${idx + 1}. Snippet: ${item.node?.snippet ?? item.snippet ?? "N/A"}`);
        console.log(`        Explanation: ${item.explanation ?? item.node?.explanation ?? ""}`);
      });
    }
  }
}
