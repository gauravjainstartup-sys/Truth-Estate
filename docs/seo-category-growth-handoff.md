# Category Design & Growth SEO Handoff Specification

## 1. Executive Summary & Category Design Thesis
Truth Estate is building **India's First Independent Buyer's Office** for residential real estate. Our objective on Google is **not** conventional keyword optimization or generic ranking. 

Our objective is **Category Habits Creation**:
> **Checking Truth Estate before paying a property booking amount must become as natural as checking CIBIL before taking a loan or CarFax before buying a used car.**

Target Audience: High-Net-Worth Buyers (CXOs, Founders, NRIs, Investors) purchasing ₹2 Cr – ₹20 Cr under-construction homes who are in a state of **Pre-Transaction Anxiety** (fear of multi-crore delays, legal traps, or overpaying).

---

## 2. Forbidden Language vs Intent-First Positioning
- **NEVER USE Internal Buzzwords**: `Project Intelligence`, `Independent Read`, `AI Powered`, `Public Records`, `RERA Filings`, `Data Driven`, `Premium Insights`.
- **ALWAYS USE Buyer Intent Keywords**: `Review`, `Worth Buying?`, `Should You Buy?`, `Legal Risks`, `Construction Progress`, `Delivery Outlook`, `Before Paying Booking Amount`, `Before You Invest`.

---

## 3. The 7 Psychological Vectors
To prevent SERP monotony across 97+ project pages, titles and meta descriptions are varied intentionally across 7 psychological angles:

1. **`DECISION`**: `<Project> Review (2026): Buy, Wait or Avoid?`
2. **`VERDICT`**: `<Project>: Worth Buying or Marketing Hype?`
3. **`CONFIDENCE`**: `<Project> Review: Read Before You Book`
4. **`RISK`**: `<Project> Review: Legal & Delivery Risks`
5. **`EDITORIAL`**: `Would We Invest in <Project>? Review`
6. **`NEGOTIATION`**: `<Project> Review: True Value or Overpriced?`
7. **`CURIOSITY`**: `<Project> Review: What Sales Won't Tell You`

---

## 4. Architecture & Data Sources
- **Data Source**: Supabase `backlog_listing_public_v3` via `fetchBacklogFull()`.
- **Pre-Curated Overrides**: `src/data/seo_category_growth_strategy.json` (97 projects, character-validated).
- **SEO Helper Module**: `src/lib/seoCategoryGrowth.ts`.
- **Metadata Integration**: Integrated directly into `src/app/projects/[slug]/page.tsx` (`generateMetadata`).

---

## 5. Automated Copy Generation for NEW Projects
When a new project is added to the backend in the future:
1. `src/lib/seoCategoryGrowth.ts` exports `getProjectSeoMeta(input: ProjectSeoInput)`.
2. It automatically checks if the project has a curated override in `seo_category_growth_strategy.json`.
3. If it is a **brand-new project**, `getProjectSeoMeta` dynamically hashes the project name, assigns one of the 7 psychological vectors, and generates:
   - **Title**: Hard capped at **≤ 60 characters** with search intent matching in the first 25 characters.
   - **Meta Description**: Hard capped at **140–155 characters** formatted in *The Economist × Apple* restrained tone.
   - **Forbidden Word Scrubbing**: Zero internal methodology jargon.

---

## 6. Handoff & Branch Status for Claude (CTO)
- Branch: `feature/seo-meta`
- Verification Commands:
  1. `npm run build` (Static export 1266/1266 pages passed clean)
  2. `node scripts/verify-out.mjs` (PASSED)
  3. `node scripts/rls-guard.mjs` (14/14 checks PASSED)
