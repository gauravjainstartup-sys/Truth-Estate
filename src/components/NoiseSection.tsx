"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ════════════════════════════════════════════════════════════════
   SECTION 3 — THE NOISE
   The buyer (the viewer) sits calm at the centre. Everyone has an
   opinion — developers, brokers, parents, friends, the internet — and
   the voices crowd in, slow and heavy, until the mood dims. Then
   silence, one question, and the noise is removed to clean white relief.
   The villain is noise. Truth Estate does not appear yet.
   ════════════════════════════════════════════════════════════════ */

/* Attributed voices — merges the opinions with their sources. Positioned
   around the periphery; the central band (top 38–62) stays clear for the
   editorial question. */
const VOICES: {
  text: string;
  source: string;
  left: number;
  top: number;
  fs: string;
  op: number;
  rot: number;
}[] = [
  /* top ring */
  { text: "Best deal.",                source: "Broker",     left: 11, top: 12, fs: "1.25rem", op: 0.72, rot: -1.5 },
  { text: "Prices will double.",       source: "YouTube",    left: 39, top:  8, fs: "1.1rem",  op: 0.64, rot:  1.0 },
  { text: "Last unit left.",           source: "Developer",  left: 68, top: 11, fs: "1.2rem",  op: 0.70, rot: -0.8 },
  { text: "You'll miss out.",          source: "Instagram",  left: 87, top: 21, fs: "1.0rem",  op: 0.60, rot:  1.6 },
  /* upper-mid */
  { text: "Guaranteed returns.",       source: "Developer",  left:  7, top: 31, fs: "1.15rem", op: 0.66, rot:  1.2 },
  { text: "Buy today.",                source: "WhatsApp",   left: 25, top: 27, fs: "1.3rem",  op: 0.74, rot: -1.0 },
  { text: "This developer never fails.", source: "Friend",   left: 63, top: 28, fs: "1.0rem",  op: 0.60, rot:  0.7 },
  { text: "Just Google it.",           source: "Google",     left: 85, top: 37, fs: "1.05rem", op: 0.58, rot: -1.4 },
  /* lower-mid */
  { text: "Wait six months.",          source: "Parents",    left:  9, top: 67, fs: "1.15rem", op: 0.66, rot: -0.9 },
  { text: "DLF is better.",            source: "Friend",     left: 29, top: 74, fs: "1.05rem", op: 0.60, rot:  1.3 },
  { text: "Think about the EMI.",      source: "Bank",       left: 62, top: 70, fs: "1.1rem",  op: 0.64, rot: -1.1 },
  { text: "Get it checked.",           source: "Lawyer",     left: 84, top: 64, fs: "1.0rem",  op: 0.58, rot:  0.8 },
  /* bottom ring */
  { text: "My friend made 2×.",        source: "Friend",     left: 21, top: 87, fs: "1.2rem",  op: 0.70, rot:  1.0 },
  { text: "Trust me.",                 source: "Broker",     left: 57, top: 89, fs: "1.3rem",  op: 0.74, rot: -1.4 },
  { text: "Smartworld is better.",     source: "Friend",     left: 78, top: 84, fs: "1.0rem",  op: 0.58, rot:  0.6 },
];

const WARM = "#F3EDE3"; // hopeful, carried from the Dream
const DIM = "#E2DBCE";  // the mood darkens as noise builds
const CLEAN = "#F8F5EF"; // relief — the screen is clean again

export default function NoiseSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = ref.current;
    if (!pin) return;

    gsap.registerPlugin(ScrollTrigger);

    const bg       = pin.querySelector<HTMLElement>("[data-bg]");
    const glow     = pin.querySelector<HTMLElement>("[data-glow]");
    const voices   = pin.querySelectorAll<HTMLElement>("[data-voice]");
    const inners   = pin.querySelectorAll<HTMLElement>("[data-voice-inner]");
    const statement = pin.querySelector<HTMLElement>("[data-statement]");

    if (!bg || !glow || !statement) return;

    const W = pin.offsetWidth  || window.innerWidth;
    const H = pin.offsetHeight || window.innerHeight;

    /* Initial states */
    gsap.set(bg, { backgroundColor: WARM });
    gsap.set(glow, { opacity: 1 });
    gsap.set(voices, { opacity: 0 });
    gsap.set(statement, { opacity: 0, y: 14 });

    /* The noise is alive but heavy — each voice drifts slowly. Frozen at
       the silence. */
    const ambient: gsap.core.Tween[] = [];
    inners.forEach((inner, i) => {
      const item = VOICES[i];
      gsap.set(inner, { rotation: item?.rot ?? 0 });
      const dirX = i % 2 === 0 ? 1 : -1;
      const dirY = i % 3 === 0 ? 1 : -1;
      const ax = 7 + (i % 4) * 3;          // 7–16px, smaller/heavier than chaos
      const ay = 6 + (i % 3) * 4;
      const dur = 9 + (i % 5) * 1.2;       // 9–13.8s, slow
      ambient.push(
        gsap.to(inner, {
          x: dirX * ax,
          y: dirY * ay,
          rotation: (item?.rot ?? 0) + (i % 2 ? 1.1 : -1.1),
          duration: dur,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: (i % 5) * 0.5,
        }),
      );
    });

    let silenceProgress = 1;
    let frozen = false;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=440%",
        pin: true,
        scrub: 0.45,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (self.progress >= silenceProgress && !frozen) {
            frozen = true;
            ambient.forEach((t) => t.pause());
          } else if (self.progress < silenceProgress && frozen) {
            frozen = false;
            ambient.forEach((t) => t.resume());
          }
        },
      },
    });

    /* ── The calm before ── */
    tl.to({}, { duration: 0.06 });

    /* ── The voices crowd in — slow, staggered. The mood dims, the
       buyer's warmth fades. Nothing flashes. ── */
    tl.to(voices, {
      opacity: (i: number) => VOICES[i]?.op ?? 0.6,
      duration: 0.2,
      stagger: 0.022,
      ease: "power1.out",
    });
    tl.to(bg, { backgroundColor: DIM, duration: 0.26, ease: "power1.inOut" }, "<");
    tl.to(glow, { opacity: 0, duration: 0.24, ease: "power1.inOut" }, "<");
    tl.to({}, { duration: 0.08 }); // overload holds, voices still drifting

    /* ── SILENCE — everything freezes ── */
    const freezeStartTime = tl.duration();
    tl.to({}, { duration: 0.16 });

    /* ── One question, on the dimmed screen ── */
    tl.to(statement, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" });
    tl.to({}, { duration: 0.13 }); // hold the question

    /* ── The noise is REMOVED — not faded. Each voice is lifted outward,
       off the screen, and the world cleanses to white. ── */
    voices.forEach((voice, i) => {
      const item = VOICES[i];
      const outX = ((item.left - 50) / 100) * W * 0.7;
      const outY = ((item.top - 50) / 100) * H * 0.7 - H * 0.06; // also lift up
      tl.to(
        voice,
        { x: outX, y: outY, opacity: 0, duration: 0.04, ease: "power2.in" },
        i === 0 ? ">" : ">-0.028",
      );
    });
    tl.to(bg, { backgroundColor: CLEAN, duration: 0.16, ease: "power1.inOut" }, "<");

    /* ── The question hangs, alone, on the clean white. Relief. ── */
    tl.to({}, { duration: 0.12 });
    tl.to(statement, { opacity: 0, y: -10, duration: 0.07, ease: "power2.in" });
    tl.to({}, { duration: 0.05 });

    silenceProgress = freezeStartTime / tl.duration();

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => {
      ambient.forEach((t) => t.kill());
      st?.kill(true);
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} className="relative h-svh w-full overflow-hidden">
      <div data-bg className="absolute inset-0" style={{ backgroundColor: WARM }} />

      {/* The buyer's hope — a warm centre that fades as the noise builds */}
      <div
        data-glow
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 34% 40% at 50% 50%, rgba(201,169,110,0.13) 0%, transparent 64%)",
        }}
      />

      {/* The voices */}
      {VOICES.map((v, i) => (
        <span
          key={`${v.text}-${i}`}
          data-voice
          className="pointer-events-none absolute max-w-[42vw] select-none md:max-w-[24vw]"
          style={{ left: `${v.left}%`, top: `${v.top}%`, transform: "translate(-50%,-50%)" }}
        >
          <span data-voice-inner className="block">
            <span
              className="block whitespace-nowrap font-serif italic text-[#1a1a1a]/80"
              style={{ fontSize: v.fs }}
            >
              &ldquo;{v.text}&rdquo;
            </span>
            <span className="mt-1 block text-[8.5px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/35">
              {v.source}
            </span>
          </span>
        </span>
      ))}

      {/* The question — appears at the freeze, holds through the relief */}
      <div
        data-statement
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
      >
        <p className="font-serif text-[1.9rem] font-medium leading-[1.2] tracking-[-0.01em] text-[#1a1a1a] md:text-[2.7rem] lg:text-[3.4rem]">
          <span className="font-light text-[#1a1a1a]/55">
            The biggest challenge
            <br />
            isn&apos;t finding a property.
          </span>
          <br />
          <span className="mt-4 inline-block">
            It&apos;s knowing
            <br />
            who to believe.
          </span>
        </p>
      </div>
    </div>
  );
}
