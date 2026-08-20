/* ════════════════════════════════════════════════════════════════
   BROWSER-SIDE SUPABASE READER — the runtime half of the live-data layer.

   Reads the SAME public tables the build reads (project_extended_details,
   project_configurations, backlog_listing_public_v3, backlog_project_data),
   with the SAME public anon key + RLS — but from the visitor's browser. So
   an edit made in the backoffice shows on the next page view without a
   deploy, exactly as the old AI-Studio client did.

   Node-free ON PURPOSE: it imports only the public coordinates
   (supabasePublic.ts), never supabase.ts (whose fixture path pulls in
   `fs`). That keeps this safe to bundle into a client component.

   Everything fails SOFT: any non-OK response or network error returns null,
   and the caller keeps the baked data. The live layer can only ever ADD
   freshness on top of a page that already works — never break one.
   ════════════════════════════════════════════════════════════════ */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabasePublic";
import { computePillarSet, mapBacklogRowFields, ocFromOverrides, type BacklogRowFields } from "./backlogRow";
import type { LiveBacklogFull, LiveConfiguration, LiveExtendedDetails, LivePillarSet, ProjectWireItem } from "./supabase";

type Row = Record<string, unknown>;

const HEADERS: HeadersInit = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

/* no-store is the whole point — never serve an asset list older than the
   edit. On any failure the caller falls back to the baked page. */
async function rows(pathAndQuery: string): Promise<Row[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, { headers: HEADERS, cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as unknown;
    return Array.isArray(body) ? (body as Row[]) : null;
  } catch {
    return null;
  }
}

/* PostgREST in.(…) — quote each id so hyphens/spaces are safe. Backlog ids
   are uuids or slugs (no quotes of their own), so a plain strip is enough. */
const inList = (ids: string[]): string => `in.(${ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",")})`;

/* the same soft readers supabase.ts uses on the way in */
const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const n = (v: unknown): number | null => {
  const x = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(x) ? x : null;
};

/* backlog_projects.project_name → its id — the join bridge the build resolves
   via fetchBacklogNameIds. The listing view's OWN id is not this id, so ext /
   configs (keyed by backlog_id) need the name→id hop first — the same hop
   useLiveVitals already relies on. Returns null on any miss; the caller then
   falls back to the row's own id + altIds. */
export async function resolveBacklogId(name: string): Promise<string | null> {
  if (!name) return null;
  const rs = await rows(`backlog_projects?project_name=eq.${encodeURIComponent(name)}&select=id&limit=1`);
  const id = rs?.[0]?.id;
  return typeof id === "string" && id ? id : null;
}

/* project_extended_details — hero, media, price/area bands, vitals.
   Field mapping mirrors supabase.ts fetchExtendedDetails EXACTLY, so the
   adapter cannot tell a live row from a build-time one. Keyed by backlog_id. */
export async function fetchExtendedLive(ids: string[]): Promise<Record<string, LiveExtendedDetails> | null> {
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length) return null;
  const rs = await rows(`project_extended_details?backlog_id=${inList(want)}&select=*`);
  if (!rs) return null;
  const out: Record<string, LiveExtendedDetails> = {};
  for (const r of rs) {
    const backlogId = s(r.backlog_id);
    if (!backlogId) continue;
    out[backlogId] = {
      backlogId,
      heroImageUrl: s(r.hero_image_url),
      heroDate: s(r.hero_date),
      priceRangeSqft: s(r.price_range_sqft),
      superAreaRange: s(r.super_area_range),
      launchPrice: n(r.launch_price),
      floorsRange: s(r.floors_range),
      totalTowers: n(r.total_towers),
      brochureUrl: s(r.brochure_url),
      paymentPlanUrl: s(r.payment_plan_url),
      renderElevationUrl: s(r.render_elevation_url),
      siteMapImageUrl: s(r.site_map_image_url),
      siteMap3dHtml: s(r.site_map_3d_html),
    };
  }
  return Object.keys(out).length ? out : null;
}

/* The WHOLE report row, live. Re-reads the project's backlog_listing_public_v3
   row (Truth Score, developer track record, legal flags, ROI, location, USPs,
   financials) AND its backlog_project_data join (construction/sales pace, the
   forensic legal_health, the OC overrides, and the Truth-Score pillar
   breakdown) — the same two sources the build reads — mapped through the SAME
   mapper (backlogRow.ts). So a pipeline rerun or a backoffice edit to any of
   these shows on the next page view, no deploy.

   Keyed by the project id (the listing view id === backlog_project_data.id ===
   the baked row.id — the same join the build makes). select=* on v3 so no field
   the report reads is ever missed. Fails soft → the caller keeps the baked row. */
export async function fetchBacklogRowLive(
  id: string,
): Promise<{ fields: BacklogRowFields; pillars: LivePillarSet | null } | null> {
  if (!id) return null;
  const [v3rows, bpdRows] = await Promise.all([
    rows(`backlog_listing_public_v3?id=eq.${encodeURIComponent(id)}&select=*&limit=1`),
    rows(
      `backlog_project_data?id=eq.${encodeURIComponent(id)}` +
        `&select=id,construction_pace,sales_velocity,legal_health,overrides,expected_roi&limit=1`,
    ),
  ]);
  const r = v3rows?.[0];
  if (!r) return null;
  const bpd = bpdRows?.[0] ?? null;
  const oc = bpd ? ocFromOverrides(bpd.overrides) : null;
  return { fields: mapBacklogRowFields(r, bpd, oc), pillars: bpd ? computePillarSet(bpd.expected_roi) : null };
}

/* developer_health.financial_health — the developer's audited financial ratios,
   the SAME table the developer dossier reads. The project report's Developer-DNA
   financial audit rides on the project row's fin* fields (net_debt_to_equity …),
   which are these ratios carried onto the row at build; re-read them live so a
   financials edit in developer_health shows on the next page view — no deploy —
   the same instant contract the assets already have.

   Lean JSONB sub-select (computed_metrics only) keeps this to ~150 bytes: the
   large analyst `notes` blob is never pulled. Only the five ratios that drive the
   report's visible financial meters are read — the overall score isn't shown on
   the report and is computed differently there, so it is deliberately left baked.
   Keyed by the exact developer_name (every live-set developer matches it exactly).
   Fails soft → the caller keeps the baked financials. */
type LiveFinancials = Partial<
  Pick<LiveBacklogFull, "finLeverage" | "finCoverage" | "finCash" | "finMargin" | "finInventory">
>;
export async function fetchDeveloperFinancialsLive(developerName: string): Promise<LiveFinancials | null> {
  const name = developerName?.trim();
  if (!name) return null;
  const rs = await rows(
    `developer_health?developer_name=eq.${encodeURIComponent(name)}&select=cm:financial_health->computed_metrics&limit=1`,
  );
  const cm = rs?.[0]?.cm;
  if (!cm || typeof cm !== "object") return null;
  const m = cm as Record<string, unknown>;
  const out: LiveFinancials = {};
  const put = (k: keyof LiveFinancials, v: unknown) => {
    const x = n(v);
    if (x != null) out[k] = x;
  };
  put("finLeverage", m.net_debt_to_equity);
  put("finCoverage", m.interest_coverage_ratio);
  put("finCash", m.ocf_to_ebitda);
  put("finMargin", m.ebitda_margin);
  put("finInventory", m.inventory_to_sales_years);
  return Object.keys(out).length ? out : null;
}

/* project_configurations — the per-BHK homes and their floor-plan images.
   Mirrors supabase.ts fetchConfigurations. Keyed by backlog_id (1-to-many). */
export async function fetchConfigsLive(ids: string[]): Promise<Record<string, LiveConfiguration[]> | null> {
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length) return null;
  const rs = await rows(`project_configurations?backlog_id=${inList(want)}&select=*&order=super_area.asc.nullslast`);
  if (!rs) return null;
  const out: Record<string, LiveConfiguration[]> = {};
  for (const r of rs) {
    const backlogId = s(r.backlog_id);
    if (!backlogId) continue;
    (out[backlogId] ??= []).push({
      backlogId,
      bhkType: s(r.bhk_type),
      areaType: s(r.area_type),
      carpetArea: n(r.carpet_area),
      balconyArea: n(r.balcony_area),
      superArea: n(r.super_area),
      floorPlanImageUrl: s(r.floor_plan_image_url),
      config3dHtml: s(r.config_3d_html),
    });
  }
  return Object.keys(out).length ? out : null;
}

/* ── News & Updates, scoped to one project ────────────────────────────────
   Every other field on the report already refreshes live; news was the one
   section that could only change on a rebuild, which meant it could sit an
   hour behind its own "last updated" date.

   The build-time reader (fetchProjectWire in supabase.ts) pulls the WHOLE
   published table in one query — right when a single build needs all 107
   projects, wrong on a page view, which would ship every project's news to
   every visitor. This asks only for the project on screen: one or two rows,
   smaller than the extended-assets fetch running beside it.

   Exact slug only. 106 of the 107 projects file under the report's own slug;
   the one that does not is resolved by the build's fuzzy fallback, and null
   here leaves that report on its baked items — an hour stale at worst, never
   wrong. Fails soft like everything else in this file.

   The field mapping is duplicated from supabase.ts rather than imported
   because this module must stay Node-free (see the header). */
export async function fetchProjectWireLive(projectSlug: string): Promise<ProjectWireItem[] | null> {
  const slug = projectSlug.trim();
  if (!slug) return null;
  const rs = await rows(
    `project_intelligence_wire?select=*&status=eq.PUBLISHED&project_slug=eq.${encodeURIComponent(slug)}` +
      `&order=event_date.desc,display_order.asc&limit=50`,
  );
  if (!rs?.length) return null;
  return rs
    .filter((r) => (s(r.status) ?? "DRAFT") === "PUBLISHED")
    .map((r) => ({
      id: String(r.id ?? ""),
      projectSlug: s(r.project_slug) ?? "",
      projectName: s(r.project_name) ?? "",
      eventDate: s(r.event_date) ?? "",
      category: (s(r.category) as ProjectWireItem["category"]) || "REGULATORY",
      headline: s(r.headline) ?? "",
      verifiedFacts: s(r.verified_facts) ?? "",
      forensicImpactType: (s(r.forensic_impact_type) as ProjectWireItem["forensicImpactType"]) || "NEUTRAL",
      forensicImpactSummary: s(r.forensic_impact_summary) ?? "",
      sourceName: s(r.source_name) ?? "",
      sourceUrl: s(r.source_url),
      sourceDocumentRef: s(r.source_document_ref),
      status: (s(r.status) as ProjectWireItem["status"]) || "PUBLISHED",
      isPinned: Boolean(r.is_pinned),
      displayOrder: n(r.display_order) ?? 0,
      updatedAt: s(r.updated_at),
      createdAt: s(r.created_at),
    }));
}
