/* ════════════════════════════════════════════════════════════════
   WHERE THIS BUILD LIVES — origin and base path, one source of truth.

   Two deployments now, and they differ in BOTH values:

     staging     https://gauravjainstartup-sys.github.io  +  /Truth-Estate
     production  https://www.truthestate.in               +  ""  (root)

   The base path used to be a literal `const basePath = "/Truth-Estate"`
   redeclared in 49 places across 52 files, alongside `basePath` in
   next.config. Serving production from the domain root means every one of
   those has to become "" at the same instant — and nothing fails until the
   deploy is live and every internal link 404s. So they all read from here
   instead, and the cutover is an environment variable.

   NEXT_PUBLIC_ prefixed so the values are inlined into the client bundles
   at build time; these are static exports with no server to ask at runtime.

   Defaults are the STAGING values: an unconfigured build is a preview
   build, never an accidental production one.
   ════════════════════════════════════════════════════════════════ */

/* "" for a root-served site; "/Truth-Estate" under GitHub Pages. Never a
   trailing slash — every caller writes `${basePath}/thing`. */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/Truth-Estate").replace(/\/$/, "");

/* Origin only, no path. Canonicals, sitemap, robots, OpenGraph and every
   JSON-LD @id derive from ORIGIN + BASE_PATH. */
export const ORIGIN = (process.env.NEXT_PUBLIC_ORIGIN ?? "https://gauravjainstartup-sys.github.io").replace(/\/$/, "");

/* The canonical address of this deployment's home page, no trailing slash. */
export const SITE_URL = `${ORIGIN}${BASE_PATH}`;

/* Alias, because 40 components already say `basePath` and it reads better
   at the call site: `${basePath}/intelligence`. */
export const basePath = BASE_PATH;

/* THE HOME PAGE'S HREF, WHICH IS NOT basePath.

   Sixteen components wrote `<a href={basePath}>` around the logo. Under the
   preview that is "/Truth-Estate" and works. In production BASE_PATH is the
   empty string, React renders `href=""`, and an empty href resolves to the
   CURRENT document — so the logo, which is the only way back to the home
   page from a report, a market, a comparison or a landing page, quietly
   becomes a button that reloads the page you are already on.

   It could not surface before cutover, because the only build anyone had
   clicked through was the preview, where BASE_PATH is non-empty. That is
   the character of the bug: correct everywhere it was tested and wrong
   everywhere it was about to ship. */
export const homeHref = BASE_PATH || "/";

/* Is this the deployment search engines should index?

   Only the real production origin. Everything else — the GitHub Pages
   preview, a branch deploy, a local build — ships `noindex, nofollow` on
   every page, because a second crawlable copy of the whole site competes
   with production for its own rankings and splits its link equity.

   NOTE ON robots.txt: blocking the preview with `Disallow: /` would be
   worse than doing nothing. It stops the crawl, so the noindex is never
   read, and a URL linked from anywhere else still surfaces as a bare
   result. Crawling stays allowed; the meta tag does the work. */
export const IS_PRODUCTION_ORIGIN = /^https:\/\/(www\.)?truthestate\.in$/.test(ORIGIN);

/* Absolute URL for a site-relative path ("/intelligence" → full URL). */
export const absUrl = (path = ""): string =>
  `${SITE_URL}${path === "" || path.startsWith("/") ? path : `/${path}`}`;
