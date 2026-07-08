/* Single source of truth for booting pdf.js in the browser. Both the inline
   viewer (PdfScroller) and the card cover thumbnail (PdfThumb) load through
   here so the worker path is defined once.

   The worker is served from public/ as a plain .js at ${basePath}/pdf.worker.min.js
   (see scripts/copy-pdf-worker.mjs). The `new URL(..., import.meta.url)` form
   emits a hashed _next/static .mjs that GitHub Pages serves with a MIME/path
   browsers reject for a module worker, so it silently never boots. */

const basePath = "/Truth-Estate";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // pdf.js v4 uses Promise.withResolvers — shim it for older mobile browsers.
      const P = Promise as unknown as { withResolvers?: unknown };
      if (typeof P.withResolvers !== "function") {
        P.withResolvers = function <T>() {
          let resolve!: (v: T | PromiseLike<T>) => void, reject!: (r?: unknown) => void;
          const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
          return { promise, resolve, reject };
        };
      }
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.js`;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}
