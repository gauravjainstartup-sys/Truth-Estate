"use client";

import { useEffect, useRef } from "react";

const investigations = [
  "Developer",
  "Construction",
  "Legal",
  "Pricing",
  "Location",
  "Exit Strategy",
];

export default function StorySection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let ticking = false;

    const update = () => {
      const vh = window.innerHeight;

      root.querySelectorAll<HTMLElement>("[data-scene]").forEach((wrapper) => {
        const inner = wrapper.querySelector<HTMLElement>("[data-content]");
        if (!inner) return;

        const rect = wrapper.getBoundingClientRect();
        const travel = wrapper.offsetHeight - vh;

        if (travel <= 0 || rect.top >= vh || rect.bottom <= 0) {
          inner.style.opacity = "0";
          return;
        }

        const p = Math.max(0, Math.min(1, -rect.top / travel));

        let o: number;
        if (p < 0.1) o = p / 0.1;
        else if (p < 0.82) o = 1;
        else o = 1 - (p - 0.82) / 0.18;

        inner.style.opacity = String(Math.max(0, Math.min(1, o)));
      });

      const tx = root.querySelector<HTMLElement>("[data-transition-bg]");
      if (tx) {
        const rect = tx.getBoundingClientRect();
        const travel = tx.offsetHeight - vh;
        if (travel > 0 && rect.top < vh && rect.bottom > 0) {
          const p = Math.max(0, Math.min(1, -rect.top / travel));
          const r = Math.round(247 - p * 237);
          const g = Math.round(245 - p * 235);
          const b = Math.round(242 - p * 232);
          tx.style.backgroundColor = `rgb(${r},${g},${b})`;
        }
      }

      const inv = root.querySelector<HTMLElement>("[data-investigations]");
      if (inv) {
        const rect = inv.getBoundingClientRect();
        const travel = inv.offsetHeight - vh;
        if (travel > 0 && rect.top < vh && rect.bottom > 0) {
          const progress = Math.max(0, Math.min(1, -rect.top / travel));
          const items = inv.querySelectorAll<HTMLElement>("[data-inv-item]");
          const count = items.length;

          items.forEach((item, i) => {
            const start = (i + 0.5) / (count + 1.5);
            const end = start + 0.06;

            if (progress >= end) {
              item.style.opacity = "1";
              item.style.transform = "translateY(0)";
            } else if (progress >= start) {
              const fade = (progress - start) / (end - start);
              item.style.opacity = String(fade);
              item.style.transform = `translateY(${(1 - fade) * 8}px)`;
            } else {
              item.style.opacity = "0";
              item.style.transform = "translateY(8px)";
            }
          });

          const container = inv.querySelector<HTMLElement>(
            "[data-inv-container]"
          );
          if (container) {
            if (progress > 0.88) {
              container.style.opacity = String(
                Math.max(0, 1 - (progress - 0.88) / 0.12)
              );
            } else {
              container.style.opacity = "1";
            }
          }
        }
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(update);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={ref}>
      {/* ─── SCENE 1 ─── */}
      <div
        data-scene
        className="relative bg-[#F7F5F2]"
        style={{ height: "160vh" }}
      >
        <div
          data-content
          className="sticky top-0 flex h-svh items-center justify-center px-8"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <h2 className="text-center font-serif text-[2.8rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
            Every property
            <br />
            has two stories.
          </h2>
        </div>
      </div>

      {/* ─── SCENE 2 ─── */}
      <div
        data-scene
        className="relative bg-[#F7F5F2]"
        style={{ height: "140vh" }}
      >
        <div
          data-content
          className="sticky top-0 flex h-svh items-center justify-center px-8"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <p className="text-center font-serif text-[2.8rem] leading-[1.15] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
            The one
            <br />
            you&apos;re told.
          </p>
        </div>
      </div>

      {/* ─── SCENE 3 ─── */}
      <div
        data-scene
        className="relative bg-[#F7F5F2]"
        style={{ height: "140vh" }}
      >
        <div
          data-content
          className="sticky top-0 flex h-svh items-center justify-center px-8"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <p className="text-center font-serif text-[2.8rem] leading-[1.15] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
            The one
            <br />
            the data tells.
          </p>
        </div>
      </div>

      {/* ─── SCENE 4 — poster punch ─── */}
      <div
        data-scene
        className="relative bg-[#F7F5F2]"
        style={{ height: "160vh" }}
      >
        <div
          data-content
          className="sticky top-0 flex h-svh items-center justify-center px-8"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <p className="text-center font-serif text-[3rem] font-semibold leading-[1.1] text-[#1a1a1a] md:text-[5.5rem] lg:text-[7rem]">
            No brochure
            <br />
            mentions this.
          </p>
        </div>
      </div>

      {/* ─── SCENE 5 — climax, holds longest ─── */}
      <div
        data-scene
        className="relative bg-[#F7F5F2]"
        style={{ height: "220vh" }}
      >
        <div
          data-content
          className="sticky top-0 flex h-svh items-center justify-center px-8"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <p className="text-center font-serif text-[2.5rem] italic leading-[1.2] text-[#1a1a1a] md:text-[4rem] lg:text-[5rem]">
            Would we buy this
            <br />
            for our own family?
          </p>
        </div>
      </div>

      {/* ─── TRANSITION: ivory → near-black ─── */}
      <div
        data-transition-bg
        className="relative"
        style={{ height: "130vh", backgroundColor: "#F7F5F2" }}
      >
        <div className="sticky top-0 h-svh" />
      </div>

      {/* ─── DARK BREATH ─── */}
      <div className="bg-[#0a0a0a]" style={{ height: "50vh" }} />

      {/* ─── CHAPTER 3: THE VERDICT PROCESS ─── */}
      <div
        data-scene
        className="relative bg-[#0a0a0a]"
        style={{ height: "180vh" }}
      >
        <div
          data-content
          className="sticky top-0 flex h-svh items-center justify-center px-8"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <div className="flex flex-col items-center gap-5">
            <div className="h-px w-10 bg-[#c9a96e]" />
            <h3 className="text-center font-serif text-[2rem] font-light leading-[1.3] tracking-wide text-white/90 md:text-[3.2rem] lg:text-[4rem]">
              How We Arrive
              <br />
              at a Verdict
            </h3>
          </div>
        </div>
      </div>

      {/* ─── INVESTIGATIONS — sequential reveal ─── */}
      <div
        data-investigations
        className="relative bg-[#0a0a0a]"
        style={{ height: "500vh" }}
      >
        <div
          data-inv-container
          className="sticky top-0 flex h-svh items-center justify-center px-8"
          style={{ willChange: "opacity" }}
        >
          <div className="flex flex-col items-center gap-10">
            {investigations.map((item) => (
              <p
                key={item}
                data-inv-item
                className="font-serif text-[1.4rem] font-light tracking-[0.12em] md:text-[2rem]"
                style={{
                  opacity: 0,
                  transform: "translateY(8px)",
                  willChange: "opacity, transform",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PROPERTY VERDICT ─── */}
      <div
        data-scene
        className="relative bg-[#0a0a0a]"
        style={{ height: "200vh" }}
      >
        <div
          data-content
          className="sticky top-0 flex h-svh items-center justify-center px-6"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <div className="flex w-full max-w-sm flex-col items-center py-16 md:max-w-md">
            <p className="text-[10px] font-light tracking-[0.4em] text-white/25">
              PROPERTY VERDICT
            </p>

            <div className="mt-10 h-px w-16 bg-[#c9a96e]/40" />

            <p className="mt-12 font-serif text-[3rem] font-medium leading-none text-[#c9a96e] md:text-[4rem]">
              Proceed
            </p>

            <p className="mt-4 font-serif text-[1.3rem] font-light text-white/60 md:text-[1.6rem]">
              DLF Arbour
            </p>

            <div className="mt-14 flex flex-col items-center">
              <p className="text-[9px] font-light tracking-[0.35em] text-white/20">
                CONFIDENCE
              </p>
              <p className="mt-3 font-serif text-[3.5rem] font-extralight leading-none text-white/90 md:text-[4.5rem]">
                97%
              </p>
            </div>

            <div className="mt-14 h-px w-16 bg-[#c9a96e]/40" />

            <div className="mt-8 flex flex-col items-center">
              <p className="text-[8px] font-light tracking-[0.35em] text-white/15">
                PREPARED BY
              </p>
              <p className="mt-2 font-serif text-[13px] tracking-[0.2em] text-white/35">
                Truth Estate
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
