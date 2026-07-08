"use client";

import { useEffect, useRef, useState } from "react";

/* Renders a PDF as scrollable page images (canvas) with pdf.js — reliable on
   desktop AND mobile, where a native <iframe> PDF often shows nothing. The
   pdf.js core loads on demand (dynamic import) so it never weighs on the page
   until someone opens a document. Any failure (CORS, bad file) falls back to a
   plain "open the PDF" link. */
export default function PdfScroller({ src }: { src: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;

    (async () => {
      try {
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
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

        const doc = await pdfjs.getDocument({ url: src }).promise;
        if (cancelled || !host) return;
        host.replaceChildren();

        const cssWidth = Math.min(host.clientWidth || 800, 900);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "mx-auto mb-3 block rounded-md bg-white shadow-[0_12px_44px_rgba(0,0,0,0.35)] last:mb-0";
          host.appendChild(canvas);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
          if (i === 1 && !cancelled) setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => { cancelled = true; };
  }, [src]);

  return (
    <div className="h-full w-full max-w-[940px] overflow-y-auto rounded-lg bg-[#e9e2d4] p-3 sm:p-4">
      {state === "loading" && (
        <p className="py-16 text-center text-[0.85rem] font-light text-[#1a1a1a]/50">Loading document…</p>
      )}
      {state === "error" && (
        <p className="py-16 text-center text-[0.88rem] font-light text-[#1a1a1a]/65">
          Couldn&rsquo;t display it inline.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1e6b45] underline underline-offset-2">Open the PDF ↗</a>
        </p>
      )}
      <div ref={hostRef} />
    </div>
  );
}
