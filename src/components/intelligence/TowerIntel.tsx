"use client";

import { useEffect, useRef, useState } from "react";
import { has3DAccess, grantPackage, saveLead } from "@/lib/journey";
import BuyerOfficeGate from "./BuyerOfficeGate";
import { useConsultation } from "../consultation/ConsultationProvider";
import type { ProjectIntel, TowerIntelMeta } from "@/lib/projects";
import { basePath } from "@/lib/site";

/* Cache-bust for the embedded advisor HTML — bump whenever a tower-intel/*.html
   advisor changes so mobile Safari refetches instead of serving the stale iframe. */
const ADVISOR_V = "20260719e";

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
  const { openConsult } = useConsultation();

  useEffect(() => {
    setAccess(has3DAccess(slug));
  }, [slug]);

  // hero pill / final-card CTA — 3D projects open the live model (free to
  // explore + a free sample; the full verdict is paid); others open the
  // Buyer Office (home once paid, otherwise the free register flow).
  useEffect(() => {
    const h = () => (has3D ? setModal(true) : openGate(has3DAccess(slug) ? "home" : "intro"));
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
      if (d.type === "te-ready" && has3DAccess(slug)) postPaid();
      if (d.type === "te-pay") openGate("plans");
      // "Talk to an advisor" from a unit — close the model and open the consult flow with the unit as source.
      if (d.type === "te-consult") { setModal(false); openConsult({ source: project.name, sourceKind: "project", intent: "buy" }); }
      // Walk-through early-access — capture the mobile number into the app's lead store.
      if (d.type === "te-lead" && d.phone) {
        saveLead({ name: "", email: "", phone: String(d.phone), project: project.name, intent: "tower-intel", message: `walkthrough-early-access · ${String(d.unit ?? "")}`.trim(), createdAt: Date.now() });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [modal, slug, project.name]);

  // Only the 3D modal locks scroll here; BuyerOfficeGate owns its own lock.
  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [modal]);

  // Payment succeeded in the gate (simulated). Record the entitlement under the
  // v2 package model — the single project plan is ₹1,499 (read + 3D), the
  // membership is all-access — then, if the 3D is already open (a dive-in),
  // unlock it so the tapped tower opens.
  function onPaid(plan: Plan) {
    if (plan === "membership") grantPackage("all");
    else grantPackage("read3d", slug);
    setAccess(true);
    if (has3D && modal) postPaid();
  }

  // "See your unit intelligence" from the success / home / booked screens.
  function onSeeUnitIntel() {
    setGateStart(null);
    if (has3D && !modal) setModal(true); // fresh open; onLoad posts entitlement
  }

  const src = meta?.file ? `${basePath}/${meta.file}?v=${ADVISOR_V}` : undefined;

  return (
    <>
      {/* Compact mini teaser — same small footprint for every project */}
      <section id="tower-intel" className="mt-14 scroll-mt-24 overflow-hidden rounded-2xl border border-[#B29668]/20 bg-[#0B1F1A] text-white">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:gap-7 md:p-7">
          <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-44">
            {meta ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${basePath}/${meta.preview}`} alt={`${project.name} — Sun & Vastu 3D`} className="h-full w-full object-cover" />
            ) : (
              <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#123d2e] to-[#0B1F1A]">
                <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 62% 30%, rgba(224,182,103,0.18), transparent 62%)" }} />
                <TowerGlyph />
              </div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(10,15,23,0.05), rgba(10,15,23,0.4))" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[#e0b667]">
              <span aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg></span> {access ? "Your Buyer Office" : "Deep intelligence"}
            </p>
            <p className="mt-2 font-serif text-[1.45rem] leading-[1.15] md:text-[1.6rem]">Sun &amp; Vastu 3D</p>
            <p className="mt-2 text-[0.85rem] font-light leading-[1.6] text-white/55">
              {access ? (
                meta ? (
                  <>You&apos;re unlocked — open your Sun &amp; Vastu 3D any time, or schedule your advisor call.</>
                ) : (
                  <>You&apos;re in. Enter your office to schedule your advisor call and track your intelligence.</>
                )
              ) : meta ? (
                <>Explore the 3D site &amp; sun study, then unlock every unit with All-Access.</>
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
              {meta ? "Explore the Sun & Vastu 3D →" : "See what's inside →"}
            </button>
          )}
        </div>
      </section>

      {/* Full-screen 3D advisor — free to explore; the full verdict is paid */}
      {modal && src && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[#f6f3ea]">
          <div className="flex items-center gap-3 border-b border-black/10 bg-white/70 px-4 py-2 sm:gap-4 sm:px-5 sm:py-3">
            <div className="min-w-0">
              <p className="hidden text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#a67c3d] sm:block">Sun · Heat · Vastu Advisor</p>
              <p className="truncate text-[0.8rem] font-medium text-[#23272e] sm:text-[0.9rem]">{project.name}</p>
            </div>
            <span className="ml-3 hidden rounded-full border border-black/12 px-2.5 py-1 text-[0.62rem] font-light text-[#6f7568] sm:inline">
              {access ? "Full verdict unlocked" : "Free to explore · one sample free"}
            </span>
            <button onClick={() => setModal(false)} aria-label="Close" className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-sm border border-black/15 bg-black/5 text-[0.95rem] text-[#23272e] transition-colors hover:border-[#a67c3d] hover:text-[#a67c3d] sm:h-9 sm:w-9">✕</button>
          </div>
          <iframe
            ref={iframeRef}
            src={src}
            title={`${project.name} — Tower & Unit Intelligence`}
            onLoad={() => { if (has3DAccess(slug)) postPaid(); }}
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
