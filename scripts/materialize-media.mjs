/* ════════════════════════════════════════════════════════════════
   MATERIALIZE MEDIA — prebuild step.

   The founder's upload path stores hero/brochure/plan media as
   base64 or Storage URLs in project_extended_details. Before
   `next build` this script turns each into a real file under
   public/live-media/ and records the mapping in
   src/lib/live-media.manifest.json, so visitors are served from
   the static site and never touch Storage.

   Egress control:
   · Every URL fetch goes through a cross-build cache (.media-cache,
     restored by the deploy workflow) and is revalidated with a
     conditional GET — an unchanged asset costs headers, not a
     re-download, so the hourly rebuild stops re-pulling the whole
     media set from Supabase every run.
   · A URL-sourced PDF above MEDIA_PDF_CAP_MB is NOT baked into the
     site (GitHub Pages caps the artifact at ~1 GB): only its page-1
     cover ships, the manifest omits the field, and the adapter falls
     back to the Storage URL — so the full file moves only when a
     reader actually clicks, and only from Storage.

   Fail-soft: any error leaves an empty manifest and exits 0 — a
   deploy can never be broken by media.
   ════════════════════════════════════════════════════════════════ */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// same public-by-design pair the app uses (src/lib/supabase.ts)
const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

const OUT_DIR = "public/live-media";
const MANIFEST = "src/lib/live-media.manifest.json";
const MAX_BYTES = 40 * 1024 * 1024; // per-file guard
const CACHE_DIR = process.env.MEDIA_CACHE_DIR || ".media-cache";
// URL-sourced PDFs above the cap ship cover-only; the click serves Storage
const PDF_CAP = Math.round((Number(process.env.MEDIA_PDF_CAP_MB) || 10) * 1048576);

const FIELDS = ["hero_image_url", "brochure_url", "payment_plan_url", "site_map_image_url", "render_elevation_url"];

const MAGIC = [
  ["/9j/", "jpg"],
  ["iVBOR", "png"],
  ["UklGR", "webp"],
  ["R0lGOD", "gif"],
  ["JVBERi", "pdf"],
];

function decode(value) {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  const dataUri = s.match(/^data:([\w/+.-]+);base64,(.*)$/s);
  const payload = dataUri ? dataUri[2] : s;
  if (!dataUri && !(payload.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(payload))) return null; // a URL/path — leave as-is
  const clean = payload.replace(/\s+/g, "");
  const hit = MAGIC.find(([m]) => clean.startsWith(m));
  if (!hit) return null; // unknown binary — don't guess
  const buf = Buffer.from(clean, "base64");
  if (!buf.length || buf.length > MAX_BYTES) return null;
  return { buf, ext: hit[1] };
}

const CT_EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "application/pdf": "pdf" };
function urlExt(u) {
  try {
    const m = new URL(u).pathname.match(/\.([a-z0-9]+)$/i);
    const e = m && m[1].toLowerCase();
    return e === "jpeg" ? "jpg" : ["png", "jpg", "webp", "gif", "avif", "pdf"].includes(e) ? e : null;
  } catch {
    return null;
  }
}

/* ── Cross-build URL cache with conditional GET ──
   Every remote asset is keyed on sha1(url) in CACHE_DIR: `<h>.bin` (bytes),
   `<h>.json` (etag/last-modified/ext/bytes[/thumbOnly]), `<h>-thumb.png`
   (a PDF's rendered cover). Each build revalidates with If-None-Match /
   If-Modified-Since: a 304 reuses the cached bytes (near-zero egress); a 200
   refreshes them; a network error keeps the last good copy rather than
   dropping media from the deploy. Over-cap PDFs store ONLY their cover
   (thumbOnly) so the cache never carries multi-MB files it won't ship. */
const cacheStats = { hit: 0, fresh: 0, changed: 0, stale: 0 };
let dlBytes = 0; // Storage egress: bytes actually pulled (not served from the .media-cache)
const cacheTouched = new Set();
const cKey = (u) => createHash("sha1").update(u).digest("hex").slice(0, 16);
const cPath = (h, suffix) => path.join(CACHE_DIR, h + suffix);
const readOpt = async (p) => { try { return await readFile(p); } catch { return null; } };

async function cachedGet(u) {
  const h = cKey(u);
  cacheTouched.add(h);
  const metaRaw = await readOpt(cPath(h, ".json"));
  let meta = null;
  try { meta = metaRaw && JSON.parse(metaRaw.toString()); } catch { meta = null; }
  const bin = meta && !meta.thumbOnly ? await readOpt(cPath(h, ".bin")) : null;
  const cachedThumb = meta ? await readOpt(cPath(h, "-thumb.png")) : null;
  // usable = the cache alone could satisfy this URL. A thumbOnly entry whose
  // recorded size now fits a raised cap must refetch the full body instead.
  const usable =
    !!meta && (meta.etag || meta.lastModified) &&
    (meta.thumbOnly ? !!cachedThumb && meta.bytes > PDF_CAP : !!bin);
  const cached = usable
    ? meta.thumbOnly
      ? { thumbOnly: true, ext: meta.ext, bytes: meta.bytes, cachedThumb, key: h }
      : { buf: bin, ext: meta.ext, bytes: bin.length, from: "cache", cachedThumb, key: h }
    : null;
  const headers = {};
  if (cached) {
    if (meta.etag) headers["If-None-Match"] = meta.etag;
    if (meta.lastModified) headers["If-Modified-Since"] = meta.lastModified;
  }
  let res;
  try {
    res = await fetch(u, { headers, signal: AbortSignal.timeout(30000) });
  } catch {
    if (cached) { cacheStats.stale++; return cached; }
    return { skip: "fetch-failed" };
  }
  if (res.status === 304 && cached) {
    try { await res.body?.cancel(); } catch { /* no body on 304 */ }
    cacheStats.hit++;
    return cached;
  }
  if (!res.ok) {
    try { await res.body?.cancel(); } catch { /* discard */ }
    if (cached) { cacheStats.stale++; return cached; }
    return { skip: `http-${res.status}` };
  }
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = CT_EXT[ct] ?? urlExt(u);
  if (!ext) { try { await res.body?.cancel(); } catch { /* discard */ } return { skip: `unknown-type (${ct || "no content-type"})` }; }
  // don't even download a body the per-file guard would throw away
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_BYTES) { try { await res.body?.cancel(); } catch { /* discard */ } return { skip: `too-big (${(len / 1048576).toFixed(1)} MB)` }; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return { skip: `too-big (${(buf.length / 1048576).toFixed(1)} MB)` };
  dlBytes += buf.length;
  cacheStats[meta ? "changed" : "fresh"]++;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cPath(h, ".bin"), buf);
    await writeFile(cPath(h, ".json"), JSON.stringify({
      etag: res.headers.get("etag") || undefined,
      lastModified: res.headers.get("last-modified") || undefined,
      ext, bytes: buf.length,
    }));
    await rm(cPath(h, "-thumb.png"), { force: true }); // content changed → cover is stale
  } catch { /* cache is best-effort — the build proceeds on the fresh bytes */ }
  return { buf, ext, bytes: buf.length, from: "url", key: h };
}

/* Persist a PDF's rendered cover next to its cache entry; thumbOnly entries
   drop the bin — the cover is all future builds need until the file changes. */
async function cacheThumb(key, tb, thumbOnly) {
  if (!key) return;
  try {
    await writeFile(cPath(key, "-thumb.png"), tb);
    if (thumbOnly) {
      const meta = JSON.parse((await readFile(cPath(key, ".json"))).toString());
      meta.thumbOnly = true;
      await writeFile(cPath(key, ".json"), JSON.stringify(meta));
      await rm(cPath(key, ".bin"), { force: true });
    }
  } catch { /* cache is best-effort */ }
}

/* Deterministic tile cache for Static Maps: a coord+zoom+style string keys the
   image, so a fixed centre is fetched from Google ONCE and reused across every
   later build (no conditional GET — the aerial for a fixed point doesn't move);
   only a changed coordinate re-fetches. Registers the key in cacheTouched so the
   end-of-run prune keeps it. Fail-soft: any miss returns {skip} → gradient. */
async function fetchSatellite(url, cacheStr) {
  const h = cKey(cacheStr);
  cacheTouched.add(h);
  const bin = await readOpt(cPath(h, ".bin"));
  const metaRaw = await readOpt(cPath(h, ".json"));
  if (bin && metaRaw) {
    cacheStats.hit++;
    try { return { buf: bin, ext: JSON.parse(metaRaw).ext || "jpg" }; } catch { return { buf: bin, ext: "jpg" }; }
  }
  let res;
  try { res = await fetch(url, { signal: AbortSignal.timeout(30000) }); }
  catch { return { skip: "fetch-failed" }; }
  if (!res.ok) { try { await res.body?.cancel(); } catch { /* discard */ } return { skip: `http-${res.status}` }; }
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = CT_EXT[ct] ?? "jpg";
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return { skip: "empty/too-big" };
  dlBytes += buf.length;
  cacheStats.fresh++;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cPath(h, ".bin"), buf);
    await writeFile(cPath(h, ".json"), JSON.stringify({ ext, bytes: buf.length }));
  } catch { /* best-effort */ }
  return { buf, ext };
}

/* A media column may hold a Storage URL rather than base64. Pull a SINGLE-URL
   value into the static build so it serves same-origin — frees every visit
   from Supabase — via the conditional-GET cache above. Fail-soft: any hiccup
   leaves the value as its original URL. */
async function fetchUrlMedia(value) {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!/^https?:\/\//i.test(s) || /[,\n]/.test(s)) return null; // only a lone URL
  return await cachedGet(s);
}

async function fetchRows() {
  const fix = process.env.SUPABASE_FIXTURES;
  if (fix) {
    try {
      return JSON.parse(await readFile(path.join(fix, "project_extended_details.json"), "utf8"));
    } catch {
      return [];
    }
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_extended_details?select=*&limit=300`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/* Page-1 cover thumbnail for a saved PDF — so document cards can show a
   real cover WITHOUT the browser fetching the PDF (the whole point: no
   multi-MB file moves until the reader clicks). Fail-soft: any renderer
   hiccup just means the card keeps its designed placeholder. */
async function pdfThumb(buf) {
  try {
    const napi = await import("@napi-rs/canvas");
    // pdf.js draws glyphs as Path2D and measures via DOMMatrix — give Node the
    // canvas package's implementations before it loads
    globalThis.Path2D ??= napi.Path2D;
    globalThis.DOMMatrix ??= napi.DOMMatrix;
    globalThis.ImageData ??= napi.ImageData;
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = napi;
    // Some real brochures hand fill/clip/stroke an object napi-canvas rejects
    // ("Value is none of these types `String`, `Path`") and one bad path op
    // kills the whole cover. Skip the op instead — a partially drawn cover
    // beats none — and name the offending type so the build log can
    // root-cause it. Patch EVERY context pdf.js draws on: the page context
    // below plus the internal ones its CanvasFactory makes for patterns,
    // masks and groups (where the crash actually happens for that brochure).
    const skipped = new Map();
    const patchCtx = (ctx) => {
      for (const m of ["fill", "clip", "stroke", "drawImage"]) {
        const orig = ctx[m].bind(ctx);
        ctx[m] = (...a) => {
          try { return orig(...a); } catch (e) {
            const t = a.length ? (a[0]?.constructor?.name ?? typeof a[0]) : "no-arg";
            skipped.set(`${m}(${t})`, (skipped.get(`${m}(${t})`) ?? 0) + 1);
          }
        };
      }
      return ctx;
    };
    // same tiny interface as pdf.js's own (unexported) NodeCanvasFactory
    class CoverCanvasFactory {
      constructor(_opts) {}
      create(width, height) {
        if (width <= 0 || height <= 0) throw new Error("Invalid canvas size");
        const canvas = createCanvas(width, height);
        return { canvas, context: patchCtx(canvas.getContext("2d")) };
      }
      reset(cc, width, height) { if (cc.canvas) { cc.canvas.width = width; cc.canvas.height = height; } }
      destroy(cc) { if (cc.canvas) { cc.canvas.width = 0; cc.canvas.height = 0; cc.canvas = null; cc.context = null; } }
    }
    const doc = await getDocument({
      data: new Uint8Array(buf),
      // Node has no font-face pipeline — point pdf.js at its bundled standard
      // fonts and let it rasterise glyphs itself
      standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/",
      disableFontFace: true,
      verbosity: 0,
      CanvasFactory: CoverCanvasFactory,
    }).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 520 / base.width });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: patchCtx(ctx), viewport: vp }).promise;
    if (skipped.size) console.log(`[materialize] thumb partial: skipped ${[...skipped].map(([k, n]) => `${k}×${n}`).join(" · ")}`);
    return canvas.toBuffer("image/png");
  } catch (e) {
    // full name+message — the 80-char cut hid exactly which napi type check
    // rejects some real brochures' page-1 render
    console.log(`[materialize] thumb skip: ${e instanceof Error ? `${e.name}: ${e.message.slice(0, 220)}` : "render error"}`);
    return null;
  }
}

/* Split a multi-URL cell (JSON array or comma/newline list) into lone URLs. */
function urlList(value) {
  if (!value || typeof value !== "string") return [];
  const s = value.trim();
  let parts = [];
  if (s.startsWith("[")) {
    try { const j = JSON.parse(s); if (Array.isArray(j)) parts = j.filter((x) => typeof x === "string"); } catch { /* not json */ }
  } else if (/[,\n]/.test(s) && !/^[A-Za-z0-9+/=\r\n]+$/.test(s)) {
    parts = s.split(/[,\n]+/);
  } else if (/^https?:\/\//i.test(s)) {
    parts = [s];
  }
  return parts.map((x) => x.trim()).filter((x) => /^https?:\/\//i.test(x));
}

const manifest = {};
try {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const rows = await fetchRows();
  let files = 0;
  const urlQueue = new Map(); // url → source label; fetched once after the row walk
  for (const row of rows) {
    const id = row?.backlog_id;
    if (!id) continue;
    for (const field of FIELDS) {
      const raw = row[field];
      if (!raw) continue;
      // base64 cells are always materialized — there's no source URL a
      // reader could click through to, so the cap can't apply to them
      let dec = decode(raw);
      let skip = null;
      if (!dec) {
        const r = await fetchUrlMedia(raw);
        if (r && (r.buf || r.thumbOnly)) dec = r;
        else skip = (r && r.skip) ?? (typeof raw !== "string" ? "not-a-string" : /^https?:\/\//i.test(raw.trim()) ? "multi-url-list" : raw.length > 200 ? "undecodable-blob" : "not-media");
      }
      if (!dec) { console.log(`[materialize] SKIP ${id} ${field}: ${skip}`); continue; }
      const slug = field.replace(/_url$/, "").replace(/_/g, "-");
      const bytes = dec.bytes ?? dec.buf.length;
      /* Over-cap URL PDF — and only when the URL itself would satisfy the
         adapter's .pdf link check, so the click-through stays renderable:
         ship the cover alone and leave the field out of the manifest; the
         report then links the Storage URL and the full file moves only on
         an actual click. */
      const passthru = !!dec.key && dec.ext === "pdf" && bytes > PDF_CAP && /\.pdf(\?.*)?$/i.test(raw.trim());
      if (passthru) {
        const tb = dec.cachedThumb ?? (dec.buf ? await pdfThumb(dec.buf) : null);
        if (tb) {
          const trel = `live-media/${id}-${slug}-thumb.png`;
          await writeFile(path.join("public", trel), tb);
          (manifest[id] ??= {})[field.replace(/_url$/, "") + "_thumb"] = trel;
          files++;
          // holding a body on a passthru means the cache entry still carries
          // it — flip the entry to cover-only so the bytes are shed
          if (dec.buf) await cacheThumb(dec.key, tb, true);
        }
        console.log(`[materialize] PASSTHRU ${id} ${field}: ${(bytes / 1048576).toFixed(1)} MB > ${(PDF_CAP / 1048576).toFixed(0)} MB cap — cover ${tb ? "shipped" : "unavailable"}, click serves the source URL`);
        continue;
      }
      if (!dec.buf) { console.log(`[materialize] SKIP ${id} ${field}: cover-only cache without body`); continue; }
      const rel = `live-media/${id}-${slug}.${dec.ext}`;
      await writeFile(path.join("public", rel), dec.buf);
      (manifest[id] ??= {})[field] = rel;
      files++;
      console.log(`[materialize] ${rel} ← ${field} (${(dec.buf.length / 1024).toFixed(0)} KB${dec.from === "url" ? ", from URL" : dec.from === "cache" ? ", cached" : ""})`);
      if (dec.ext === "pdf") {
        const tb = dec.cachedThumb ?? await pdfThumb(dec.buf);
        if (tb) {
          const trel = `live-media/${id}-${slug}-thumb.png`;
          await writeFile(path.join("public", trel), tb);
          manifest[id][field.replace(/_url$/, "") + "_thumb"] = trel;
          files++;
          console.log(`[materialize] ${trel} ← page-1 cover (${(tb.length / 1024).toFixed(0)} KB${dec.cachedThumb ? ", cached" : ""})`);
          if (!dec.cachedThumb && dec.key) await cacheThumb(dec.key, tb, false);
        }
      }
    }
    // multi-URL cells (brochure page lists) — each page image pulled
    // same-origin so readers never hit Storage per page-turn
    for (const field of FIELDS) {
      const items = urlList(row[field]);
      if (items.length < 2) continue; // lone URLs were handled above
      for (const u of items) urlQueue.set(u, `${id} ${field}`);
    }
  }

  /* ── URL map: floor plans + brochure pages → same-origin files ──
     Every http URL collected above (and every configuration floor plan)
     is fetched ONCE per build and recorded under manifest.__urls, so the
     adapter serves it from the site instead of Storage on every visit. */
  try {
    const fix = process.env.SUPABASE_FIXTURES;
    let cfgRows = [];
    if (fix) {
      try { cfgRows = JSON.parse(await readFile(path.join(fix, "project_configurations.json"), "utf8")); } catch { cfgRows = []; }
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/project_configurations?select=floor_plan_image_url&limit=2000`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) cfgRows = await res.json();
    }
    for (const c of cfgRows) {
      const v = c?.floor_plan_image_url;
      if (!v) continue;
      const items = urlList(v);
      for (const u of items) urlQueue.set(u, "floor_plan");
      if (!items.length && typeof v === "string" && /^https?:\/\//i.test(v.trim())) urlQueue.set(v.trim(), "floor_plan");
    }
  } catch { /* configurations unavailable — floor plans stay remote */ }

  if (urlQueue.size) {
    const urls = {};
    let saved = 0;
    for (const [u, from] of urlQueue) {
      const r = await fetchUrlMedia(u);
      if (!r || !r.buf) { console.log(`[materialize] SKIP url (${from}): ${(r && (r.skip ?? (r.thumbOnly ? "over-cap-pdf" : null))) ?? "unfetchable"} ← ${u.slice(-60)}`); continue; }
      const h = createHash("sha1").update(u).digest("hex").slice(0, 12);
      const rel = `live-media/u-${h}.${r.ext}`;
      await writeFile(path.join("public", rel), r.buf);
      urls[u] = rel;
      saved++; files++;
    }
    if (saved) manifest.__urls = urls;
    console.log(`[materialize] url-map: ${saved}/${urlQueue.size} remote file(s) pulled same-origin`);
  }

  /* ── Satellite hero fallback ──────────────────────────────────────────
     Every project without an uploaded hero gets a Google Static Maps satellite
     of its site as the hero backdrop — the component already renders it and
     captions it "Satellite view of the site". Coordinates come from the ENRICHED
     snapshot (the seed-authoritative centres the location map plots), and a
     `suspect` provenance is skipped so we never plot a contradicted centre.
     Baked same-origin, keyed by project id under manifest.__satellite, and
     cached deterministically so Google is hit once per centre. Fail-soft. */
  try {
    /* GMAPS_SERVER_KEY FIRST, and the reason is that this call is not a
       browser call. The key that serves the location maps is locked to
       website referrers, which is exactly right for a key sitting in a
       client bundle — and exactly why it cannot sign this request, which
       leaves a CI runner with no Referer header at all and comes back 403.
       A key restricted by API rather than referrer is the supported answer.
       Falls through to the browser key when there is no server key, because
       an unrestricted key works for both and that is where this started. */
    const GKEY = process.env.GMAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GMAPS_KEY || process.env.GMAPS_KEY || "";
    const SAT_ZOOM = 17; // site-level framing; the cache key tracks this so a change re-bakes
    const fix = process.env.SUPABASE_FIXTURES;
    let geoRows = [];
    if (fix) { try { geoRows = JSON.parse(await readFile(path.join(fix, "backlog_listing_public_v3.json"), "utf8")); } catch { geoRows = []; } }
    if (!GKEY) {
      console.log(`[materialize] satellite: no GMAPS key set — heroes left as gradient`);
    } else if (!geoRows.length) {
      console.log(`[materialize] satellite: no enriched v3 snapshot — skipped`);
    } else {
      const sat = {};
      let baked = 0, skipped = 0, suspect = 0;
      for (const r of geoRows) {
        const id = r?.id, lat = Number(r?.latitude), lng = Number(r?.longitude);
        if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) continue;
        if (r.geo_provenance === "suspect") { suspect++; continue; }
        const c = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        const cacheStr = `sat|v1|${c}|z${SAT_ZOOM}|640x360|satellite|jpg`;
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${c}&zoom=${SAT_ZOOM}&size=640x360&scale=2&maptype=satellite&format=jpg&key=${encodeURIComponent(GKEY)}`;
        const got = await fetchSatellite(url, cacheStr);
        if (!got || !got.buf) { skipped++; if (baked === 0 && skipped <= 2) console.log(`[materialize] satellite ${id}: ${got?.skip ?? "no-body"}`); continue; }
        const rel = `live-media/sat-${id}.${got.ext}`;
        try { await writeFile(path.join("public", rel), got.buf); } catch { skipped++; continue; }
        sat[id] = rel; baked++; files++;
      }
      if (baked) manifest.__satellite = sat;
      console.log(`[materialize] satellite: ${baked} hero(es) baked · ${suspect} suspect-skipped · ${skipped} miss`);
      /* "0 baked, 97 miss" and "0 baked, 0 candidates" print almost the same
         and mean entirely different things. Say which, and say what to do —
         a bare http-403 reads as a network blip when it is a key that was
         locked down and is now being asked to sign a request it cannot. */
      if (!baked && skipped) {
        console.warn(
          `[materialize] satellite: every request failed. If those are http-403, the key is ` +
          `referrer-restricted and this call has no referrer — set GMAPS_SERVER_KEY to a key ` +
          `restricted by API instead. Heroes fall back to gradient for this build.`,
        );
      }
    }
  } catch (e) { console.warn(`[materialize] satellite pass skipped (${e instanceof Error ? e.message : "error"}) — heroes stay gradient`); }

  console.log(`[materialize] cache: ${cacheStats.hit} unchanged (304) · ${cacheStats.fresh} new · ${cacheStats.changed} changed · ${cacheStats.stale} stale-kept · ⇢ Storage egress ≈ ${(dlBytes / 1048576).toFixed(1)} MB pulled`);
  // drop cache entries whose URL vanished from the data — the cache tracks
  // the live media set instead of growing without bound. Only prune when this
  // run saw URLs at all: an empty fetch result must not wipe a good cache.
  try {
    if (!cacheTouched.size) throw null;
    for (const f of await readdir(CACHE_DIR)) {
      if (!cacheTouched.has(f.replace(/(-thumb\.png|\.bin|\.json)$/, ""))) await rm(path.join(CACHE_DIR, f), { force: true });
    }
  } catch { /* no cache dir this run */ }
  console.log(`[materialize] ${files} file(s) across ${Object.keys(manifest).length} project(s)`);
} catch (e) {
  console.warn(`[materialize] skipped (${e instanceof Error ? e.message : "error"}) — media stays inline/absent`);
}
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
