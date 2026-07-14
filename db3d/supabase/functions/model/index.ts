/* ════════════════════════════════════════════════════════════════
   EDGE FUNCTION · model — GET /model?slug=… + Bearer token → bundle

   Gate: valid signature · not expired · slug matches the token scope.
   Data: get_model_bundle(slug) via service_role RPC (the SECURITY
   DEFINER function is the only read path; RLS hides the tables).

   RESHAPE — the important part: get_model_bundle returns to_jsonb(row)
   rows (snake_case columns + DB-only keys like the bigint id), but the
   engine was proven against the pieces dialect the mock serves
   (camelCase site/configs, tower `id` = 'T-7', floorplan extras like
   `rails` at top level). Serving DB rows raw would break tower labels
   (bigint id shadows 'T-7'), blank the config areas (carpetSqft) and
   drop floorplan rails. reshapeBundle() restores the exact dialect —
   field lists mirror db3d/make-bundle.mjs (the seed generator), and
   db3d/test-edge-parity.mjs proves pieces → seed-shape → reshape is
   the identity for every project on disk.
   ════════════════════════════════════════════════════════════════ */
import { corsHeaders, envGet, handleModel } from "../_shared/gate.ts";

type Row = Record<string, unknown>;
const pick = (r: Row, keys: string[]): Row => {
  const o: Row = {};
  for (const k of keys) o[k] = r[k];
  return o;
};

export function reshapeBundle(db: Row): Row | null {
  const site = db.site as Row | null;
  if (!site) return null; // unknown slug
  return {
    site: {
      slug: site.slug, name: site.name, latitudeRad: site.latitude_rad, floors: site.floors,
      floorHeightM: site.floor_height_m, lobbyHeightM: site.lobby_height_m, northCalRad: site.north_cal_rad,
      sunBenchmarkHours: site.sun_benchmark_h, westWeight: site.west_weight, sunRayLenM: site.sun_ray_len_m,
      lake: site.lake, scaleMPerPx: site.scale_m_per_px, pxOriginX: site.px_origin_x, pxOriginY: site.px_origin_y,
      boundaryPx: site.boundary_px,
      // latitudeDeg / northCalDeg are derivable and unread by the engine — not stored, not emitted
    },
    towers: (db.towers as Row[]).map((t) => ({
      slug: t.slug, id: t.tower_id, // 'T-7' back on `id`; the bigint row id stays behind
      x: t.x, z: t.z, rot: t.rot, hw: t.hw, hd: t.hd, core: t.core, cfg: t.cfg,
    })),
    configs: (db.configs as Row[]).map((c) => ({
      slug: c.slug, config: c.config, beds: c.beds, baths: c.baths, saleable: c.saleable,
      carpetSqft: c.carpet_sqft, balconySqft: c.balcony_sqft,
      deck: c.deck, rooms: c.rooms, extra: c.extra, col: c.col,
    })),
    plates: (db.plates as Row[]).map((p) => pick(p, ["slug", "config", "offsets"])),
    floorplans: (db.floorplans as Row[]).map((f) => ({
      ...pick(f, ["slug", "config", "unit", "key", "iw", "ih", "walls"]),
      ...(f.extra as Row || {}), // rails / spawn / deck return to the top level
    })),
    intelligence: (db.intelligence as Row[]).map((r) =>
      pick(r, ["slug", "tower_id", "unit", "composite", "grade", "facing", "sub_scores", "reasons", "flags", "metrics"])),
    vastu: pick(db.vastu as Row, ["generic_offsets", "direction", "room"]),
  };
}

async function getBundle(slug: string): Promise<Row | null> {
  const base = envGet("SUPABASE_URL"), key = envGet("SUPABASE_SERVICE_ROLE_KEY");
  const r = await fetch(`${base}/rest/v1/rpc/get_model_bundle`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ p_slug: slug }),
  });
  if (!r.ok) return null;
  const db = (await r.json()) as Row | null;
  return db ? reshapeBundle(db) : null;
}

const originAllow = (): string[] => [
  "https://gauravjainstartup-sys.github.io",
  ...envGet("EXTRA_ORIGIN").split(",").filter(Boolean),
];

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") ?? "";
  const headers = corsHeaders(origin, originAllow());
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "no-route" }), { status: 404, headers });
  const secret = envGet("MODEL_JWT_SECRET");
  if (!secret || !envGet("SUPABASE_URL") || !envGet("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response(JSON.stringify({ error: "misconfigured" }), { status: 500, headers });
  }
  const u = new URL(req.url);
  const r = await handleModel(
    { auth: req.headers.get("authorization"), slug: u.searchParams.get("slug") },
    { secret, getBundle },
  );
  return new Response(JSON.stringify(r.json), { status: r.code, headers });
}

const D = (globalThis as { Deno?: { serve?: (h: (r: Request) => Promise<Response>) => void } }).Deno;
if (D?.serve) D.serve(handler); // Deno Edge runtime only; the parity test imports `handler` under Node
