"use client";

/* ────────────────────────────────────────────────────────────────────────
   Sun & Vastu 3D Simulation — feature landing page.

   The one thing a brochure can never show you: how a specific home meets the
   sun through the day and the year, and how it sits on the Vastu compass —
   floor by floor, unit by unit. This page explains only that (sunlight +
   Vastu), demonstrates it with an animated sun-path over a floor plate, works
   a full illustrative sample, and opens the real, live 3D simulations we have
   already modelled.

   Brand-matched to the dark editorial site (Playfair serif + Geist), with a
   luminous amber sun system as the one place we spend colour. The founder rule
   — no edits to existing components during DB work — does not apply here: this
   is an entirely new marketing page.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/events";
import Logo from "../Logo";
import { useConsultation } from "../consultation/ConsultationProvider";
import { basePath } from "@/lib/site";


/* ── palette ──────────────────────────────────────────────────────────── */
const C = {
  ink: "#14110d",
  cream: "#f4efe6",
  faint: "#a9a196",
  gold: "#c9a96e",
  goldHi: "#e7cf95",
  green: "#2f6b4f",
  sun: "#f6b64b",
  sunHi: "#ffd777",
};

/* ── the projects with the simulation LIVE (keyed to the committed 3D
   advisors in /public/tower-intel — these render standalone) ───────────── */
const LIVE: { name: string; file: string; preview: string; towers: number; note: string }[] = [
  { name: "Puri The Aravallis", file: "tower-intel/puri-the-aravallis.html", preview: "tower-intel/puri-the-aravallis-preview.jpg", towers: 2, note: "G+42 quad-core · south deck" },
  { name: "Elan The Presidential", file: "tower-intel/elan-the-presidential.html", preview: "tower-intel/elan-the-presidential-preview.jpg", towers: 8, note: "lagoon-facing heads & wings" },
  { name: "Elan The Emperor", file: "tower-intel/elan-the-emperor.html", preview: "tower-intel/elan-the-emperor-preview.jpg", towers: 5, note: "NE-sunrise corners" },
  { name: "Birla Arika", file: "tower-intel/birla-arika.html", preview: "tower-intel/birla-arika-preview.jpg", towers: 4, note: "six sanctioned plates" },
  { name: "Ashiana Amarah Phase - 1 & 1A", file: "tower-intel/ashiana-amarah-phase-1.html", preview: "tower-intel/ashiana-amarah-phase-1-preview.jpg", towers: 4, note: "Stilt+14 · amenity-facing decks" },
  { name: "Ashiana Amarah Phase - 2", file: "tower-intel/ashiana-amarah-phase-2.html", preview: "tower-intel/ashiana-amarah-phase-2-preview.jpg", towers: 4, note: "Stilt+14 · central greenway" },
  { name: "Ashiana Amarah Phase - 3 & 3A", file: "tower-intel/ashiana-amarah-phase-3.html", preview: "tower-intel/ashiana-amarah-phase-3-preview.jpg", towers: 4, note: "Stilt+14 · eastern park" },
  { name: "Ashiana Amarah Phase - 4", file: "tower-intel/ashiana-amarah-phase-4.html", preview: "tower-intel/ashiana-amarah-phase-4-preview.jpg", towers: 5, note: "Stilt+14 · NE park-facing row" },
  { name: "Ashiana Amarah Phase - 5", file: "tower-intel/ashiana-amarah-phase-5.html", preview: "tower-intel/ashiana-amarah-phase-5-preview.jpg", towers: 4, note: "G+14 · Iris 4 BHK + 3 BHK" },
  { name: "Ashiana Anmol Phase - 3", file: "tower-intel/ashiana-anmol-phase-3.html", preview: "tower-intel/ashiana-anmol-phase-3-preview.jpg", towers: 5, note: "Stilt+14 · Sohna · 2 & 3 BHK" },
  { name: "Signature Global De-Luxe DXP", file: "tower-intel/signature-global-de-luxe-dxp.html", preview: "tower-intel/signature-global-de-luxe-dxp-preview.jpg", towers: 8, note: "G+33 · Sector 37D · 3 & 4 BHK" },
  { name: "Signature Global Titanium SPR", file: "tower-intel/signature-global-titanium-spr.html", preview: "tower-intel/signature-global-titanium-spr-preview.jpg", towers: 7, note: "2-to-core dual-aspect" },
  { name: "M3M Elie Saab", file: "tower-intel/m3m-residences-by-elie-saab.html", preview: "tower-intel/m3m-residences-by-elie-saab-preview.jpg", towers: 3, note: "east-sunrise living" },
  /* DLF The Arbour — 3D advisor withheld from the live site (founder's call).
     Kept here so re-enabling is just un-commenting this line (and the matching
     TOWER_INTEL block in src/lib/projects.ts).
     { name: "DLF The Arbour", file: "tower-intel/dlf-arbour.html", preview: "tower-intel/preview.jpg", towers: 5, note: "south-east corners" }, */
];

/* ── scroll reveal (honours reduced-motion, lint-clean) ───────────────── */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, cls: shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4" };
}
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, cls } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`transition-all duration-[900ms] ease-out ${cls} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── the hero: a live sun-path sweeping a top-down floor plate ──────────
   A canvas draws the sun on its arc (east → zenith → west), a soft light
   wash falling across a four-room plate, and the rooms on the sun-facing
   side warming as the day turns. Season raises or lowers the arc, exactly
   as the real simulation does. Auto-plays; scrubbable; reduced-motion safe. */
type Season = "winter" | "equinox" | "summer";
const SEASONS: { id: Season; label: string; peak: number; day: [number, number] }[] = [
  { id: "winter", label: "Winter", peak: 0.62, day: [7.1, 17.4] },
  { id: "equinox", label: "Equinox", peak: 0.80, day: [6.2, 18.2] },
  { id: "summer", label: "Summer", peak: 0.98, day: [5.5, 19.1] },
];

/* plate rooms in plate-local space (0..1), with the room's outward-facing
   side used to decide how directly it takes the sun */
const ROOMS = [
  { name: "Living", x: 0.0, y: 0.0, w: 0.58, h: 0.56, face: [-0.7, -0.7] as [number, number] },
  { name: "Kitchen", x: 0.58, y: 0.0, w: 0.42, h: 0.34, face: [0.8, -0.6] as [number, number] },
  { name: "Master", x: 0.58, y: 0.34, w: 0.42, h: 0.66, face: [0.7, 0.7] as [number, number] },
  { name: "Bed 2", x: 0.0, y: 0.56, w: 0.58, h: 0.44, face: [-0.7, 0.7] as [number, number] },
];

function SunStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const litRef = useRef<HTMLSpanElement>(null);

  const tRef = useRef(0.18);
  const playRef = useRef(true);
  const seasonRef = useRef<Season>("winter");

  const [playing, setPlaying] = useState(true);
  const [season, setSeason] = useState<Season>("winter");
  const [scrub, setScrub] = useState(0.18);

  useEffect(() => { playRef.current = playing; }, [playing]);
  useEffect(() => { seasonRef.current = season; }, [season]);

  // reduced-motion: hold the sun at noon and don't auto-advance
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = requestAnimationFrame(() => { tRef.current = 0.5; setScrub(0.5); setPlaying(false); });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth; h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

    const draw = () => {
      const t = tRef.current;
      const s = SEASONS.find((x) => x.id === seasonRef.current)!;
      ctx.clearRect(0, 0, w, h);

      // subtle warm ground wash so the sun glow reads on the dark page
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "rgba(30,24,16,0.0)");
      bg.addColorStop(1, "rgba(40,30,18,0.35)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // sun on its arc: t=0 rises east(left), t=1 sets west(right)
      const cx = w / 2;
      const baseY = h * 0.86;
      const R = Math.min(w * 0.44, h * 1.05);
      const ang = Math.PI * (1 - t);
      const sunX = cx + R * Math.cos(ang);
      const sunY = baseY - R * Math.sin(ang) * s.peak;
      const alt = clamp(Math.sin(ang) * s.peak); // 0 at horizon, ~1 at noon

      // arc path (the sun's track)
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const a = Math.PI * (1 - i / 60);
        const x = cx + R * Math.cos(a);
        const y = baseY - R * Math.sin(a) * s.peak;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(201,169,110,0.16)";
      ctx.lineWidth = 1; ctx.setLineDash([2, 5]); ctx.stroke(); ctx.setLineDash([]);

      // the plate — a four-room home seen from above, centred low
      const pw = Math.min(w * 0.42, 340);
      const ph = pw * 0.82;
      const px = cx - pw / 2;
      const py = h * 0.42;
      const pcx = px + pw / 2, pcy = py + ph / 2;

      // light direction: from the sun toward the plate centre
      let dx = pcx - sunX, dy = pcy - sunY;
      const dlen = Math.hypot(dx, dy) || 1; dx /= dlen; dy /= dlen;
      // the sun-facing outward direction (from plate toward sun)
      const sdx = -dx, sdy = -dy;

      // rooms
      const litNames: string[] = [];
      ROOMS.forEach((r) => {
        const rx = px + r.x * pw, ry = py + r.y * ph, rw = r.w * pw, rh = r.h * ph;
        // how directly this room's window faces the sun × how high the sun is
        const facing = clamp(r.face[0] * sdx + r.face[1] * sdy);
        const lit = clamp(facing * (0.35 + 0.65 * alt)) * clamp(0.3 + alt);
        // base room fill (parchment), warmed by sun
        const warm = 40 + lit * 200;
        ctx.fillStyle = `rgb(${228 + lit * 20},${222 + lit * 18},${205 - lit * 5})`;
        ctx.fillRect(rx, ry, rw, rh);
        if (lit > 0.16) {
          const g = ctx.createLinearGradient(rx - sdx * rw, ry - sdy * rh, rx + rw, ry + rh);
          g.addColorStop(0, `rgba(255,190,90,${0.10 + lit * 0.5})`);
          g.addColorStop(1, "rgba(255,190,90,0)");
          ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
          if (lit > 0.3) litNames.push(r.name);
        }
        // walls
        ctx.strokeStyle = "rgba(70,58,40,0.55)"; ctx.lineWidth = 1.5;
        ctx.strokeRect(rx, ry, rw, rh);
        // room label
        ctx.fillStyle = `rgba(60,48,32,${0.5 + lit * 0.4})`;
        ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(r.name.toUpperCase(), rx + rw / 2, ry + rh / 2);
        void warm;
      });

      // plate outline + a slim balcony edge on the south (bottom)
      ctx.strokeStyle = "rgba(50,40,26,0.8)"; ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);

      // compass — N points up (screen), a small tick
      ctx.fillStyle = "rgba(201,169,110,0.85)";
      ctx.font = "700 10px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText("N", pcx, py - 8);
      ctx.beginPath(); ctx.moveTo(pcx, py - 30); ctx.lineTo(pcx, py - 20);
      ctx.strokeStyle = "rgba(201,169,110,0.55)"; ctx.lineWidth = 1; ctx.stroke();

      // sun rays sweeping across the plate (additive)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = -2; i <= 2; i++) {
        const ox = i * 26;
        const g = ctx.createLinearGradient(sunX, sunY, pcx + ox, pcy);
        g.addColorStop(0, `rgba(255,205,110,${0.10 + alt * 0.10})`);
        g.addColorStop(1, "rgba(255,205,110,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(pcx + ox, pcy + ph * 0.2); ctx.stroke();
      }
      ctx.restore();

      // the sun itself — soft halo + warm core, colour warmer at low altitude
      const warmK = 1 - alt;
      const core = `rgb(255,${Math.round(215 - warmK * 45)},${Math.round(120 - warmK * 40)})`;
      const halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 70 + alt * 30);
      halo.addColorStop(0, "rgba(255,214,130,0.55)");
      halo.addColorStop(0.5, "rgba(246,182,75,0.18)");
      halo.addColorStop(1, "rgba(246,182,75,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(sunX, sunY, 90 + alt * 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(sunX, sunY, 13 + alt * 4, 0, Math.PI * 2); ctx.fill();

      // update the DOM readouts
      const [rise, set] = s.day;
      const hour = lerp(rise, set, t);
      const hh = Math.floor(hour);
      const mm = Math.round((hour - hh) * 60);
      if (timeRef.current) timeRef.current.textContent = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      const phase = hour < 11 ? "Morning" : hour < 14 ? "Midday" : hour < 16.5 ? "Afternoon" : "Evening";
      if (phaseRef.current) phaseRef.current.textContent = phase;
      if (litRef.current) litRef.current.textContent = litNames.length ? litNames.join(" · ") + " in direct sun" : "low sun — soft, indirect light";
    };

    let rafId = 0, prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - prev, 60); prev = now;
      if (playRef.current) {
        tRef.current += dt / 11000; // ~11s dawn→dusk
        if (tRef.current > 1) tRef.current = 0;
        setScrub(tRef.current);
      }
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full">
      <div ref={wrapRef} className="relative h-[300px] w-full sm:h-[380px] lg:h-[440px]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        {/* live readout */}
        <div className="pointer-events-none absolute left-0 top-0 flex items-baseline gap-3">
          <span ref={timeRef} className="font-serif text-3xl text-[#f6d68a] tabular-nums sm:text-4xl">07:00</span>
          <span ref={phaseRef} className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Morning</span>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 text-center text-[12px] italic text-[#cbb98d]">
          <span ref={litRef}>Living · Kitchen in direct sun</span>
        </div>
      </div>

      {/* controls: play, scrub, season */}
      <div className="mt-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause sun" : "Play sun"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c9a96e]/40 bg-[#c9a96e]/[0.1] text-[#e7cf95] transition-colors hover:bg-[#c9a96e]/20"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <input
            type="range" min={0} max={1} step={0.001} value={scrub}
            onChange={(e) => { const v = Number(e.target.value); tRef.current = v; setScrub(v); setPlaying(false); }}
            aria-label="Time of day"
            className="teh-sun-range h-1 w-full cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(90deg, ${C.sun} 0%, ${C.sunHi} ${scrub * 100}%, rgba(255,255,255,0.12) ${scrub * 100}%)` }}
          />
        </div>
        <div className="flex items-center gap-2">
          {SEASONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSeason(s.id)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-medium tracking-[0.1em] transition-colors ${
                season === s.id ? "bg-[#c9a96e] text-[#1a1509]" : "border border-white/12 text-[#a9a196] hover:text-[#f4efe6]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── the Vastu compass — eight sectors, the principal rooms placed ─────── */
const VASTU = [
  { dir: "N", deg: 0, el: "Kuber", room: "Entrance", good: true },
  { dir: "NE", deg: 45, el: "Ishan", room: "Pooja · water", good: true },
  { dir: "E", deg: 90, el: "Surya", room: "Living · sunrise", good: true },
  { dir: "SE", deg: 135, el: "Agni", room: "Kitchen", good: true },
  { dir: "S", deg: 180, el: "Yama", room: "—", good: false },
  { dir: "SW", deg: 225, el: "Nairutya", room: "Master", good: true },
  { dir: "W", deg: 270, el: "Varuna", room: "Dining", good: false },
  { dir: "NW", deg: 315, el: "Vayu", room: "Guest", good: false },
];
function VastuCompass({ size = 300 }: { size?: number }) {
  const cx = size / 2, cy = size / 2;
  const rOut = size * 0.46, rIn = size * 0.2;
  const seg = (deg: number, r1: number, r2: number) => {
    const a0 = ((deg - 22.5) - 90) * Math.PI / 180;
    const a1 = ((deg + 22.5) - 90) * Math.PI / 180;
    const p = (a: number, r: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    return `M ${p(a0, r1)} L ${p(a0, r2)} A ${r2} ${r2} 0 0 1 ${p(a1, r2)} L ${p(a1, r1)} A ${r1} ${r1} 0 0 0 ${p(a0, r1)} Z`;
  };
  const lp = (deg: number, r: number) => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[320px]" role="img" aria-label="Vastu compass showing room placement by direction">
      {VASTU.map((v) => (
        <path key={v.dir} d={seg(v.deg, rIn, rOut)}
          fill={v.good ? "rgba(47,107,79,0.28)" : "rgba(255,255,255,0.03)"}
          stroke="rgba(201,169,110,0.28)" strokeWidth={1} />
      ))}
      {VASTU.map((v) => {
        const a = lp(v.deg, (rIn + rOut) / 2);
        const l = lp(v.deg, rOut + 14);
        return (
          <g key={`t-${v.dir}`}>
            <text x={a.x} y={a.y - 4} textAnchor="middle" fill={v.good ? "#e7cf95" : "#a9a196"} fontSize={12} fontWeight={700}>{v.dir}</text>
            <text x={a.x} y={a.y + 10} textAnchor="middle" fill="#cbc2b4" fontSize={8.5}>{v.room}</text>
            <text x={l.x} y={l.y} textAnchor="middle" fill="rgba(201,169,110,0.6)" fontSize={8} fontStyle="italic">{v.el}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={rIn} fill="rgba(20,17,13,0.9)" stroke="rgba(201,169,110,0.3)" />
      <text x={cx} y={cy - 3} textAnchor="middle" fill="#f6d68a" fontSize={11} fontWeight={700}>VASTU</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#a9a196" fontSize={8}>brahmasthan</text>
    </svg>
  );
}

/* ── the times-of-day strip for the sunlight section ──────────────────── */
const TIMES = [
  { k: "Morning", t: "07:00", copy: "East and south-east rooms take the first low sun. Living, dining and the puja corner come alive; a kitchen on the Agni corner warms early.", pct: 62 },
  { k: "Midday", t: "12:30", copy: "The sun is overhead and to the south. Balconies and south decks are at their brightest; interiors sit in even, indirect light.", pct: 96 },
  { k: "Evening", t: "17:30", copy: "West-facing rooms catch the last warm light — and, in summer, the heat that comes with it. We flag the units that overheat here.", pct: 48 },
];

/* ── how-it-works ─────────────────────────────────────────────────────── */
const STEPS = [
  { n: "01", h: "We trace the sanctioned plans", b: "Every wall, window and balcony from the approved floor plates — drawn to scale, per unit type, not a marketing render." },
  { n: "02", h: "We place the tower for real", b: "Set at its actual site coordinates and held to true north, with the neighbouring towers that cast shadows across it." },
  { n: "03", h: "We run a full solar year", b: "The sun is walked through every hour of every season. For each unit we compute direct-sun hours, afternoon heat load and its Vastu placement." },
];

/* ── worked illustrative sample ───────────────────────────────────────── */
const SAMPLE_SUN = [
  { k: "Morning", v: "3.1 h", d: "living & dining" },
  { k: "Midday", v: "full", d: "south balcony" },
  { k: "Evening", v: "0.4 h", d: "bedrooms shaded" },
];
const SAMPLE_VASTU = [
  { z: "Entrance", dir: "North · Kuber", ok: true },
  { z: "Kitchen", dir: "South-east · Agni", ok: true },
  { z: "Master", dir: "South-west · Nairutya", ok: true },
  { z: "Pooja", dir: "North-east · Ishan", ok: true },
  { z: "Toilets", dir: "West · off the NE", ok: false },
];

export default function SunVastu() {
  const { openConsult } = useConsultation();
  const talk = () => openConsult({ sourceKind: "homepage" });
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => { track("sun_vastu_page_viewed"); }, []);

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4efe6]" style={{ fontFeatureSettings: '"ss01"' }}>
      {/* ── nav ── */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
        <a href={`${basePath}/`} aria-label="Truth Estate — home"><Logo className="h-9 w-auto opacity-80 md:h-10" /></a>
        <div className="flex items-center gap-6 text-[12px] font-medium tracking-[0.12em] text-[#a9a196]">
          <a href={`${basePath}/intelligence`} className="hidden transition-colors hover:text-[#f4efe6] sm:inline">Truth Intelligence</a>
          <button onClick={talk} className="rounded-full border border-[#c9a96e]/45 bg-[#c9a96e]/[0.12] px-4 py-1.5 text-[#e7cf95] transition-all hover:border-[#c9a96e]/80 hover:bg-[#c9a96e]/25">Talk to us</button>
        </div>
      </nav>

      {/* ═══ 1 · HERO ═══ */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 45% at 78% 8%, rgba(246,182,75,0.10) 0%, transparent 62%)" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-8 md:grid-cols-[1fr_1.02fr] md:px-10 md:pb-28 md:pt-14">
          <Reveal>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={C.sun} strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </svg>
              Sun &amp; Vastu · 3D Simulation
            </p>
            <h1 className="mt-5 font-serif text-[2.7rem] font-medium leading-[1.03] tracking-[-0.01em] text-[#f7f2e8] sm:text-6xl">
              See the light<br />before you buy.
            </h1>
            <p className="mt-6 max-w-md font-serif text-lg italic leading-relaxed text-[#cbc2b4]">
              A brochure shows one perfect evening. We show you every hour of every season — the direct sun, the afternoon heat and the Vastu of a home, floor by floor, before you commit a rupee.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <button onClick={() => scrollTo("live")} className="rounded-sm bg-[#2f6b4f] px-8 py-4 text-[13px] font-medium tracking-[0.06em] text-[#f4efe6] shadow-lg shadow-black/30 transition-colors hover:bg-[#37805e]">
                Open a live simulation
              </button>
              <button onClick={() => scrollTo("how")} className="text-[13px] font-medium tracking-[0.04em] text-[#c9a96e] transition-colors hover:text-[#e7cf95]">
                How it works →
              </button>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-5 sm:p-7">
              <SunStage />
            </div>
          </Reveal>
        </div>
      </header>

      {/* ═══ 2 · THE PROBLEM ═══ */}
      <section className="border-t border-white/[0.06] bg-[#161209]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">The blind spot</p>
            <h2 className="mt-5 max-w-3xl font-serif text-3xl font-medium leading-[1.12] text-[#f4efe6] sm:text-[2.6rem]">
              You can feel a home’s light in ten minutes. You just can’t do it before it’s built.
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[#b8b0a3]">
              Two units in the same tower, one floor apart, can live in completely different light — one bright and dry, the next dim by 3 pm with a west wall that bakes in June. Vastu is guessed from a compass held to a printed plan. By the time you find out, you own it. The simulation moves that discovery to before you decide.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 3 · SUNLIGHT ═══ */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">Sunlight</p>
          <h2 className="mt-5 max-w-3xl font-serif text-3xl font-medium leading-[1.12] text-[#f4efe6] sm:text-[2.6rem]">
            Morning, midday, evening — and winter against summer.
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[#b8b0a3]">
            For every unit we compute how many hours of direct sun it actually receives, where that light lands inside the home, and how the picture changes from the short winter arc to the high summer one. Direct-sun hours per day is the number we lead with — the single honest measure of a bright home.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TIMES.map((t, i) => (
            <Reveal key={t.k} delay={i * 90}>
              <div className="flex h-full flex-col rounded-lg border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-xl text-[#f4efe6]">{t.k}</span>
                  <span className="font-serif text-lg text-[#f6d68a] tabular-nums">{t.t}</span>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: `linear-gradient(90deg, ${C.sun}, ${C.sunHi})` }} />
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-[#b0a898]">{t.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ 4 · VASTU ═══ */}
      <section className="border-y border-white/[0.06] bg-[#161209]">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-28">
          <Reveal className="order-2 flex justify-center md:order-1">
            <VastuCompass />
          </Reveal>
          <Reveal delay={100} className="order-1 md:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">Vastu</p>
            <h2 className="mt-5 font-serif text-3xl font-medium leading-[1.12] text-[#f4efe6] sm:text-[2.6rem]">
              The compass facts, measured — not guessed.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#b8b0a3]">
              From the true-north placement, the simulation reads where each principal zone falls: the entrance, the kitchen on the fire corner, the master in the south-west, the pooja and water in the north-east. We show you which zones sit favourably and which do not.
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#b8b0a3]">
              We don’t sell superstition, and we don’t dismiss it. We give you the orientation on the record — <span className="text-[#e7cf95]">what weight you give the tradition is yours to decide.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 5 · HOW IT WORKS ═══ */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">How it works</p>
          <h2 className="mt-5 max-w-2xl font-serif text-3xl font-medium leading-[1.12] text-[#f4efe6] sm:text-[2.6rem]">
            Built from the sanctioned plans, not a render.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.06] md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90} className="h-full">
              <div className="flex h-full flex-col bg-[#14110d] p-7">
                <span className="font-serif text-2xl text-[#c9a96e]">{s.n}</span>
                <h3 className="mt-4 font-serif text-xl text-[#f4efe6]">{s.h}</h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[#b0a898]">{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ 6 · WORKED SAMPLE ═══ */}
      <section className="border-t border-white/[0.06] bg-[#161209]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">A worked example</p>
            <h2 className="mt-5 max-w-3xl font-serif text-3xl font-medium leading-[1.12] text-[#f4efe6] sm:text-[2.6rem]">
              One unit, fully read.
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[#b8b0a3]">
              Here is what a single simulation output looks like — an illustrative unit, worked end to end.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-10 overflow-hidden rounded-xl border border-[#c9a96e]/25 bg-[#f4efe6] text-[#2a2318] shadow-2xl shadow-black/40">
              {/* card header */}
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#2a2318]/12 px-7 py-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a07d2c]">Sun &amp; Vastu report</p>
                  <h3 className="mt-2 font-serif text-2xl text-[#241d12]">Solaris · Tower A</h3>
                  <p className="mt-1 font-serif text-[15px] italic text-[#6a6154]">4 BHK · south-east corner · 18th floor</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl text-[#2f6b4f] tabular-nums">6.4 h</p>
                  <p className="text-[11px] tracking-wide text-[#6a6154]">winter direct sun / day</p>
                </div>
              </div>

              <div className="grid gap-px bg-[#2a2318]/10 md:grid-cols-2">
                {/* sun by time */}
                <div className="bg-[#f4efe6] p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a07d2c]">Through the day · winter</p>
                  <div className="mt-4 flex flex-col gap-3">
                    {SAMPLE_SUN.map((s) => (
                      <div key={s.k} className="flex items-baseline justify-between border-b border-[#2a2318]/10 pb-2">
                        <span className="text-[13px] text-[#4a4234]">{s.k}</span>
                        <span className="text-[13px] text-[#6a6154]">{s.d}</span>
                        <span className="font-serif text-[15px] font-medium text-[#241d12] tabular-nums">{s.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between rounded-md bg-[#2f6b4f]/[0.08] px-4 py-3">
                    <span className="text-[12px] text-[#4a4234]">Summer direct sun / day</span>
                    <span className="font-serif text-[15px] font-medium text-[#2f6b4f] tabular-nums">8.9 h</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-md bg-[#a07d2c]/[0.08] px-4 py-3">
                    <span className="text-[12px] text-[#4a4234]">Afternoon-west heat load</span>
                    <span className="font-serif text-[15px] font-medium text-[#a07d2c]">Low</span>
                  </div>
                </div>

                {/* vastu placement */}
                <div className="bg-[#f4efe6] p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a07d2c]">Vastu placement</p>
                  <div className="mt-4 flex flex-col gap-2.5">
                    {SAMPLE_VASTU.map((v) => (
                      <div key={v.z} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#4a4234]">{v.z}</span>
                        <span className="flex items-center gap-2 text-[13px] text-[#6a6154]">
                          {v.dir}
                          <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${v.ok ? "bg-[#2f6b4f] text-white" : "bg-[#a07d2c]/25 text-[#a07d2c]"}`}>{v.ok ? "✓" : "!"}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 rounded-md bg-[#2a2318]/[0.05] px-4 py-3 text-[12.5px] italic leading-relaxed text-[#4a4234]">
                    A rare south-east corner: morning sun in the living and dining, the master in the auspicious south-west, and no west heat on the bedrooms. Four of five principal zones favourably placed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#2a2318]/12 px-7 py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a07d2c]">Truth Estate</span>
                <span className="text-[11px] italic text-[#6a6154]">Illustrative · Gurugram 28.45°N · true-north tower · clear-sky model</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 7 · LIVE NOW ═══ */}
      <section id="live" className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">Live now</p>
          <h2 className="mt-5 max-w-3xl font-serif text-3xl font-medium leading-[1.12] text-[#f4efe6] sm:text-[2.6rem]">
            {LIVE.reduce((s, p) => s + p.towers, 0)} towers you can walk through the sun on, right now.
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[#b8b0a3]">
            These projects are already modelled and interactive. Open one, play the sun across the day, and pick the tower and floor that live in the best light.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LIVE.map((p, i) => (
            <Reveal key={p.name} delay={(i % 3) * 80}>
              <a
                href={`${basePath}/${p.file}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => track("model_opened", { projectName: p.name, props: { source: "sun-vastu" } })}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] transition-all hover:border-[#c9a96e]/40 hover:bg-white/[0.04]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#0f0d09]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${basePath}/${p.preview}`} alt={`${p.name} — 3D sun & Vastu model`} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium tracking-[0.1em] text-[#f6d68a] backdrop-blur-sm">LIVE</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-lg leading-snug text-[#f4efe6]">{p.name}</h3>
                  <p className="mt-1 text-[12.5px] text-[#a9a196]">{p.towers} towers · {p.note}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[0.04em] text-[#c9a96e] transition-colors group-hover:text-[#e7cf95]">
                    Open live simulation
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">▸</span>
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-8 text-[12.5px] italic text-[#8f887c]">
            More towers are modelled every week. Don’t see yours? <button onClick={talk} className="text-[#c9a96e] underline decoration-[#c9a96e]/40 underline-offset-2 transition-colors hover:text-[#e7cf95]">Ask us to model it.</button>
          </p>
        </Reveal>
      </section>

      {/* ═══ 8 · CLOSING ═══ */}
      <section className="relative overflow-hidden border-t border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(246,182,75,0.08) 0%, transparent 65%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center md:px-10 md:py-36">
          <Reveal>
            <h2 className="font-serif text-[2.4rem] font-medium leading-[1.08] text-[#f7f2e8] sm:text-5xl">
              Every tower has a best home in it. We can show you which.
            </h2>
            <p className="mt-6 font-serif text-lg italic text-[#cbc2b4]">
              Bring us the project you’re considering — we’ll walk its sun and its Vastu with you, floor by floor.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
              <button onClick={talk} className="rounded-sm bg-[#2f6b4f] px-9 py-4 text-[13px] font-medium tracking-[0.06em] text-[#f4efe6] shadow-lg shadow-black/30 transition-colors hover:bg-[#37805e]">
                Talk to us
              </button>
              <button onClick={() => scrollTo("live")} className="text-[13px] font-medium tracking-[0.04em] text-[#c9a96e] transition-colors hover:text-[#e7cf95]">
                Explore a live simulation →
              </button>
            </div>
            <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7a7264]">Independent by design. No developer’s rupee, ever.</p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
