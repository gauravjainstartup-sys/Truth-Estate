"use client";

import { useEffect, useRef, useState } from "react";
import { isMember, setMember } from "@/lib/journey";
import BuyerOfficeGate from "./BuyerOfficeGate";
import type { ProjectIntel, TowerIntelMeta } from "@/lib/projects";

const basePath = "/Truth-Estate";

/* A page-wide event so any "See Unit Intelligence" CTA (hero, final card)
   can trigger the module without prop-drilling. */
const UNIT_INTEL_EVENT = "te:unit-intel";
export function openUnitIntel() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(UNIT_INTEL_EVENT));
}

const CAPS = [
  { t: "3D site & tower model", d: "Every tower placed to scale on the real plot." },
  { t: "Sun-path per unit", d: "Direct-sun hours by unit and floor, at the site's true latitude." },
  { t: "Vastu score", d: "A corner-by-corner Vastu read — with the reasoning." },
  { t: "Natural light & views", d: "Which homes get the morning light, and what they look onto." },
  { t: "Cross-ventilation", d: "The dual-aspect units that actually breathe." },
  { t: "Best-value stacks", d: "The floors and stacks that price best for what you get." },
];

export default function TowerIntel({ project, meta }: { project: ProjectIntel; meta?: TowerIntelMeta }) {
  const [member, setMemberState] = useState(false);
  const [modal, setModal] = useState(false); // the 3D advisor (modelled projects)
  const [gate, setGate] = useState(false); // the Buyer Office join
  const [joined, setJoined] = useState(false); // "in production" projects: post-join note
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setMemberState(isMember());
  }, []);

  // hero pill / final-card CTA
  useEffect(() => {
    const h = () => (meta?.file ? setModal(true) : setGate(true));
    window.addEventListener(UNIT_INTEL_EVENT, h);
    return () => window.removeEventListener(UNIT_INTEL_EVENT, h);
  }, [meta]);

  const postMember = () => {
    try { iframeRef.current?.contentWindow?.postMessage({ type: "te-member" }, "*"); } catch { /* ignore */ }
  };

  // messages from the 3D iframe (dive-in gate)
  useEffect(() => {
    if (!modal) return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.type === "te-ready" && isMember()) postMember();
      if (d.type === "te-join") setGate(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [modal]);

  useEffect(() => {
    if (!modal && !gate) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [modal, gate]);

  function onJoined() {
    setMember();
    setMemberState(true);
    setGate(false);
    if (meta?.file) postMember(); // unlock the dive-in in the live 3D
    else setJoined(true); // in-production: acknowledge
  }

  const src = meta?.file ? `${basePath}/${meta.file}` : undefined;

  return (
    <>
      {meta ? (
        /* ── Modelled project: compact entry → free 3D exploration ── */
        <section id="tower-intel" className="mt-14 scroll-mt-24 overflow-hidden rounded-2xl border border-[#1f3a4d]/40 bg-[#0a0f17] text-white">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:gap-7 md:p-7">
            <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${basePath}/${meta.preview}`} alt={`${project.name} — 3D sun & unit advisor`} className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(10,15,23,0.1), rgba(10,15,23,0.5))" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[#e0b667]"><span aria-hidden>▦</span> Deep intelligence · live 3D</p>
              <p className="mt-2 font-serif text-[1.5rem] leading-[1.15] md:text-[1.7rem]">Tower &amp; Unit Intelligence</p>
              <p className="mt-2 text-[0.86rem] font-light leading-[1.6] text-white/55">
                Explore the 3D site &amp; sun study free — the best tower for sun is <b className="font-medium text-white/80">{meta.sample.ref.replace("Tower ", "Tower ")}</b> at <span className="text-[#ffce63]">{meta.sample.sun}</span> winter sun. Open a tower to unlock unit-level intel for all {meta.totalUnits} homes.
              </p>
            </div>
            <button onClick={() => setModal(true)} className="shrink-0 rounded-sm bg-[#e0b667] px-6 py-3.5 text-[0.84rem] font-semibold tracking-[0.02em] text-[#1a1206] transition-colors hover:bg-[#f0cd85]">
              See Unit Intelligence →
            </button>
          </div>
        </section>
      ) : (
        /* ── In-production project: static "what's inside" → join ── */
        <section id="tower-intel" className="mt-14 scroll-mt-24 overflow-hidden rounded-2xl border border-[#1f3a4d]/40 bg-[#0a0f17] p-8 text-white md:p-10">
          <div className="relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,206,99,0.14), transparent 70%)", filter: "blur(24px)" }} />
            <p className="flex items-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-[#e0b667]"><span aria-hidden>▦</span> Deep intelligence</p>
            <h2 className="mt-3 max-w-xl font-serif text-[1.9rem] font-medium leading-[1.15] md:text-[2.3rem]">Tower &amp; Unit Intelligence</h2>
            <p className="mt-3 max-w-xl text-[0.92rem] font-light leading-[1.75] text-white/60">
              A 3D model of {project.name} that grades every unit the way most buyers never can — by sun, light, Vastu, ventilation, views and value. It&apos;s the layer that decides <span className="italic">which</span> home, not just which project.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAPS.map((c) => (
                <div key={c.t} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-[0.86rem] font-medium text-white/85">{c.t}</p>
                  <p className="mt-1.5 text-[0.76rem] font-light leading-[1.5] text-white/45">{c.d}</p>
                </div>
              ))}
            </div>
            {joined ? (
              <div className="mt-7 rounded-xl border border-[#1e6b45]/40 bg-[#1e6b45]/10 p-5">
                <p className="text-[0.9rem] font-medium text-[#9fd8b6]">You&apos;re in — welcome to the Buyer Office.</p>
                <p className="mt-1.5 text-[0.84rem] font-light leading-[1.6] text-white/60">We&apos;re building {project.name}&apos;s tower model now. Your advisor will walk you through it unit by unit — and it&apos;ll appear in your file the moment it&apos;s ready.</p>
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={() => setGate(true)} className="rounded-sm bg-[#e0b667] px-7 py-3.5 text-[0.86rem] font-semibold tracking-[0.02em] text-[#1a1206] transition-colors hover:bg-[#f0cd85]">
                  Join the Buyer Office to see {project.name}&apos;s units →
                </button>
                <p className="text-[0.76rem] font-light text-white/45">Free · share your requirements. No payment.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Full-screen 3D advisor — free to explore; the dive-in is gated */}
      {modal && src && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[#0a0f17]">
          <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
            <div>
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#e0b667]">Tower &amp; Unit Intelligence</p>
              <p className="text-[0.9rem] font-medium text-white">{project.name}</p>
            </div>
            <span className="ml-3 hidden rounded-full border border-white/12 px-2.5 py-1 text-[0.62rem] font-light text-white/45 sm:inline">
              {member ? "Buyer Office · unit intel unlocked" : "Tap a tower for unit-level intel"}
            </span>
            <button onClick={() => setModal(false)} className="ml-auto rounded-sm border border-white/15 bg-white/5 px-4 py-2 text-[0.78rem] font-medium tracking-[0.04em] text-white transition-colors hover:border-[#46c2ff]">Close ✕</button>
          </div>
          <iframe
            ref={iframeRef}
            src={src}
            title={`${project.name} — Tower & Unit Intelligence`}
            onLoad={() => { if (isMember()) postMember(); }}
            className="min-h-0 flex-1 border-0"
          />
        </div>
      )}

      <BuyerOfficeGate open={gate} project={project.name} onClose={() => setGate(false)} onJoined={onJoined} />
    </>
  );
}
