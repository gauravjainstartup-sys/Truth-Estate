/* Prebuild: copy the pdf.js worker into public/ as a plain .js file.

   pdf.js needs its worker served with a JavaScript MIME type. GitHub Pages is
   reliable about `.js` (text/javascript) but flaky about `.mjs` for module
   workers, and Next's hashed `_next/static/media/*.mjs` emission adds path
   ambiguity under basePath. Copying to public/pdf.worker.min.js sidesteps both
   — it lands at a stable ${basePath}/pdf.worker.min.js. Fail-soft. */

import { copyFile, mkdir } from "node:fs/promises";

const SRC = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
const DEST = "public/pdf.worker.min.js";

try {
  await mkdir("public", { recursive: true });
  await copyFile(SRC, DEST);
  console.log(`[pdf-worker] ${SRC} → ${DEST}`);
} catch (e) {
  console.warn(`[pdf-worker] skipped (${e instanceof Error ? e.message : "error"})`);
}
