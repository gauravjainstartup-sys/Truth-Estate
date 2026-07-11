/* ════════════════════════════════════════════════════════════════
   MATERIALIZE MEDIA — prebuild step.

   The founder's upload path stores hero/brochure/plan media as
   base64 in project_extended_details. Inlining those into the
   static pages is heavy (each blob lands in the HTML twice), so
   before `next build` this script decodes every base64 blob into a
   real file under public/live-media/ and records the mapping in
   src/lib/live-media.manifest.json. The adapter prefers the
   materialized path; URL values pass through untouched.

   Fail-soft: any error leaves an empty manifest and exits 0 — a
   deploy can never be broken by media.
   ════════════════════════════════════════════════════════════════ */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// same public-by-design pair the app uses (src/lib/supabase.ts)
const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

const OUT_DIR = "public/live-media";
const MANIFEST = "src/lib/live-media.manifest.json";
const MAX_BYTES = 40 * 1024 * 1024; // per-file guard

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

/* A media column may hold a Storage URL rather than base64. Pull a SINGLE-URL
   value into the static build so it serves same-origin — essential for the PDF
   thumbnails pdf.js renders (a cross-origin Storage fetch is CORS-blocked, so
   the brochure/payment-plan cover never paints), and it also frees the deploy
   from Supabase at runtime. Multi-URL lists (a brochure's page images) are left
   to the adapter's cross-origin <img> page-turner. Fail-soft: any hiccup leaves
   the value as its original URL. */
async function fetchUrlMedia(value) {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!/^https?:\/\//i.test(s) || /[,\n]/.test(s)) return null; // only a lone URL
  let res;
  try {
    res = await fetch(s, { signal: AbortSignal.timeout(30000) });
  } catch {
    return { skip: "fetch-failed" };
  }
  if (!res.ok) return { skip: `http-${res.status}` };
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = CT_EXT[ct] ?? urlExt(s);
  if (!ext) return { skip: `unknown-type (${ct || "no content-type"})` };
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return { skip: `too-big (${(buf.length / 1048576).toFixed(1)} MB)` };
  return { buf, ext, from: "url" };
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
    const doc = await getDocument({
      data: new Uint8Array(buf),
      // Node has no font-face pipeline — point pdf.js at its bundled standard
      // fonts and let it rasterise glyphs itself
      standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/",
      disableFontFace: true,
      verbosity: 0,
    }).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 520 / base.width });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return canvas.toBuffer("image/png");
  } catch (e) {
    console.log(`[materialize] thumb skip: ${e instanceof Error ? e.message.slice(0, 80) : "render error"}`);
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
      let dec = decode(raw);
      let skip = null;
      if (!dec) {
        const r = await fetchUrlMedia(raw);
        if (r && r.buf) dec = r;
        else skip = (r && r.skip) ?? (typeof raw !== "string" ? "not-a-string" : /^https?:\/\//i.test(raw.trim()) ? "multi-url-list" : raw.length > 200 ? "undecodable-blob" : "not-media");
      }
      if (!dec) { console.log(`[materialize] SKIP ${id} ${field}: ${skip}`); continue; }
      const slug = field.replace(/_url$/, "").replace(/_/g, "-");
      const rel = `live-media/${id}-${slug}.${dec.ext}`;
      await writeFile(path.join("public", rel), dec.buf);
      (manifest[id] ??= {})[field] = rel;
      files++;
      console.log(`[materialize] ${rel} ← ${field} (${(dec.buf.length / 1024).toFixed(0)} KB${dec.from === "url" ? ", from URL" : ""})`);
      if (dec.ext === "pdf") {
        const tb = await pdfThumb(dec.buf);
        if (tb) {
          const trel = `live-media/${id}-${slug}-thumb.png`;
          await writeFile(path.join("public", trel), tb);
          manifest[id][field.replace(/_url$/, "") + "_thumb"] = trel;
          files++;
          console.log(`[materialize] ${trel} ← page-1 cover (${(tb.length / 1024).toFixed(0)} KB)`);
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
    const { createHash } = await import("node:crypto");
    const urls = {};
    let saved = 0;
    for (const [u, from] of urlQueue) {
      const r = await fetchUrlMedia(u);
      if (!r || !r.buf) { console.log(`[materialize] SKIP url (${from}): ${(r && r.skip) ?? "unfetchable"} ← ${u.slice(-60)}`); continue; }
      const h = createHash("sha1").update(u).digest("hex").slice(0, 12);
      const rel = `live-media/u-${h}.${r.ext}`;
      await writeFile(path.join("public", rel), r.buf);
      urls[u] = rel;
      saved++; files++;
    }
    if (saved) manifest.__urls = urls;
    console.log(`[materialize] url-map: ${saved}/${urlQueue.size} remote file(s) pulled same-origin`);
  }
  console.log(`[materialize] ${files} file(s) across ${Object.keys(manifest).length} project(s)`);
} catch (e) {
  console.warn(`[materialize] skipped (${e instanceof Error ? e.message : "error"}) — media stays inline/absent`);
}
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
