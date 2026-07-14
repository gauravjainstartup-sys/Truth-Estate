/* ════════════════════════════════════════════════════════════════
   EDGE-PORT PROOF — run:  node --experimental-strip-types db3d/test-edge-parity.mjs

   Drives the DEPLOYABLE Supabase Edge Function files
   (db3d/supabase/functions/*) under Node 22 with PostgREST stubbed:

   · the same gate matrix the mock passes (test-gate.mjs), through the
     functions' real Request/Response surface;
   · token dialect parity — a token minted by the mock verifies in the
     port and vice versa, and identical payloads yield BYTE-IDENTICAL
     JWTs (the two implementations are indistinguishable);
   · reshape identity — pieces → seed columns (to_jsonb simulation) →
     reshapeBundle() returns exactly the pieces dialect the engine was
     proven against, for every project on disk.

   Deno-only surface NOT exercised here: Deno.serve + Deno.env (thin,
   guarded). The RUNBOOK's curl block covers those after deploy.
   ════════════════════════════════════════════════════════════════ */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";

process.env.MODEL_JWT_SECRET = "dev-secret-not-for-prod"; // = the mock's default → shared dialect provable
process.env.SUPABASE_URL = "http://supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-test-key";
process.env.EXTRA_ORIGIN = "http://localhost:8791";

const HERE = new URL(".", import.meta.url);
const piece = (slug, n) => JSON.parse(readFileSync(new URL(`./projects/${slug}/pieces/${n}.json`, HERE), "utf8"));
const PROJECTS = readdirSync(new URL("./projects", HERE))
  .filter((d) => existsSync(new URL(`./projects/${d}/pieces/site.json`, HERE))); // same filter as the mock

/* ── simulate get_model_bundle(slug): pieces mapped through the seed's
      columns (mirrors make-bundle.mjs) + the DB-only keys to_jsonb adds ── */
function dbBundle(slug) {
  const site = piece(slug, "site"), towers = piece(slug, "towers"), configs = piece(slug, "configs"),
    plates = piece(slug, "plates"), fps = piece(slug, "floorplans"), intel = piece(slug, "intelligence"),
    vastu = piece(slug, "vastu_rules");
  let seq = 0;
  const idify = (r) => ({ id: ++seq, ...r });
  const nn = (v) => (v === undefined ? null : v); // SQL: a missing value is a NULL column
  return {
    site: { slug: site.slug, name: site.name, latitude_rad: site.latitudeRad, floors: site.floors,
      floor_height_m: site.floorHeightM, lobby_height_m: site.lobbyHeightM, north_cal_rad: site.northCalRad,
      sun_benchmark_h: site.sunBenchmarkHours, west_weight: site.westWeight, sun_ray_len_m: site.sunRayLenM,
      lake: site.lake, scale_m_per_px: site.scaleMPerPx, px_origin_x: site.pxOriginX, px_origin_y: site.pxOriginY,
      boundary_px: site.boundaryPx, amenities: [], updated_at: "2026-07-14T00:00:00+00:00" },
    towers: towers.map((t) => idify({ slug: t.slug, tower_id: t.id, x: t.x, z: t.z, rot: t.rot, hw: t.hw, hd: t.hd, core: t.core, cfg: t.cfg })),
    configs: configs.map((c) => idify({ slug: c.slug, config: c.config, beds: nn(c.beds), baths: nn(c.baths), saleable: nn(c.saleable),
      carpet_sqft: nn(c.carpetSqft), balcony_sqft: nn(c.balconySqft), deck: nn(c.deck), rooms: nn(c.rooms), extra: nn(c.extra), col: nn(c.col) })),
    plates: plates.map((p) => idify({ slug: p.slug, config: p.config, offsets: p.offsets })),
    floorplans: fps.map((f) => { const { slug: s, config, unit, key, iw, ih, walls, ...rest } = f;
      return idify({ slug: s, config, unit, key, iw: nn(iw), ih: nn(ih), walls, extra: rest }); }),
    intelligence: intel.map((r) => idify({ slug: r.slug, tower_id: r.tower_id, unit: r.unit, composite: nn(r.composite),
      grade: nn(r.grade), facing: nn(r.facing), sub_scores: nn(r.sub_scores), reasons: nn(r.reasons), flags: nn(r.flags),
      metrics: nn(r.metrics), floor_curve: null, computed_at: "2026-07-14T00:00:00+00:00" })),
    vastu: { id: 1, generic_offsets: vastu.generic_offsets, direction: vastu.direction, room: vastu.room,
      updated_at: "2026-07-14T00:00:00+00:00" },
  };
}

/* ── PostgREST stub — the only network the functions touch ── */
const grantWrites = []; // grant-entitlement inserts land here for assertions
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  if ((init.headers || {}).apikey !== "svc-test-key") return J({ error: "bad service key" }, 401);
  if (u.pathname === "/rest/v1/model_access_grants" && (init.method || "GET") === "POST") {
    if (u.searchParams.get("on_conflict") !== "slug,subject,entitlement") return J({ error: "bad on_conflict" }, 400);
    if (!/ignore-duplicates/.test((init.headers || {}).prefer || "")) return J({ error: "not idempotent" }, 400);
    grantWrites.push(...JSON.parse(init.body));
    return new Response(null, { status: 201 });
  }
  if (u.pathname === "/rest/v1/model_access_grants") {
    const slug = (u.searchParams.get("slug") || "").replace(/^eq\./, "");
    const subject = (u.searchParams.get("subject") || "").replace(/^eq\./, "");
    return J(subject === "buyer@demo" && PROJECTS.includes(slug) ? [{ entitlement: "paid", expires_at: null }] : []);
  }
  if (u.pathname === "/rest/v1/rpc/get_model_bundle") {
    const { p_slug } = JSON.parse(init.body);
    return J(PROJECTS.includes(p_slug) ? dbBundle(p_slug)
      : { site: null, towers: [], configs: [], plates: [], floorplans: [], intelligence: [], vastu: null });
  }
  throw new Error("unexpected fetch " + url);
};

process.env.GRANT_ADMIN_KEY = "admin-test-key";
const { handler: mintH } = await import("./supabase/functions/mint-token/index.ts");
const { handler: modelH, reshapeBundle } = await import("./supabase/functions/model/index.ts");
const { handler: grantH } = await import("./supabase/functions/grant-entitlement/index.ts");
const gate = await import("./supabase/functions/_shared/gate.ts");
const mock = await import("./mock-api.mjs"); // imported, not listening; same default secret

const GOOD = "http://localhost:8791", SLUG = "signature-global-titanium-spr", SECRET = "dev-secret-not-for-prod";
let pass = 0, fail = 0;
const ok = (name, cond, got) => { (cond ? pass++ : fail++); console.log(`${cond ? "✓" : "✗ FAIL"}  ${name}${cond ? "" : "  → got " + JSON.stringify(got)?.slice(0, 200)}`); };
const mintReq = (origin, body) => new Request("http://edge.local/mint-token", { method: "POST", headers: origin ? { origin, "content-type": "application/json" } : {}, body: JSON.stringify(body) });
const modelReq = (slug, auth) => new Request(`http://edge.local/model?slug=${encodeURIComponent(slug)}`, { headers: auth ? { authorization: auth } : {} });

// 1. mint-token gate — same matrix as test-gate.mjs, through the deployable handler
ok("off-site origin → 403", (await mintH(mintReq("https://evil.com", { slug: SLUG, subject: "buyer@demo" }))).status === 403);
ok("no entitlement → 403", (await mintH(mintReq(GOOD, { slug: SLUG, subject: "stranger@x" }))).status === 403);
const mintedRes = await mintH(mintReq(GOOD, { slug: SLUG, subject: "buyer@demo" }));
const minted = await mintedRes.json();
ok("entitled buyer → 200 + token", mintedRes.status === 200 && typeof minted.token === "string", minted);
const TOKEN = minted.token;
ok("missing fields → 400", (await mintH(mintReq(GOOD, { slug: SLUG }))).status === 400);

// 2. rate-limit (5/min) — 6th attempt in the window is blocked
for (let i = 0; i < 4; i++) await mintH(mintReq(GOOD, { slug: SLUG, subject: "buyer@demo" })); // 2..5
ok("6th mint in window → 429", (await mintH(mintReq(GOOD, { slug: SLUG, subject: "buyer@demo" }))).status === 429);

// 3. model gate
ok("no token → 401", (await modelH(modelReq(SLUG))).status === 401);
ok("tampered token → 401", (await modelH(modelReq(SLUG, "Bearer " + TOKEN.slice(0, -3) + "AAA"))).status === 401);
const inFive = Math.floor(Date.now() / 1000) + 300;
const wrongScope = await gate.mint({ slug: "some-other-project", ent: "paid", sub: "buyer@demo", exp: inFive }, SECRET);
ok("valid token, wrong slug → 403", (await modelH(modelReq(SLUG, "Bearer " + wrongScope))).status === 403);
const expired = await gate.mint({ slug: SLUG, ent: "paid", sub: "buyer@demo", exp: Math.floor(Date.now() / 1000) - 10 }, SECRET);
ok("expired token → 401", (await modelH(modelReq(SLUG, "Bearer " + expired))).status === 401);
const ghost = await gate.mint({ slug: "ghost-project", ent: "paid", sub: "x", exp: inFive }, SECRET);
ok("unknown slug → 404", (await modelH(modelReq("ghost-project", "Bearer " + ghost))).status === 404);

// 4. happy path — the bundle arrives in the pieces dialect the engine expects
const gotRes = await modelH(modelReq(SLUG, "Bearer " + TOKEN));
const b = await gotRes.json();
ok("valid token → 200 bundle", gotRes.status === 200);
ok("bundle has all 7 pieces", b && ["site", "towers", "configs", "plates", "floorplans", "intelligence", "vastu"].every((k) => b[k]));
ok("towers reshaped: 7, id='T-6', no bigint/tower_id", b?.towers?.length === 7 && b.towers[0].id === "T-6" && !("tower_id" in b.towers[0]), b?.towers?.[0]);
ok("configs reshaped: carpetSqft restored", b?.configs?.find((c) => c.config === "4.5 BHK")?.carpetSqft === 1972, b?.configs?.[0]);
ok("floorplans: 5, rails back at top level, no extra wrapper", b?.floorplans?.length === 5 && b.floorplans.every((f) => !("extra" in f)) && b.floorplans.some((f) => f.rails), b?.floorplans?.[0]);
ok("bundle: 16 flats of intelligence", b?.intelligence?.length === 16, b?.intelligence?.length);

// 5. reshape identity — DB shape → EXACTLY the pieces bundle the mock serves (per project on disk)
for (const slug of PROJECTS) {
  const expected = JSON.parse(JSON.stringify(mock.bundle(slug)));
  delete expected.site.latitudeDeg; delete expected.site.northCalDeg; // derivable, unread by the engine, not stored
  const got = JSON.parse(JSON.stringify(reshapeBundle(dbBundle(slug))));
  ok(`reshape identity: ${slug}`, isDeepStrictEqual(got, expected),
    !isDeepStrictEqual(got, expected) && Object.keys(expected).find((k) => !isDeepStrictEqual(got[k], expected[k])));
}

// 6. token dialect parity — the port and the mock are indistinguishable
const payload = { slug: SLUG, ent: "paid", sub: "buyer@demo", exp: inFive };
ok("mock-minted token verifies in the port", (await gate.verify(mock.mint(payload), SECRET))?.sub === "buyer@demo");
ok("port-minted token verifies in the mock", mock.verify(await gate.mint(payload, SECRET))?.sub === "buyer@demo");
ok("identical payload → byte-identical JWT", (await gate.mint(payload, SECRET)) === mock.mint(payload));

// 7. grant-entitlement — the writer the site's unlock flows call
const grantReq = (origin, body, extra = {}) => new Request("http://edge.local/grant-entitlement",
  { method: "POST", headers: { ...(origin ? { origin } : {}), "content-type": "application/json", ...extra }, body: JSON.stringify(body) });
ok("grant: bad origin → 403", (await grantH(grantReq("https://evil.com", { slug: SLUG, subject: "+919812345678", entitlement: "lead" }))).status === 403);
ok("grant: bad slug → 400", (await grantH(grantReq(GOOD, { slug: "NOT A SLUG!!", subject: "+919812345678", entitlement: "lead" }))).status === 400);
ok("grant: bad entitlement → 400", (await grantH(grantReq(GOOD, { slug: SLUG, subject: "+919812345678", entitlement: "root" }))).status === 400);
const g1 = await grantH(grantReq(GOOD, { slug: SLUG, subject: "+919812345678", entitlement: "lead" }));
ok("grant: lead write → 200 + row lands", g1.status === 200 && grantWrites.some((w) => w.slug === SLUG && w.subject === "+919812345678" && w.entitlement === "lead"), grantWrites);
grantWrites.length = 0;
const g2 = await grantH(grantReq(GOOD, { slug: [SLUG, "elan-the-presidential"], subject: "member@x", entitlement: "member" }));
ok("grant: self-service 'member' clamped to 'lead' (multi-slug)", g2.status === 200 && (await g2.json()).entitlement === "lead" &&
  grantWrites.length === 2 && grantWrites.every((w) => w.entitlement === "lead"), grantWrites);
grantWrites.length = 0;
const g3 = await grantH(grantReq(GOOD, { slug: SLUG, subject: "webhook@ops", entitlement: "paid" }, { "x-grant-key": "admin-test-key" }));
ok("grant: x-grant-key holder keeps 'paid'", g3.status === 200 && grantWrites[0]?.entitlement === "paid", grantWrites);
let last;
for (let i = 0; i < 11; i++) last = await grantH(grantReq(GOOD, { slug: SLUG, subject: "chatty@x", entitlement: "lead" }));
ok("grant: 11th write in a minute → 429", last.status === 429);

// 8. edge shell behaviour the mock never needed
const pre = await mintH(new Request("http://edge.local/mint-token", { method: "OPTIONS", headers: { origin: GOOD } }));
ok("CORS preflight → 204 + origin echo", pre.status === 204 && pre.headers.get("access-control-allow-origin") === GOOD);
const secretWas = process.env.MODEL_JWT_SECRET;
delete process.env.MODEL_JWT_SECRET;
ok("missing MODEL_JWT_SECRET → 500 (never mint unsigned)", (await mintH(mintReq(GOOD, { slug: SLUG, subject: "buyer@demo" }))).status === 500);
process.env.MODEL_JWT_SECRET = secretWas;

console.log(`\n${fail ? "✗" : "✓"} ${pass}/${pass + fail} edge-port checks passed`);
process.exit(fail ? 1 : 0);
