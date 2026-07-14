/* ════════════════════════════════════════════════════════════════
   FEED ADAPTER — pipeline Step 1's real source.

   The founder's `project_input_feed` VIEW consolidates the existing ops
   pipeline (backlog_projects + project_extended_details +
   project_configurations) into one row per project: typed_facts,
   uploaded_assets, and a configurations[] array. This module maps that
   view row → the generation-brief contract that intake.mjs validates.

   Two site-wide defaults the view doesn't carry (returns null):
     · true-north offset → 0°     (north-up siteplans)
     · scale             → 0.45 m/px
   Precedence for both: explicit override > view value > default.

   SOURCE seam — today reads a fixture mirroring one view row
   (db3d/intake/feed/<slug>.feed.json), since Supabase is network-blocked
   from the build sandbox. In production this is one
   `select … from project_input_feed where project_name = $1` via
   service_role. The mapping is identical either way.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FEED_DIR = process.env.FEED_DIR || path.join(HERE, "feed");

export const NORTH_DEFAULT_DEG = 0;      // north-up siteplan → plan north = true north
export const SCALE_DEFAULT_M_PER_PX = 0.45;

const firstNum = (...vals) => { for (const v of vals) { const n = typeof v === "string" ? parseFloat(v) : v; if (typeof n === "number" && Number.isFinite(n)) return n; } return null; };
/* slug from the project name — identical dialect to projects.ts tiSlug /
   src/lib/modelAccess.ts modelSlugFor, so the advisor attaches correctly. */
export const slugify = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
/* leading integer of a BHK label: "4 BHK"→4, "3.5 BHK"→3, "Studio"→null */
const bedsOf = (bhk) => { const n = parseInt(String(bhk || "").trim(), 10); return Number.isFinite(n) ? n : null; };
/* single floor count: no_of_floors wins; else the largest integer in a range/label ("G+38"→38, "35-40"→40) */
const floorsOf = (feed) => firstNum(feed.no_of_floors) ?? (() => { const ms = String(feed.floors || "").match(/\d+/g); return ms ? Math.max(...ms.map(Number)) : null; })();

/* map one project_input_feed row → the intake contract (intake.mjs shape) */
export function mapFeedRow(feed, overrides = {}) {
  const tf = feed.typed_facts || {}, ua = feed.uploaded_assets || {};
  const configsRaw = Array.isArray(feed.configurations) ? feed.configurations : [];

  // configs: one per bhk_type (dedup across towers); first non-null areas win
  const byType = new Map();
  const dupTowers = [];
  for (const c of configsRaw) {
    const key = (c.bhk_type || "").trim();
    if (!key) continue;
    if (!byType.has(key)) {
      byType.set(key, {
        config: key, beds: bedsOf(key), baths: null,
        carpetSqft: firstNum(c.carpet_area), superSqft: firstNum(c.super_area), balconySqft: firstNum(c.balcony_area),
        rooms: null,
      });
    } else {
      dupTowers.push(key); // same BHK in another tower — areas already captured
    }
  }

  // floor plans: one per configuration row that has an image (tower-scoped)
  const floorplan_urls = configsRaw
    .filter((c) => c.floor_plan_image_url)
    .map((c) => ({ config: (c.bhk_type || "").trim(), tower: c.tower_name || null, url: c.floor_plan_image_url }));

  // tower hints from the config↔tower mapping the view carries
  const configByTower = {};
  for (const c of configsRaw) if (c.tower_name && c.bhk_type) configByTower[c.tower_name] = c.bhk_type.trim();

  const north = firstNum(overrides.north_offset_deg, feed.true_north_offset_deg, tf.true_north_offset_deg) ?? NORTH_DEFAULT_DEG;
  const scale = firstNum(overrides.scale_m_per_px, feed.scale_m_per_px, tf.scale_m_per_px) ?? SCALE_DEFAULT_M_PER_PX;
  const northDefaulted = firstNum(overrides.north_offset_deg, feed.true_north_offset_deg, tf.true_north_offset_deg) == null;
  const scaleDefaulted = firstNum(overrides.scale_m_per_px, feed.scale_m_per_px, tf.scale_m_per_px) == null;

  const contract = {
    slug: overrides.slug || slugify(feed.project_name),
    name: feed.project_name,
    status: overrides.status || "ready",
    developer: feed.developer_name || null,
    city: feed.city || feed.location || null,
    location: feed.location || null,

    latitude_deg: firstNum(overrides.latitude_deg, feed.latitude, tf.latitude),
    north_offset_deg: north,
    floors: overrides.floors ?? floorsOf(feed),
    floors_uniform: overrides.floors_uniform ?? true,
    scale_m_per_px: scale,

    // Tier-2 → null so intake.mjs applies its engine defaults
    floor_height_m: overrides.floor_height_m ?? null,
    lobby_height_m: overrides.lobby_height_m ?? null,
    core_half_width_m: overrides.core_half_width_m ?? null,
    sky_floor: overrides.sky_floor ?? null,
    prevailing_breeze: overrides.prevailing_breeze ?? null,
    view_anchors: overrides.view_anchors ?? null,

    configs: [...byType.values()],
    tower_hints: {
      towerCount: firstNum(feed.total_towers) ?? undefined,
      configByTower: Object.keys(configByTower).length ? configByTower : undefined,
      notes: overrides.tower_notes || undefined,
    },

    siteplan_url: overrides.siteplan_url || feed.siteplan_image_url || ua.siteplan_image_url || null,
    floorplan_urls,
    brochure_url: feed.brochure_url || ua.brochure_url || null,
    notes: `Fed from project_input_feed (backlog_id ${feed.backlog_id ?? "?"}).`
      + (dupTowers.length ? ` Config areas deduped across towers for: ${[...new Set(dupTowers)].join(", ")}.` : ""),

    // provenance so the brief can flag which values came from a default
    __provenance: {
      source: "project_input_feed",
      northDefaulted, scaleDefaulted,
      northDefault: NORTH_DEFAULT_DEG, scaleDefault: SCALE_DEFAULT_M_PER_PX,
    },
  };
  return contract;
}

export function loadFeed(slug, dir = FEED_DIR) {
  const p = path.join(dir, `${slug}.feed.json`);
  return mapFeedRow(JSON.parse(readFileSync(p, "utf8"))); // real: select … from project_input_feed
}
