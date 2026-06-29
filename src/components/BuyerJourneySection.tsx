"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ════════════════════════════════════════════════════════════════
   THE BUYER'S JOURNEY — a calligraphic scroll-film.
   An NRI family of four, nestled together, drawn in line-art. Their
   faces morph from hope to worry to calm as a fine ink tangle draws in
   around them; at the turn it unravels into one clean gold line — proof.
   The villain is never a person — only promises without proof, and
   distance. One pinned, scrubbed timeline → identical on every device.
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

/* Per-stage choreography (0–4 = problem, 5 = clarity) */
const BROW  = [-1, 1, 3, 4, 5, 0];   // inner brow rises with worry
const MOUTH = [9, 4, 1, -3, -7, 8];  // + smile, − frown
const BG = ["#F3EDE3", "#EFE8DD", "#E9E1D4", "#E2DACB", "#D9D2C6"];
const BRIGHT = "#F8F5EF";
const TANGLE_BY_STAGE: number[][] = [[], [0, 1], [2, 3], [4, 5], [6, 7]];

const TANGLES = [
  "M50 110 C100 80 140 120 105 150 C75 175 120 195 160 180",
  "M310 110 C260 80 220 120 255 150 C285 175 240 195 200 182",
  "M60 250 C110 230 150 270 110 290 C85 300 130 300 170 286",
  "M300 250 C250 230 210 272 250 290 C275 300 230 305 195 290",
  "M100 58 C160 40 220 50 270 72",
  "M70 182 C110 164 120 206 80 216",
  "M290 182 C250 164 240 208 280 218",
  "M130 300 C180 288 220 300 260 292",
];
const CLEAN = "M70 320 C150 312 210 312 290 320";

/* ── The family, parametrically (matches the approved concept) ── */
type Member = { cx: number; cy: number; s: number; hair: string; tilt: number };
const FAMILY: Member[] = [
  { cx: 146, cy: 130, s: 0.92, hair: "short", tilt: 6 },
  { cx: 216, cy: 128, s: 0.90, hair: "long",  tilt: -6 },
  { cx: 170, cy: 200, s: 0.58, hair: "tuft",  tilt: 5 },
  { cx: 198, cy: 202, s: 0.55, hair: "pony",  tilt: -5 },
];
const mk = (f: Member, i: number) => (i >= 2 ? 0.95 : 1); // kids morph a touch gentler
const browY = (f: Member) => f.cy - 19 * f.s;
const browLD = (f: Member, t: number) =>
  `M${f.cx - 22 * f.s} ${browY(f)} Q${f.cx - 14 * f.s} ${browY(f) - 3 * f.s} ${f.cx - 12 * f.s} ${browY(f) - t}`;
const browRD = (f: Member, t: number) =>
  `M${f.cx + 22 * f.s} ${browY(f)} Q${f.cx + 14 * f.s} ${browY(f) - 3 * f.s} ${f.cx + 12 * f.s} ${browY(f) - t}`;
const mouthD = (f: Member, k: number) => {
  const my = f.cy + 25 * f.s;
  return `M${f.cx - 10 * f.s} ${my} Q${f.cx} ${my + k} ${f.cx + 10 * f.s} ${my}`;
};

function faceMarkup(f: Member, i: number, bg: string) {
  const { cx, cy, s, hair } = f;
  const rx = 39 * s, ry = 48 * s;
  const eyeY = cy - 3 * s, noseY = cy + 11 * s, ex = 13 * s, ew = 5 * s;
  let h = "";
  if (hair === "long") {
    h += `<path d="M${cx - rx - 2} ${cy - 2 * s} C${cx - rx - 7} ${cy + 34 * s} ${cx - rx} ${cy + 58 * s} ${cx - rx + 10} ${cy + 66 * s}"/>`;
    h += `<path d="M${cx + rx + 2} ${cy - 2 * s} C${cx + rx + 7} ${cy + 34 * s} ${cx + rx} ${cy + 58 * s} ${cx + rx - 10} ${cy + 66 * s}"/>`;
  }
  h += `<ellipse data-head cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${bg}"/>`;
  if (hair === "short") {
    h += `<path d="M${cx - rx + 7} ${cy - 16 * s} C${cx - 26 * s} ${cy - ry - 3 * s} ${cx + 26 * s} ${cy - ry - 3 * s} ${cx + rx - 7} ${cy - 16 * s}"/>`;
  } else if (hair === "long") {
    h += `<path d="M${cx - rx + 3} ${cy - 6 * s} C${cx - 30 * s} ${cy - ry - 6 * s} ${cx + 30 * s} ${cy - ry - 6 * s} ${cx + rx - 3} ${cy - 6 * s}"/>`;
    h += `<path d="M${cx} ${cy - ry + 3 * s} C${cx - 6 * s} ${cy - 22 * s} ${cx - 7 * s} ${cy - 12 * s} ${cx - 5 * s} ${cy - 6 * s}"/>`;
  } else if (hair === "tuft") {
    h += `<path d="M${cx - 16 * s} ${cy - ry + 7 * s} C${cx - 7 * s} ${cy - ry - 9 * s} ${cx + 7 * s} ${cy - ry - 9 * s} ${cx + 16 * s} ${cy - ry + 7 * s}"/>`;
  } else if (hair === "pony") {
    h += `<path d="M${cx - 16 * s} ${cy - ry + 7 * s} C${cx - 7 * s} ${cy - ry - 9 * s} ${cx + 7 * s} ${cy - ry - 9 * s} ${cx + 16 * s} ${cy - ry + 7 * s}"/>`;
    h += `<path d="M${cx + rx - 3 * s} ${cy - 10 * s} C${cx + rx + 10 * s} ${cy - 6 * s} ${cx + rx + 12 * s} ${cy + 10 * s} ${cx + rx + 4 * s} ${cy + 22 * s}"/>`;
  }
  h += `<path data-bl="${i}" d="${browLD(f, BROW[0])}"/>`;
  h += `<path data-br="${i}" d="${browRD(f, BROW[0])}"/>`;
  h += `<path d="M${cx - ex - ew} ${eyeY} Q${cx - ex} ${eyeY - 3.4 * s} ${cx - ex + ew} ${eyeY} Q${cx - ex} ${eyeY + 2.8 * s} ${cx - ex - ew} ${eyeY} Z"/>`;
  h += `<path d="M${cx + ex - ew} ${eyeY} Q${cx + ex} ${eyeY - 3.4 * s} ${cx + ex + ew} ${eyeY} Q${cx + ex} ${eyeY + 2.8 * s} ${cx + ex - ew} ${eyeY} Z"/>`;
  h += `<circle cx="${cx - ex}" cy="${eyeY + 0.4 * s}" r="${1.5 * s}" fill="#1a1a1a"/>`;
  h += `<circle cx="${cx + ex}" cy="${eyeY + 0.4 * s}" r="${1.5 * s}" fill="#1a1a1a"/>`;
  h += `<path d="M${cx - 0.5 * s} ${eyeY + 5 * s} C${cx - 3 * s} ${noseY} ${cx - 3.5 * s} ${noseY + 3 * s} ${cx + 2 * s} ${noseY + 3.5 * s}"/>`;
  h += `<path data-mo="${i}" d="${mouthD(f, MOUTH[0] * mk(f, i))}"/>`;
  return `<g transform="rotate(${f.tilt} ${cx} ${cy})">${h}</g>`;
}
const FAMILY_MARKUP = FAMILY.map((f, i) => faceMarkup(f, i, BG[0])).join("");

export default function BuyerJourneySection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = ref.current;
    if (!pin) return;
    gsap.registerPlugin(ScrollTrigger);

    const bgEl   = pin.querySelector<HTMLElement>("[data-bg]")!;
    const fam    = pin.querySelector<SVGGElement>("[data-family]")!;
    const heads  = Array.from(fam.querySelectorAll<SVGElement>("[data-head]"));
    const bL = Array.from(fam.querySelectorAll<SVGPathElement>("[data-bl]"));
    const bR = Array.from(fam.querySelectorAll<SVGPathElement>("[data-br]"));
    const mo = Array.from(fam.querySelectorAll<SVGPathElement>("[data-mo]"));
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

    gsap.set(bgEl, { backgroundColor: BG[0] });
    copy.forEach((c, i) => gsap.set(c, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 8 }));
    emo.forEach((e, i) => gsap.set(e, { opacity: i === 0 ? 1 : 0 }));
    gsap.set([relief, manifesto, verdict], { opacity: 0, y: 10 });

    const setFaces = (st: number) => {
      FAMILY.forEach((f, i) => {
        tl.to(bL[i], { attr: { d: browLD(f, BROW[st]) }, duration: 0.07, ease: "power1.inOut" }, "<");
        tl.to(bR[i], { attr: { d: browRD(f, BROW[st]) }, duration: 0.07, ease: "power1.inOut" }, "<");
        tl.to(mo[i], { attr: { d: mouthD(f, MOUTH[st] * mk(f, i)) }, duration: 0.07, ease: "power1.inOut" }, "<");
      });
    };

    let cur = 0;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: pin, start: "top top", end: "+=820%", pin: true, scrub: 0.5, anticipatePin: 1 },
    });

    const go = (iTo: number, hold = 0.1) => {
      tl.to(copy[cur], { opacity: 0, y: -8, duration: 0.045 });
      tl.to(emo[cur],  { opacity: 0, duration: 0.045 }, "<");
      tl.to(bgEl,  { backgroundColor: BG[iTo], duration: 0.09 }, "<");
      tl.to(heads, { fill: BG[iTo], duration: 0.09 }, "<");
      setFaces(iTo);
      TANGLE_BY_STAGE[iTo].forEach((idx) => tl.to(tangles[idx], { strokeDashoffset: 0, duration: 0.09, ease: "power1.inOut" }, "<"));
      tl.to(copy[iTo], { opacity: 1, y: 0, duration: 0.05 });
      tl.to(emo[iTo],  { opacity: 1, duration: 0.05 }, "<");
      tl.to({}, { duration: hold });
      cur = iTo;
    };

    tl.to({}, { duration: 0.07 });
    go(1); go(2); go(3); go(4, 0.14);

    /* ── THE TURN — tangle unravels into the gold line, family calm ── */
    tl.to(copy[4], { opacity: 0, y: -8, duration: 0.05 });
    tl.to(emo[4],  { opacity: 0, duration: 0.05 }, "<");
    tl.to(bgEl,  { backgroundColor: BRIGHT, duration: 0.16, ease: "power1.inOut" }, "<");
    tl.to(heads, { fill: BRIGHT, duration: 0.16 }, "<");
    setFaces(5);
    tangles.forEach((p, i) => tl.to(p, { strokeDashoffset: tLens[i], duration: 0.12, ease: "power1.inOut" }, i ? "<0.004" : "<"));
    tl.to(clean, { strokeDashoffset: 0, duration: 0.16, ease: "power2.out" }, "<0.05");
    tl.to(emo[5], { opacity: 1, duration: 0.08 }, "<0.04");
    tl.to(relief, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" }, "<0.02");
    tl.to({}, { duration: 0.16 });

    /* ── THE OFFICE — a quiet manifesto, one line at a time ── */
    tl.to(relief, { opacity: 0, y: -10, duration: 0.06, ease: "power2.in" });
    tl.to(manifesto, { opacity: 1, y: 0, duration: 0.05 });
    tl.fromTo(maniEls, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.06, stagger: 0.08, ease: "power2.out" }, "<0.02");
    tl.to({}, { duration: 0.18 });

    /* ── THE VERDICT — calm, editorial ── */
    tl.to(manifesto, { opacity: 0, y: -10, duration: 0.06, ease: "power2.in" });
    tl.to(verdict, { opacity: 1, y: 0, duration: 0.05 });
    tl.fromTo(vEls, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.05, stagger: 0.04, ease: "power2.out" }, "<0.02");
    tl.to({}, { duration: 0.2 });

    /* Hand off to ExperienceSection (#0a0a0a) */
    tl.to([verdict, emo[5], fam, clean], { opacity: 0, y: -10, duration: 0.07, ease: "power2.in" });
    tl.to(bgEl, { backgroundColor: "#0a0a0a", duration: 0.08 }, "<");

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => { st?.kill(true); tl.kill(); };
  }, []);

  return (
    <div ref={ref} className="relative h-svh w-full overflow-hidden">
      <div data-bg className="absolute inset-0" style={{ backgroundColor: BG[0] }} />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 md:flex-row md:items-center md:px-10">
        {/* ── The family + emotion ── */}
        <div className="flex h-[48%] w-full flex-col items-center justify-end md:h-full md:w-[52%] md:justify-center">
          <svg viewBox="0 0 360 380" className="h-auto w-full max-w-[380px]" aria-hidden="true">
            <g data-tangle-g fill="none" stroke="#1a1a1a" strokeOpacity={0.5} strokeWidth={1.4} strokeLinecap="round">
              {TANGLES.map((d, i) => <path key={i} data-tangle d={d} />)}
            </g>
            <path data-clean d={CLEAN} fill="none" stroke="#c9a96e" strokeWidth={2.4} strokeLinecap="round" />
            <g
              data-family
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: FAMILY_MARKUP }}
            />
          </svg>
          <div className="relative mt-3 h-7 w-full md:mt-6">
            {[...PROBLEM.map((s) => s.emo), "Clarity · Confidence"].map((e, i) => (
              <span key={e} data-emo className="absolute inset-x-0 text-center text-[0.72rem] font-light uppercase tracking-[0.32em] text-[#c9a96e]" style={{ opacity: i === 0 ? 1 : 0 }}>
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* ── The narrative ── */}
        <div className="relative flex h-[52%] w-full items-center justify-center md:h-full md:w-[48%] md:justify-start">
          <div className="relative min-h-[15rem] w-full max-w-md">
            {PROBLEM.map((s, i) => (
              <div key={s.hero} data-copy className="absolute inset-x-0 top-0 text-center md:text-left" style={{ opacity: i === 0 ? 1 : 0 }}>
                <p className="text-[10px] font-medium tracking-[0.4em] text-[#1a1a1a]/30">{s.k}</p>
                <h2 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3rem] lg:text-[3.6rem]">{s.hero}</h2>
                <p className="mt-4 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/45">{s.whisper}</p>
              </div>
            ))}

            <div data-relief className="absolute inset-x-0 top-0 text-center md:text-left" style={{ opacity: 0 }}>
              <p className="text-[10px] font-medium tracking-[0.4em] text-[#1a1a1a]/30">06</p>
              <h2 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3rem] lg:text-[3.6rem]">Finally — proof.</h2>
              <p className="mt-4 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/45">One office changes everything.</p>
            </div>

            <div data-manifesto className="absolute inset-x-0 top-0 text-center md:text-left" style={{ opacity: 0 }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">The Truth Estate Office</p>
              <div className="mt-6 space-y-5">
                {MANIFESTO.map((m) => (
                  <p key={m} data-mani className="font-serif text-[1.4rem] font-light leading-[1.25] text-[#1a1a1a]/85 md:text-[1.7rem]">{m}</p>
                ))}
              </div>
            </div>

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
