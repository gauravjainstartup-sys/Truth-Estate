"use client";

import { useState } from "react";
import { InterestKind, saveInterest, OFFRAMP_COPY } from "@/lib/journey";

/* The honest off-ramp shown when a visitor wants something we don't serve yet
   (ready-to-move or commercial). Presentational only — each surface wraps it
   in its own shell. Captures a waitlist email, then confirms. An optional
   secondary link lets the caller offer a genuine next step (e.g. our note on
   under-construction vs ready-to-move). */
export default function FocusOffRamp({
  kind,
  locations,
  onExplore,
  exploreLabel,
}: {
  kind: InterestKind;
  locations?: string[];
  onExplore?: () => void;
  exploreLabel?: string;
}) {
  const c = OFFRAMP_COPY[kind];
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const emailOk = /\S+@\S+\.\S+/.test(email);

  const submit = () => {
    if (!emailOk) return;
    saveInterest({ kind, email, locations, createdAt: Date.now() });
    setDone(true);
  };

  if (done) {
    return (
      <div className="animate-fade-up mx-auto max-w-[560px] text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/[0.06] text-[1.4rem] text-[#1e6b45]">
          &#10003;
        </span>
        <h2 className="mt-7 font-serif text-[1.7rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[2.1rem]">
          {c.done}
        </h2>
        <p className="mt-4 text-[0.9rem] font-light text-[#1a1a1a]/45">
          In the meantime, our published intelligence is open to everyone — no account needed.
        </p>
        {onExplore && (
          <button
            onClick={onExplore}
            className="mt-8 rounded-sm border border-[#1a1a1a]/20 bg-white px-8 py-3.5 text-[13px] font-light tracking-[0.05em] text-[#1a1a1a]/80 transition-all duration-300 hover:border-[#1a1a1a]/40"
          >
            {exploreLabel ?? "Explore the intelligence"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-[560px]">
      <p className="mb-5 text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">{c.kicker}</p>
      <h2 className="font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.7rem]">
        {c.title}
      </h2>
      <p className="mt-5 max-w-xl text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
        {c.body}
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={c.placeholder}
          className="min-w-0 flex-1 border-b border-[#1a1a1a]/20 bg-transparent py-3 font-serif text-[1.15rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/50"
        />
        <button
          onClick={submit}
          disabled={!emailOk}
          className="shrink-0 rounded-sm bg-[#1e6b45] px-8 py-4 text-[13px] font-medium tracking-[0.06em] text-white shadow-sm transition-all duration-300 enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {c.cta}
        </button>
      </div>
      <p className="mt-3.5 text-[0.78rem] font-light italic text-[#1a1a1a]/35">{c.reassure}</p>

      {onExplore && (
        <button
          onClick={onExplore}
          className="mt-8 text-[0.86rem] font-light text-[#1e6b45] underline decoration-[#1e6b45]/25 underline-offset-4 transition-colors hover:text-[#238c55]"
        >
          {exploreLabel ?? "Read our note on under-construction vs ready-to-move →"}
        </button>
      )}
    </div>
  );
}
