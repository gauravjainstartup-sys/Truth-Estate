/* Offline tests for the brief inference. No network, no Deno.
   Run with:  node --experimental-strip-types test-offline.mjs

   Imports core.ts directly and lets node strip the types, rather than
   regex-mangling the source — the mangling silently produced a DIFFERENT
   function, which is precisely the class of bug these tests exist to
   catch. What runs here is what deploys. */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const { inferBrief, slugify, weightedMedian, weightFor, MIN_PROJECTS } =
  await import(join(dir, "core.ts"));

let pass = 0, fail = 0;
const t = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${extra ? "  — " + extra : ""}`); }
};

/* Real rows, copied from backlog_listing_public_v3. */
const CAT = [
  { name: "DLF The Arbour",   microMarket: "Golf Course Road Extension (GCRE)", min_price_cr: 9.5,  config: "4BHK",  min_bhk_num: 4, avg_cost_sqft: 21550, truthScore: 88 },
  { name: "DLF Privana South",microMarket: "Golf Course Road Extension (GCRE)", min_price_cr: 7.5,  config: "4BHK",  min_bhk_num: 4, avg_cost_sqft: 20100, truthScore: 84 },
  { name: "M3M Golf Hills",   microMarket: "Golf Course Road Extension (GCRE)", min_price_cr: 8.2,  config: "3BHK+", min_bhk_num: 3, avg_cost_sqft: 19800, truthScore: 71 },
  { name: "M3M Capital",      microMarket: "Dwarka Expressway",                 min_price_cr: 2.1,  config: "2BHK+", min_bhk_num: 2, avg_cost_sqft: 18250, truthScore: 76 },
  { name: "Sobha City",       microMarket: "New Gurgaon",                       min_price_cr: 2.4,  config: "3BHK",  min_bhk_num: 3, avg_cost_sqft: 13466, truthScore: 69 },
];
const ev = (name, slug, t) => ({ name, project_slug: slug, created_at: `2026-07-25T${t}:00Z` });

console.log("\nslugify matches liveSlug / modelSlugFor");
t("DLF The Arbour",  slugify("DLF The Arbour") === "dlf-the-arbour");
t("M3M Capital",     slugify("M3M Capital") === "m3m-capital");
t("trims punctuation", slugify("Elan the Emperor!") === "elan-the-emperor");
t("collapses runs",  slugify("A  --  B") === "a-b");

console.log("\nthe threshold");
{
  const b = inferBrief([ev("report_viewed", "dlf-the-arbour", "10:00")], CAT);
  t("one report is not enough", b.enough === false);
  t("no corridor guessed", b.corridor.value === null);
  t("no budget guessed", b.budgetCr.value === null);
  t("says how many more are needed", b.corridor.evidence.includes(`${MIN_PROJECTS - 1} more`));
  t("still reports what was read", b.reportsRead === 1 && b.projects[0].slug === "dlf-the-arbour");
}
{
  const b = inferBrief([
    ev("report_viewed", "dlf-the-arbour", "10:00"),
    ev("report_viewed", "dlf-privana-south", "10:05"),
  ], CAT);
  t("two reports is not enough", b.enough === false, `reportsRead=${b.reportsRead}`);
}

console.log("\nthree reports on one corridor");
{
  const b = inferBrief([
    ev("report_viewed", "dlf-the-arbour", "10:00"),
    ev("report_viewed", "dlf-privana-south", "10:05"),
    ev("report_viewed", "m3m-golf-hills", "10:09"),
  ], CAT);
  t("enough", b.enough === true);
  t("corridor is GCRE", b.corridor.value?.[0] === "Golf Course Road Extension (GCRE)", JSON.stringify(b.corridor));
  t("corridor evidence is checkable", /3 of the reports/.test(b.corridor.evidence), b.corridor.evidence);
  t("budget brackets the three", b.budgetCr.value.min <= 7.5 && b.budgetCr.value.max >= 8.2, JSON.stringify(b.budgetCr.value));
  t("config is 4 BHK (2 of 3)", b.config.value === "4 BHK", JSON.stringify(b.config));
  t("timeline is always unknown", b.timeline.value === null && b.timeline.evidence === "we've no signal on this");
}

console.log("\na cheap glance must not drag the budget down");
{
  /* Bought the ₹9.5 Cr one; opened a ₹2.1 Cr one once. A min-max would
     say "₹2.1-9.5 Cr", which is not a budget. */
  const b = inferBrief([
    ev("report_viewed", "dlf-the-arbour", "10:00"),
    ev("report_viewed", "dlf-the-arbour", "10:20"),
    ev("payment_completed", "dlf-the-arbour", "10:25"),
    ev("report_viewed", "dlf-privana-south", "10:30"),
    ev("report_viewed", "m3m-capital", "10:40"),
  ], CAT);
  t("enough", b.enough === true);
  t("budget floor is not dragged to 2.1", b.budgetCr.value.min >= 6, JSON.stringify(b.budgetCr.value));
  t("budget covers the paid project", b.budgetCr.value.max >= 9.5, JSON.stringify(b.budgetCr.value));
  t("evidence names the purchase", /paid for/.test(b.budgetCr.evidence), b.budgetCr.evidence);
  t("paid project ranks first", b.projects[0].slug === "dlf-the-arbour" && b.projects[0].paid === true);
  t("corridor still GCRE", b.corridor.value?.[0] === "Golf Course Road Extension (GCRE)");
}

console.log("\nspread-out browsing refuses to guess");
{
  const b = inferBrief([
    ev("report_viewed", "dlf-the-arbour", "10:00"),
    ev("report_viewed", "m3m-capital", "10:05"),
    ev("report_viewed", "sobha-city", "10:10"),
  ], CAT);
  t("enough rows", b.enough === true);
  t("no corridor called", b.corridor.value === null, JSON.stringify(b.corridor));
  t("says why", /too spread/.test(b.corridor.evidence), b.corridor.evidence);
  t("no config called", b.config.value === null, JSON.stringify(b.config));
}

console.log("\ntwo corridors that together dominate");
{
  const b = inferBrief([
    ev("report_viewed", "dlf-the-arbour", "10:00"),
    ev("report_viewed", "dlf-privana-south", "10:05"),
    ev("report_viewed", "m3m-capital", "10:10"),
    ev("report_viewed", "m3m-capital", "10:12"),
  ], CAT);
  t("names both", b.corridor.value?.length === 2, JSON.stringify(b.corridor));
}

console.log("\nrubbish in");
{
  const b = inferBrief([
    ev("report_viewed", "a-project-that-was-deleted", "10:00"),
    ev("report_viewed", "dlf-the-arbour", "10:05"),
    ev("page_viewed", null, "10:06"),
  ], CAT);
  t("unknown slug is dropped, not invented", b.reportsRead === 1, JSON.stringify(b.projects.map(p => p.slug)));
  t("null slug ignored", b.projects.every((p) => p.slug));
  t("empty trail is safe", inferBrief([], CAT).reportsRead === 0);
  t("empty catalogue is safe", inferBrief([ev("report_viewed", "x", "10:00")], []).reportsRead === 0);
}

console.log("\nthe real trail from 2026-07-25 — every guess must match its own evidence");
{
  /* Copied from production: two purchases four crore apart, plus one idle
     open. The first version of this file answered "₹2-3.75 Cr — the report
     you paid for starts at ₹9.5 Cr", and "4 BHK — 1 of the 3 you viewed".
     Both are self-refuting on the face of them. */
  const CAT2 = [
    ...CAT,
    { name: "BIRLA PRAVAAH", microMarket: "Southern Peripheral Road (SPR Corridor)", min_price_cr: 3.3, config: "3BHK", min_bhk_num: 3, avg_cost_sqft: 15250, truthScore: 74 },
  ];
  const b = inferBrief([
    ev("report_viewed", "dlf-the-arbour", "13:17"),
    ev("report_viewed", "dlf-the-arbour", "13:18"),
    ev("payment_completed", "dlf-the-arbour", "13:19"),
    ev("payment_completed", "birla-pravaah", "13:20"),
    ev("report_viewed", "birla-pravaah", "13:21"),
    ev("report_viewed", "m3m-capital", "13:22"),
  ], CAT2);

  t("enough", b.enough === true);
  const inBand = (p) => p >= b.budgetCr.value.min && p <= b.budgetCr.value.max;
  const quoted = Number((b.budgetCr.evidence.match(/₹([\d.]+) Cr/) ?? [])[1]);
  t("budget evidence quotes a price INSIDE the band",
    !Number.isFinite(quoted) || inBand(quoted),
    `band ${JSON.stringify(b.budgetCr.value)} vs evidence "${b.budgetCr.evidence}"`);
  t("two purchases 4 Cr apart is not 'strong'", b.budgetCr.confidence !== "strong", b.budgetCr.confidence);
  t("no size claimed from a single project", b.config.value === null, JSON.stringify(b.config));
  t("says why instead", /different sizes/.test(b.config.evidence), b.config.evidence);
  t("corridor evidence reads like English", !/— 1 and 1/.test(b.corridor.evidence), b.corridor.evidence);
}

console.log("\na repeated size still gets claimed");
{
  const b = inferBrief([
    ev("report_viewed", "dlf-the-arbour", "10:00"),
    ev("report_viewed", "dlf-privana-south", "10:05"),
    ev("report_viewed", "m3m-golf-hills", "10:10"),
  ], CAT);
  t("4 BHK from two projects", b.config.value === "4 BHK", JSON.stringify(b.config));
}

console.log("\nconsultation weight + budget spread-guard");
{
  const WIDE = [2, 4, 6, 8, 12, 16].map((cr) => ({
    name: `P${cr}`, microMarket: "A", min_price_cr: cr, config: "", min_bhk_num: 3, avg_cost_sqft: 0, truthScore: 70,
  }));
  const evp = (name, slug, tm, props) => ({ name, project_slug: slug, created_at: `2026-07-25T${tm}:00Z`, props });
  const browse = () => [2, 4, 6, 8, 12, 16].map((cr, i) => ev("report_viewed", `p${cr}`, `10:0${i}`));

  // Broad browse, no purchase/consult anchor → budget must refuse to guess.
  const broad = inferBrief(browse(), WIDE);
  t("broad browse → no budget", broad.budgetCr.value === null, JSON.stringify(broad.budgetCr));
  t("broad browse → 'too wide' evidence", /wide|narrow/.test(broad.budgetCr.evidence), broad.budgetCr.evidence);

  // Same broad browse + a consultation on P6 → anchored, budget lands near ₹6.
  const anchored = inferBrief([...browse(), evp("lead_captured", "p6", "10:10", { intent: "consultation" })], WIDE);
  t("consultation anchors the budget", anchored.budgetCr.value !== null && anchored.budgetCr.value.min <= 6 && anchored.budgetCr.value.max >= 6, JSON.stringify(anchored.budgetCr));
  const p6 = anchored.projects.find((p) => p.slug === "p6");
  t("consultation sets consulted, not enquired", !!p6 && p6.consulted === true && p6.enquired === false, JSON.stringify(p6));
  t("a consulted project outweighs a mere view", !!p6 && p6.weight >= 12, JSON.stringify(p6));

  // A document request stays a plain enquiry (+4), not a consultation.
  const enq = inferBrief([...browse(), evp("lead_captured", "p6", "10:10", { intent: "documents" })], WIDE);
  const p6e = enq.projects.find((p) => p.slug === "p6");
  t("a document lead is enquired, not consulted", !!p6e && p6e.enquired === true && p6e.consulted === false, JSON.stringify(p6e));
}

console.log("\nweights and median");
t("repeat views are capped", weightFor({ views: 99, paid: false, enquired: false }) === 3);
t("a purchase outweighs idle views", weightFor({ views: 1, paid: true, enquired: false }) > weightFor({ views: 3, paid: false, enquired: false }));
t("a consultation outranks a purchase", weightFor({ views: 1, consulted: true }) > weightFor({ views: 1, paid: true }));
t("median is weighted", weightedMedian([{ v: 1, w: 1 }, { v: 9, w: 50 }]) === 9);
t("median of nothing is null", weightedMedian([]) === null);
t("zero weights ignored", weightedMedian([{ v: 5, w: 0 }]) === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
