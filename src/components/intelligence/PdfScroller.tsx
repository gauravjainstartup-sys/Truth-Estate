"use client";

import { useEffect, useRef, useState } from "react";
import { loadPdfjs } from "./pdfjs";

/* Renders a PDF as scrollable page images (canvas) with pdf.js — reliable on
   desktop AND mobile, where a native <iframe> PDF often shows nothing. The
   pdf.js core loads on demand (dynamic import) so it never weighs on the page
   until someone opens a document. Any failure (CORS, bad file, or a worker that
   won't load) falls back to a native <iframe> plus an "open the PDF" link. */
export default function PdfScroller({ src }: { src: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let stopped = false;      // set on unmount, src change, watchdog, or error
    let firstRendered = false; // page 1 painted — don't fall back after this
    const host = hostRef.current;

    // If pdf.js stalls (most often a worker that won't load on the host) the
    // getDocument promise can hang rather than reject — don't spin forever,
    // drop to the iframe after a grace period.
    const watchdog = setTimeout(() => {
      if (!stopped) { stopped = true; setState("error"); }
    }, 8000);

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const doc = await pdfjs.getDocument({ url: src }).promise;
        if (stopped || !host) return;
        host.replaceChildren();

        const cssWidth = Math.min(host.clientWidth || 800, 900);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          if (stopped) return;
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
          if (i === 1 && !stopped) { clearTimeout(watchdog); firstRendered = true; setState("ready"); }
        }
      } catch {
        // Only fall back if we never got page 1 up — a later-page hiccup
        // shouldn't yank a document the reader is already looking at.
        if (!stopped && !firstRendered) { stopped = true; setState("error"); }
      }
    })();

    return () => { stopped = true; clearTimeout(watchdog); };
  }, [src]);

  // If pdf.js can't fetch/parse (e.g. CORS on the Storage bucket) or the worker
  // won't boot, fall back to a native <iframe> — it displays a cross-origin PDF
  // without needing CORS on desktop — with the open-in-new-tab link always there.
  if (state === "error") {
    return (
      <div className="flex h-full w-full max-w-[940px] flex-col rounded-lg bg-[#e9e2d4] p-2 sm:p-3">
        <iframe src={src} title="Document" className="w-full flex-1 rounded-md bg-white" />
        <p className="shrink-0 py-2 text-center text-[0.78rem] font-light text-[#1a1a1a]/60">
          Trouble viewing it here?{" "}
          <a href={src} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1e6b45] underline underline-offset-2">Open the PDF ↗</a>
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-[940px] overflow-y-auto rounded-lg bg-[#e9e2d4] p-3 sm:p-4">
      {state === "loading" && (
        <p className="py-16 text-center text-[0.85rem] font-light text-[#1a1a1a]/50">Loading document…</p>
      )}
      <div ref={hostRef} />
    </div>
  );
}
