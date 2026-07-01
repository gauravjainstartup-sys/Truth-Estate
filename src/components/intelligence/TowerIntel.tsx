"use client";

import { useEffect, useRef, useState } from "react";
import { hasFullAccess, unlockProject, setMember } from "@/lib/journey";
import BuyerOfficeGate from "./BuyerOfficeGate";
import type { ProjectIntel, TowerIntelMeta } from "@/lib/projects";

const basePath = "/Truth-Estate";

/* A page-wide event so any "See Unit Intelligence" CTA (hero, final card)
   can trigger the module without prop-drilling. */
const UNIT_INTEL_EVENT = "te:unit-intel";
export function openUnitIntel() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(UNIT_INTEL_EVENT));
}

type GateStart = "intro" | "req" | "plans" | "home";
type Plan = "single" | "membership";

export default function TowerIntel({ project, meta }: { project: ProjectIntel; meta?: TowerIntelMeta }) {
  const slug = project.slug;
  const [access, setAccess] = useState(false); // paid: single-project unlock or membership
  const [modal, setModal] = useState(false); // the 3D advisor (modelled projects)
  const [gateStart, setGateStart] = useState<GateStart | null>(null); // Buyer Office surface (null = closed)
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const has3D = !!meta?.file;
  const openGate = (s: GateStart) => setGateStart(s);

  useEffect(() => {
    setAccess(hasFullAccess(slug));
  }, [slug]);

  // hero pill / final-card CTA — 3D projects open the live model (free to
  // explore + a free sample; the full verdict is paid); others open the
  // Buyer Office (home once paid, otherwise the free register flow).
  useEffect(() => {
    const h = () => (has3D ? setModal(true) : openGate(hasFullAccess(slug) ? "home" : "intro"));
    window.addEventListener(UNIT_INTEL_EVENT, h);
    return () => window.removeEventListener(UNIT_INTEL_EVENT, h);
  }, [has3D, slug]);

  const postPaid = () => {
    try { iframeRef.current?.contentWindow?.postMessage({ type: "te-paid" }, "*"); } catch { /* ignore */ }
  };

  // messages from the 3D iframe — te-pay fires when a non-paid visitor dives
  // past the free sample; we open the plans/checkout on top of the model.
  useEffect(() => {
    if (!modal) return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.type === "te-ready" && hasFullAccess(slug)) postPaid();
      if (d.type === "te-pay") openGate("plans");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [modal, slug]);

  // Only the 3D modal locks scroll here; BuyerOfficeGate owns its own lock.
  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [modal]);

  // Payment succeeded in the gate (simulated). Record the entitlement and, if
  // the 3D is already open (a dive-in), unlock it so the tapped tower opens.
  function onPaid(plan: Plan) {
    if (plan === "membership") setMember();
    else unlockProject(slug);
    setAccess(true);
    if (has3D && modal) postPaid();
  }

  // "See your unit intelligence" from the success / home / booked screens.
  function onSeeUnitIntel() {
    setGateStart(null);
    if (has3D && !modal) setModal(true); // fresh open; onLoad posts entitlement
  }

  const src = meta?.file ? `${basePath}/${meta.file}` : undefined;

  return (
    <>
      {/* Compact mini teaser — same small footprint for every project */}
      <section id="tower-intel" className="mt-14 scroll-mt-24 overflow-hidden rounded-2xl border border-[#1f3a4d]/40 bg-[#0a0f17] text-white">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:gap-7 md:p-7">
          <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-44">
            {meta ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${basePath}/${meta.preview}`} alt={`${project.name} — 3D sun & unit advisor`} className="h-full w-full object-cover" />
            ) : (
              <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#111a29] to-[#0a0f17]">
                <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 62% 30%, rgba(224,182,103,0.18), transparent 62%)" }} />
                <TowerGlyph />
              </div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(10,15,23,0.05), rgba(10,15,23,0.4))" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[#e0b667]">
              <span aria-hidden>▦</span> {access ? "Your Buyer Office" : <>Deep intelligence{meta ? " · live 3D" : ""}</>}
            </p>
            <p className="mt-2 font-serif text-[1.45rem] leading-[1.15] md:text-[1.6rem]">Tower &amp; Unit Intelligence</p>
            <p className="mt-2 text-[0.85rem] font-light leading-[1.6] text-white/55">
              {access ? (
                meta ? (
                  <>You&apos;re unlocked — open your 3D advisor any time, or schedule your advisor call.</>
                ) : (
                  <>You&apos;re in. Enter your office to schedule your advisor call and track your intelligence.</>
                )
              ) : meta ? (
                <>Explore the 3D site &amp; sun study free — open a tower for a free sample, then unlock every unit from ₹1,499.</>
              ) : (
                <>The 3D layer that decides <span className="italic">which</span> home — graded by sun, Vastu, light, ventilation &amp; value.</>
              )}
            </p>
          </div>
          {access ? (
            <button onClick={() => openGate("home")} className="shrink-0 rounded-sm bg-[#e0b667] px-6 py-3.5 text-[0.84rem] font-semibold tracking-[0.02em] text-[#1a1206] transition-colors hover:bg-[#f0cd85]">
              Enter your Buyer Office →
            </button>
          ) : (
            <button onClick={() => (meta ? setModal(true) : openGate("intro"))} className="shrink-0 rounded-sm bg-[#e0b667] px-6 py-3.5 text-[0.84rem] font-semibold tracking-[0.02em] text-[#1a1206] transition-colors hover:bg-[#f0cd85]">
              {meta ? "Explore the live 3D →" : "See what's inside →"}
            </button>
          )}
        </div>
      </section>

      {/* Full-screen 3D advisor — free to explore; the full verdict is paid */}
      {modal && src && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[#0a0f17]">
          <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
            <div>
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#e0b667]">Tower &amp; Unit Intelligence</p>
              <p className="text-[0.9rem] font-medium text-white">{project.name}</p>
            </div>
            <span className="ml-3 hidden rounded-full border border-white/12 px-2.5 py-1 text-[0.62rem] font-light text-white/45 sm:inline">
              {access ? "Full verdict unlocked" : "Free to explore · one sample free"}
            </span>
            <button onClick={() => setModal(false)} className="ml-auto rounded-sm border border-white/15 bg-white/5 px-4 py-2 text-[0.78rem] font-medium tracking-[0.04em] text-white transition-colors hover:border-[#46c2ff]">Close ✕</button>
          </div>
          <iframe
            ref={iframeRef}
            src={src}
            title={`${project.name} — Tower & Unit Intelligence`}
            onLoad={() => { if (hasFullAccess(slug)) postPaid(); }}
            className="min-h-0 flex-1 border-0"
          />
        </div>
      )}

      <BuyerOfficeGate
        open={gateStart !== null}
        project={project.name}
        slug={slug}
        start={gateStart ?? "intro"}
        has3D={has3D}
        access={access}
        onClose={() => setGateStart(null)}
        onJoined={() => { /* free register — lead saved in the gate */ }}
        onPaid={onPaid}
        onSeeUnitIntel={onSeeUnitIntel}
      />
    </>
  );
}

function TowerGlyph() {
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" className="relative" aria-hidden>
      <g stroke="#e0b667" strokeWidth="1.4" strokeLinejoin="round" opacity="0.9">
        <path d="M24 5 8 13v22l16 8 16-8V13z" fill="rgba(224,182,103,0.05)" />
        <path d="M8 13l16 8 16-8M24 21v22" opacity="0.5" />
        <rect x="18" y="19" width="5" height="14" fill="rgba(224,182,103,0.10)" />
        <rect x="25" y="17" width="5" height="16" fill="rgba(224,182,103,0.10)" />
      </g>
    </svg>
  );
}
