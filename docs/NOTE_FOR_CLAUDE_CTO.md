# 🏛️ Technical Briefing & Handover Note for Claude (CTO)

**To:** Claude, Chief Technology Officer  
**From:** Antigravity Engineering & Forensic Intelligence Team  
**Subject:** Project Intelligence Wire Architecture, Verified 2025–2026 Ground Dispatches, and Backend SEO Engine  
**Date:** August 19, 2026  
**Status:** In Production (`feature/project-intelligence-wire`)  

---

## 1. Executive Summary

Truth Estate has deployed the **Project Intelligence Wire**—a real-time, evidence-based chronological event stream tracking ground reality across all **107 tracked residential projects in Gurugram**. 

The wire solves the fundamental transparency deficit in Indian real estate by grounding each project's progress in **official regulatory filings (HARERA Gurugram), stock exchange disclosures (BSE/NSE contract award intimations), and DTCP Haryana government gazettes**.

---

## 2. Supabase Data Architecture

### Database Table: `public.project_intelligence_wire`
```sql
CREATE TABLE IF NOT EXISTS public.project_intelligence_wire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('CONSTRUCTION', 'REGULATORY', 'PRICING', 'INFRASTRUCTURE', 'CORPORATE_JV')),
  headline TEXT NOT NULL,
  verified_facts TEXT NOT NULL,
  forensic_impact_type TEXT NOT NULL CHECK (forensic_impact_type IN ('POSITIVE', 'NEUTRAL', 'RISK', 'CRITICAL_FLAG')),
  forensic_impact_summary TEXT,
  source_name TEXT NOT NULL,
  source_document_ref TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for high-concurrency lookup & SSG baking:
CREATE INDEX IF NOT EXISTS idx_project_wire_slug ON public.project_intelligence_wire(project_slug);
CREATE INDEX IF NOT EXISTS idx_project_wire_date ON public.project_intelligence_wire(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_wire_cat ON public.project_intelligence_wire(category);
```

### Dataset Scope & Distribution:
* **Total Dispatches:** 453 verified entries.
* **Coverage:** 100% of all 107 projects (4 to 5 multi-category dispatches each).
* **Temporal Distribution:**
  * **2026 (Up to Q3 2026):** 108 dispatches (latest slab milestones, recent OCs, Dahlias ₹271 Cr penthouse record).
  * **2025:** 138 dispatches (GCRE 16-lane underpasses, SPR retendering, secondary resale pricing).
  * **2024:** 157 dispatches (Dwarka Expressway inauguration, Tier-1 EPC tenders, launch GDVs).
  * **2018–2023:** 50 statutory baseline anchors (official HARERA registration certificates and dates).

---

## 3. Ground-Truth Contractor & Entity Matrix

All contractor attributions have been strictly audited against stock exchange filings and HARERA quarterly progress reports (QPRs):

| Project | Location | Lead EPC Contractor / Partners | Contract Value / Ref |
| :--- | :--- | :--- | :--- |
| **DLF The Arbour** | Sector 63, GCRE | **Ahluwalia Contracts (India) Ltd** & **B L Kashyap & Sons Ltd** <br>• *Structural: Thornton Tomasetti* • *Elevators: Otis India* | ₹744.68 Cr (Ahluwalia) + ₹369 Cr (BL Kashyap) |
| **DLF Privana South** | Sector 76/77, SPR | **ACC India (Arabian Construction Co.)** <br>• *Site Civil: M/s D.K. Nagpal & Associates* | 7 towers (G+40) structural package |
| **Whiteland The Aspen** | Sector 76, SPR | **Shapoorji Pallonji E&C** <br>• *Architect: Hafeez Contractor* • *Structural: Vintech* | G+38 turnkey execution |
| **Puri The Aravallis** | Sector 61, GCRE | **Ahluwalia Contracts (India) Limited** | Turnkey structural civil execution |
| **Godrej Zenith** | Sector 89, New Gurgaon | **Krishna Buildestates Pvt. Ltd. (KBE)** (Mivan formwork) | ₹208.77 Cr Core & Shell package |
| **Godrej Aristocrat** | Sector 49, Sohna Road | **KEC International (RPG Group)** | Turnkey structural civil package |
| **Signature Global Titanium SPR** | Sector 71, SPR | **Capacit'e Infraprojects Limited** <br>• *Commercial JV: RMZ Corp (3.94M sq ft)* | ₹1,203 Crore EPC contract |
| **Elan The Presidential & Emperor** | Sector 106, DXP | **Leighton Asia (CIMIC Group)** | ₹2,000+ Crore turnkey package |
| **Max Estate 360** | Sector 36A, DXP | **Max Estates** + **New York Life Insurance** + **Antara Senior Living** | Institutional equity backing |
| **Krisumi Waterfall Suites** | Sector 36A, CPR | **Sumitomo Corporation (Japan)** & **Nikken Sekkei** | Japanese master township |
| **Sobha Limited Projects** | DXP, Sec 80, Sec 63A | **Sobha Limited (100% In-House Precast Integration)** | German precast manufacturing |

---

## 4. Backend & Programmatic SEO Architecture (Zero UI Footprint)

We have implemented a pure backend SEO optimization layer across the Next.js App Router:

1. **Schema.org Structured Data (`JSON-LD`)**:
   * **`ItemList` Schema (`timelineLdFor`)**: Serializes the chronological ground intelligence timeline into structured historical events with dates, headlines, verified facts, and official source links.
   * **`NewsArticle` Schema (`newsLdFor`)**: Tags the latest/pinned 2026 intelligence dispatch as a structured news report with `datePublished`, `dateModified: 2026-08-19`, and author `Truth Estate Forensic Intelligence`.
   * **`Product` & `Review` Schema**: Retains the independent Truth Score rating (0–100) and review body.
   * **`FAQPage` Schema**: Expanded with dynamic 2026 contractor, construction pacing, and HARERA completion answers.

2. **Dynamic Metadata & Social Share Tags**:
   * `generateMetadata` in `src/app/projects/[slug]/page.tsx` fetches the latest pinned wire item and generates dynamic Open Graph and Twitter Card descriptions with 2026 ground status.

3. **AI Search & LLM Grounding (`/llms.txt`)**:
   * Machine-readable index at `/llms.txt` documenting the 453 verified dispatches to maximize citation inclusion in Perplexity, ChatGPT Search, and Google AI Overviews.

---

## 5. Ingestion Pipeline & Maintenance Scripts

All scripts reside in the `scripts/` directory and can be executed via Node.js:

```bash
# Ingest comprehensive batches (DLF, M3M, Godrej, Signature, Birla, Emaar, Sobha, Smartworld, etc.)
node scripts/comprehensive-batch1-dlf-m3m.mjs
node scripts/comprehensive-batch2-godrej-signature-birla.mjs
node scripts/comprehensive-batch3-emaar-smartworld-sobha-whiteland.mjs
node scripts/comprehensive-batch4-krisumi-ashiana-centralpark-tulip-elan-others.mjs

# Refresh local JSON snapshot for static build optimization
SNAPSHOT_REFRESH=1 node scripts/snapshot-supabase.mjs

# Run Next.js production SSG build (bakes all 1,838 pages in ~20-25s)
NEXT_PUBLIC_BASE_PATH="" NEXT_PUBLIC_ORIGIN=https://truthestate.in npm run build
```

---

## 6. Future UI Enhancements (Held for Next Sprint)

Per product direction, the following UI additions are queued for the subsequent release:
1. **Corridor Wire Feeds (`/intelligence/markets/[slug]`)**: Aggregating all ground events by micro-market (e.g. Golf Course Extension corridor live stream).
2. **Developer DNA Timeline (`/intelligence/developers/[slug]`)**: Combined portfolio-wide construction velocity view for major builders (DLF, Godrej, Signature Global).
3. **Project Comparison Wire Overlay (`/intelligence/compare/[pair]`)**: Side-by-side milestone comparison.

---
*Signed,*  
**Truth Estate Engineering Team**
