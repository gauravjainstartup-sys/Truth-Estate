# Supabase Egress Audit & Optimization Specification

## 1. Problem Statement
The Supabase free tier monthly network egress cap is **5.00 GB**. Current usage is at **4.22 GB (84.4%)**.

### Egress Breakdown (From Supabase Dashboard Metrics)
- **Auth Egress**: `279.03 KB` (**0.0%**)
- **Edge Functions Egress**: `459.65 KB` (**0.0%**)
- **PostgREST Egress**: **`915.51 MB` (99.9%)**

> **Root Cause**: Outgoing network traffic is 99.9% consumed by PostgREST database queries executed during static site builds (`npm run build`), local development, and CI runs.

---

## 2. Technical Audit & Root Cause Analysis

### A. Over-fetching with `select=*` on JSONB-Heavy Views
In `src/lib/supabase.ts`, `fetchBacklogFull()` executes:
```sql
select=*&order="truthScore".desc.nullslast&limit=500
```
- `backlog_listing_public_v3` contains 120+ columns, including **25+ large nested JSONB columns** (`modConstruction`, `modLegal`, `modFinancial`, `modTrackRecord`, `locPlannedInfra`, `locGrowthDrivers`, `uspCards`, `uspConsultants`, full legal case logs, etc.).
- A single `fetchBacklogFull()` response carries **~3.5 MB to 5.0 MB** of uncompressed JSON data over the wire.

### B. Triple-Query Join Overhead
Every single invocation of `fetchBacklogFull()` executes **3 separate HTTP network requests**:
1. `backlog_listing_public_v3` (limit 500)
2. `backlog_project_data` (`select=id,construction_pace,sales_velocity,legal_health`, limit 2000)
3. `backlog_project_data` (`select=id,overrides`, limit 2000)

### C. Worker Thread Cache Isolation in Next.js Static Export
Next.js static export (`output: "export"`) spawns **9 parallel worker threads** to generate 1,266 static pages (`/projects/[slug]`, `/intelligence/compare/[pair]`, `/best-projects/[filter]`, etc.).
- Memory variables (`let backlogCache`) inside `src/app/projects/[slug]/page.tsx` are isolated to a single Node process and are **not shared across worker threads**.
- Across 1,266 page builds, `fetchBacklogFull()` is executed repeatedly over the network across worker threads, fetching 3.5MB–5MB per call.
- **Result**: A single `npm run build` or local dev session can consume **1.0 GB to 3.5 GB of Supabase network egress**.

---

## 3. Solution Architecture & Technical Plan

### Goal
Reduce build-time PostgREST network egress from **~2,500 MB &rarr; ~3.5 MB per build** (**99.8% reduction**), keeping monthly usage under **150 MB total (< 3% of the 5 GB cap)**.

---

### Step 1: Pre-Build Data Snapshot Script (`scripts/fetch-db-snapshot.mjs`)
Automate fetching the database snapshot **once** before static page compilation begins.

1. Create `scripts/fetch-db-snapshot.mjs`:
   - Fetches `backlog_listing_public_v3`, `backlog_project_data`, `developers_overview`, `micro_market_data`, `projects_basic_public`.
   - Writes JSON files to `.data-snapshot/` directory.
2. In `package.json`, update prebuild script:
   ```json
   "scripts": {
     "prebuild": "node scripts/fetch-db-snapshot.mjs",
     "build": "SUPABASE_FIXTURES=.data-snapshot next build && node scripts/verify-out.mjs"
   }
   ```
3. `src/lib/supabase.ts` already contains fixture support (`readFixture()`):
   When `SUPABASE_FIXTURES=.data-snapshot` is set, all 9 worker threads read from local disk files instead of making HTTP network calls to Supabase.

---

### Step 2: Column Selection Projection Optimization
For lightweight consumers (sitemaps, search indexes, geo coordinates, and overview lists), do NOT call `fetchBacklogFull()` with `select=*`.

1. For `sitemap.ts` and `search-index.json`:
   Select only basic string columns:
   ```sql
   select=id,name,developer,location,"microMarket","truthScore","min_price_cr"
   ```
   *(Reduces payload size from 3.5 MB to ~50 KB per request).*

---

### Step 3: Consolidate Database Sub-Queries
In `src/lib/supabase.ts`, combine the 3 separate HTTP requests in `fetchBacklogFull()` (`backlog_listing_public_v3` + `backlog_project_data` QPR + `backlog_project_data` overrides) into a single consolidated view query or RPC call in Supabase PostgREST.

---

## 4. Verification & Testing Steps
1. Run `node scripts/fetch-db-snapshot.mjs` locally to verify snapshot creation in `.data-snapshot/`.
2. Run `SUPABASE_FIXTURES=.data-snapshot npm run build` and verify:
   - 0 HTTP calls sent to `lyetvabfgaidvqrbmaoy.supabase.co` during worker page generation.
   - Build completes with `1266/1266` pages rendered cleanly.
   - `node scripts/verify-out.mjs` and `node scripts/rls-guard.mjs` pass 100% clean.
