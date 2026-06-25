"use client";

import { useEffect, useRef } from "react";

export default function StorySection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          (entry.target as HTMLElement).style.opacity = entry.isIntersecting
            ? "1"
            : "0";
        });
      },
      { threshold: 0.4 }
    );

    const screens = ref.current?.querySelectorAll("[data-story]");
    screens?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-[#F7F5F2]">
      <div
        data-story
        className="flex min-h-svh items-center justify-center px-8 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <h2 className="text-center font-serif text-[2.8rem] font-medium leading-[1.2] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
          Every property
          <br />
          has two stories.
        </h2>
      </div>

      <div
        data-story
        className="flex min-h-svh items-center justify-center px-8 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <p className="text-center font-serif text-[2.8rem] leading-[1.2] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
          The one
          <br />
          you&apos;re told.
        </p>
      </div>

      <div
        data-story
        className="flex min-h-svh items-center justify-center px-8 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <p className="text-center font-serif text-[2.8rem] leading-[1.2] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
          The one
          <br />
          the data tells.
        </p>
      </div>

      <div
        data-story
        className="flex min-h-svh items-center justify-center px-8 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <p className="text-center font-serif text-[3rem] font-semibold leading-[1.12] text-[#1a1a1a] md:text-[5.5rem] lg:text-[7rem]">
          No brochure
          <br />
          mentions this.
        </p>
      </div>

      <div
        data-story
        className="flex min-h-svh items-center justify-center px-8 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <p className="text-center font-serif text-[2.5rem] italic leading-[1.25] text-[#1a1a1a] md:text-[4rem] lg:text-[5rem]">
          Would we buy this
          <br />
          for our own family?
        </p>
      </div>

      <div
        data-story
        className="flex min-h-svh items-center justify-center px-8 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <p className="text-center font-serif text-[2.8rem] font-medium leading-[1.2] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
          That is where
          <br />
          Truth Estate begins.
        </p>
      </div>

      <div
        data-story
        className="flex min-h-[60vh] items-center justify-center px-8 transition-opacity duration-1000"
        style={{ opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="h-px w-12 bg-[#c9a96e]" />
          <p className="text-center text-[11px] font-light tracking-[0.3em] text-[#1a1a1a]/40 md:text-[13px]">
            HOW WE ARRIVE AT A VERDICT
          </p>
        </div>
      </div>
    </section>
  );
}
