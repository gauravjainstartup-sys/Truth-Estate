"use client";

/* ════════════════════════════════════════════════════════════════
   LIVE COMPARE — renders a project A-vs-B comparison for ANY pair,
   client-side, so every scored project is comparable without a
   prerendered page per pair.

   Reads ?a=<slug>&b=<slug> from the URL, loads the build-emitted
   /compare-index.json (slug → full ProjectIntel), and feeds the two
   ProjectIntels to the SAME ComparePage the prerendered pairs use — no
   UI change, identical output. Popular / top-scored pairs still route to
   their static prerendered page (instant, indexable); this handles the
   long tail. Fails soft to a "couldn't load" state with a way back.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Logo from "../Logo";
import ComparePage from "./ComparePage";
import { basePath, homeHref } from "@/lib/site";
import type { ProjectIntel } from "@/lib/projects";
import type { ResolvedCompare } from "@/lib/compare";

type Status = "loading" | "ready" | "error";

export default function CompareLive() {
  const [status, setStatus] = useState<Status>("loading");
  const [resolved, setResolved] = useState<ResolvedCompare | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const aSlug = params.get("a")?.trim();
    const bSlug = params.get("b")?.trim();
    if (!aSlug || !bSlug || aSlug === bSlug) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    fetch(`${basePath}/compare-index.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((idx: Record<string, ProjectIntel> | null) => {
        if (cancelled) return;
        const a = idx?.[aSlug];
        const b = idx?.[bSlug];
        if (!a || !b) {
          setStatus("error");
          return;
        }
        setResolved({ kind: "project", a, b });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "ready" && resolved) return <ComparePage r={resolved} />;

  // loading / error — the same intelligence chrome, no layout shift into the page
  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={homeHref} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-[18vh] text-center md:px-10">
        {status === "loading" ? (
          <>
            <span
              className="h-7 w-7 animate-spin rounded-full border-2 border-[#1a1a1a]/15 border-t-[#1e6b45]"
              aria-hidden="true"
            />
            <p className="mt-5 text-[0.82rem] font-light tracking-[0.02em] text-[#1a1a1a]/45">Building the comparison…</p>
          </>
        ) : (
          <>
            <p className="font-serif text-[1.6rem] font-medium tracking-[-0.01em]">We couldn&rsquo;t load that comparison.</p>
            <p className="mt-3 max-w-md text-[0.9rem] font-light leading-[1.7] text-[#1a1a1a]/55">
              One of the two projects may not be in our tracked set. Pick two from the compare page and try again.
            </p>
            <a
              href={`${basePath}/intelligence/compare`}
              className="mt-7 rounded-sm bg-[#1e6b45] px-6 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]"
            >
              Back to Compare
            </a>
          </>
        )}
      </div>
    </div>
  );
}
