"use client";

import { useEffect, useRef, useState } from "react";

/* ZoomStage — modern image-zoom UX for the full-screen viewers.
   · touch: two-finger pinch to zoom, one finger pans while zoomed
   · desktop: trackpad pinch (ctrl/⌘ + wheel) zooms around the pointer
   · magnifier: click zooms 2.5× into the point, click again resets
   The stage fills the whole viewer, so zoomed content spreads across
   the entire screen rather than staying inside the image's box.
   Scale is clamped 1–4×; panning is clamped so content never drifts
   out of reach; at 1× everything is exactly as laid out. */

const MIN = 1;
const MAX = 4;

export default function ZoomStage({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const tRef = useRef(t);
  tRef.current = t;

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const moved = useRef(false);

  const clampT = (s: number, x: number, y: number) => {
    const el = stageRef.current;
    if (!el || s <= 1) return { s: Math.max(MIN, s), x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const minX = r.width * (1 - s);
    const minY = r.height * (1 - s);
    return { s, x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  };

  /* zoom keeping the stage-point (cx, cy) fixed under the cursor/fingers */
  const zoomAt = (cx: number, cy: number, nextS: number) => {
    const { s, x, y } = tRef.current;
    const ns = Math.min(MAX, Math.max(MIN, nextS));
    const wx = (cx - x) / s;
    const wy = (cy - y) / s;
    setT(clampT(ns, cx - wx * ns, cy - wy * ns));
  };

  /* ctrl/⌘ + wheel = trackpad pinch; plain wheel pans while zoomed.
     Registered manually so it can be non-passive (preventDefault). */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { s, x, y } = tRef.current;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, s * Math.exp(-e.deltaY * 0.01));
      } else if (s > 1) {
        e.preventDefault();
        setT(clampT(s, x - e.deltaX, y - e.deltaY));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: tRef.current.s };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    if (Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y) > 2) moved.current = true;

    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
      zoomAt(mid.x, mid.y, pinch.current.s * (d / pinch.current.d));
    } else if (pointers.current.size === 1 && tRef.current.s > 1) {
      const { s, x, y } = tRef.current;
      setT(clampT(s, x + (cur.x - prev.x), y + (cur.y - prev.y)));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = stageRef.current;
    // a clean tap/click = the magnifier: zoom into the point, or reset
    if (el && pointers.current.size === 1 && !moved.current) {
      const r = el.getBoundingClientRect();
      const { s } = tRef.current;
      if (s === 1) zoomAt(e.clientX - r.left, e.clientY - r.top, 2.5);
      else setT({ s: 1, x: 0, y: 0 });
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  return (
    <div className="relative h-full max-h-full w-full max-w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div
        ref={stageRef}
        className="h-full w-full select-none"
        style={{ touchAction: "none", cursor: t.s === 1 ? "zoom-in" : "zoom-out" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => { pointers.current.delete(e.pointerId); pinch.current = null; }}
      >
        <div className="flex h-full w-full items-center justify-center" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`, transformOrigin: "0 0", transition: pointers.current.size ? "none" : "transform 200ms ease-out", willChange: "transform" }}>
          {children}
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 font-mono text-[0.58rem] tracking-[0.06em] text-white/75 backdrop-blur-sm" style={{ opacity: t.s === 1 ? 1 : 0, transition: "opacity 250ms" }}>
        pinch · ⌃ scroll · click to zoom
      </p>
    </div>
  );
}
