# Truth Estate — Product & Engineering Constitution (`TRUTH_ESTATE_PRINCIPLES.md`)

This document is the **unshakeable constitution** of Truth Estate. It governs every product, UI, UX, and architectural decision made by AI agents (Antigravity & subagents) and human contributors.

---

## 1. Core Identity & Category
- **We are NOT**: A property listing portal, brokerage, advertising marketplace, or lead generation broker.
- **We ARE**: **India's first Independent Real Estate Intelligence Platform — The Buyer's Office**.
- **Target Persona**: Premium Home Buyers, HNIs, and NRIs purchasing ₹2 Cr+ residential real estate in Gurugram (expanding All-India).
- **Core Question We Answer**: Not *"Which project should I buy?"*, but **"Should I buy THIS project, and WHY?"**

---

## 2. Design & UX Commandments (Morgan Stanley × Bloomberg × Apple)
1. **Calm, Authoritative Luxury**:
   - **PREFER**: Generous whitespace, large crisp typography (Inter, Outfit, serif headings), structured cards, subtle glassmorphism, dark/warm radial backdrops (`#241d12`, `#14110d`), and gold accents (`#c9a96e`, `#9a7a2e`).
   - **NEVER USE**: Loud colors, promotional banners, cheap gradients, countdown timers, pop-up spam, or visual clutter.
2. **Single Primary CTA per Screen**:
   - Reduce cognitive load. Every page has **one primary CTA**. Never overwhelm the buyer with competing action buttons.
3. **Bloomberg-Class Dashboard**:
   - The Buyer Office dashboard is a **live intelligence terminal** (projects, construction alerts, legal signals, market pulse), not a Gmail inbox or Notion folder.

---

## 3. Brand Voice & Language Rules
- **Zero Developer Bias & Zero Marketing Hyperbole**:
  - Delete broker jargon: *"Luxury Living"*, *"World Class"*, *"Best Deal"*, *"Guaranteed Return"*.
  - Replace with evidence terms: **"Construction Momentum"**, **"Legal Risk"**, **"Execution Risk"**, **"Possession Forecast"**, **"Developer Track Record"**.
- **Professional, Short, Evidence-First**:
  - Every claim must be traceable to structured public data (RERA Haryana, NSE/BSE filings, Court Orders, Consumer Forums). Never invent or hallucinate data.

---

## 4. Product Moats & Core Offerings
1. **Project Intelligence Pass (₹999)**: Independent Forensic Audit, Quarterly Updates, TruthGuide Pro, and Priority Owners Club Access.
2. **TruthGuide Pro**: Grounded AI expert answering strictly from structured evidence (RERA/Court/Financial filings), with zero hallucinations and explicit citations.
3. **Construction Momentum Index**: Proprietary quarterly metric comparing actual physical progress vs. developer's declared RERA schedule.
4. **Developer Portfolio Pulse**: Tracking execution consistency across 16+ developers and 100+ projects.
5. **Owners Club**: LinkedIn × Slack for verified property owners — private updates, collective buying power, and resale marketplace.

---

## 5. Non-Negotiable Engineering Filters
- **The North Star Test**: *"Does this feature help a home buyer make a better, evidence-backed property decision?"* If yes, build it. If not, reject it.
- **Data Integrity**: Wire backend data into existing UI components using adapters (`liveReport.ts` style). Render missing data as "NA" or hide cleanly.
- **Architectural Security**: Row-Level Security (RLS) is the hard wall. Identity operations run server-side only via service-role SECURITY DEFINER functions.

---
**Before starting any task, Antigravity loads and enforces these non-negotiable principles.**
