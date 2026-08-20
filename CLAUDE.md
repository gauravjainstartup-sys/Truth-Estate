# Claude / Agent Handover Notes

## Branches
- **`feature/programmatic-apartment-clusters`**: Programmatic SEO & GEO landing pages under `/apartments/[slug]`, covering 25+ high-intent typologies, budget segments, and micro-market combinations.
- **`feature/deal-room-flow-refresh`**: 3-step Deal Room demand mandate wizard with 0ms instant DB calculation and manual external pricing fallback.
- **`feature/vision-and-mission`**: Vision & Mission page (kept isolated pending user sign-off).

---

## 1. Programmatic SEO & GEO Landing Pages (`/apartments/[slug]`)

### Architecture & Ground Rules
- **Route Namespace**: `/apartments/[slug]` (e.g. `/apartments/4-bhk-apartments-gurugram`, `/apartments/penthouses-in-gurugram`, `/apartments/4-bhk-in-gurugram-under-5-cr`, etc.).
- **Zero Route Conflict**:
  - `/best-projects/[filter]` is preserved exclusively for the 7 legacy filters (`under-3-cr-gurugram`, etc.).
  - `/intelligence/markets/[slug]` is preserved exclusively for the 6 high-level corridor hubs.
  - `/projects/[slug]` is preserved exclusively for individual project forensic dossiers (**100% untouched and identical to prod**).
- **Component Reuse**:
  - Reuses the site's canonical light-theme components (`ProjectsIndex` and `ProjectOptionCard`) to ensure visual consistency (`#fbf8f2` warm canvas, `#1a1a1a` typography, `border-[#1a1a1a]/10`).
  - Includes an editorial light-themed FAQ section at the bottom formatted with Schema.org `FAQPage` JSON-LD for AI search engines (ChatGPT Search, Perplexity, Google SGE) to cite.
- **Dynamic Sitemap**:
  - Dynamically injected into `src/app/sitemap.ts` (`priority: 0.85`, `changeFrequency: weekly`).

---

## 2. Deal Room Flow Architecture (`src/components/dealroom/DealRoomMandate.tsx`)
The Deal Room flow operates with 0ms latency (pure instant local DB + manual entry fallback):

### Step 1: The Asset
- **Fields**:
  - `city`: Dropdown (`Gurugram`, `Delhi`, `Noida`, `Greater Noida`, `Faridabad`, `GIFT City`, `Other — NCR`). Default: `Gurugram`.
  - `project`: Project Name with instant autocomplete typeahead across all 107+ tracked projects from `compare-index.json`, or free text input.
  - `config`: Configuration selector pills (1 BHK to 5 BHK / Penthouse) matching filed unit types when tracked.
  - `sizeSqft`: Super built-up area in Sq Ft. When project & config are selected, pre-populates/suggests filed unit layouts or allows custom sq ft input.
  - `unit`: Optional tower/floor/facing details.
- **Action**: Clicking *"Continue to Pricing →"* transitions immediately (0ms) to Step 2.

### Step 2: The Terms & Target Price
- **Live DB Projects**:
  - If the project is tracked in `compare-index.json`, computes `sizeSqft × psfRate` (using `psfOwn` or corridor `psf`).
  - Displays **Estimated Current Market Price** in Crores (e.g. `₹9.30 – ₹12.46 Cr @ ₹23,500/sq ft`).
  - Displays **Target Closing Price** in Crores and Rupees with an interactive visual slider spanning Steal Deal (~25% below market floor) to Market Top.
  - Live target badge indicating discount percentage versus the market floor.
- **External / Untracked Projects**:
  - Direct manual target price input in Crores/Rupees.
  - No AI delay or external API failure risk.
- **Context Questions**:
  - Buyer readiness stage (`Finalised it` / `Comparing a few` / `Still exploring`).
  - Existing quote in hand (optional text).
  - Timeline to close (`Within 30 days`, `60 days`, `90 days`, `Flexible`).
  - Funding mode (`Self-funded`, `Home loan approved`, `Home loan in process`, `Not sure yet`).

### Step 3: Summary Docket & Buyer Verification
- **Executive Summary Docket**: Consolidates asset details, market benchmark, target price in Crores, discount percentage, timeline, and funding.
- **Signup & Verification**:
  - Full Name input.
  - Mobile number + country dial code with 6-digit OTP verification via `shortlistAuth`.
  - OAuth option: *"Continue with Google"*.
- **Submission**:
  - Persists the lead into `contact_leads` with `intent: "deal-room"` and structured payload.
  - Persists local mirror to `localStorage` for `/deal-room/track` real-time viewing.
  - Transitions to the confirmation / advisor SLA screen.

---

## 3. Important Rules & Build Invariants
- **Report Page Invariant**: Never modify `/projects/[slug]` or `src/lib/reportAdapter.ts` when building cluster or deal room landing pages. Always verify against prod.
- `SUPABASE_SERVICE_ROLE_KEY` is passed exclusively via environment variables and never committed to git.
- All 1,863+ static pages compile cleanly with zero errors via `npm run build`.
