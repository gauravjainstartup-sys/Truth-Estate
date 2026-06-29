"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ════════════════════════════════════════════════════════════════
   THE BUYER'S JOURNEY — a calligraphic scroll-film.
   An NRI couple, drawn as one line. Their mouths morph from a smile to
   worry as the noise — a fine ink tangle — draws in around them. The
   villain is never a person; it is promises without proof, and distance.
   At the turn, the tangle unravels into a single clean gold line: proof.

   One pinned, scrubbed timeline drives every beat, so the emotion is
   identical on desktop and mobile — only the layout reflows.
   ════════════════════════════════════════════════════════════════ */

const STAGES = [
  { k: "01", emo: "Hopeful",               hero: "A home, back home.",   whisper: "The dream that started it all." },
  { k: "02", emo: "Overwhelmed",           hero: "A thousand listings.", whisper: "None you can trust from here." },
  { k: "03", emo: "Torn",                  hero: "A hundred opinions.",  whisper: "Family, friends, the whole internet." },
  { k: "04", emo: "Skeptical",             hero: "Endless promises.",    whisper: "Not one of them proven." },
  { k: "05", emo: "Anxious",               hero: "An ocean away.",       whisper: "Too far to check. Too much to trust." },
  { k: "06", emo: "Clarity · Confidence",  hero: "Finally — proof.",     whisper: "One office. Every claim, verified." },
];

/* Per-stage choreography */
const MOUTH = [12, 5, 1, -6, -11, 11];     // control offset: + smile, − frown
const DRIFT = [0, 0, 2, 5, 12, -3];        // heads drift apart, then back together
const BG    = ["#F3EDE3", "#EFE8DD", "#E9E1D4", "#E2DACB", "#D9D2C6", "#F8F5EF"];
const TANGLE_BY_STAGE: number[][] = [[], [0, 1], [2, 3], [4, 5], [6, 7], []];

/* Hand-authored ink scribbles — the noise, in SVG space (0 0 440 340) */
const TANGLES = [
  "M60 95 C120 62 165 120 112 150 C72 174 132 200 182 176",
  "M380 95 C322 62 278 120 330 150 C372 174 312 202 262 182",
  "M72 252 C142 232 182 282 132 300 C102 312 172 312 212 296",
  "M372 252 C302 232 262 286 322 300 C352 308 302 316 250 300",
  "M120 60 C200 40 262 50 322 72 C350 82 300 110 250 96",
  "M92 182 C142 162 152 212 102 222 C72 228 122 242 162 232",
  "M352 182 C302 162 292 216 342 226 C366 232 322 246 282 236",
  "M150 300 C210 286 250 300 300 290 C220 270 300 250 250 300",
];
const CLEAN = "M95 256 C180 236 262 236 347 256";

const mouth = (cx: number, k: number) => `M ${cx - 13} 172 Q ${cx} ${172 + k} ${cx + 13} 172`;

const PROOFS = [
  { k: "Financial Health", v: "Strong" },
  { k: "RERA Compliance",  v: "Verified" },
  { k: "Litigation Check", v: "Clear" },
  { k: "Construction",     v: "On Track" },
];

export default function BuyerJourneySection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = ref.current;
    if (!pin) return;

    gsap.registerPlugin(ScrollTrigger);

    const bgEl    = pin.querySelector<HTMLElement>("[data-bg]")!;
    const svgWrap = pin.querySelector<HTMLElement>("[data-svgwrap]")!;
    const personL = pin.querySelector<SVGGElement>("[data-person='L']")!;
    const personR = pin.querySelector<SVGGElement>("[data-person='R']")!;
    const mouthL  = pin.querySelector<SVGPathElement>("[data-mouth='L']")!;
    const mouthR  = pin.querySelector<SVGPathElement>("[data-mouth='R']")!;
    const tangles = Array.from(pin.querySelectorAll<SVGPathElement>("[data-tangle]"));
    const clean   = pin.querySelector<SVGPathElement>("[data-clean]")!;
    const copy    = Array.from(pin.querySelectorAll<HTMLElement>("[data-copy]"));
    const emo     = Array.from(pin.querySelectorAll<HTMLElement>("[data-emo]"));
    const office  = pin.querySelector<HTMLElement>("[data-officewrap]")!;
    const officeEls = Array.from(pin.querySelectorAll<HTMLElement>("[data-office]"));

    /* Prime the ink: dash each scribble + the clean line so they can draw on */
    const len = (p: SVGPathElement) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      p.style.strokeDashoffset = `${L}`;
      return L;
    };
    const tLens = tangles.map(len);
    len(clean);

    /* Initial states — stage 0 (the dream) is live */
    gsap.set(bgEl, { backgroundColor: BG[0] });
    copy.forEach((c, i) => gsap.set(c, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 8 }));
    emo.forEach((e, i) => gsap.set(e, { opacity: i === 0 ? 1 : 0 }));
    gsap.set(office, { opacity: 0, y: 14 });
    gsap.set(mouthL, { attr: { d: mouth(180, MOUTH[0]) } });
    gsap.set(mouthR, { attr: { d: mouth(260, MOUTH[0]) } });

    let cur = 0;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=680%",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
      },
    });

    /* A noise beat (stages 1–4): copy reflows, mouths fall, ink draws in. */
    const go = (iTo: number, hold = 0.1) => {
      tl.to(copy[cur], { opacity: 0, y: -8, duration: 0.045 });
      tl.to(emo[cur],  { opacity: 0, duration: 0.045 }, "<");
      tl.to(bgEl, { backgroundColor: BG[iTo], duration: 0.09 }, "<");
      tl.to(mouthL, { attr: { d: mouth(180, MOUTH[iTo]) }, duration: 0.07, ease: "power1.inOut" }, "<");
      tl.to(mouthR, { attr: { d: mouth(260, MOUTH[iTo]) }, duration: 0.07, ease: "power1.inOut" }, "<");
      tl.to(personL, { x: -DRIFT[iTo], duration: 0.08, ease: "power1.inOut" }, "<");
      tl.to(personR, { x:  DRIFT[iTo], duration: 0.08, ease: "power1.inOut" }, "<");
      TANGLE_BY_STAGE[iTo].forEach((idx) => {
        tl.to(tangles[idx], { strokeDashoffset: 0, duration: 0.09, ease: "power1.inOut" }, "<");
      });
      tl.to(copy[iTo], { opacity: 1, y: 0, duration: 0.05 });
      tl.to(emo[iTo],  { opacity: 1, duration: 0.05 }, "<");
      tl.to({}, { duration: hold });
      cur = iTo;
    };

    tl.to({}, { duration: 0.07 });   // hold the dream
    go(1);                            // a thousand listings
    go(2);                            // a hundred opinions
    go(3);                            // endless promises
    go(4, 0.14);                      // an ocean away — densest, held

    /* ── THE TURN — the tangle unravels into one clean gold line ── */
    tl.to(copy[4], { opacity: 0, y: -8, duration: 0.05 });
    tl.to(emo[4],  { opacity: 0, duration: 0.05 }, "<");
    tl.to(bgEl, { backgroundColor: BG[5], duration: 0.14, ease: "power1.inOut" }, "<");
    tl.to(mouthL, { attr: { d: mouth(180, MOUTH[5]) }, duration: 0.1, ease: "power2.out" }, "<");
    tl.to(mouthR, { attr: { d: mouth(260, MOUTH[5]) }, duration: 0.1, ease: "power2.out" }, "<");
    tl.to(personL, { x: -DRIFT[5], duration: 0.1, ease: "power2.out" }, "<");
    tl.to(personR, { x:  DRIFT[5], duration: 0.1, ease: "power2.out" }, "<");
    tangles.forEach((p, i) => {
      tl.to(p, { strokeDashoffset: tLens[i], duration: 0.11, ease: "power1.inOut" }, i ? "<0.004" : "<");
    });
    tl.to(clean, { strokeDashoffset: 0, duration: 0.13, ease: "power2.out" });

    tl.to(copy[5], { opacity: 1, y: 0, duration: 0.06 });
    tl.to(emo[5],  { opacity: 1, duration: 0.06 }, "<");
    tl.to(office, { opacity: 1, y: 0, duration: 0.07 }, "<0.02");
    tl.fromTo(officeEls, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.05, stagger: 0.025, ease: "power2.out" }, "<0.02");
    tl.to({}, { duration: 0.2 });    // hold the payoff

    /* Hand off to ExperienceSection (#0a0a0a) */
    tl.to([copy[5], emo[5], office, svgWrap], { opacity: 0, y: -10, duration: 0.07, ease: "power2.in" });
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

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 md:flex-row md:items-center md:px-10">
        {/* ─────────── THE COUPLE (calligraphy) + emotion ─────────── */}
        <div data-svgwrap className="flex h-[50%] w-full flex-col items-center justify-end md:h-full md:w-[54%] md:justify-center">
          <svg viewBox="0 0 440 340" className="h-auto w-full max-w-[460px]" aria-hidden="true">
            <g
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* shared shoulder line — togetherness */}
              <path d="M120 306 C150 252 200 246 220 246 C240 246 290 252 320 306" strokeWidth={2.2} />

              {/* the ink tangle (noise) */}
              {TANGLES.map((d, i) => (
                <path key={i} data-tangle d={d} strokeWidth={1.4} stroke="#1a1a1a" strokeOpacity={0.5} />
              ))}

              {/* the one clean line — proof — gold */}
              <path data-clean d={CLEAN} stroke="#c9a96e" strokeWidth={2.4} />

              {/* person L */}
              <g data-person="L">
                <circle cx={180} cy={150} r={46} />
                <path d="M138 120 C150 92 212 92 222 120" strokeWidth={1.8} />
                <circle cx={168} cy={148} r={3} fill="#1a1a1a" stroke="none" />
                <circle cx={193} cy={148} r={3} fill="#1a1a1a" stroke="none" />
                <path data-mouth="L" d={mouth(180, 12)} strokeWidth={2} />
              </g>

              {/* person R */}
              <g data-person="R">
                <circle cx={260} cy={150} r={46} />
                <path d="M220 118 C234 98 286 98 302 122" strokeWidth={1.8} />
                <circle cx={248} cy={148} r={3} fill="#1a1a1a" stroke="none" />
                <circle cx={273} cy={148} r={3} fill="#1a1a1a" stroke="none" />
                <path data-mouth="R" d={mouth(260, 12)} strokeWidth={2} />
              </g>
            </g>
          </svg>

          {/* emotion tags */}
          <div className="relative mt-3 h-7 w-full md:mt-6">
            {STAGES.map((s, i) => (
              <span
                key={s.emo}
                data-emo
                className="absolute inset-x-0 text-center text-[0.72rem] font-light uppercase tracking-[0.32em] text-[#c9a96e]"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                {s.emo}
              </span>
            ))}
          </div>
        </div>

        {/* ─────────── THE NARRATIVE (right / bottom) ─────────── */}
        <div className="relative flex h-[50%] w-full items-center justify-center md:h-full md:w-[46%] md:justify-start">
          <div className="relative h-[10rem] w-full max-w-md">
            {STAGES.map((s, i) => (
              <div
                key={s.hero}
                data-copy
                className="absolute inset-x-0 top-0 text-center md:text-left"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <p className="text-[10px] font-medium tracking-[0.4em] text-[#1a1a1a]/30">{s.k}</p>
                <h2 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3rem] lg:text-[3.6rem]">
                  {s.hero}
                </h2>
                <p className="mt-4 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/45">
                  {s.whisper}
                </p>
              </div>
            ))}

            {/* Buyer Office — the payoff, revealed at clarity */}
            <div
              data-officewrap
              className="absolute inset-x-0 top-[7.5rem] mx-auto w-full max-w-sm rounded-2xl border border-[#1a1a1a]/8 bg-white/75 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.07)] backdrop-blur-md"
              style={{ opacity: 0 }}
            >
              <div data-office className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/35">Verdict</p>
                  <p className="font-serif text-[1.7rem] font-semibold leading-none text-[#1e6b45]">Proceed</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/35">Confidence</p>
                  <p className="font-serif text-[1.7rem] font-extralight leading-none text-[#1a1a1a]/85">92%</p>
                </div>
              </div>
              <div data-office className="mt-4 grid grid-cols-2 gap-x-5 gap-y-1.5 border-t border-[#1a1a1a]/8 pt-4">
                {PROOFS.map((p) => (
                  <div key={p.k} className="flex items-center justify-between">
                    <span className="text-[0.66rem] font-light text-[#1a1a1a]/50">{p.k}</span>
                    <span className="text-[0.66rem] font-medium text-[#1e6b45]">{p.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
