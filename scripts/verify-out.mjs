// post-build gate over the exported report pages.
//
// WHAT IT USED TO ASSERT, AND WHY THAT WAS WRONG: that every project page
// carries the Location Intelligence section. It cannot. That section is paid
// content — ProjectProfile renders <LockedReport> unless readAccess, and
// readAccess starts false and is only set in an effect, so the STATIC html of
// a real report is always the locked teaser. The check could never pass, and
// it printed "location-section:0" on every good build since it was written.
// Read as a product failure it says a pillar of the paid report is missing;
// what it actually says is that the paywall works.
//
// So each page is now checked against what it is SUPPOSED to contain:
//   locked report → the unlock teaser, the free sections, and NOT paid content
//   sample read   → the paid pillars, since it is never gated
//   legacy stub   → a redirect
//
// TWO TRAPS, both of which produced false results while this was written:
// React splits text nodes with <!-- --> comments, so a phrase that spans an
// interpolation is not contiguous in the raw HTML; and the page is entity-
// encoded, so an apostrophe in the source is &#x27; in the output. Every
// text assertion below runs on comment-stripped, entity-decoded text.
import { readdirSync, readFileSync } from "node:fs";

const dirs = ["out/projects", "out/intelligence/projects"];
const files = dirs.flatMap((d) => {
  let names = [];
  try { names = readdirSync(d); } catch { console.log(`[verify-out] MISSING DIRECTORY ${d}`); }
  if (!names.length) console.log(`[verify-out] EMPTY ${d}`);
  return names.filter((f) => f.endsWith(".html")).map((f) => [d, f]);
});

const PAID_MARKER = "Will this address still be winning";
const LOCK_MARKER = 'id="unlock"';
const NEG_MARKER = 'id="negotiate"';
const FAQ_MARKER = 'id="faqs"';

/* The paid half of the negotiation section: the ask. If any of these
   reaches a public file we have given away the thing we charge for. */
const ASK_MARKERS = [
  "Ask what is unsold",
  "Delay compensation is a clause",
  "Which plan you take is worth",
  "Make them justify the premium",
  "Raise it as arithmetic",
  "Put each flag in writing",
  "Put it to them directly",
];

/* A locked report has to be worth indexing on its own. Below this it is a
   headline and a paywall, which ranks like one. Set under the observed
   floor (~1,500) so ordinary variation never trips it — this is a guard
   against a change that guts the free sections, not a target. */
const MIN_WORDS = 1200;

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", mdash: "—" };
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? ENT[n.toLowerCase()] ?? m);

const visibleText = (html) => {
  const body = html
    .replace(/<!--.*?-->/gs, "")
    .replace(/<script.*?<\/script>/gis, "")
    .replace(/<style.*?<\/style>/gis, "");
  return decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
};

const faqSchemas = (html) => {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)) {
    try {
      const d = JSON.parse(m[1]);
      if (d["@type"] === "FAQPage" && Array.isArray(d.mainEntity)) out.push(d.mainEntity);
    } catch { /* a malformed block is caught by the schema check below */ }
  }
  return out;
};

let stubs = 0, locked = 0, samples = 0;
const leaked = [], unlockless = [], sampleBare = [];
const noNeg = [], noFaq = [], askLeak = [], thin = [], schemaGhost = [];

for (const [dir, f] of files) {
  const s = readFileSync(`${dir}/${f}`, "utf8");
  if (s.includes("data-legacy-stub")) { stubs++; continue; }

  if (f.startsWith("sample-")) {
    samples++;
    // the one page that is never paywalled — it must show the analysis
    if (!s.includes(PAID_MARKER)) sampleBare.push(f);
    continue;
  }

  locked++;
  const text = visibleText(s);

  // paid pillars must NOT be in a public file
  if (s.includes(PAID_MARKER)) leaked.push(f);
  // and the unlock surface must be
  if (!s.includes(LOCK_MARKER)) unlockless.push(f);

  // the two sections a guest is meant to get, and a crawler with them
  if (!s.includes(NEG_MARKER)) noNeg.push(f);
  if (!s.includes(FAQ_MARKER)) noFaq.push(f);

  // the negotiation asks are paid; the leverage and evidence are not
  if (ASK_MARKERS.some((a) => text.includes(a))) askLeak.push(f);

  if (text.split(" ").length < MIN_WORDS) thin.push(f);

  /* Structured data has to describe content that is ON the page. FAQPage
     schema was being emitted on all 97 locked reports while the FAQ
     itself rendered only when unlocked — Google treats marked-up content
     the user cannot see as a violation, not an optimisation. */
  for (const entity of faqSchemas(s)) {
    for (const q of entity) {
      const name = q?.name ?? "";
      const answer = q?.acceptedAnswer?.text ?? "";
      /* Compare like for like: the page's text has had its whitespace
         collapsed by the extractor above (and by HTML itself), so the
         schema string must be collapsed too before looking for it. */
      const norm = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
      const probe = (v) => norm(v).length >= 40 && !text.includes(norm(v).slice(0, 40));
      if (probe(name) || probe(answer)) { schemaGhost.push(f); break; }
    }
  }
}

console.log(`[verify-out] locked reports:${locked} samples:${samples} stubs:${stubs}`);

const report = (list, label) => {
  if (!list.length) return false;
  console.log(`[verify-out] ${label} (${list.length}): ${list.slice(0, 5).join(", ")}`);
  return true;
};

/* Fatal: shipping is worse than not shipping. Both mean the thing we sell
   is sitting in a file anyone can read. */
let fatal = false;
fatal = report(leaked, "PAID CONTENT IN PUBLIC HTML") || fatal;
fatal = report(askLeak, "NEGOTIATION ASKS IN PUBLIC HTML") || fatal;

/* Loud, not fatal: a deploy blocked at 3am over a thin page helps nobody,
   and none of these hands anything away. */
report(unlockless, "NO UNLOCK SURFACE");
report(sampleBare, "SAMPLE MISSING ITS ANALYSIS");
report(noNeg, "NO NEGOTIATION SECTION");
report(noFaq, "NO FAQ SECTION");
report(thin, `UNDER ${MIN_WORDS} CRAWLABLE WORDS`);
report(schemaGhost, "FAQ SCHEMA NOT VISIBLE ON THE PAGE");

if (!locked) console.log("[verify-out] NO REPORT PAGES FOUND — the export or this path is wrong");

if (fatal) {
  console.error("[verify-out] FAILING THE BUILD — paid content is readable in the export");
  process.exit(1);
}
