"use client";

/* ────────────────────────────────────────────────────────────────────────
   CompareGlimpse — the LOCKED-state tease on the compare "money" gate. An
   editorial balance that weighs the two projects across the five factors and
   wobbles as it "computes", under a masked verdict. It is a CONVERSION device,
   not a data leak:

     • it never rests tipped to a side (the beam wobbles symmetrically and
       returns to level), so no winner is implied while locked;
     • it shows no score, CAGR, or number — only the field names being weighed;
     • the verdict badge stays masked ("🔒 the better buy").

   The real head-to-head (verdict, /10 pillars, watch-outs) appears on unlock
   through the page's normal AUTH_EVENT reveal — this component only ever renders
   while locked, then unmounts. Decorative, so aria-hidden; the CompareUnlock
   card below it carries the actionable copy and the accessible name. Project
   names sit in a stable row UNDER the beam (not on the pans) so they stay level
   and never wrap awkwardly, however long the name.
   ──────────────────────────────────────────────────────────────────────── */

const WEIGH = ["ROI", "Legal", "Build", "Location", "Developer"] as const;

export default function CompareGlimpse({ aName, bName }: { aName: string; bName: string }) {
  const pan = (weights: readonly string[], delays: string[], side: "l" | "r") => (
    <div className={`absolute top-0 w-[78px] ${side === "l" ? "left-[-40px]" : "right-[-40px]"}`}>
      <div className="h-[5px] rounded-full bg-[#1a1a1a]/15" />
      <div className="mt-1.5 flex flex-col items-center gap-1">
        {weights.map((w, i) => (
          <span key={w} style={{ animationDelay: delays[i] }} className="cmpg-wt rounded-[5px] border border-[#1a1a1a]/14 bg-[#fffdf9] px-1.5 py-[2px] font-mono text-[0.5rem] uppercase tracking-[0.08em] text-[#1a1a1a]/70">{w}</span>
        ))}
      </div>
    </div>
  );
  return (
    <div aria-hidden className="cmpg relative mx-auto mt-3 w-full max-w-[380px] select-none [overflow-x:clip]">
      <style>{`
        @keyframes cmpg-weigh{0%{transform:rotate(0deg)}25%{transform:rotate(-3.2deg)}50%{transform:rotate(0deg)}75%{transform:rotate(3.2deg)}100%{transform:rotate(0deg)}}
        @keyframes cmpg-drop{0%{opacity:0;transform:translateY(-9px)}16%{opacity:1;transform:translateY(0)}84%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-9px)}}
        @keyframes cmpg-glow{0%,100%{opacity:.45}50%{opacity:1}}
        .cmpg .cmpg-beam{transform-origin:50% 50%;animation:cmpg-weigh 6s ease-in-out infinite}
        .cmpg .cmpg-wt{opacity:0;animation:cmpg-drop 6s ease-in-out infinite}
        .cmpg .cmpg-dot{animation:cmpg-glow 1.8s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){
          .cmpg .cmpg-beam,.cmpg .cmpg-wt,.cmpg .cmpg-dot{animation:none}
          .cmpg .cmpg-wt{opacity:1}
        }
      `}</style>

      {/* what's being weighed — neutral, no side assigned */}
      <p className="text-center font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/65">
        Weighing {WEIGH.join(" · ")}
      </p>

      {/* the balance — beam wobbles; names live below, so they stay level */}
      <div className="relative mx-auto mt-4 h-[104px] w-[188px]">
        <div className="absolute left-1/2 top-[62px] h-0 w-0 -translate-x-1/2 border-x-[13px] border-x-transparent border-b-[46px] border-b-[#1a1a1a]/12" />
        <div className="absolute left-1/2 top-[18px] w-[168px] -translate-x-1/2">
          <div className="cmpg-beam relative h-[6px] rounded-full bg-gradient-to-r from-[#9a7a2e] to-[#c9a96e]">
            {pan(WEIGH.slice(0, 2), [".6s", "1.5s"], "l")}
            {pan(WEIGH.slice(2), ["1s", "2s", "2.6s"], "r")}
          </div>
        </div>
      </div>

      {/* names — stable, readable, mapped to the pans left/right */}
      <div className="mt-1 grid grid-cols-2 gap-4">
        <p className="text-center font-serif text-[0.9rem] font-medium leading-tight text-[#1a1a1a]">{aName}</p>
        <p className="text-center font-serif text-[0.9rem] font-medium leading-tight text-[#1a1a1a]">{bName}</p>
      </div>

      {/* masked verdict */}
      <div className="mt-3.5 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9a7a2e]/45 bg-[#9a7a2e]/[0.14] px-3.5 py-1.5 font-mono text-[0.6rem] font-semibold tracking-[0.04em] text-[#6b5214]">
          <span className="cmpg-dot" aria-hidden>🔒</span> the better buy — masked
        </span>
      </div>
    </div>
  );
}
