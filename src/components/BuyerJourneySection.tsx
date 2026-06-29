"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ════════════════════════════════════════════════════════════════
   THE BUYER'S JOURNEY — a calligraphic scroll-film.
   An NRI couple, drawn in line-art. Their mouths morph from a smile to
   worry as a fine ink tangle draws in around them. The villain is never
   a person — it is promises without proof, and distance. At the turn,
   the tangle unravels into one clean gold line: proof. Then the relief
   reveals slowly, one idea at a time, ending on a quiet verdict.

   One pinned, scrubbed timeline drives every beat, so the emotion is
   identical on desktop and mobile — only the layout reflows.
   ════════════════════════════════════════════════════════════════ */

const PROBLEM = [
  { k: "01", emo: "Hopeful",     hero: "A home, back home.",   whisper: "The dream that started it all." },
  { k: "02", emo: "Overwhelmed", hero: "A thousand listings.", whisper: "None you can trust from here." },
  { k: "03", emo: "Torn",        hero: "A hundred opinions.",  whisper: "Family, friends, the whole internet." },
  { k: "04", emo: "Skeptical",   hero: "Endless promises.",    whisper: "Not one of them proven." },
  { k: "05", emo: "Anxious",     hero: "An ocean away.",       whisper: "Too far to check. Too much to trust." },
];

const MANIFESTO = [
  "A partner who works only for you.",
  "Proof, where promises used to be.",
  "Everything, in writing.",
];

const PROOFS = [
  { k: "Financial Health", v: "Strong" },
  { k: "RERA Compliance",  v: "Verified" },
  { k: "Litigation Check", v: "Clear" },
  { k: "Construction",     v: "On Track" },
];

/* Per-stage choreography (problem stages 0–4) */
const MOUTH = [11, 5, 1, -6, -11];     // + smile, − frown
const MOUTH_CALM = 10;
const DRIFT = [0, 0, 2, 5, 12];        // heads drift apart under stress
const DRIFT_TOGETHER = -3;             // and back together at clarity
const BG = ["#F3EDE3", "#EFE8DD", "#E9E1D4", "#E2DACB", "#D9D2C6"];
const BRIGHT = "#F8F5EF";
const TANGLE_BY_STAGE: number[][] = [[], [0, 1], [2, 3], [4, 5], [6, 7]];

const TANGLES = [
  "M60 100 C120 66 165 124 112 154 C72 178 132 204 182 180",
  "M380 100 C322 66 278 124 330 154 C372 178 312 206 262 186",
  "M72 256 C142 236 182 286 132 304 C102 316 172 316 212 300",
  "M372 256 C302 236 262 290 322 304 C352 312 302 320 250 304",
  "M120 64 C200 44 262 54 322 76 C350 86 300 114 250 100",
  "M92 186 C142 166 152 216 102 226 C72 232 122 246 162 236",
  "M352 186 C302 166 292 220 342 230 C366 236 322 250 282 240",
  "M150 304 C210 290 250 304 300 294 C220 274 300 254 250 304",
];
const CLEAN = "M95 232 C180 214 260 214 345 232";

const mouth = (cx: number, k: number) => `M ${cx - 10} 174 Q ${cx} ${174 + k} ${cx + 10} 174`;

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
    const relief  = pin.querySelector<HTMLElement>("[data-relief]")!;
    const manifesto = pin.querySelector<HTMLElement>("[data-manifesto]")!;
    const maniEls = Array.from(pin.querySelectorAll<HTMLElement>("[data-mani]"));
    const verdict = pin.querySelector<HTMLElement>("[data-verdict]")!;
    const vEls    = Array.from(pin.querySelectorAll<HTMLElement>("[data-vitem]"));

    const len = (p: SVGPathElement) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      p.style.strokeDashoffset = `${L}`;
      return L;
    };
    const tLens = tangles.map(len);
    len(clean);

    /* Initial — the dream */
    gsap.set(bgEl, { backgroundColor: BG[0] });
    copy.forEach((c, i) => gsap.set(c, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 8 }));
    emo.forEach((e, i) => gsap.set(e, { opacity: i === 0 ? 1 : 0 }));
    gsap.set([relief, manifesto, verdict], { opacity: 0, y: 10 });
    gsap.set(mouthL, { attr: { d: mouth(180, MOUTH[0]) } });
    gsap.set(mouthR, { attr: { d: mouth(260, MOUTH[0]) } });

    let cur = 0;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: pin, start: "top top", end: "+=820%", pin: true, scrub: 0.5, anticipatePin: 1 },
    });

    /* A problem beat: copy reflows, mouths fall, ink draws in. */
    const go = (iTo: number, hold = 0.1) => {
      tl.to(copy[cur], { opacity: 0, y: -8, duration: 0.04 });
      tl.to(emo[cur],  { opacity: 0, duration: 0.04 }, "<");
      tl.to(bgEl, { backgroundColor: BG[iTo], duration: 0.08 }, "<");
      tl.to(mouthL, { attr: { d: mouth(180, MOUTH[iTo]) }, duration: 0.07, ease: "power1.inOut" }, "<");
      tl.to(mouthR, { attr: { d: mouth(260, MOUTH[iTo]) }, duration: 0.07, ease: "power1.inOut" }, "<");
      tl.to(personL, { x: -DRIFT[iTo], duration: 0.08, ease: "power1.inOut" }, "<");
      tl.to(personR, { x:  DRIFT[iTo], duration: 0.08, ease: "power1.inOut" }, "<");
      TANGLE_BY_STAGE[iTo].forEach((idx) => tl.to(tangles[idx], { strokeDashoffset: 0, duration: 0.09, ease: "power1.inOut" }, "<"));
      tl.to(copy[iTo], { opacity: 1, y: 0, duration: 0.05 });
      tl.to(emo[iTo],  { opacity: 1, duration: 0.05 }, "<");
      tl.to({}, { duration: hold });
      cur = iTo;
    };

    tl.to({}, { duration: 0.07 });
    go(1); go(2); go(3); go(4, 0.14);

    /* ── THE TURN — the tangle unravels into one clean gold line.
       The relief copy arrives AS the line resolves, so the right is
       never empty. ── */
    tl.to(copy[4], { opacity: 0, y: -8, duration: 0.05 });
    tl.to(emo[4],  { opacity: 0, duration: 0.05 }, "<");
    tl.to(bgEl, { backgroundColor: BRIGHT, duration: 0.16, ease: "power1.inOut" }, "<");
    tl.to(mouthL, { attr: { d: mouth(180, MOUTH_CALM) }, duration: 0.12, ease: "power2.out" }, "<");
    tl.to(mouthR, { attr: { d: mouth(260, MOUTH_CALM) }, duration: 0.12, ease: "power2.out" }, "<");
    tl.to(personL, { x: -DRIFT_TOGETHER, duration: 0.12, ease: "power2.out" }, "<");
    tl.to(personR, { x:  DRIFT_TOGETHER, duration: 0.12, ease: "power2.out" }, "<");
    tangles.forEach((p, i) => tl.to(p, { strokeDashoffset: tLens[i], duration: 0.12, ease: "power1.inOut" }, i ? "<0.004" : "<"));
    tl.to(clean, { strokeDashoffset: 0, duration: 0.16, ease: "power2.out" }, "<0.04");
    tl.to(emo[5], { opacity: 1, duration: 0.08 }, "<0.04");          // CLARITY tag (stays)
    tl.to(relief, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" }, "<0.02"); // fills the right
    tl.to({}, { duration: 0.16 });                                    // let the relief land

    /* ── THE OFFICE — a quiet manifesto, one idea at a time ── */
    tl.to(relief, { opacity: 0, y: -10, duration: 0.06, ease: "power2.in" });
    tl.to(manifesto, { opacity: 1, y: 0, duration: 0.05 });
    tl.fromTo(maniEls, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.06, stagger: 0.08, ease: "power2.out" }, "<0.02");
    tl.to({}, { duration: 0.18 });

    /* ── THE VERDICT — calm, editorial, no card ── */
    tl.to(manifesto, { opacity: 0, y: -10, duration: 0.06, ease: "power2.in" });
    tl.to(verdict, { opacity: 1, y: 0, duration: 0.05 });
    tl.fromTo(vEls, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.05, stagger: 0.04, ease: "power2.out" }, "<0.02");
    tl.to({}, { duration: 0.2 });

    /* Hand off to ExperienceSection (#0a0a0a) */
    tl.to([verdict, emo[5], svgWrap], { opacity: 0, y: -10, duration: 0.07, ease: "power2.in" });
    tl.to(bgEl, { backgroundColor: "#0a0a0a", duration: 0.08 }, "<");

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => { st?.kill(true); tl.kill(); };
  }, []);

  return (
    <div ref={ref} className="relative h-svh w-full overflow-hidden">
      <div data-bg className="absolute inset-0" style={{ backgroundColor: BG[0] }} />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 md:flex-row md:items-center md:px-10">
        {/* ─────────── THE COUPLE (calligraphy) + emotion ─────────── */}
        <div data-svgwrap className="flex h-[46%] w-full flex-col items-center justify-end md:h-full md:w-[52%] md:justify-center">
          <svg viewBox="0 0 440 360" className="h-auto w-full max-w-[440px]" aria-hidden="true">
            <g fill="none" stroke="#1a1a1a" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              {/* shoulders — togetherness */}
              <path d="M120 330 C152 264 200 258 220 258 C240 258 288 264 320 330" strokeWidth={2} />

              {/* the ink tangle (noise) */}
              {TANGLES.map((d, i) => (
                <path key={i} data-tangle d={d} strokeWidth={1.3} strokeOpacity={0.55} />
              ))}

              {/* the one clean line — proof — gold */}
              <path data-clean d={CLEAN} stroke="#c9a96e" strokeWidth={2.4} />

              {/* person L — fuller hair */}
              <g data-person="L">
                <ellipse cx={180} cy={150} rx={40} ry={48} />
                <path d="M140 150 C130 96 230 96 220 150" strokeWidth={1.7} />
                <path d="M142 152 C138 176 142 191 152 199" strokeWidth={1.5} />
                <path d="M218 152 C222 176 218 191 208 199" strokeWidth={1.5} />
                <path d="M162 146 Q167 149 172 146" strokeWidth={1.7} />
                <path d="M188 146 Q193 149 198 146" strokeWidth={1.7} />
                <path d="M161 135 Q167 132 173 134" strokeWidth={1.5} />
                <path d="M187 134 Q193 132 199 135" strokeWidth={1.5} />
                <path d="M180 151 C178 159 177 163 183 163" strokeWidth={1.5} />
                <path data-mouth="L" d={mouth(180, 11)} strokeWidth={2} />
              </g>

              {/* person R — short hair */}
              <g data-person="R">
                <ellipse cx={260} cy={150} rx={40} ry={48} />
                <path d="M226 146 C234 108 286 108 294 147" strokeWidth={1.7} />
                <path d="M244 146 Q249 149 254 146" strokeWidth={1.7} />
                <path d="M268 146 Q273 149 278 146" strokeWidth={1.7} />
                <path d="M243 135 Q249 132 255 134" strokeWidth={1.5} />
                <path d="M267 134 Q273 132 279 135" strokeWidth={1.5} />
                <path d="M260 151 C258 159 257 163 263 163" strokeWidth={1.5} />
                <path data-mouth="R" d={mouth(260, 11)} strokeWidth={2} />
              </g>
            </g>
          </svg>

          <div className="relative mt-3 h-7 w-full md:mt-6">
            {[...PROBLEM.map((s) => s.emo), "Clarity · Confidence"].map((e, i) => (
              <span
                key={e}
                data-emo
                className="absolute inset-x-0 text-center text-[0.72rem] font-light uppercase tracking-[0.32em] text-[#c9a96e]"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* ─────────── THE NARRATIVE (right / bottom) ─────────── */}
        <div className="relative flex h-[54%] w-full items-center justify-center md:h-full md:w-[48%] md:justify-start">
          <div className="relative min-h-[15rem] w-full max-w-md">
            {/* Problem stages */}
            {PROBLEM.map((s, i) => (
              <div key={s.hero} data-copy className="absolute inset-x-0 top-0 text-center md:text-left" style={{ opacity: i === 0 ? 1 : 0 }}>
                <p className="text-[10px] font-medium tracking-[0.4em] text-[#1a1a1a]/30">{s.k}</p>
                <h2 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3rem] lg:text-[3.6rem]">{s.hero}</h2>
                <p className="mt-4 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/45">{s.whisper}</p>
              </div>
            ))}

            {/* Relief */}
            <div data-relief className="absolute inset-x-0 top-0 text-center md:text-left" style={{ opacity: 0 }}>
              <p className="text-[10px] font-medium tracking-[0.4em] text-[#1a1a1a]/30">06</p>
              <h2 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3rem] lg:text-[3.6rem]">Finally — proof.</h2>
              <p className="mt-4 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/45">One office changes everything.</p>
            </div>

            {/* Manifesto — revealed one line at a time */}
            <div data-manifesto className="absolute inset-x-0 top-0 text-center md:text-left" style={{ opacity: 0 }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">The Truth Estate Office</p>
              <div className="mt-6 space-y-5">
                {MANIFESTO.map((m) => (
                  <p key={m} data-mani className="font-serif text-[1.4rem] font-light leading-[1.25] text-[#1a1a1a]/85 md:text-[1.7rem]">{m}</p>
                ))}
              </div>
            </div>

            {/* Verdict — editorial, no card */}
            <div data-verdict className="absolute inset-x-0 top-0 text-center md:text-left" style={{ opacity: 0 }}>
              <p data-vitem className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Independent Verdict</p>
              <div data-vitem className="mt-5 flex items-baseline justify-center gap-4 md:justify-start">
                <span className="font-serif text-[2.6rem] font-semibold leading-none text-[#1e6b45] md:text-[3.2rem]">Proceed</span>
                <span className="font-serif text-[1.5rem] font-extralight leading-none text-[#1a1a1a]/55">92%</span>
              </div>
              <div className="mt-7 space-y-2.5 border-t border-[#1a1a1a]/10 pt-6">
                {PROOFS.map((p) => (
                  <div key={p.k} data-vitem className="flex items-center justify-between">
                    <span className="text-[0.82rem] font-light text-[#1a1a1a]/55">{p.k}</span>
                    <span className="flex items-center gap-1.5 text-[0.82rem] font-medium text-[#1e6b45]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {p.v}
                    </span>
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
