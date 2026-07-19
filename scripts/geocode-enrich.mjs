/* ── Build-time geocode enrichment ──────────────────────────────────────
   The Location map (report Pillar III) only renders its rich radar when the
   project row carries a valid lat/lng AND its POIs carry per-POI coordinates
   (see src/lib/liveReport.ts → geo is built only `if (centerOk)`). Live rows
   from the upstream pipeline don't yet include those coordinates, so the
   report falls back to the "schematic · indicative" map.

   This step is the BRIDGE (founder decision: "geocoder now, upstream later"):
   after the Supabase snapshot is pulled, it fills in ONLY the coordinates that
   are MISSING — project centre + each POI — by geocoding names against OpenStreetMap
   Nominatim (free), then bakes them into the snapshot the static build consumes.

   Guarantees, so this can never make things worse:
   • Fail-soft — any network/parse error is swallowed; a coord it can't resolve
     is simply left absent (the row keeps its current schematic fallback).
   • Respects upstream — coords already present on a row/POI are never touched,
     so when the upstream pipeline starts emitting real coords this step no-ops.
   • Distance-validated — a POI geocode is accepted only if it lands within a
     sane delta of the POI's stated distance_km from the project, and inside
     Gurugram's bounds — so a wrong-city match can't produce a wrong pin.
   • Cached — results (hits AND misses) persist in scripts/geocode-cache.json,
     so repeat builds do zero network and OSM's usage policy is respected.

   Offline test: set GEOCODE_FIXTURE=<json of {nameFragment: {lat,lng}}> to
   resolve from a mock instead of the network; set SNAPSHOT_DIR to a test dir. */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const DIR = process.env.SNAPSHOT_DIR || ".data-snapshot";
const CACHE = "scripts/geocode-cache.json";
const VIEWS = ["backlog_listing_public_v3", "backlog_listing_public_v2"];
const POI_KEYS = ["hospitals", "schools_colleges", "office_spaces", "malls_shopping"];
const UA = "TruthEstate/1.0 (buyer-side location map; contact gauravjainstartup@gmail.com)";
// Gurugram sanity box — reject any geocode that lands outside it
const BOX = { latLo: 28.30, latHi: 28.65, lngLo: 76.80, lngHi: 77.25 };

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : v != null && v !== "" && Number.isFinite(+v) ? +v : null);
const parseObj = (v) => { if (v == null) return null; if (typeof v === "object") return v; try { return JSON.parse(v); } catch { return null; } };
const inBox = (c) => !!c && c.lat >= BOX.latLo && c.lat <= BOX.latHi && c.lng >= BOX.lngLo && c.lng <= BOX.lngHi;
const distKm = (a, b) => Math.hypot((b.lat - a.lat) * 111.32, (b.lng - a.lng) * 111.32 * Math.cos((a.lat * Math.PI) / 180));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MAX = +(process.env.GEOCODE_MAX || 500); // cap live lookups per build so a fresh snapshot can't blow CI time; the rest fill in on later builds (enriched snapshot is cached)
const BUDGET_MS = +(process.env.GEOCODE_BUDGET_MS || 240000); // hard wall-clock ceiling (4 min) — a slow/blocked Nominatim can never hang the build
const DEADLINE = Date.now() + BUDGET_MS;
let cache = {};
try { cache = JSON.parse(await readFile(CACHE, "utf8")); } catch { cache = {}; }
let cacheDirty = false, calls = 0, fails = 0, dead = false; // circuit-breaker: after repeated failures assume the network's blocked and stop calling

let mock = null;
if (process.env.GEOCODE_FIXTURE) { try { mock = JSON.parse(await readFile(process.env.GEOCODE_FIXTURE, "utf8")); } catch { mock = null; } }

async function geocode(query) {
  const key = norm(query);
  if (!key) return null;
  if (key in cache) return cache[key];
  if (mock) { // offline: resolve by name-fragment substring, don't pollute the real cache
    for (const [frag, c] of Object.entries(mock)) if (key.includes(norm(frag))) return c;
    return null;
  }
  if (dead || calls >= MAX || Date.now() > DEADLINE) return null; // circuit-open / over budget / past deadline — skip, don't cache a non-answer
  let out = null, errored = false;
  try {
    await sleep(1100); // Nominatim: ≤ 1 req/sec
    calls++;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(10000) });
    if (res.ok) { const a = await res.json(); if (Array.isArray(a) && a[0]) out = { lat: +a[0].lat, lng: +a[0].lon }; }
    else errored = true;
  } catch { errored = true; }
  if (errored) { if (++fails >= 6) { dead = true; console.warn("[geocode] network unreachable — circuit open; remaining lookups skipped this build"); } return null; }
  fails = 0;                      // a clean round-trip (even an empty result) resets the breaker
  cache[key] = out; cacheDirty = true; // cache only genuine answers (hit or real empty) so known-misses aren't re-tried
  return out;
}

const stats = { rows: 0, centers: 0, pois: 0, rejected: 0 };

async function enrichRow(row) {
  const locality = row.micro_market || row.locality || row.sector || row.sub_micromarket || row.address || row.city || "Gurugram";
  const pname = row.project_name || row.name || row.project || row.title || "";
  // 1) project centre
  let center = num(row.latitude) != null && num(row.longitude) != null ? { lat: num(row.latitude), lng: num(row.longitude) } : null;
  if (!inBox(center)) {
    const g = await geocode(`${pname}, ${locality}, Gurugram, Haryana, India`);
    if (inBox(g)) { center = g; row.latitude = g.lat; row.longitude = g.lng; stats.centers++; }
  }
  if (!inBox(center)) return; // no trustworthy centre → don't risk unvalidated POI pins
  // 2) POIs — only those missing coords
  const raw = row.location_hyperlocal_poi_density;
  const poi = parseObj(raw);
  if (!poi || typeof poi !== "object") return;
  for (const k of POI_KEYS) {
    const arr = Array.isArray(poi[k]) ? poi[k] : [];
    for (const it of arr) {
      if (!it || typeof it !== "object") continue;
      if (num(it.latitude) != null && num(it.longitude) != null) continue; // respect existing / upstream coords
      const name = it.name || it.title; if (!name) continue;
      const g = await geocode(`${name}, ${locality}, Gurugram, Haryana, India`);
      if (!inBox(g)) { stats.rejected++; continue; }
      const stated = num(it.distance_km);
      if (stated != null && Math.abs(distKm(center, g) - stated) > Math.max(1.2, stated * 0.6)) { stats.rejected++; continue; }
      it.latitude = g.lat; it.longitude = g.lng; stats.pois++;
    }
  }
  row.location_hyperlocal_poi_density = typeof raw === "string" ? JSON.stringify(poi) : poi;
}

for (const view of VIEWS) {
  const path = `${DIR}/${view}.json`;
  if (!existsSync(path)) continue;
  let rows;
  try { rows = JSON.parse(await readFile(path, "utf8")); } catch { console.warn(`[geocode] ${view}: unreadable — skipped`); continue; }
  if (!Array.isArray(rows)) continue;
  for (const row of rows) { stats.rows++; try { await enrichRow(row); } catch { /* fail-soft per row */ } }
  try { await writeFile(path, JSON.stringify(rows)); } catch (e) { console.warn(`[geocode] ${view}: write failed — ${e?.message?.slice(0, 60)}`); }
  console.log(`[geocode] ${view}: ${rows.length} rows enriched`);
}
if (cacheDirty) { try { await writeFile(CACHE, JSON.stringify(cache)); } catch { /* non-fatal */ } }
console.log(`[geocode] done · rows:${stats.rows} centres+${stats.centers} pois+${stats.pois} rejected:${stats.rejected} network-calls:${calls}`);
