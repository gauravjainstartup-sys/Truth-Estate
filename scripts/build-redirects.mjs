#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   BUILD THE 301 MAP from the old truthestate.in to this build.

   Why it is a script and not a hand-written file: the old site's URLs
   have to be matched against 935 new ones, and doing that by eye is how
   a redirect map ends up 80% complete and nobody notices which 20%.

   Run it one of two ways, from a machine that can reach the old site:

     # crawl the live site (follows internal links, respects the sitemap)
     node scripts/build-redirects.mjs --crawl https://www.truthestate.in

     # or from a Search Console export / any list of URLs or paths
     node scripts/build-redirects.mjs old-urls.txt
     node scripts/build-redirects.mjs old-urls.csv      # first column, header skipped

   It writes deploy/redirects.conf and prints what it could NOT match, so
   the gaps are a list you can act on rather than a silence.

   MATCHING, strongest signal first:
     1. the path already exists in the new build          → no redirect needed
     2. the old path's project slug matches a new report  → the report
     3. a known section rename (/project/x → /projects/x) → the section
     4. nothing                                           → reported, never guessed

   A wrong 301 is worse than a 404: it tells Google two unrelated pages
   are the same page, and it takes a re-crawl of both to undo. So the bar
   for emitting one is a real match, and everything else is printed for a
   human to decide.
   ════════════════════════════════════════════════════════════════ */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const OUT = "deploy/redirects.conf";
const SITEMAP = "out/sitemap.xml";

const slugify = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const pathOf = (u) => {
  try { return new URL(u, "https://www.truthestate.in").pathname.replace(/\/+$/, "") || "/"; }
  catch { return String(u).trim().replace(/\/+$/, "") || "/"; }
};

/* ── the new site's addresses ──
   From `out/sitemap.xml` after a local build, or straight off a deployed
   site with --sitemap <url>.

   The URL form exists because requiring a build put a four-minute barrier
   in front of a job that is really one HTTP request: a full production
   build needs the Supabase snapshot, pulls a few hundred megabytes of
   media, and produces — for this purpose — a single XML file that the
   running site is already serving. Reading it from the deployment is also
   the more honest answer, since the redirect targets we emit are then the
   URLs that demonstrably exist rather than the ones a rebuild predicts. */
async function newPaths(src) {
  let xml;
  if (src && /^https?:\/\//.test(src)) {
    const res = await fetch(src, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) { console.error(`\n  ${src} → HTTP ${res.status}\n`); process.exit(1); }
    xml = await res.text();
  } else {
    const file = src || SITEMAP;
    if (!existsSync(file)) {
      console.error(`\n  ${file} not found. Either point at a deployed sitemap:\n` +
                    `    node scripts/build-redirects.mjs --crawl https://www.truthestate.in --sitemap https://<host>/sitemap.xml\n` +
                    `  or build first:\n` +
                    `    NEXT_PUBLIC_BASE_PATH="" NEXT_PUBLIC_ORIGIN=https://www.truthestate.in npm run build\n`);
      process.exit(1);
    }
    xml = await readFile(file, "utf8");
  }
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => pathOf(m[1]));
  if (paths.length === 0) { console.error(`\n  no <loc> entries in the sitemap — wrong URL?\n`); process.exit(1); }
  return [...new Set(paths)];
}

/* ── the old site's addresses ── */
async function crawl(origin) {
  const seen = new Set(), queue = ["/"], found = new Set();
  /* Seed from the sitemap when there is one — a crawl that only follows
     links misses anything not linked from the home page, which on a
     content site is usually most of it. */
  try {
    const r = await fetch(new URL("/sitemap.xml", origin), { signal: AbortSignal.timeout(20000) });
    if (r.ok) for (const m of (await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)) queue.push(pathOf(m[1]));
  } catch { /* no sitemap is normal */ }

  while (queue.length && seen.size < 2000) {
    const p = queue.shift();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    let html = "";
    try {
      const res = await fetch(new URL(p, origin), { redirect: "follow", signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      if (!/text\/html/i.test(res.headers.get("content-type") ?? "")) continue;
      html = await res.text();
    } catch { continue; }
    found.add(p);
    for (const m of html.matchAll(/href="([^"#?]+)"/g)) {
      const href = m[1];
      if (/^(https?:)?\/\//.test(href) && !href.includes(new URL(origin).host)) continue;
      if (/\.(png|jpe?g|svg|webp|css|js|ico|woff2?|pdf)$/i.test(href)) continue;
      const q = pathOf(href);
      if (!seen.has(q)) queue.push(q);
    }
    if (found.size % 25 === 0) process.stdout.write(`\r  crawled ${found.size}…`);
  }
  process.stdout.write(`\r  crawled ${found.size} page(s)\n`);
  return [...found];
}

async function fromFile(file) {
  const raw = await readFile(file, "utf8");
  return [...new Set(
    raw.split(/\r?\n/)
      .map((l) => l.split(",")[0].trim().replace(/^"|"$/g, ""))
      .filter((l) => l && !/^(url|page|address)$/i.test(l) && !l.startsWith("#"))
      .map(pathOf),
  )];
}

/* ── matching ── */
/* A report path carries the project name between the "gurugram-real-estate"
   prefix and the corridor. Old URLs are likelier to be /projects/<name> or
   /project/<name>, so both sides are reduced to a bag of name tokens and
   compared. Corridor and sector tokens are dropped: they are the part most
   likely to differ between the two sites and the part that carries no
   identity. */
/* Section words, place words and phase/sector numbering. "report" was
   missing and it cost a match on its own: /report/m3m-crown-phase-1
   tokenised to {report, m3m, crown}, and "report" appears in no new path,
   so a page that was otherwise an exact hit came back unmatched. */
const NOISE = new Set([
  "gurugram", "real", "estate", "projects", "project", "report", "reports",
  "property", "properties", "developer", "developers", "builder",
  "location", "locations", "market", "markets", "area", "micro",
  "sector", "corridor", "road", "expressway", "spr", "gcre", "gcr",
  "dwarka", "sohna", "new", "phase", "intelligence",
]);
const tokens = (p) => new Set(slugify(p).split("-").filter((t) => t && !NOISE.has(t) && !/^\d+[a-z]?$/.test(t)));

/* CONTAINMENT, NOT SIMILARITY — and uniqueness as the guard.

   Similarity scoring was the obvious choice and it was wrong for this
   shape. The old address is the short identity, /project/dlf-the-arbour;
   the new one carries the corridor and the sector as well. Overlap is
   perfect and the score still comes out at 0.5, because the new path's
   extra tokens count against a match they have nothing to do with. Every
   report would have been reported unmatched.

   What actually identifies a report is that every name token of the old
   path appears in the new one. So: require full containment, then insist
   the winner is the ONLY one — /project/dlf-privana is contained in
   privana-north, -south and -west alike, and picking the shortest would
   be a coin toss dressed as a decision. Ambiguity is reported, never
   resolved silently, because an incorrect 301 tells Google two different
   pages are one page and takes a re-crawl of both to undo.

   A single token is never enough on its own: "/project/dlf" contains
   only "dlf" and would swallow every DLF project. */
function bestMatch(oldPath, news) {
  const a = tokens(oldPath);
  if (a.size === 0) return null;

  const contained = [];
  for (const n of news) {
    const b = tokens(n);
    if (b.size === 0) continue;
    let all = true;
    for (const t of a) if (!b.has(t)) { all = false; break; }
    if (all) contained.push({ path: n, extra: b.size - a.size });
  }
  if (contained.length === 0) return null;

  /* An exact token-set match beats a containment with extras, and settles
     the /about vs /about-us style case cleanly when it applies. */
  const exact = contained.filter((c) => c.extra === 0);
  if (exact.length === 1) return { path: exact[0].path, score: "exact" };
  if (exact.length > 1) return { ambiguous: exact.map((c) => c.path) };

  if (a.size < 2) return { ambiguous: contained.slice(0, 5).map((c) => c.path) };
  if (contained.length > 1) return { ambiguous: contained.slice(0, 5).map((c) => c.path) };
  return { path: contained[0].path, score: `contains ${a.size} token(s)` };
}

const SECTION = [
  [/^\/project\//, "/projects/"],
  [/^\/report\//, "/projects/"],
  [/^\/developer\//, "/intelligence/developers/"],
  [/^\/location\//, "/intelligence/markets/"],
  [/^\/market\//, "/intelligence/markets/"],
];

/* WHERE A GIVEN OLD PAGE IS ALLOWED TO LAND.

   Containment alone put /project/dlf-the-arbour up against five
   candidates, four of them comparison pages — /intelligence/compare/
   ashiana-aaroham-phase-1-vs-dlf-the-arbour contains every token of
   "dlf-the-arbour" and is a perfectly good containment match. It is also
   obviously not the successor to that project's page, and no amount of
   scoring would have said so; the constraint is categorical, not
   numerical. A page about one project resolves to that project's report,
   full stop.

   Comparison pages are excluded from EVERY search. They are combinatorial
   — 40 projects make 780 of them — so they dominate any candidate set
   they are allowed into, and none of them is the heir to a single page. */
const CANDIDATES = [
  [/^\/(project|report|properties|property)\//, (n) => n.startsWith("/projects/")],
  [/^\/(developer|builder)\//, (n) => n.startsWith("/intelligence/developers/")],
  [/^\/(location|market|area|micro-?market)\//, (n) => n.startsWith("/intelligence/markets/")],
];
const candidatesFor = (oldPath, news) => {
  const rule = CANDIDATES.find(([re]) => re.test(oldPath));
  const pool = rule ? news.filter(rule[1]) : news;
  return pool.filter((n) => !n.startsWith("/intelligence/compare/"));
};

/* --sitemap is pulled out first so it can sit anywhere on the line; what
   remains is the positional source of old URLs, as before. */
const argv = process.argv.slice(2);
const sitemapAt = argv.indexOf("--sitemap");
const sitemapSrc = sitemapAt === -1 ? undefined : argv.splice(sitemapAt, 2)[1];

const arg = argv[0];
if (!arg) {
  console.error(
    "usage: build-redirects.mjs <old-urls.txt|--crawl https://www.truthestate.in> [--sitemap <url|path>]",
  );
  process.exit(1);
}

const news = await newPaths(sitemapSrc);
const newSet = new Set(news);
const olds = arg === "--crawl"
  ? await crawl(argv[1] ?? "https://www.truthestate.in")
  : await fromFile(arg);

console.log(`\n  old: ${olds.length} path(s)   new: ${news.length} path(s)\n`);

const same = [], mapped = [], unmatched = [], ambiguous = [];
for (const p of olds) {
  if (p === "/") continue;
  if (newSet.has(p)) { same.push(p); continue; }

  let target = null, why = "";
  for (const [re, to] of SECTION) {
    if (!re.test(p)) continue;
    const candidate = p.replace(re, to);
    if (newSet.has(candidate)) { target = candidate; why = "section"; break; }
  }
  if (!target) {
    const m = bestMatch(p, candidatesFor(p, news));
    if (m?.ambiguous) { ambiguous.push({ from: p, options: m.ambiguous }); continue; }
    if (m?.path) { target = m.path; why = m.score; }
  }
  if (target) mapped.push({ from: p, to: target, why });
  else unmatched.push(p);
}

const lines = [
  "# ════════════════════════════════════════════════════════════════",
  "#  301s from the old truthestate.in. GENERATED — do not hand-edit;",
  "#  re-run scripts/build-redirects.mjs instead.",
  "#",
  `#  ${same.length} path(s) unchanged (no redirect needed)`,
  `#  ${mapped.length} redirected`,
  `#  ${ambiguous.length} ambiguous — several candidates, needs a human`,
  `#  ${unmatched.length} unmatched — listed at the foot of this file`,
  "# ════════════════════════════════════════════════════════════════",
  "",
  ...mapped.map((m) => `location = ${m.from} { return 301 ${m.to}; }   # ${m.why}`),
  "",
  ...(ambiguous.length
    ? ["# ── AMBIGUOUS. Pick one and uncomment; guessing here is worse than a 404. ──",
       ...ambiguous.flatMap((x) => [`#   ${x.from}`, ...x.options.map((o) => `#     location = ${x.from} { return 301 ${o}; }`)])]
    : []),
  "",
  ...(unmatched.length
    ? ["# ── UNMATCHED. Each of these 404s at cutover unless mapped by hand. ──",
       ...unmatched.map((p) => `#   ${p}`)]
    : []),
  "",
];
await writeFile(OUT, lines.join("\n"));

console.log(`  unchanged : ${same.length}`);
console.log(`  redirected: ${mapped.length}`);
console.log(`  ambiguous : ${ambiguous.length}${ambiguous.length ? "  ← pick one by hand" : ""}`);
for (const x of ambiguous.slice(0, 10)) console.log(`      ${x.from}  →  ${x.options.join(" | ")}`);
console.log(`  UNMATCHED : ${unmatched.length}${unmatched.length ? "  ← these 404 at cutover" : ""}`);
for (const p of unmatched.slice(0, 20)) console.log(`      ${p}`);
if (unmatched.length > 20) console.log(`      … and ${unmatched.length - 20} more`);
console.log(`\n  → ${OUT}\n`);
