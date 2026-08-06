import fs from "fs";

const raw = JSON.parse(
  fs.readFileSync("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.json", "utf-8")
);

const violations = raw.filter((r) => r.newDescLength > 160 || r.newDescLength < 145);
console.log(`Found ${violations.length} description violations:`);

violations.forEach((v) => {
  console.log(`\nIndex ${v.index}: ${v.projectName} (Len: ${v.newDescLength})`);
  console.log(`  Desc: "${v.newDescription}"`);
});
