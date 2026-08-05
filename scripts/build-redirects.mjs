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

import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const OUT = "deploy/redirects.conf";
const OLD_URLS = "deploy/old-urls.txt";
/* URLs Google has indexed (GSC exports) that the crawl never reached. A
   separate committed file so a re-crawl — which overwrites old-urls.txt —
   cannot silently drop them. Folded into the old-URL set below. */
const INDEXED_URLS = "deploy/indexed-urls.txt";
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

  /* THE SITEMAP IS NOT THE SITE, and using it as the candidate list was a
     quiet mistake. sitemap.ts lists what we ask Google to index; the build
     serves more than that. /premiumbuyeroffice, /investors, /deal-room,
     /get-custom-project-report, /sun-vastu, /shortlist and the /office
     portal are all real, reachable pages that appear in no <loc>. An old
     URL whose successor is one of them would have come back UNMATCHED —
     reported as "this 404s at cutover" while the page it wanted was
     sitting right there, served, one directory away.

     The routes are read from src/app, which is the actual definition of
     what exists. Sitemap membership is an SEO decision and has nothing to
     do with whether an address resolves. */
  const routes = await staticRoutes();
  const all = [...new Set([...paths, ...routes])];
  const extra = all.length - new Set(paths).size;
  console.log(`  new: ${new Set(paths).size} sitemap URL(s)` + (extra ? ` + ${extra} unlisted route(s) from src/app` : ""));
  return all;
}

/* Every non-dynamic page.tsx under src/app, as a path. Dynamic segments
   are skipped: their real addresses are the sitemap's, and "/projects/[slug]"
   is not somewhere a browser can go. Route groups — (marketing) and the
   like — contribute no URL segment, so they are dropped rather than
   emitted as a directory nobody serves. */
async function staticRoutes(root = "src/app") {
  if (!existsSync(root)) return [];
  const out = [];
  async function walk(dir, url) {
    let items;
    try { items = await readdir(dir, { withFileTypes: true }); } catch { return }
    for (const it of items) {
      if (it.isFile() && /^page\.(tsx|ts|jsx|js|mdx)$/.test(it.name)) out.push(url || "/");
      if (!it.isDirectory()) continue;
      const n = it.name;
      if (n.startsWith("_") || n.startsWith("@") || n.includes("[")) continue; // private, parallel, dynamic
      const seg = n.startsWith("(") && n.endsWith(")") ? "" : `/${n}`;        // route group adds nothing
      await walk(`${dir}/${n}`, url + seg);
    }
  }
  await walk(root, "");
  return [...new Set(out)];
}

/* ── the old site's addresses ──
   CAP=20000, was 2000, and the first real crawl returned exactly 2000
   paths. A round number equal to the limit is not a measurement, it is
   the limit — and a truncated crawl is the worst possible input here,
   because the pages it silently drops are indistinguishable from pages
   that do not exist. The map would have looked complete and quietly
   omitted whatever the crawl reached last. It now says so when it stops
   early, and the ceiling is high enough that a site of this size will
   not touch it. */
const CAP = Number(process.env.CRAWL_MAX ?? 20000);
async function crawl(origin) {
  const seen = new Set(), queue = ["/"], found = new Set();
  /* Seed from the sitemap when there is one — a crawl that only follows
     links misses anything not linked from the home page, which on a
     content site is usually most of it. */
  try {
    const r = await fetch(new URL("/sitemap.xml", origin), { signal: AbortSignal.timeout(20000) });
    if (r.ok) for (const m of (await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)) queue.push(pathOf(m[1]));
  } catch { /* no sitemap is normal */ }

  while (queue.length && seen.size < CAP) {
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
  if (seen.size >= CAP) {
    console.warn(
      `\n  ⚠ THE CRAWL STOPPED AT ITS LIMIT OF ${CAP} — ${queue.length} link(s) were still queued.\n` +
      `    This map is incomplete and the pages it is missing look exactly like\n` +
      `    pages that do not exist. Re-run with CRAWL_MAX set higher.\n`,
    );
  }
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
  "sector", "corridor", "intelligence", "new", "phase", "best",
]);

/* PLACE WORDS ARE NOISE FOR A PROJECT AND IDENTITY FOR A MARKET, and
   keeping them in one list got that backwards for every corridor page.
   On a project slug the corridor is a suffix that differs between the two
   sites and carries no identity — dropping it is what lets
   /project/dlf-the-arbour reach the long new address. On a market page
   the corridor IS the page: /best-projects/dwarka-expressway reduced to
   {best} once every meaningful word had been discarded as noise, and
   /intelligence/markets/dwarka-expressway reduced to the empty set, so a
   pair of URLs naming the same corridor twice had nothing left to compare.

   They are dropped when the candidate is anything else and kept when the
   candidate is a market. */
const PLACE = new Set(["road", "expressway", "spr", "gcre", "gcr", "dwarka", "sohna"]);

/* A PHASE NUMBER IS IDENTITY HERE, NOT NOISE.
   "phase" is a section word and bare digits are sector numbers, so both
   were discarded — which made Ashiana Mulberry Phase 4 and Phase 2 the
   same bag of tokens, {ashiana, mulberry}. They are different projects in
   different micro-markets, and the tie-break then handed Phase 4's URL to
   Phase 2's report and labelled it "exact": the one outcome this file
   exists to prevent, telling Google two unrelated pages are one page.

   Nine of the ninety-seven tracked projects are phased — Amarah runs to
   five, Navya Avik and Golf Hills to two — so this is not an edge case.
   The phase designator is folded into a single token before the split, so
   "phase-1-1a" survives as one unit and sector numbers, which really are
   noise, keep being dropped. */
const foldPhase = (s) => s.replace(/-phase-((?:\d+[a-z]?)(?:-\d+[a-z]?)*)/g, (_, n) => `-phase${n.replace(/-/g, "")}`);
const tokens = (p, keepPlace = false) => new Set(
  foldPhase(slugify(p)).split("-").filter((t) =>
    t && !NOISE.has(t) && (keepPlace || !PLACE.has(t)) && !/^\d+[a-z]?$/.test(t)),
);
const IS_MARKET = (p) => p.startsWith("/intelligence/markets/");

/* CONTAINMENT, NOT SIMILARITY — and uniqueness as the guard.

   Similarity scoring was the obvious choice and it was wrong for this
   shape. The old address is the short identity, /project/dlf-the-arbour;
   the new one carries the corridor and the sector as well. Overlap is
   perfect and the score still comes out at 0.5, because the new path's
   extra tokens count against a match they have nothing to do with. Every
   report would have been reported unmatched.

   What actually identifies a page is that one side's name tokens all
   appear in the other's. So: require full containment, then insist the
   winner is the ONLY one — /project/dlf-privana is contained in
   privana-north, -south and -west alike, and picking the shortest would
   be a coin toss dressed as a decision. Ambiguity is reported, never
   resolved silently, because an incorrect 301 tells Google two different
   pages are one page and takes a re-crawl of both to undo.

   EITHER DIRECTION, because the crawl showed both. The old-is-shorter
   assumption above is true of project pages and precisely inverted for
   developer pages: /developers/gurugram-real-estate-dlf-review-track-
   record-financials reduces to {dlf, review, track, record, financials}
   against a new /intelligence/developers/dlf of {dlf}. Nothing was
   missing from the match — the old URL simply spells out in its slug
   what the new one puts in the page. Sixteen developer pages came back
   unmatched for want of testing the subset the other way round.

   The reverse direction is allowed only inside a section-scoped pool,
   and that restriction is the whole safety of it. A one-token new path is
   a subset of almost any descriptive old one: /office reduces to
   {office}, so an unscoped reverse match would hand
   /dlf-cyber-city-office-space to the client portal and call it a
   redirect. Scoped to /intelligence/developers/, {dlf} standing alone is
   not a coincidence — it is the page. Unscoped, both sides must bring at
   least two tokens.

   A single token is never enough on its own: "/project/dlf" contains
   only "dlf" and would swallow every DLF project. */
function bestMatch(oldPath, news, scoped) {
  const aPlain = tokens(oldPath), aPlace = tokens(oldPath, true);
  if (aPlain.size === 0 && aPlace.size === 0) return null;

  const subset = (x, y) => { for (const t of x) if (!y.has(t)) return false; return true };
  const contained = [];
  for (const n of news) {
    /* Both sides tokenised the same way, chosen by what the candidate is. */
    const place = IS_MARKET(n);
    const a = place ? aPlace : aPlain;
    const b = tokens(n, place);
    if (a.size === 0 || b.size === 0) continue;
    /* Markets count as scoped wherever they appear. There are six of them,
       curated by hand, so a lone "spr" or "sohna" inside an old URL is not
       a coincidence the way a lone "office" is. Without this,
       /best-projects/under-5-cr-spr-corridor missed the SPR market page
       for the sole reason that its slug is one token long. */
    const reverseOk = scoped || place || b.size >= 2;
    if (subset(a, b) || (reverseOk && subset(b, a))) contained.push({ path: n, extra: Math.abs(b.size - a.size) });
  }
  if (contained.length === 0) return null;

  /* An exact token-set match beats a containment with extras, and settles
     the /about vs /about-us style case cleanly when it applies. */
  const exact = contained.filter((c) => c.extra === 0);
  if (exact.length === 1) return { path: exact[0].path, score: "exact" };
  if (exact.length > 1) return { ambiguous: exact.map((c) => c.path) };

  if (Math.max(aPlain.size, aPlace.size) < 2) return { ambiguous: contained.slice(0, 5).map((c) => c.path) };

  /* CLOSEST WINS, when one candidate is strictly closer than the rest.
     /best-projects/golf-course-extension reduces to {best,golf,course,
     extension} and both market pages contain it — "road" is a noise word,
     so /markets/golf-course-road reduces to {golf,course} and is a subset
     too. Reporting that as a coin toss is wrong: one candidate leaves one
     token unaccounted for and the other leaves two, and the difference is
     the whole answer. A tie stays ambiguous — dlf-privana against north,
     south and west is three candidates one token apart, which is exactly
     the case this must never resolve. */
  const closest = Math.min(...contained.map((c) => c.extra));
  const best = contained.filter((c) => c.extra === closest);
  if (best.length === 1) return { path: best[0].path, score: `contains ${aPlain.size || aPlace.size} token(s)` };
  return { ambiguous: best.slice(0, 5).map((c) => c.path) };
}

/* A PROJECT SLUG → ITS REPORT.
   Comparison URLs name projects by the short internal slug —
   /compare/m3m-capital-vs-dlf-privana-west — while a report lives at
   gurugram-real-estate-<that slug>-<corridor>-sector-<n>. The short slug
   appears inside the long one, so the report can be found from the sitemap
   alone with no database access.

   SHORTEST WINS, and here that is not a coin toss. "m3m-capital" is
   contained in both M3M Capital and M3M Capital Phase 2; the shorter path
   is the one where the slug accounts for the entire project name, and the
   longer is a different project whose name merely begins with it. The
   boundary dashes stop "birla-arika" matching mid-word. Verified against
   all 97 rows: every one resolves to its own report, none to a sibling. */
/* OLD PROJECT SLUG → NEW, for the few projects the old site named differently
   (a misspelling, a dropped developer prefix). Consulted when resolving a
   comparison's first project to its report, so a whole family of /compare/
   URLs built on the old name lands instead of 404ing. The direct project URL
   is covered by OVERRIDES; this is its comparison-pair counterpart. */
const SLUG_ALIAS = {
  "tonino-lambhorgini-residences": "signature-global-tonino-lamborghini-residences",
};

function projectResolver(news) {
  const projects = news.filter((n) => n.includes("/projects/"));
  return (slugIn) => {
    const slug = SLUG_ALIAS[slugIn] ?? slugIn;
    const hits = projects.filter((p) => p.includes(`-${slug}-`) || p.endsWith(`-${slug}`));
    if (hits.length === 0) return null;
    const shortest = Math.min(...hits.map((h) => h.length));
    const best = hits.filter((h) => h.length === shortest);
    return best.length === 1 ? best[0] : null;
  };
}

/* COMPARISON PAGES ARE PAIRS, and nothing else about them matters.
   /compare/a-vs-b succeeds /intelligence/compare/a-vs-b, or the same pair
   written the other way round. Letting the token matcher near them
   produced 1,458 "ambiguous" rows in the first real run, every one a list
   of five unrelated pairs that happened to share a project name — noise
   burying the entries a human actually has to decide.

   AND WHEN THE PAIR IS GONE, THE FIRST PROJECT'S REPORT. The old site
   published every pair of 97 projects — 4,656 pages — and this build
   scores 52, so 3,876 of them have no counterpart. Founder's call, and
   the right one: a reader who searched "X vs Y" is served by X's full
   forensic read, which carries its own alternatives section, far better
   than by a comparison hub listing pairs they did not ask about. It also
   spreads that equity across 97 real pages instead of pooling it on one
   index, which Google reads as a soft 404. */
function comparePair(oldPath, newSet, toReport) {
  const slug = oldPath.replace(/^\/(intelligence\/)?compare\//, "");
  const at = `/intelligence/compare/${slug}`;
  if (newSet.has(at)) return { path: at, why: "section" };
  const i = slug.indexOf("-vs-");
  if (i > 0) {
    const flipped = `/intelligence/compare/${slug.slice(i + 4)}-vs-${slug.slice(0, i)}`;
    if (newSet.has(flipped)) return { path: flipped, why: "same pair, reversed" };
    const report = toReport(slug.slice(0, i));
    if (report) return { path: report, why: "pair retired → first project's report" };
  }
  return null;
}

/* SECTION RENAMES, from the crawl rather than from imagination.
   The first version of this list was guesswork — /project/, /report/,
   /developer/, all singular — written before anyone had seen the old
   site. The crawl found 2,000 paths and not one of them matched a single
   rule here, because the site uses /compare/ and /developers/. Rules
   inferred from a URL scheme you have not looked at are decoration.

   Both spellings stay: the plural forms are what the crawl proved, the
   singular ones cost nothing and cover a stray inbound link. */
const SECTION = [
  [/^\/compare\//, "/intelligence/compare/"],
  [/^\/projects?\//, "/projects/"],
  [/^\/reports?\//, "/projects/"],
  [/^\/developers?\//, "/intelligence/developers/"],
  [/^\/locations?\//, "/intelligence/markets/"],
  [/^\/markets?\//, "/intelligence/markets/"],
  /* Section INDEXES, last so it never shadows a more specific rule. The
     old site's hubs live at the root — /developers, /compare — and this
     build files them under /intelligence. Tokens cannot see it: every one
     of those words is a section word and reduces to nothing, so /developers
     tokenised to the empty set and was reported unmatched while its exact
     successor sat at /intelligence/developers. Each rewrite is still
     checked against the real path list, so this can only fire on a page
     that exists. */
  [/^\//, "/intelligence/"],
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

   Comparison pages are excluded from every search EXCEPT their own. They
   are combinatorial — 97 projects make 1,864 of them — so they dominate
   any candidate set they are allowed into, and none of them is the heir
   to a single project's page.

   Blanket-excluding them was still wrong, and the crawl is what showed
   it: 1,864 of the 1,898 unmatched paths were /compare/<a>-vs-<b>, whose
   successor is /intelligence/compare/<a>-vs-<b> and nothing else. A
   comparison page is not the heir to a project page; it is very much the
   heir to a comparison page. The exclusion belongs on the candidate pool
   for other sections, not on the section itself. */
const IS_COMPARE = (p) => /^\/(intelligence\/)?compare\//.test(p);
const CANDIDATES = [
  [/^\/compare\//, (n) => n.startsWith("/intelligence/compare/")],
  [/^\/(projects?|reports?|properties|property)\//, (n) => n.startsWith("/projects/")],
  [/^\/(developers?|builders?)\//, (n) => n.startsWith("/intelligence/developers/")],
  [/^\/(locations?|markets?|areas?|micro-?markets?)\//, (n) => n.startsWith("/intelligence/markets/")],
];
const candidatesFor = (oldPath, news) => {
  const rule = CANDIDATES.find(([re]) => re.test(oldPath));
  const pool = rule ? news.filter(rule[1]) : news;
  return { scoped: Boolean(rule), pool: IS_COMPARE(oldPath) ? pool : pool.filter((n) => !IS_COMPARE(n)) };
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
let olds = arg === "--crawl"
  ? await crawl(argv[1] ?? "https://www.truthestate.in")
  : await fromFile(arg);

/* THE CRAWL IS THE EXPENSIVE, PERISHABLE HALF. Keep it.
   A crawl takes minutes and needs the old site still answering; the
   matching takes a second and depends on the build being shipped. Tying
   them together meant the map was made against one build and deployed
   with another — and the compare set is derived from live data, so 77
   pairs the map pointed at did not exist in the image that shipped. 77
   permanent redirects into 404s, live, and every check we had said green.

   Writing the crawl out makes the two halves independent: crawl when the
   old site changes, and regenerate the map at every deploy from that
   deploy's OWN sitemap, which cannot disagree with itself. */
if (arg === "--crawl") {
  await writeFile(OLD_URLS, `${olds.slice().sort().join("\n")}\n`);
  console.log(`  → ${OLD_URLS} (${olds.length} path(s) — the input to every future rebuild)`);
}

/* Fold in Google's own index — the URLs the crawl never reached. Written to
   old-urls.txt ABOVE first (that file stays the pure crawl, so a re-crawl
   overwriting it can't disagree with itself); the indexed set is unioned in
   only for THIS run's matching. Without it, 854 URLs Google has indexed would
   404 at cutover — indistinguishable in any smoke test from pages that never
   existed. */
if (existsSync(INDEXED_URLS)) {
  const merged = new Set(olds);
  const before = merged.size;
  for (const p of await fromFile(INDEXED_URLS)) merged.add(p);
  olds = [...merged];
  if (olds.length > before) console.log(`  + ${olds.length - before} path(s) from ${INDEXED_URLS} (Google-indexed, crawl missed)`);
}

console.log(`\n  old: ${olds.length} path(s)   new: ${news.length} path(s)\n`);

/* SAME WORDS, DIFFERENT PUNCTUATION. /premium-buyer-office and
   /premiumbuyeroffice are the same address written two ways, and every
   signal below misses it: the strings differ, no section rule applies,
   and tokenising gives {premium,buyer,office} against the single token
   "premiumbuyeroffice", so containment finds nothing. Word boundaries are
   a stylistic choice a site makes once and often changes; they carry no
   identity. Comparing the letters with the separators removed catches it
   with effectively no risk of a false positive — and only where exactly
   one new path squashes to the same string, so an accidental collision is
   declined rather than resolved. */
const squash = (p) => slugify(p).replace(/-/g, "");
const bySquash = new Map();
for (const n of news) {
  const k = squash(n);
  bySquash.set(k, bySquash.has(k) ? null : n); // null marks "more than one"
}

const toReport = projectResolver(news);

/* HAND-DECIDED, and they live here because this file is regenerated.
   The generated map writes ambiguous and unmatched entries out as
   comments for a human to settle — but the next crawl overwrites the
   file, so a decision made by editing it survives exactly until someone
   presses the button again. Recording them in the script instead makes
   them durable, reviewable in a diff, and impossible to lose.

   Four paths, each with a reason:

   The three price-and-corridor pages ask two questions at once and the new
   site answers them on separate pages. The tokeniser cannot choose —
   "under-3-cr" and "under-5-cr" both reduce to {under, cr} once the digit
   is dropped, so all three price bands look identical to it, which is
   why it correctly declined rather than guessed. Sending them to the
   price page with the corridor pre-filled answers both halves: the grid
   reads ?q= on mount, and the page's canonical keeps the clean URL, so
   the equity lands on a real indexed page rather than a query string.

   /under-construction-projects-in-gurugram is a catalogue of everything
   being built, which is what the projects index is.

   /contact has no successor — this build has no contact page. The
   advisory office is where "get in touch" leads, and a redirect there
   beats a 404 on what is likely one of the old site's better-linked
   pages. Say the word and it changes. */
const OVERRIDES = {
  "/best-projects/under-3-cr-dwarka-expressway": "/best-projects/under-3-cr-gurugram?q=Dwarka%20Expressway",
  "/best-projects/under-5-cr-spr-corridor": "/best-projects/under-5-cr-gurugram?q=SPR",
  "/best-projects/under-8-cr-golf-course-extension": "/best-projects/under-8-cr-gurugram?q=Golf%20Course%20Extension",
  "/under-construction-projects-in-gurugram": "/intelligence/projects",
  "/contact": "/premiumbuyeroffice",
  /* The old site listed this project as "tonino-lambhorgini-residences"
     (misspelt, no developer prefix); this build files it under its full,
     correct slug. The token matcher can't bridge "lambhorgini"→"lamborghini",
     so it's named here. Google has it indexed, so it must not 404. */
  "/projects/gurugram-real-estate-tonino-lambhorgini-residences-southern-peripheral-road-spr-corridor-sector-71":
    "/projects/gurugram-real-estate-signature-global-tonino-lamborghini-residences-southern-peripheral-road-spr-corridor-sector-71",
};

/* LAST RESORT: THE SECTION'S OWN INDEX.
   Ten of the old site's sixteen developer pages name a developer this
   build has no page for. Nothing can match them, and the alternative to
   a redirect is ten 404s. Founder's call: send them to the developers
   index, which is the right section and a real page, and let their
   ranking consolidate there.

   Deliberately narrow. It fires only for a path already under a known
   section prefix and only after every other signal has declined, so it
   can never quietly capture a page that had a real successor. */
const SECTION_INDEX = [
  [/^\/developers?\//, "/intelligence/developers"],
  [/^\/(locations?|markets?)\//, "/intelligence/markets"],
];

const same = [], mapped = [], unmatched = [], ambiguous = [];
for (const p of olds) {
  if (p === "/") continue;
  if (newSet.has(p)) { same.push(p); continue; }

  /* A human already answered this one. First, so no later signal can
     talk it out of the decision. */
  if (OVERRIDES[p]) { mapped.push({ from: p, to: OVERRIDES[p], why: "decided by hand" }); continue; }

  /* Comparison pages resolve by pair or not at all — never by tokens. */
  if (IS_COMPARE(p)) {
    const hit = comparePair(p, newSet, toReport);
    if (hit) mapped.push({ from: p, to: hit.path, why: hit.why });
    else unmatched.push(p);
    continue;
  }

  let target = null, why = "";
  for (const [re, to] of SECTION) {
    if (!re.test(p)) continue;
    const candidate = p.replace(re, to);
    if (newSet.has(candidate)) { target = candidate; why = "section"; break; }
  }
  if (!target) {
    const sq = bySquash.get(squash(p));
    if (sq) { target = sq; why = "same words, different hyphenation"; }
  }
  if (!target) {
    const { pool, scoped } = candidatesFor(p, news);
    const m = bestMatch(p, pool, scoped);
    if (m?.ambiguous) { ambiguous.push({ from: p, options: m.ambiguous }); continue; }
    if (m?.path) { target = m.path; why = m.score; }
  }
  if (!target) {
    for (const [re, index] of SECTION_INDEX) {
      if (re.test(p) && newSet.has(index)) { target = index; why = "no successor → section index"; break; }
    }
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
