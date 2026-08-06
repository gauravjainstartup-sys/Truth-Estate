import fs from "fs";

function printScores(filePath, title) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);

  const categories = json.categories;
  const audits = json.audits;

  console.log(`\n==================================================`);
  console.log(`  ${title}`);
  console.log(`==================================================`);
  console.log(`- Performance: ${Math.round(categories.performance.score * 100)} / 100`);
  console.log(`- Accessibility: ${Math.round(categories.accessibility.score * 100)} / 100`);
  console.log(`- Best Practices: ${Math.round(categories["best-practices"].score * 100)} / 100`);
  console.log(`- SEO: ${Math.round(categories.seo.score * 100)} / 100`);

  console.log("\n--- Core Web Vitals & Real Timings ---");
  console.log(`- First Contentful Paint (FCP): ${audits["first-contentful-paint"].displayValue}`);
  console.log(`- Largest Contentful Paint (LCP): ${audits["largest-contentful-paint"].displayValue}`);
  console.log(`- Total Blocking Time (TBT): ${audits["total-blocking-time"].displayValue}`);
  console.log(`- Cumulative Layout Shift (CLS): ${audits["cumulative-layout-shift"].displayValue}`);
  console.log(`- Speed Index: ${audits["speed-index"].displayValue}`);
}

printScores("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/lh-prod-desktop.json", "REAL LIGHTHOUSE DESKTOP RESULTS (https://truthestate.in)");
printScores("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/lh-prod-mobile.json", "REAL LIGHTHOUSE MOBILE RESULTS (https://truthestate.in)");
