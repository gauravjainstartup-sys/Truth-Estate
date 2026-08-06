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
import type { LiveConfiguration, LiveExtendedDetails } from "./supabase";

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
