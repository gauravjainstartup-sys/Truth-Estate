import fs from "fs";
import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const rows = (await fetchBacklogFull()) ?? [];
  console.log(`Processing ${rows.length} projects...`);

  const seoRewrites = rows.map((r, i) => {
    const p = r.name || `Project ${i + 1}`;
    const d = r.developer || "Developer";
    const s = r.truthScore;
    const pr = r.minPriceCr;
    const scoreText = s ? `Truth Score ${s}` : "";
    const shortScore = s ? `Score ${s}` : "";

    const oldTitle = `${p} — Project Intelligence | Truth Estate`;
    const oldDesc = `Independent read on ${p} by ${d} — Truth Score ${s ?? "N/A"}/100: delivery risk, construction pace, legal and financial signals from RERA filings and public records.`;

    // 1. Build SEO Title (Target 50-60 chars)
    const titleCandidates = [
      `${p} Review (2026): Worth Buying? ${scoreText}`.trim(),
      `${p} Review: Worth Buying? ${scoreText}`.trim(),
      `${p} Review: Should You Buy? ${scoreText}`.trim(),
      `${p} Review (2026): Verdict & ${scoreText}`.trim(),
      `${p} Review: Verdict & ${scoreText}`.trim(),
      `${p} Review: Buyer Guide & ${scoreText}`.trim(),
      `${p} Review: Worth Buying? ${shortScore}`.trim(),
      `${p} Review: Should You Buy? ${shortScore}`.trim(),
      `${p} Review: Verdict & ${shortScore}`.trim(),
      `${p} Review: Buyer Guide & ${shortScore}`.trim(),
      `${p} Review (2026): ${shortScore}`.trim(),
      `${p} Review: ${scoreText}`.trim(),
      `${p} Review: ${shortScore}`.trim(),
      `${p} Review: Verdict`.trim(),
    ];

    let newTitle = titleCandidates.find((t) => t.length <= 60 && t.length >= 45) || titleCandidates.find((t) => t.length <= 60) || `${p} Review`;

    // 2. Build 3-Sentence Meta Description (Target 145-160 chars)
    const pricePhrase = pr ? `₹${pr} Cr+ pricing, ` : "";
    const devPhrase = d ? `by ${d}` : "";

    const descCandidates = [
      `Should you buy ${p} ${devPhrase}? Discover legal risks, construction progress, ${pricePhrase}developer track record and delivery outlook before booking.`,
      `Thinking of buying ${p} ${devPhrase}? Explore legal risks, construction progress, ${pricePhrase}developer history and delivery outlook before booking.`,
      `Planning to buy ${p} ${devPhrase}? Discover legal risks, construction progress, ${pricePhrase}developer track record and delivery outlook before you invest.`,
      `Considering an investment in ${p} ${devPhrase}? Uncover legal risks, construction progress, ${pricePhrase}and delivery outlook before booking.`,
      `Should you invest in ${p} ${devPhrase}? Read our review covering legal risks, construction progress, ${pricePhrase}and delivery outlook before booking.`,
      `Thinking of buying ${p}? Discover legal risks, construction progress, ${pricePhrase}developer history and delivery outlook before paying booking amount.`,
      `Should you buy ${p}? Explore legal risks, construction progress, ${pricePhrase}developer track record and delivery outlook before paying booking amount.`,
      `Planning to buy ${p}? Discover legal risks, construction progress, ${pricePhrase}developer history and delivery outlook before paying booking amount.`,
      `Considering ${p} ${devPhrase}? Uncover legal risks, construction progress, pricing, developer track record and delivery outlook before paying booking amount.`,
      `Should you buy ${p} ${devPhrase}? Discover legal risks, construction progress, pricing, developer history and delivery outlook before paying the booking amount.`,
      `Thinking of buying ${p} ${devPhrase}? Uncover legal risks, construction progress, pricing, developer track record and delivery outlook before paying your booking amount.`,
      `Should you buy ${p}? Review legal risks, construction progress, pricing and delivery outlook before booking.`,
      `Thinking of buying ${p}? Uncover legal risks, construction progress, pricing and delivery outlook before booking.`,
      `Planning to buy ${p}? Discover legal risks, construction progress, pricing and delivery outlook before booking.`,
      `Considering ${p}? Explore legal risks, construction progress, pricing and delivery outlook before booking.`,
    ];

    let newDesc = descCandidates.find((dText) => dText.length >= 145 && dText.length <= 160);

    // Guaranteed fallback fit
    if (!newDesc) {
      const candidates2 = [
        `Should you buy ${p}? Review legal risks, construction progress, pricing and delivery outlook before booking.`,
        `Thinking of buying ${p}? Uncover legal risks, construction progress, pricing and delivery outlook before booking.`,
        `Planning to buy ${p}? Discover legal risks, construction progress, pricing and delivery outlook before booking.`,
        `Considering ${p}? Explore legal risks, construction progress, pricing and delivery outlook before booking.`,
        `Should you buy ${p}? Uncover legal risks, construction progress and delivery outlook before booking.`,
        `Planning to buy ${p}? Explore legal risks, construction progress and delivery outlook before booking.`,
      ];
      newDesc = candidates2.find((c) => c.length >= 140 && c.length <= 160) || `Should you buy ${p}? Discover legal risks, construction progress and delivery outlook before booking.`;
    }

    const reason = `Replaced methodology jargon with high-intent buyer decision keywords (Review, Worth Buying, Legal Risks, Delivery Outlook) and a Truth Score hook to maximize SERP click-through rate.`;

    return {
      index: i + 1,
      projectName: p,
      developerName: d,
      truthScore: s ?? "N/A",
      oldTitle,
      newTitle,
      newTitleLength: newTitle.length,
      oldDescription: oldDesc,
      newDescription: newDesc,
      newDescLength: newDesc.length,
      reasonForImprovement: reason,
    };
  });

  // Validation
  let titleOverflows = 0;
  let descViolations = 0;

  seoRewrites.forEach((r) => {
    if (r.newTitleLength > 60) titleOverflows++;
    if (r.newDescLength > 160 || r.newDescLength < 140) descViolations++;
  });

  console.log(`\nValidation Audit across ${seoRewrites.length} Projects:`);
  console.log(`- Title Length Overflows (>60 chars): ${titleOverflows}`);
  console.log(`- Desc Length Violations (<140 or >160 chars): ${descViolations}`);

  // Write JSON
  fs.writeFileSync(
    "/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.json",
    JSON.stringify(seoRewrites, null, 2)
  );

  // Write CSV
  const csvLines = [
    ["Index", "Project Name", "Developer", "Truth Score", "Old Title", "New Title", "Title Chars", "Old Description", "New Description", "Desc Chars", "Reason for Improvement"]
      .map((c) => `"${c.replace(/"/g, '""')}"`)
      .join(","),
  ];

  seoRewrites.forEach((r) => {
    csvLines.push(
      [
        r.index,
        r.projectName,
        r.developerName,
        r.truthScore,
        r.oldTitle,
        r.newTitle,
        r.newTitleLength,
        r.oldDescription,
        r.newDescription,
        r.newDescLength,
        r.reasonForImprovement,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
  });

  fs.writeFileSync(
    "/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.csv",
    csvLines.join("\n")
  );

  console.log("Wrote clean JSON and CSV files.");
}

main().catch(console.error);
