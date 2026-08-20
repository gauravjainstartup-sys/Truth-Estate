# Claude / Agent Handover Notes

## Current Branch
- **`feature/deal-room-flow-refresh`**: Contains the updated 3-step Deal Room demand mandate flow from the landing page (`/deal-room`).

## Deal Room Flow Architecture (`src/components/dealroom/DealRoomMandate.tsx`)
The Deal Room flow mirrors the project-level mandate flow in a clean 3-step wizard:

### Step 1: The Asset
- **Fields**:
  - `city`: Dropdown (`Gurugram`, `Delhi`, `Noida`, `Greater Noida`, `Faridabad`, `GIFT City`, `Other — NCR`). Default: `Gurugram`.
  - `project`: Project Name with instant autocomplete typeahead across all 107+ tracked projects from `compare-index.json`, or free text input.
  - `config`: Configuration selector pills (1 BHK to 5 BHK / Penthouse) matching filed unit types when tracked.
  - `sizeSqft`: Super built-up area in Sq Ft. When project & config are selected, pre-populates/suggests filed unit layouts or allows custom sq ft input.
  - `unit`: Optional tower/floor/facing details.
- **Action**: Clicking *"Continue to Pricing →"* triggers the pricing resolution interstitial.

### Step 2: The Terms & Target Price
- **Pricing Engine**:
  - **Live DB Lookup**: If the project is tracked in `compare-index.json`, computes `sizeSqft × psfRate` (using `psfOwn` or corridor `psf`).
  - **Gemini Top-Model Fallback**: If the project is untracked/custom, calls `fetchResalePrice(project, city, config, "gemini-2.5-pro")` to ground the current market rate.
- **Display & Target Slider**:
  - Displays **Estimated Current Market Price** formatted cleanly in Crores (e.g. `₹4.75 – ₹5.25 Cr @ ₹24,000/sq ft`).
  - Displays **Target Closing Price** in Crores and Rupees with an interactive visual slider spanning Steal Deal (~25% below market floor) to Market Top.
  - Live target badge indicating discount percentage versus the market floor.
- **Context Questions**:
  - Buyer readiness stage (`Finalised it` / `Comparing a few` / `Still exploring`).
  - Existing quote in hand (optional text).
  - Timeline to close (`Within 30 days`, `60 days`, `90 days`, `Flexible`).
  - Funding mode (`Self-funded`, `Home loan approved`, `Home loan in process`, `Not sure yet`).

### Step 3: Summary Docket & Buyer Verification
- **Executive Summary Docket**: Displays a consolidated review card with the asset details, market benchmark, target price in Crores, discount percentage, timeline, and funding.
- **Signup & Verification**:
  - Full Name input.
  - Mobile number + country dial code with 6-digit OTP verification via `shortlistAuth`.
  - OAuth option: *"Continue with Google"*.
- **Submission**:
  - Persists the lead into `contact_leads` with `intent: "deal-room"` and structured payload.
  - Persists local mirror to `localStorage` for `/deal-room/track` real-time viewing.
  - Transitions to the confirmation / advisor SLA screen.

---

## Important Rules
- `SUPABASE_SERVICE_ROLE_KEY` is passed exclusively via environment variables and never committed to git.
- All 1,838 static pages compile cleanly with zero errors via `npm run build`.
