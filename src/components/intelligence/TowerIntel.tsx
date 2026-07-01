"use client";

import { useEffect, useState } from "react";
import { isUnlocked, unlockProject, saveLead, loadBuyData } from "@/lib/journey";
import type { ProjectIntel, TowerIntelMeta } from "@/lib/projects";

const basePath = "/Truth-Estate";
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export default function TowerIntel({ project, meta }: { project: ProjectIntel; meta?: TowerIntelMeta }) {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [gate, setGate] = useState(false);
  const [modal, setModal] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [err, setErr] = useState("");

  useEffect(() => {
    setMounted(true);
    setUnlocked(isUnlocked(project.slug));
  }, [project.slug]);

  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modal]);

  const file = meta?.file;
  const src = file ? `${basePath}/${file}` : undefined;
  const set = (k: "name" | "email" | "phone") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submitUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !emailOk(form.email)) {
      setErr("Please enter your name and a valid email.");
      return;
    }
    saveLead({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, project: project.name, intent: "tower-intel", buy: loadBuyData() ?? undefined, createdAt: Date.now() });
    unlockProject(project.slug);
    setErr("");
    setUnlocked(true);
    setGate(false);
    setModal(true);
  }

  function submitWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk(form.email)) {
      setErr("Please enter a valid email.");
      return;
    }
    saveLead({ name: form.name.trim() || "—", email: form.email.trim(), project: project.name, intent: "tower-intel", createdAt: Date.now() });
    setErr("");
    setDone(true);
  }

  const heading = "Tower & Unit Intelligence";
  const blurb = "A 3D site model that grades every unit by direct sun at the site's true latitude — plus Vastu, cross-ventilation, views and the best-value stacks. The layer most buyers never see until it's too late.";

  /* ── No model yet: the honest "in production" hook + waitlist ── */
  if (!meta) {
    return (
      <section id="tower-intel" className="mt-14 scroll-mt-24 overflow-hidden rounded-2xl border border-dashed border-[#c9a96e]/45 bg-[#0d1a12] p-8 text-white md:p-9">
        <p className="flex items-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#e0b667]"><span aria-hidden>▦</span> In production · deep intelligence</p>
        <p className="mt-3 font-serif text-[1.5rem] leading-[1.3]">{heading} — coming to {project.name}</p>
        <p className="mt-2 max-w-xl text-[0.9rem] font-light leading-[1.7] text-white/60">{blurb} Our engineers are modelling {project.name} now.</p>
        {done ? (
          <p className="mt-6 text-[0.9rem] font-light text-[#7fd6a4]">Done — you&apos;re on the early-access list for {project.name}.</p>
        ) : (
          <form onSubmit={submitWaitlist} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input value={form.email} onChange={set("email")} type="email" placeholder="you@email.com" className="w-full rounded-sm border border-white/15 bg-white/5 px-4 py-3 text-[0.88rem] text-white placeholder-white/35 outline-none focus:border-[#e0b667] sm:max-w-xs" />
            <button className="shrink-0 rounded-sm bg-[#e0b667] px-6 py-3 text-[0.82rem] font-semibold tracking-[0.03em] text-[#1a1206] transition-colors hover:bg-[#f0cd85]">Get early access</button>
          </form>
        )}
        {err && !done && <p className="mt-2 text-[0.78rem] text-[#f0a68f]">{err}</p>}
      </section>
    );
  }

  const showUnlocked = mounted && unlocked;

  return (
    <>
      <section id="tower-intel" className="mt-14 scroll-mt-24 overflow-hidden rounded-2xl border border-[#1f3a4d]/40 bg-[#0a0f17] text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)]">
        {/* Real preview of the live 3D advisor */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${basePath}/${meta.preview}`} alt={`${project.name} — 3D sun & unit advisor`} className="h-52 w-full object-cover object-center md:h-64" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,15,23,0.15) 0%, rgba(10,15,23,0.5) 55%, #0a0f17 100%)" }} />
          <div className="absolute inset-x-6 top-5 flex items-center justify-between">
            <p className="flex items-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-[#e0b667]"><span aria-hidden>▦</span> Deep intelligence</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[0.6rem] font-medium tracking-[0.06em] text-white/75 backdrop-blur">
              {showUnlocked ? "Unlocked" : <><LockIcon /> Locked · live preview</>}
            </span>
          </div>
          {!showUnlocked && (
            <button onClick={() => setGate(true)} aria-label="Unlock" className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/45 backdrop-blur transition-transform hover:scale-105"><LockIcon big /></span>
            </button>
          )}
        </div>

        <div className="p-8 pt-6 md:p-10 md:pt-7">
          <h2 className="font-serif text-[1.9rem] font-medium leading-[1.15] md:text-[2.3rem]">{heading}</h2>
          <p className="mt-3 max-w-xl text-[0.92rem] font-light leading-[1.75] text-white/65">{blurb}</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {["3D site & tower model", "Sun-path per unit", "Vastu score", "Cross-ventilation", "Best-value stacks"].map((t) => (
              <span key={t} className="rounded-full border border-white/12 px-3 py-1.5 text-[0.72rem] font-light text-white/55">{t}</span>
            ))}
          </div>

          {/* Free sample unit — mirrors the advisor's own #1-for-sun pick */}
          {!showUnlocked && (
            <div className="mt-6 rounded-xl border border-[#46c2ff]/25 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#46c2ff]">Free sample · 1 of {meta.unitTypes} layouts</p>
                <span className="rounded-full border border-[#ffce63]/40 bg-[#ffce63]/10 px-2.5 py-0.5 text-[0.66rem] font-semibold text-[#ffe3a6]">☀ Best for winter sun</span>
              </div>
              <p className="mt-3 font-mono text-[0.74rem] text-white/45">{meta.sample.ref}</p>
              <p className="font-serif text-[1.3rem] leading-tight text-white">{meta.sample.type}</p>
              <div className="mt-4">
                <div className="flex justify-between text-[0.66rem] text-white/45"><span>Direct sun · winter</span><span className="text-[#ffce63]">{meta.sample.sun}</span></div>
                <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full" style={{ width: `${meta.sample.sunPct}%`, background: "linear-gradient(90deg,#b9742a,#ffce63)" }} /></div>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <Fact k="Ventilation" v={meta.sample.ventilation} />
                <Fact k="Vastu" v={meta.sample.vastu} />
                <Fact k="Ideal for" v={meta.sample.idealFor} />
                <Fact k="Sun rank" v={`Top of ${meta.totalUnits} units`} />
              </div>
              <p className="mt-4 border-t border-white/8 pt-3 text-[0.78rem] font-light leading-[1.6] text-white/50">
                That&apos;s one sample. Unlocked, we score <b className="font-medium text-white/80">all {meta.totalUnits} units across {meta.towers} towers</b> — sun-path, Vastu, light, views and value — and surface the best stack for <span className="italic">you</span>.
              </p>
            </div>
          )}

          {showUnlocked ? (
            <button onClick={() => setModal(true)} className="mt-8 inline-flex items-center gap-2 rounded-sm bg-[#46c2ff] px-7 py-3.5 text-[0.86rem] font-semibold tracking-[0.02em] text-[#04121c] transition-colors hover:bg-[#6fd0ff]">
              Open Tower &amp; Unit Intelligence <span aria-hidden>→</span>
            </button>
          ) : !gate ? (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button onClick={() => setGate(true)} className="inline-flex items-center gap-2 rounded-sm bg-[#e0b667] px-7 py-3.5 text-[0.86rem] font-semibold tracking-[0.02em] text-[#1a1206] transition-colors hover:bg-[#f0cd85]">
                <LockIcon dark /> Unlock free — see your best unit
              </button>
              <p className="text-[0.76rem] font-light text-white/45">Free with a Buyer Office profile. No payment.</p>
            </div>
          ) : (
            <form onSubmit={submitUnlock} className="mt-8 max-w-md rounded-xl border border-white/12 bg-white/[0.03] p-5">
              <p className="text-[0.78rem] font-medium text-white/80">Open your Buyer Office file to unlock</p>
              <p className="mt-1 text-[0.72rem] font-light leading-[1.5] text-white/45">Your report, saved. The full tower &amp; unit intelligence, unlocked. One advisor, on the record.</p>
              <div className="mt-4 flex flex-col gap-2.5">
                <input value={form.name} onChange={set("name")} placeholder="Full name" className="rounded-sm border border-white/15 bg-white/5 px-4 py-2.5 text-[0.86rem] text-white placeholder-white/35 outline-none focus:border-[#e0b667]" />
                <input value={form.email} onChange={set("email")} type="email" placeholder="you@email.com" className="rounded-sm border border-white/15 bg-white/5 px-4 py-2.5 text-[0.86rem] text-white placeholder-white/35 outline-none focus:border-[#e0b667]" />
                <input value={form.phone} onChange={set("phone")} placeholder="Phone / WhatsApp (optional)" className="rounded-sm border border-white/15 bg-white/5 px-4 py-2.5 text-[0.86rem] text-white placeholder-white/35 outline-none focus:border-[#e0b667]" />
              </div>
              {err && <p className="mt-2 text-[0.76rem] text-[#f0a68f]">{err}</p>}
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-sm bg-[#46c2ff] px-6 py-2.5 text-[0.82rem] font-semibold text-[#04121c] transition-colors hover:bg-[#6fd0ff]">Unlock intelligence</button>
                <button type="button" onClick={() => { setGate(false); setErr(""); }} className="text-[0.78rem] font-light text-white/45 hover:text-white/75">Cancel</button>
              </div>
              <p className="mt-3 text-[0.68rem] font-light text-white/30">We use this to build your file and reach you — never to spam. Front-end demo.</p>
            </form>
          )}
        </div>
      </section>

      {/* Full-screen 3D advisor */}
      {modal && src && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[#0a0f17]">
          <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
            <div>
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#e0b667]">Tower &amp; Unit Intelligence</p>
              <p className="text-[0.9rem] font-medium text-white">{project.name}</p>
            </div>
            <button onClick={() => setModal(false)} className="ml-auto rounded-sm border border-white/15 bg-white/5 px-4 py-2 text-[0.78rem] font-medium tracking-[0.04em] text-white transition-colors hover:border-[#46c2ff]">
              Close ✕
            </button>
          </div>
          <iframe src={src} title={`${project.name} — Tower & Unit Intelligence`} className="min-h-0 flex-1 border-0" />
        </div>
      )}
    </>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-white/35">{k}</p>
      <p className="mt-1 text-[0.78rem] font-light leading-[1.45] text-white/70">{v}</p>
    </div>
  );
}

function LockIcon({ dark, big }: { dark?: boolean; big?: boolean }) {
  const s = big ? 20 : 11;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden className="inline-block">
      <rect x="4" y="10" width="16" height="11" rx="2" fill={dark ? "#1a1206" : "currentColor"} opacity={dark ? 1 : 0.85} />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={dark ? "#1a1206" : "currentColor"} strokeWidth="2" fill="none" />
    </svg>
  );
}
