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

const CT_EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf" };
function urlExt(u) {
  try {
    const m = new URL(u).pathname.match(/\.([a-z0-9]+)$/i);
    const e = m && m[1].toLowerCase();
    return e === "jpeg" ? "jpg" : ["png", "jpg", "webp", "gif", "pdf"].includes(e) ? e : null;
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

const manifest = {};
try {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const rows = await fetchRows();
  let files = 0;
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
    }
  }
  console.log(`[materialize] ${files} file(s) across ${Object.keys(manifest).length} project(s)`);
} catch (e) {
  console.warn(`[materialize] skipped (${e instanceof Error ? e.message : "error"}) — media stays inline/absent`);
}
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
