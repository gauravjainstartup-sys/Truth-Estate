"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Curated chaos — only the strongest signals of a fragmented purchase.
   Fewer elements than a word cloud: visitors should FEEL the fragmentation,
   not read every label. Sizes vary widely (0.76rem → 2.0rem) so the loud
   human noise dominates and paperwork recedes. The bottom-centre band
   (top > 82, left 25–75) is kept clear for the chaos label. */
const CHAOS_ITEMS: {
  text: string;
  left: number;
  top: number;
  fs: string;
  op: number;
  rot: number;
}[] = [
  /* far left */
  { text: "Developer",       left:  7, top: 18, fs: "1.5rem",  op: 0.44, rot: -1.2 },
  { text: "Lawyer",          left:  6, top: 58, fs: "1.0rem",  op: 0.32, rot: -2.0 },
  /* left */
  { text: "WhatsApp",        left: 19, top: 30, fs: "1.85rem", op: 0.50, rot:  0.8 },
  { text: "Bank",            left: 22, top: 62, fs: "1.1rem",  op: 0.36, rot:  0.6 },
  { text: "Agreements",      left: 16, top: 84, fs: "0.78rem", op: 0.26, rot:  1.2 },
  /* centre-left */
  { text: "CA",              left: 34, top: 14, fs: "0.9rem",  op: 0.32, rot:  1.8 },
  { text: "Calls",           left: 32, top: 40, fs: "2.0rem",  op: 0.50, rot:  1.4 },
  { text: "Documents",       left: 30, top: 68, fs: "0.98rem", op: 0.34, rot: -0.8 },
  /* centre */
  { text: "Broker",          left: 47, top: 22, fs: "1.6rem",  op: 0.46, rot: -1.8 },
  { text: "Parents",         left: 46, top: 50, fs: "1.3rem",  op: 0.42, rot:  2.0 },
  /* centre-right */
  { text: "Site Visits",     left: 62, top: 16, fs: "1.1rem",  op: 0.36, rot:  1.1 },
  { text: "Emails",          left: 60, top: 42, fs: "1.45rem", op: 0.44, rot: -1.6 },
  { text: "Payments",        left: 64, top: 70, fs: "0.98rem", op: 0.34, rot:  0.7 },
  /* right */
  { text: "Spouse",          left: 76, top: 26, fs: "1.2rem",  op: 0.40, rot: -0.6 },
  { text: "Builder Updates", left: 79, top: 52, fs: "0.82rem", op: 0.28, rot:  1.6 },
  { text: "Demand Letters",  left: 77, top: 82, fs: "0.76rem", op: 0.26, rot: -1.0 },
];

const PILLARS = [
  "Conversations",
  "Documents",
  "Recommendations",
  "Buyer Ledger",
  "Ownership",
];

export default function ChaosToOrderSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = ref.current;
    if (!pin) return;

    gsap.registerPlugin(ScrollTrigger);

    const screen1   = pin.querySelector<HTMLElement>("[data-screen1]");
    const words     = pin.querySelectorAll<HTMLElement>("[data-word]");
    const inners    = pin.querySelectorAll<HTMLElement>("[data-word-inner]");
    const chaosLbl  = pin.querySelector<HTMLElement>("[data-chaos-lbl]");
    const goldLine  = pin.querySelector<HTMLElement>("[data-gold-line]");
    const poTitle   = pin.querySelector<HTMLElement>("[data-po-title]");
    const pillarsEls = pin.querySelectorAll<HTMLElement>("[data-pillar]");
    const finalEl   = pin.querySelector<HTMLElement>("[data-final]");

    if (!screen1 || !goldLine || !poTitle || !finalEl) return;

    /* Convergence deltas — every word has a destination: the exact centre,
       where the Private Office will emerge. Nothing drifts off-screen. */
    const W = pin.offsetWidth  || window.innerWidth;
    const H = pin.offsetHeight || window.innerHeight;
    CHAOS_ITEMS.forEach((item, i) => {
      const word = words[i];
      if (!word) return;
      word.dataset.dx = String(Math.round(((50 - item.left) / 100) * W));
      word.dataset.dy = String(Math.round(((50 - item.top)  / 100) * H));
    });

    /* ── Initial states ── */
    gsap.set(words,    { opacity: 0 });
    gsap.set(chaosLbl, { opacity: 0 });
    gsap.set(goldLine, { scaleX: 0, opacity: 0, transformOrigin: "center center" });
    gsap.set(poTitle,  { opacity: 0, y: 6 });
    pillarsEls.forEach((el) => gsap.set(el, { opacity: 0, y: 8 }));
    gsap.set(finalEl,  { opacity: 0, y: 12 });

    /* ── The chaos is ALIVE — words behave like slow molecules.
       Each inner element drifts on its own infinite, restrained loop so
       paths cross and opacities breathe. Frozen during the silence. ── */
    const ambient: gsap.core.Tween[] = [];
    inners.forEach((inner, i) => {
      const item = CHAOS_ITEMS[i];
      gsap.set(inner, { rotation: item?.rot ?? 0, opacity: 1 });
      const dirX = i % 2 === 0 ? 1 : -1;
      const dirY = i % 3 === 0 ? 1 : -1;
      const ax = 9 + (i % 4) * 4;          // 9–21px
      const ay = 7 + (i % 3) * 5;          // 7–17px
      const dur = 7.5 + (i % 5) * 1.1;     // 7.5–11.9s
      ambient.push(
        gsap.to(inner, {
          x: dirX * ax,
          y: dirY * ay,
          rotation: (item?.rot ?? 0) + (i % 2 ? 1.4 : -1.4),
          duration: dur,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: (i % 5) * 0.45,
        }),
      );
      // Roughly half the words also breathe in opacity
      if (i % 2 === 0) {
        ambient.push(
          gsap.to(inner, {
            opacity: 0.6,
            duration: dur * 0.75,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: (i % 3) * 0.5,
          }),
        );
      }
    });

    /* silenceProgress is filled in once the timeline is built; the freeze
       holds from the silence onward (words are leaving after that anyway). */
    let silenceProgress = 1;
    let frozen = false;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=480%",
        pin: true,
        scrub: 0.4,
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

    /* ── ACT 1 · REALIZATION — the headline simply holds ── */
    tl.to({}, { duration: 0.09 });
    tl.to(screen1, { opacity: 0, y: -12, duration: 0.06, ease: "power2.in" });

    /* ── ACT 2 · CHAOS — the fragments flood in, alive and drifting ── */
    tl.to(words, {
      opacity: (i: number) => CHAOS_ITEMS[i]?.op ?? 0.3,
      duration: 0.13,
      stagger: 0.006,
      ease: "power1.out",
    });
    tl.to(chaosLbl, { opacity: 1, duration: 0.06, ease: "power1.out" });
    tl.to({}, { duration: 0.05 });

    /* ── ACT 2½ · SILENCE — everything freezes. Held. No movement. ── */
    const freezeStartTime = tl.duration();
    tl.to({}, { duration: 0.17 });

    /* ── ACT 3 · GRAVITY — fragments are pulled to centre, one by one.
       Each travels at full presence and is absorbed only at the centre. ── */
    tl.to(chaosLbl, { opacity: 0, duration: 0.03 });
    words.forEach((word, i) => {
      tl.to(
        word,
        {
          x: Number(word.dataset.dx ?? 0),
          y: Number(word.dataset.dy ?? 0),
          scale: 0.32,
          duration: 0.032,
          ease: "power2.in",
        },
        i === 0 ? ">" : ">-0.013",
      );
      tl.to(word, { opacity: 0, duration: 0.014, ease: "power1.in" }, "<0.017");
    });

    /* ── ACT 4 · RELIEF — empty screen, then a product-launch reveal ── */
    tl.to({}, { duration: 0.08 });                                   // empty, held
    tl.to(goldLine, { opacity: 1, scaleX: 1, duration: 0.07, ease: "power2.out" });
    tl.to({}, { duration: 0.05 });                                   // pause
    tl.to(poTitle, { opacity: 1, y: 0, duration: 0.07, ease: "power2.out" });
    tl.to({}, { duration: 0.06 });                                   // pause before pillars

    pillarsEls.forEach((el) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.045, ease: "power2.out" });
      tl.to({}, { duration: 0.03 });                                 // breath between each
    });
    tl.to({}, { duration: 0.06 });

    /* ── ACT 5 · THE PAYOFF — everything clears for one statement ── */
    tl.to([goldLine, poTitle, ...Array.from(pillarsEls)], {
      opacity: 0,
      y: -6,
      duration: 0.07,
      ease: "power2.in",
    });
    tl.to(finalEl, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" });
    tl.to({}, { duration: 0.18 });                                   // long emotional hold

    /* ── Continuous narrative — the statement recedes so the next chapter
       ("Every property has two stories.") rises on the same ivory. ── */
    tl.to(finalEl, { opacity: 0, y: -10, duration: 0.06, ease: "power2.in" });

    /* Now that the full timeline exists, anchor the freeze to its progress. */
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
    /* Single pinned section — full viewport, ivory (matches the next chapter) */
    <div ref={ref} className="relative h-svh w-full overflow-hidden bg-[#F5F0E8]">
      {/* ── ACT 1 · Headline ── */}
      <div
        data-screen1
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <h2 className="font-serif text-[2.5rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3.5rem] lg:text-[4.4rem]">
          One Property.
          <br />
          Too Many Conversations.
        </h2>
        <p className="mx-auto mt-7 max-w-[32ch] text-[0.95rem] font-light leading-[1.95] tracking-[0.005em] text-[#1a1a1a]/30 md:mt-8 md:text-[1rem]">
          Buying a property isn&apos;t one decision. It&apos;s hundreds of
          conversations, documents and opinions — scattered across different
          people.
        </p>
      </div>

      {/* ── ACT 2 · Chaos fragments (full-screen, living) ── */}
      {CHAOS_ITEMS.map((item, i) => (
        <span
          key={`${item.text}-${i}`}
          data-word
          className="pointer-events-none absolute select-none"
          style={{ left: `${item.left}%`, top: `${item.top}%` }}
        >
          <span
            data-word-inner
            className="block font-light text-[#1a1a1a]"
            style={{ fontSize: item.fs, letterSpacing: "0.015em" }}
          >
            {item.text}
          </span>
        </span>
      ))}

      {/* Chaos label */}
      <div
        data-chaos-lbl
        className="pointer-events-none absolute bottom-[11%] left-0 right-0 text-center"
      >
        <p className="font-serif text-[1rem] italic tracking-[0.01em] text-[#1a1a1a]/25 md:text-[1.1rem]">
          Everything important lives somewhere else.
        </p>
      </div>

      {/* ── ACT 4 · Resolution — gold line, title, five pillars ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          data-gold-line
          className="h-px w-10 bg-[#c9a96e]/70"
          style={{ transformOrigin: "center center" }}
        />

        <p
          data-po-title
          className="mt-6 text-[10px] font-medium uppercase tracking-[0.42em] text-[#c9a96e]"
        >
          Your Private Office
        </p>

        <div className="mt-11 flex flex-col items-center gap-7 md:mt-12 md:gap-9">
          {PILLARS.map((pillar) => (
            <p
              key={pillar}
              data-pillar
              className="font-serif text-[1.15rem] font-light tracking-[0.005em] text-[#1a1a1a]/55 md:text-[1.5rem]"
            >
              {pillar}
            </p>
          ))}
        </div>
      </div>

      {/* ── ACT 5 · Final statement — alone, then recedes into the next chapter ── */}
      <div
        data-final
        className="absolute inset-0 flex items-center justify-center px-6 text-center"
      >
        <p className="font-serif text-[2.6rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.4rem]">
          Everything important.
          <br />
          One place.
        </p>
      </div>
    </div>
  );
}
