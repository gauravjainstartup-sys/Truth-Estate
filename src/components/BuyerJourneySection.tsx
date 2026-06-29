"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ════════════════════════════════════════════════════════════════
   THE BUYER'S JOURNEY — one continuous scroll-film.
   A single woman stays centred while the world changes around her.
   Her expression (6 frames) morphs as excitement curdles into chaos,
   then recovers into clarity. All the noise — notifications, brokers,
   claims, clouds — is rendered in code around her.

   Dream → Portals → Brokers → Promises → Chaos → Solution
   Excited → Overwhelmed → Pressured → Irritated → Anxious → Confident
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";

const FRAMES = [
  "excited",
  "overwhelmed",
  "pressured",
  "irritated",
  "anxious",
  "relieved",
];

const NARRATIVE = [
  { kicker: "THE DREAM",          line: "It all begins with a dream home.",        pill: "Excited. Hopeful. Confident.", dark: false },
  { kicker: "THE PORTALS",        line: "Endless listings. Endless spam.",         pill: "Overwhelmed. Confused.",        dark: false },
  { kicker: "BROKERS EVERYWHERE", line: "One broker turns into ten.",              pill: "Pressured. Drained.",           dark: false },
  { kicker: "VERBAL PROMISES",    line: "Best deal. Best price. No proof.",        pill: "Skeptical. Irritated.",         dark: false },
  { kicker: "CHAOS & UNCERTAINTY",line: "Too many voices. Too many doubts.",       pill: "Anxious. Unsure. Helpless.",    dark: true  },
  { kicker: "THE SOLUTION",       line: "From verbal promises to verified proofs.", pill: "Clarity. Confidence. Control.", dark: false },
];

const NOTIFICATIONS = [
  { label: "Best Deal!",      badge: 17, left: 8,  top: 24 },
  { label: "Limited Offer!",  badge: 23, left: 14, top: 40 },
  { label: "New Launch!",     badge: 31, left: 9,  top: 56 },
  { label: "Luxury 4BHK",     badge: 12, left: 70, top: 26 },
  { label: "Call Now!",       badge: 28, left: 74, top: 52 },
];

const BROKER_POS = [
  { left: 16, top: 30 }, { left: 24, top: 60 }, { left: 12, top: 46 },
  { left: 72, top: 28 }, { left: 80, top: 48 }, { left: 70, top: 66 },
  { left: 33, top: 78 }, { left: 60, top: 80 }, { left: 47, top: 86 },
];

const PROMISES = [
  { text: "Top developer",    left: 12, top: 28 },
  { text: "Unbeatable price", left: 70, top: 26 },
  { text: "Best unit for you",left: 9,  top: 56 },
  { text: "Guaranteed returns", left: 72, top: 56 },
  { text: "Limited inventory",left: 40, top: 84 },
];

const DOUBTS = [
  { text: "Will it be delivered?",      left: 11, top: 26 },
  { text: "Is the developer stable?",   left: 66, top: 24 },
  { text: "Is the price fair?",         left: 72, top: 58 },
  { text: "Is the location future-proof?", left: 8, top: 60 },
];

const PROOFS = [
  { k: "Financial Health", v: "Strong" },
  { k: "RERA Compliance",  v: "Verified" },
  { k: "Litigation Check", v: "Clear" },
  { k: "Construction",     v: "On Track" },
];

const VALUE_PROPS = [
  "Verbal promises → verified proofs",
  "One dedicated expert, not ten brokers",
  "Every claim documented",
  "Decide with confidence",
];

/* Background tints across the descent and recovery */
const BG = ["#F3EDE3", "#EFE8DD", "#E8E0D2", "#E0D8C9", "#17140F", "#F8F5EF"];

export default function BuyerJourneySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [hereReady, setHereReady] = useState(false);

  /* Probe for the portrait set — hide the placeholder once photos exist */
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setHereReady(true);
    img.src = `${basePath}/images/buyer/${FRAMES[0]}.png`;
  }, []);

  useEffect(() => {
    const pin = ref.current;
    if (!pin) return;

    gsap.registerPlugin(ScrollTrigger);

    const bgEl   = pin.querySelector<HTMLElement>("[data-bg]")!;
    const glow   = pin.querySelector<HTMLElement>("[data-glow]")!;
    const frames = Array.from(pin.querySelectorAll<HTMLElement>("[data-frame]"));
    const tops   = Array.from(pin.querySelectorAll<HTMLElement>("[data-top]"));
    const pills  = Array.from(pin.querySelectorAll<HTMLElement>("[data-pill]"));
    const portrait = pin.querySelector<HTMLElement>("[data-portrait]")!;
    const solution = pin.querySelector<HTMLElement>("[data-solution]")!;
    const officeEls = Array.from(pin.querySelectorAll<HTMLElement>("[data-office]"));
    const envs = [
      pin.querySelector<HTMLElement>('[data-env="dream"]'),
      pin.querySelector<HTMLElement>('[data-env="portals"]'),
      pin.querySelector<HTMLElement>('[data-env="brokers"]'),
      pin.querySelector<HTMLElement>('[data-env="promises"]'),
      pin.querySelector<HTMLElement>('[data-env="chaos"]'),
    ];

    /* ── Initial states — beat 0 (Dream) is live ── */
    gsap.set(bgEl, { backgroundColor: BG[0] });
    gsap.set(glow, { opacity: 1 });
    frames.forEach((f, i) => gsap.set(f, { opacity: i === 0 ? 1 : 0 }));
    tops.forEach((t, i)  => gsap.set(t, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 8 }));
    pills.forEach((p, i) => gsap.set(p, { opacity: i === 0 ? 1 : 0 }));
    envs.forEach((e, i)  => e && gsap.set(e, { opacity: i === 0 ? 1 : 0 }));
    gsap.set(solution, { opacity: 0 });
    gsap.set(portrait, { yPercent: 0, scale: 1 });

    let cur = 0;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=760%",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
      },
    });

    /* Move from the current beat to beat `iTo`. The headline + pill sit at
       the same position each beat, so they fade OUT fully before the next
       fades IN (sequential, never ghosting). Portrait, environment and
       background cross-fade concurrently — those are different visuals. */
    const go = (iTo: number, hold = 0.1) => {
      // ── OUT (concurrent) + portrait/env/bg cross-fade ──
      tl.to(tops[cur],  { opacity: 0, y: -8, duration: 0.045 });
      tl.to(pills[cur], { opacity: 0, duration: 0.045 }, "<");
      tl.to(frames[cur], { opacity: 0, duration: 0.06 }, "<");
      if (envs[cur]) tl.to(envs[cur]!, { opacity: 0, duration: 0.05 }, "<");
      tl.to(bgEl, { backgroundColor: BG[iTo], duration: 0.09 }, "<");
      if (iTo === 1) tl.to(glow, { opacity: 0, duration: 0.07 }, "<"); // warm light leaves
      tl.to(frames[iTo], { opacity: 1, duration: 0.06 }, "<");
      if (envs[iTo]) tl.to(envs[iTo]!, { opacity: 1, duration: 0.07 }, "<");
      // ── IN narrative (appended after the OUT block, so no overlap) ──
      tl.to(tops[iTo],  { opacity: 1, y: 0, duration: 0.05 });
      tl.to(pills[iTo], { opacity: 1, duration: 0.05 }, "<");
      tl.to({}, { duration: hold });
      cur = iTo;
    };

    tl.to({}, { duration: 0.07 });   // hold the dream
    go(1);                           // Portals — spam
    go(2);                           // Brokers — multiply
    go(3);                           // Promises — claims
    go(4, 0.14);                     // Chaos — dim, doubts (hold longer)

    /* ── THE EXHALE — the moment of relief ── */
    tl.to(frames[4], { opacity: 0, duration: 0.06 });
    tl.to(frames[5], { opacity: 1, duration: 0.06 }, "<");      // smile returns
    tl.to(tops[4],   { opacity: 0, y: -8, duration: 0.05 }, "<");
    tl.to(pills[4],  { opacity: 0, duration: 0.05 }, "<");
    tl.to(envs[4]!,  { opacity: 0, duration: 0.07 }, "<");
    tl.to(bgEl, { backgroundColor: BG[5], duration: 0.13, ease: "power1.inOut" }, "<"); // dark → clean
    tl.to({}, { duration: 0.06 });                              // breathe on her relief

    /* ── THE SOLUTION — she settles up; the Buyer Office takes centre ── */
    tl.to(portrait, { yPercent: -22, scale: 0.74, duration: 0.1, ease: "power2.out" });
    tl.to(tops[5],  { opacity: 1, y: 0, duration: 0.06 }, "<");
    tl.to(pills[5], { opacity: 1, duration: 0.06 }, "<0.02");
    tl.to(solution, { opacity: 1, duration: 0.07 }, "<");
    tl.fromTo(
      officeEls,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.05, stagger: 0.028, ease: "power2.out" },
      "<0.02",
    );
    tl.to({}, { duration: 0.2 });                               // hold the payoff

    /* ── Hand off to ExperienceSection (#0a0a0a) ── */
    tl.to([portrait, solution, tops[5], pills[5]], { opacity: 0, y: -10, duration: 0.07, ease: "power2.in" });
    tl.to(bgEl, { backgroundColor: "#0a0a0a", duration: 0.08 }, "<");

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => {
      st?.kill(true);
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} className="relative h-svh w-full overflow-hidden">
      <div data-bg className="absolute inset-0" style={{ backgroundColor: BG[0] }} />
      <div
        data-glow
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 42%, rgba(201,169,110,0.16) 0%, transparent 62%)",
        }}
      />

      {/* ─────────── HER (centred portrait, 6 cross-faded frames) ─────────── */}
      <div
        data-portrait
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[46vh] w-[64vw] max-w-[360px] -translate-x-1/2 -translate-y-1/2 md:h-[52vh] md:w-[30vw]"
      >
        {/* Soft silhouette placeholder — fades away once real photos exist */}
        <div
          className={`absolute inset-0 flex items-end justify-center transition-opacity duration-700 ${
            hereReady ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="h-[88%] w-[72%] rounded-t-[45%] bg-[#1a1a1a]/[0.05]" />
        </div>
        {/* Frames as background-images — a missing file simply shows nothing
            (no broken-image glyph), so the placeholder reads through cleanly. */}
        {FRAMES.map((name) => (
          <div
            key={name}
            data-frame
            className="absolute inset-0 bg-contain bg-bottom bg-no-repeat"
            style={{ backgroundImage: `url(${basePath}/images/buyer/${name}.png)` }}
          />
        ))}
      </div>

      {/* ─────────── ENVIRONMENTS (the noise, rendered in code) ─────────── */}

      {/* Beat 0 — Dream: a dream-home thought bubble */}
      <div data-env="dream" className="pointer-events-none absolute inset-0 z-10">
        <div
          className="absolute left-[22%] top-[28%] flex h-24 w-24 items-center justify-center rounded-full bg-white/70 shadow-[0_8px_40px_rgba(201,169,110,0.18)] backdrop-blur-sm md:left-[30%] md:h-28 md:w-28"
          style={{ animation: "soft-float 7s ease-in-out infinite" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.4" className="h-9 w-9">
            <path d="M3 11l9-7 9 7M5 10v9h14v-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="absolute left-[20%] top-[44%] block h-2 w-2 rounded-full bg-white/60 md:left-[28%]" />
        <span className="absolute left-[24%] top-[48%] block h-1.5 w-1.5 rounded-full bg-white/50 md:left-[31%]" />
      </div>

      {/* Beat 1 — Portals: notification spam */}
      <div data-env="portals" className="pointer-events-none absolute inset-0 z-10">
        {NOTIFICATIONS.map((n, i) => (
          <div
            key={n.label}
            className="absolute flex items-center gap-2 rounded-xl bg-white/85 px-3.5 py-2 shadow-[0_6px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm"
            style={{ left: `${n.left}%`, top: `${n.top}%`, animation: `soft-float ${6 + i}s ease-in-out infinite` }}
          >
            <span className="text-[0.8rem] font-medium text-[#1a1a1a]/80">{n.label}</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d4503e] px-1.5 text-[0.62rem] font-semibold text-white">
              {n.badge}
            </span>
          </div>
        ))}
      </div>

      {/* Beat 2 — Brokers: one becomes ten */}
      <div data-env="brokers" className="pointer-events-none absolute inset-0 z-10">
        {BROKER_POS.map((b, i) => (
          <div
            key={i}
            className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1a1a]/[0.08] ring-1 ring-[#1a1a1a]/10 md:h-12 md:w-12"
            style={{ left: `${b.left}%`, top: `${b.top}%`, animation: `soft-float ${5 + (i % 4)}s ease-in-out infinite` }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.3" className="h-5 w-5 opacity-50">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1e6b45] text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5">
                <path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11 11 0 003.4.55 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.55 3.4 1 1 0 01-.24 1z" />
              </svg>
            </span>
          </div>
        ))}
      </div>

      {/* Beat 3 — Promises: verbal claims */}
      <div data-env="promises" className="pointer-events-none absolute inset-0 z-10">
        {PROMISES.map((p, i) => (
          <div
            key={p.text}
            className="absolute rounded-2xl rounded-bl-sm bg-[#1a1a1a] px-4 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.16)]"
            style={{ left: `${p.left}%`, top: `${p.top}%`, animation: `soft-float ${6 + (i % 3)}s ease-in-out infinite` }}
          >
            <span className="text-[0.82rem] font-medium italic text-white/90">&ldquo;{p.text}&rdquo;</span>
          </div>
        ))}
      </div>

      {/* Beat 4 — Chaos: dark clouds, doubts, question marks */}
      <div data-env="chaos" className="pointer-events-none absolute inset-0 z-10">
        {/* clouds */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(0,0,0,0.45) 0%, transparent 66%)" }} />
        {/* floating question marks */}
        {[14, 30, 68, 84, 50].map((l, i) => (
          <span
            key={i}
            className="absolute font-serif text-[1.6rem] text-white/25 md:text-[2rem]"
            style={{ left: `${l}%`, top: `${18 + (i % 3) * 9}%`, animation: `soft-float ${5 + i}s ease-in-out infinite` }}
          >
            ?
          </span>
        ))}
        {/* doubts */}
        {DOUBTS.map((d, i) => (
          <span
            key={d.text}
            className="absolute text-[0.82rem] font-light text-white/55 md:text-[0.9rem]"
            style={{ left: `${d.left}%`, top: `${d.top}%`, animation: `soft-float ${7 + i}s ease-in-out infinite` }}
          >
            {d.text}
          </span>
        ))}
      </div>

      {/* ─────────── NARRATIVE (top kicker + line, bottom pill) ─────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-[8%] z-30 flex flex-col items-center px-6 text-center md:top-[10%]">
        {NARRATIVE.map((n) => (
          <div key={n.kicker} data-top className="absolute">
            <p className={`text-[10px] font-medium uppercase tracking-[0.34em] ${n.dark ? "text-[#c9a96e]" : "text-[#c9a96e]"}`}>
              {n.kicker}
            </p>
            <p className={`mt-3 font-serif text-[1.5rem] font-medium leading-[1.2] tracking-[-0.01em] md:text-[2.1rem] ${n.dark ? "text-white/90" : "text-[#1a1a1a]"}`}>
              {n.line}
            </p>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[8%] z-30 flex justify-center px-6">
        {NARRATIVE.map((n) => (
          <span
            key={n.pill}
            data-pill
            className={`absolute rounded-full px-5 py-2 text-[0.82rem] font-light tracking-[0.02em] backdrop-blur-sm ${
              n.dark ? "bg-white/10 text-white/85" : "bg-[#1a1a1a]/[0.05] text-[#1a1a1a]/70"
            }`}
          >
            {n.pill}
          </span>
        ))}
      </div>

      {/* ─────────── THE SOLUTION — Buyer Office payoff ─────────── */}
      <div
        data-solution
        className="absolute inset-x-0 bottom-[12%] z-30 flex justify-center px-6"
      >
        <div className="w-full max-w-md rounded-2xl border border-[#1a1a1a]/8 bg-white/80 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.08)] backdrop-blur-md md:p-7">
          <p data-office className="text-center text-[10px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]">
            Your Buyer Office
          </p>

          <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4">
            <div data-office>
              <p className="text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/35">Recommended Verdict</p>
              <p className="mt-1.5 font-serif text-[2rem] font-semibold leading-none text-[#1e6b45] md:text-[2.4rem]">Proceed</p>
              <p className="mt-2 text-[0.72rem] font-light text-[#1a1a1a]/45">92% Confidence</p>
            </div>
            <div data-office className="text-right">
              <div className="flex items-center justify-end gap-2.5">
                <div className="text-right">
                  <p className="text-[0.78rem] font-medium text-[#1a1a1a]/80">Arjun Mehta</p>
                  <p className="text-[0.66rem] font-light text-[#1a1a1a]/45">Senior Analyst</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-[#1a1a1a]/[0.08] ring-1 ring-[#1a1a1a]/10" />
              </div>
            </div>
          </div>

          <div data-office className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-[#1a1a1a]/8 pt-5">
            {PROOFS.map((p) => (
              <div key={p.k} className="flex items-center justify-between">
                <span className="text-[0.74rem] font-light text-[#1a1a1a]/55">{p.k}</span>
                <span className="flex items-center gap-1 text-[0.74rem] font-medium text-[#1e6b45]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p.v}
                </span>
              </div>
            ))}
          </div>

          <div data-office className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-[#1a1a1a]/8 pt-5">
            {VALUE_PROPS.map((v) => (
              <span key={v} className="text-[0.68rem] font-light text-[#1a1a1a]/45">
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
