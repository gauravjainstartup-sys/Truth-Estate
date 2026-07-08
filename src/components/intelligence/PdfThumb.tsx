"use client";

import { useEffect, useRef, useState } from "react";
import { loadPdfjs } from "./pdfjs";

/* Card cover that renders the FIRST PAGE of a PDF as a thumbnail — so a
   brochure or payment plan shows itself before anyone clicks. Lazy: the PDF is
   only fetched once the card nears the viewport (these cards sit far down the
   page), so we never pull multi-MB files for a reader who doesn't scroll here.
   Until the page paints — and if anything fails — it shows the same
   "PDF · On file" placeholder the card used before. */
export default function PdfThumb({ src }: { src: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [state, setState] = useState<"idle" | "ready" | "error">("idle");

  // Only start work once the card is close to the viewport. If the browser
  // lacks IntersectionObserver, the card simply keeps its placeholder and
  // still opens the PDF on click — graceful degradation.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let stopped = false;
    const canvas = canvasRef.current;
    // A worker that won't boot can leave getDocument hanging — don't spin
    // forever, just keep the placeholder.
    const watchdog = setTimeout(() => { if (!stopped) { stopped = true; setState("error"); } }, 8000);

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const doc = await pdfjs.getDocument({ url: src }).promise;
        if (stopped || !canvas) return;
        const page = await doc.getPage(1);
        if (stopped) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (520 / base.width) * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setState("error"); return; }
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!stopped) { clearTimeout(watchdog); setState("ready"); }
      } catch {
        if (!stopped) { stopped = true; setState("error"); }
      }
    })();

    return () => { stopped = true; clearTimeout(watchdog); };
  }, [near, src]);

  return (
    <div ref={wrapRef} className="relative aspect-[16/10] overflow-hidden bg-[#f5f0e5]/70">
      {/* Placeholder underneath — the rendered first page fades in over it. */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#9a7a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-8 w-8 opacity-70" aria-hidden>
            <path d="M6 2.5h8L19.5 8v13a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z" /><path d="M14 2.5V8h5.5M9 13h6M9 17h6" />
          </svg>
          <p className="mt-2.5 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#9a7a2e]/80">PDF · On file</p>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`absolute inset-0 h-full w-full bg-white object-cover object-top transition-[opacity,transform] duration-500 group-hover:scale-[1.02] ${state === "ready" ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
