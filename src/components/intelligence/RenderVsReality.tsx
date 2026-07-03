"use client";

import { useRef, useState } from "react";

/* The pitch | the plot — one frame split by a draggable line. Left holds the
   brochure's promise, right the site as it stands; pull the divider fully
   either way to see each image whole. Layers arrive as server-rendered
   nodes so this stays a thin interaction shell.

   Touch care: the container is touch-action: pan-y — a drag only captures
   once horizontal intent is clear (|dx| > 6px and > |dy|), so vertical page
   scrolling over the image keeps working; the knob itself drags instantly. */

export default function RenderVsReality({
  left,
  right,
  leftChip,
  rightChip,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftChip: string;
  rightChip: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const gesture = useRef<{ id: number; x: number; y: number; live: boolean } | null>(null);

  const setFromX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  const start = (e: React.PointerEvent, live: boolean) => {
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, live };
    if (live) {
      ref.current?.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    }
  };
  const move = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.id) return;
    if (!g.live) {
      const dx = Math.abs(e.clientX - g.x);
      const dy = Math.abs(e.clientY - g.y);
      if (dx > 6 && dx > dy) {
        g.live = true;
        ref.current?.setPointerCapture(e.pointerId);
      } else if (dy > 12) {
        gesture.current = null; // vertical intent — let the page scroll
        return;
      } else return;
    }
    setFromX(e.clientX);
  };
  const end = (e: React.PointerEvent) => {
    const g = gesture.current;
    // a clean tap jumps the line to the finger
    if (g && e.pointerId === g.id && !g.live && Math.abs(e.clientX - g.x) < 6 && Math.abs(e.clientY - g.y) < 6) setFromX(e.clientX);
    gesture.current = null;
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] cursor-ew-resize select-none overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-[#0b1f1a] md:aspect-[16/7.5]"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => start(e, false)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={() => (gesture.current = null)}
    >
      <div className="absolute inset-0">{right}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)`, willChange: "clip-path" }}>{left}</div>

      {/* the line + knob */}
      <div className="absolute inset-y-0 w-[2px] -translate-x-[1px] bg-[#F7F3EA]/95 shadow-[0_0_14px_rgba(0,0,0,0.5)]" style={{ left: `${pos}%` }}>
        <button
          type="button"
          role="slider"
          aria-label="Compare the render with the site"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onPointerDown={(e) => { e.stopPropagation(); start(e, true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((v) => Math.max(0, v - 6));
            if (e.key === "ArrowRight") setPos((v) => Math.min(100, v + 6));
          }}
          className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[3px] rounded-full border-2 border-[#d8b978] bg-[#F7F3EA] font-mono text-[0.8rem] font-bold text-[#7a5f1e] shadow-[0_6px_18px_rgba(0,0,0,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b978]"
          style={{ touchAction: "none" }}
        >
          ‹ ›
        </button>
      </div>

      {/* provenance chips on diagonal corners; each fades as its side collapses */}
      <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#0a192d]/60 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-white/90 backdrop-blur-sm transition-opacity duration-300" style={{ opacity: pos < 16 ? 0 : 1 }}>
        <span className="h-[7px] w-[7px] rounded-full bg-[#d8b978]" /> {leftChip}
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#141110]/65 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-white/85 backdrop-blur-sm transition-opacity duration-300" style={{ opacity: pos > 84 ? 0 : 1 }}>
        <span className="h-[7px] w-[7px] rounded-full bg-[#3fae76]" /> {rightChip}
      </span>
    </div>
  );
}
