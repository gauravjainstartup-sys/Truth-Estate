"use client";

import { useEffect, useRef } from "react";

/* ════════════════════════════════════════════════════════════════
   SECTION 2 — THE DREAM
   Why the journey started: hope, not paperwork. Photo-free, editorial,
   almost silent. Warm morning light, room to breathe. No product, no CTA.
   ════════════════════════════════════════════════════════════════ */
export default function DreamSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>("[data-r]");
    els.forEach((el, i) => {
      el.style.transition = `opacity 1.5s ease ${i * 0.28}s, transform 1.5s ease ${i * 0.28}s`;
    });
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            obs.unobserve(el);
          }
        }),
      { threshold: 0.4 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[114svh] items-center justify-center overflow-hidden bg-[#F5F0E8] px-6"
    >
      {/* Warm morning light — breathes slowly, the only motion */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 72% 62% at 50% 24%, rgba(201,169,110,0.17) 0%, rgba(245,240,232,0) 60%)",
          animation: "dream-glow 11s ease-in-out infinite",
        }}
      />
      {/* A second warm wash, low and quiet */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 48% at 50% 104%, rgba(201,169,110,0.07) 0%, transparent 56%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2
          data-r
          style={{ opacity: 0, transform: "translateY(22px)" }}
          className="font-serif text-[2.6rem] font-medium leading-[1.12] tracking-[-0.015em] text-[#1a1a1a] md:text-[3.8rem] lg:text-[4.6rem]"
        >
          Your dream home.
          <br />
          <span className="font-normal italic text-[#1a1a1a]/80">
            It starts with excitement.
          </span>
        </h2>

        <p
          data-r
          style={{ opacity: 0, transform: "translateY(16px)" }}
          className="mx-auto mt-10 max-w-md text-[0.95rem] font-light leading-[1.95] tracking-[0.02em] text-[#1a1a1a]/40 md:text-[1rem]"
        >
          Every great home begins with one hopeful decision.
        </p>
      </div>
    </section>
  );
}
