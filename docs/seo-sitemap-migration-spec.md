# SEO Sitemap Migration & 301 Redirect Specification

## Objective
Preserve 100% of organic search rankings, link equity, and Google Search Console indexation when migrating `truthestate.in` to the new Next.js static export build.

---

## 1. Project URLs (Zero Action Required)
- **Status**: 97 of 97 live `/projects/[slug]` URLs match the new codebase **100% character-for-character**.
- **Action**: Keep `/projects/[slug]` routes as-is.

---

## 2. Developer Review 301 Redirects
Create static redirect stubs (or route handlers) mapping legacy verbose developer URLs to the new `/intelligence/developers/[slug]` ledgers:

| Legacy Production URL | Target New URL |
| :--- | :--- |
| `/developers` | `/intelligence/developers` |
| `/developers/gurugram-real-estate-dlf-review-track-record-financials` | `/intelligence/developers/dlf` |
| `/developers/gurugram-real-estate-m3m-review-track-record-financials` | `/intelligence/developers/m3m` |
| `/developers/gurugram-real-estate-godrej-review-track-record-financials` | `/intelligence/developers/godrej` |
| `/developers/gurugram-real-estate-signature-global-review-track-record-financials` | `/intelligence/developers/signature-global` |
| `/developers/gurugram-real-estate-emaar-review-track-record-financials` | `/intelligence/developers/emaar` |
| `/developers/gurugram-real-estate-smartworld-review-track-record-financials` | `/intelligence/developers/smartworld` |
| `/developers/gurugram-real-estate-sobha-review-track-record-financials` | `/intelligence/developers/sobha` |
| `/developers/gurugram-real-estate-birla-estates-review-track-record-financials` | `/intelligence/developers/birla` |
| `/developers/gurugram-real-estate-central-park-review-track-record-financials` | `/intelligence/developers/central-park` |
| `/developers/gurugram-real-estate-experion-review-track-record-financials` | `/intelligence/developers/experion` |
| `/developers/gurugram-real-estate-ashiana-group-review-track-record-financials` | `/intelligence/developers/ashiana` |
| `/developers/gurugram-real-estate-tulip-review-track-record-financials` | `/intelligence/developers/tulip` |
| `/developers/gurugram-real-estate-max-estates-review-track-record-financials` | `/intelligence/developers/max-estates` |
| `/developers/gurugram-real-estate-elan-review-track-record-financials` | `/intelligence/developers/elan` |
| `/developers/gurugram-real-estate-whiteland-review-track-record-financials` | `/intelligence/developers/whiteland` |
| `/developers/gurugram-real-estate-puri-constructions-review-track-record-financials` | `/intelligence/developers/puri` |

---

## 3. Compare Pages Wildcard Redirects (`/compare/*`)
The live production site has 4,656 comparison URLs under `/compare/[pair]`. The new codebase serves these under `/intelligence/compare/[pair]`.

- **Action**: Create a wildcard redirect route or static HTML stub page for `/compare/[pair]` that performs an immediate client/head redirect to `/intelligence/compare/[pair]`, preserving the `:pair` parameter.

---

## 4. Core & Category Page Redirects
Map the remaining 5 legacy production core URLs:

| Legacy Production URL | Target New URL |
| :--- | :--- |
| `/under-construction-projects-in-gurugram` | `/intelligence/projects` |
| `/contact` | `/office` |
| `/best-projects/dwarka-expressway` | `/best-projects/dwarka-expressway-under-5-cr` (or add alias in `bestProjects.ts`) |
| `/best-projects/golf-course-road` | `/best-projects/golf-course-road-luxury` (or add alias in `bestProjects.ts`) |
| `/best-projects/golf-course-extension` | `/best-projects/golf-course-extension-luxury` (or add alias in `bestProjects.ts`) |
| `/best-projects/spr-corridor` | `/best-projects/spr-corridor-under-5-cr` (or add alias in `bestProjects.ts`) |

---

## 5. Verification Steps
1. Run `npm run build` and ensure output completes with exit code 0.
2. Run `node scripts/verify-out.mjs` to confirm static export files are generated properly.
3. Run `node scripts/rls-guard.mjs` to ensure 14/14 security checks remain green.
