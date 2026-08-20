"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — MANDATE (Instant Live DB Pricing + Manual Fallback)

   A 3-step structured mandate flow:
     Step 1: The Asset  → city → project name → config → size (sq ft)
     Step 2: The Terms  → instant live DB psf pricing in Crores + slider,
                          or direct manual target price input for external projects
     Step 3: The Buyer  → mandate summary docket + signup & phone OTP verification

   Zero external AI latency: Live DB resolves instantly (<10ms).
   External/untracked projects allow direct manual price entry.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import SiteHeader from "./SiteHeader";
import DealRoomLanding from "./DealRoomLanding";
import OtpDigits from "@/components/auth/OtpDigits";
import { basePath } from "@/lib/site";
import { track } from "@/lib/events";
import { saveLead, isSignedIn, loadAccount } from "@/lib/journey";
import { getSession, signInWithGoogle } from "@/lib/phoneAuth";
import { sendOtp, verifyOtp, OTP_LENGTH } from "@/lib/shortlistAuth";
import { saveMandate } from "@/lib/dealRoomMandate";

/* Cohort capacity is real — keep SEATS_CLAIMED truthful and bump it by hand as
   mandates land (concierge-maintained). Scarcity must never be faked. */
const SEATS_TOTAL = 10;
const SEATS_CLAIMED = 0;
const COHORT = "August cohort";

const CITIES = ["Gurugram", "Delhi", "Noida", "Greater Noida", "Faridabad", "GIFT City (Gandhinagar)", "Other — NCR"];
const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+65", flag: "🇸🇬" },
  { code: "+44", flag: "🇬🇧" }, { code: "+1", flag: "🇺🇸" },
];
const STAGES = ["Still exploring", "Comparing a few", "Finalised it"] as const;
const TIMELINES = ["Within 30 days", "Within 60 days", "Within 90 days", "Flexible"];
const FUNDING = ["Self-funded", "Home loan approved", "Home loan in process", "Not sure yet"];

/* Buyer configurations spread */
const DEFAULT_CONFIGS = ["1 BHK / Studio", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse"];

// Default typical sizes (super sq ft) per config when project has no filed sizes
const DEFAULT_AREAS: Record<string, number> = {
  "1 bhk / studio": 750,
  "2 bhk": 1350,
  "3 bhk": 2150,
  "4 bhk": 3200,
  "5 bhk": 4500,
  penthouse: 5500,
};

const DRAFT_KEY = "truthEstate.dealRoomDraft";
const PHASES = ["The asset", "The terms", "Summary & verify"];

/* Indian digit grouping for a rupee amount (45000000 -> "4,50,00,000"). */
function inrGroup(n: number): string {
  const s = String(Math.max(0, Math.round(n)));
  if (s.length <= 3) return s;
  return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3);
}

/* Format in Crores (e.g. 45000000 -> "₹4.50 Cr") */
function formatCr(n: number): string {
  if (!(n > 0)) return "—";
  const cr = n / 1e7;
  return cr >= 1 ? `₹${cr.toFixed(2)} Cr` : `₹${Math.round(n / 1e5)} L`;
}

function formatCrRange(low: number, high: number): string {
  if (low === high) return formatCr(low);
  const lCr = low / 1e7;
  const hCr = high / 1e7;
  if (lCr >= 1 && hCr >= 1) {
    return `₹${lCr.toFixed(2)} – ₹${hCr.toFixed(2)} Cr`;
  }
  return `₹${inrGroup(low)} – ₹${inrGroup(high)}`;
}

const digitsToNum = (s: string): number => Number((s || "").replace(/[^\d]/g, "")) || 0;

type ResaleDbPrice = {
  text: string;
  low: number;
  high: number;
};

type Draft = {
  city: string;
  project: string;
  config: string;
  sizeSqft: string;
  unit: string;
  stage: string;
  target: string;
  timeline: string;
  funding: string;
  offer: string;
};

const emptyDraft: Draft = {
  city: CITIES[0],
  project: "",
  config: "3 BHK",
  sizeSqft: "",
  unit: "",
  stage: "Finalised it",
  target: "",
  timeline: TIMELINES[0],
  funding: FUNDING[0],
  offer: "",
};

export default function DealRoomMandate() {
  const [screen, setScreen] = useState<"landing" | "wizard" | "done">("landing");
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(emptyDraft);
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [projectConfigs, setProjectConfigs] = useState<Record<string, string[]>>({});
  const [projectPrices, setProjectPrices] = useState<Record<string, [number, number]>>({});
  const [projectPsf, setProjectPsf] = useState<Record<string, { low: number; high: number }>>({});
  const [projectHomes, setProjectHomes] = useState<Record<string, { config: string; superSqft: number }[]>>({});
  const [projOpen, setProjOpen] = useState(false);

  // Pricing resolution state from Live DB
  const [resale, setResale] = useState<ResaleDbPrice | null>(null);
  const [resolvedPsf, setResolvedPsf] = useState<{ low: number; high: number } | null>(null);

  // Auth state (buyer step)
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const resumed = useRef(false);

  const set = (k: keyof Draft, v: string) => setD((p) => ({ ...p, [k]: v }));
  const isIndia = dial === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.length === OTP_LENGTH && otp.every((x) => x !== "");

  /* Reach the surface + resume a Google round-trip */
  useEffect(() => {
    track("deal_room_page_viewed", { props: { source: "mandate" } });
    if (resumed.current) return;
    resumed.current = true;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw && isSignedIn()) {
        const draft = JSON.parse(raw) as Draft;
        submitMandate(draft, "google");
      }
    } catch { /* fail soft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The auto-suggested size must never displace a number the buyer
     TYPED — but until they have typed one, every config change should
     re-suggest, or a stale suggestion prices the wrong layout. A flag,
     not a value comparison: "did a human put this here?" is the actual
     question, and comparing against past suggestions can't answer it. */
  const sizeEdited = useRef(false);

  // When config changes, auto-suggest the filed layout's size.
  // `projOverride` exists for the typeahead pick, which selects project
  // and config in the same tick — reading d.project there would see the
  // HALF-TYPED text (the pick hasn't re-rendered yet), miss the filed
  // layouts, and fall back to a generic area. That fallback then priced
  // a 3,956 sq ft flat as 2,000 sq ft — confidently, in Crores.
  const handleConfigChange = (cfg: string, projOverride?: string) => {
    const proj = (projOverride ?? d.project).trim();
    const homes = projectHomes[proj] || [];
    const matchedHomes = homes.filter((h) => h.config.trim().toLowerCase() === cfg.trim().toLowerCase() && h.superSqft > 0);
    const suggestedSize = matchedHomes.length ? String(matchedHomes[0].superSqft) : String(DEFAULT_AREAS[cfg.toLowerCase()] || 2000);
    setD((prev) => ({
      ...prev,
      config: cfg,
      sizeSqft: sizeEdited.current && prev.sizeSqft ? prev.sizeSqft : suggestedSize,
    }));
  };

  /* Instant Live DB Pricing Calculation:
     Calculates sizeSqft × psfRate from filed project rates */
  function computeLiveDbPrice(project: string, config: string, sizeSqft: number): { price: ResaleDbPrice; psf: { low: number; high: number } } | null {
    const psf = projectPsf[project.trim()];
    if (!psf || !(psf.low > 0) || !(sizeSqft > 0)) return null;
    const lakh = (v: number) => Math.round(v / 1e5) * 1e5;
    const low = lakh(sizeSqft * psf.low);
    const high = lakh(sizeSqft * psf.high);
    const text = formatCrRange(low, high);
    return {
      price: { text, low, high },
      psf,
    };
  }

  const seedTarget = (r: ResaleDbPrice) => {
    if (r.low) {
      setD((p) => (digitsToNum(p.target) === 0 ? { ...p, target: inrGroup(Math.round(r.low * 0.9)) } : p));
    }
  };

  /* Step 1 → Step 2 Transition (Instant, Zero Latency) */
  function goToTerms() {
    const proj = d.project.trim();
    if (!proj) {
      setErr("Please enter a project name.");
      return;
    }
    const sizeNum = digitsToNum(d.sizeSqft) || DEFAULT_AREAS[d.config.toLowerCase()] || 2000;
    if (!d.sizeSqft) {
      set("sizeSqft", String(sizeNum));
    }

    setErr("");
    setProjOpen(false);

    // Instant local DB check
    const fromDb = computeLiveDbPrice(proj, d.config, sizeNum);
    if (fromDb) {
      setResale(fromDb.price);
      setResolvedPsf(fromDb.psf);
      seedTarget(fromDb.price);
    } else {
      // External / Untracked project: user fills target price manually
      setResale(null);
      setResolvedPsf(null);
    }

    setStep(1);
    window.scrollTo(0, 0);
  }

  function openWizard() {
    setScreen("wizard");
    setStep(0);
    setErr("");
    track("deal_room_mandate_started", {});
    window.scrollTo(0, 0);

    if (projectNames.length === 0) {
      type Band = { low?: number; high?: number };
      type IdxEntry = {
        name?: string;
        configs?: string[];
        budget?: [number, number];
        psf?: Band;
        psfOwn?: Band;
        ops?: { homes?: { config?: string; superSqft?: number }[] };
      };
      fetch(`${basePath}/compare-index.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((idx: Record<string, IdxEntry> | null) => {
          if (!idx) return;
          const entries = Object.values(idx).filter((p): p is IdxEntry & { name: string } => !!p?.name);
          setProjectNames(Array.from(new Set(entries.map((p) => p.name))).sort());
          const cfg: Record<string, string[]> = {};
          const price: Record<string, [number, number]> = {};
          const psf: Record<string, { low: number; high: number }> = {};
          const homes: Record<string, { config: string; superSqft: number }[]> = {};
          for (const p of entries) {
            if (Array.isArray(p.configs) && p.configs.length) cfg[p.name] = p.configs;
            if (Array.isArray(p.budget) && p.budget[0] > 0) price[p.name] = [p.budget[0], p.budget[1] ?? p.budget[0]];
            const band = (p.psfOwn?.low ?? 0) > 0 ? p.psfOwn! : (p.psf?.low ?? 0) > 0 ? p.psf! : null;
            if (band) psf[p.name] = { low: band.low!, high: (band.high ?? 0) > 0 ? band.high! : band.low! };
            const hs = (p.ops?.homes ?? [])
              .filter((h) => (h.superSqft ?? 0) > 0 && !!h.config)
              .map((h) => ({ config: h.config!, superSqft: h.superSqft! }));
            if (hs.length) homes[p.name] = hs;
          }
          setProjectConfigs(cfg);
          setProjectPrices(price);
          setProjectPsf(psf);
          setProjectHomes(homes);
        })
        .catch(() => {});
    }
  }

  function configsFor(project: string): string[] {
    const c = projectConfigs[project.trim()];
    return c && c.length ? c : DEFAULT_CONFIGS;
  }

  function go(n: number) {
    setStep(n);
    setErr("");
    window.scrollTo(0, 0);
  }

  function stashDraft() {
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
  }

  function submitMandate(draft: Draft, how: "otp" | "google") {
    const acct = loadAccount();
    const s = getSession();
    saveLead({
      name: (name.trim() || acct?.name || "—"),
      email: s?.email ?? "",
      phone: how === "otp" ? `${dial} ${num}`.trim() : (s?.phone ?? ""),
      project: draft.project.trim() || undefined,
      intent: "deal-room",
      message: `Deal Room mandate — ${draft.city} · ${draft.project.trim() || "—"}${draft.config ? ` (${draft.config})` : ""}${draft.sizeSqft ? ` · ${draft.sizeSqft} sq ft` : ""} · target ₹${draft.target || "—"} · ${draft.timeline}`,
      payload: {
        kind: "deal-room-mandate",
        cohort: COHORT,
        city: draft.city,
        project: draft.project.trim(),
        config: draft.config || null,
        sizeSqft: draft.sizeSqft || null,
        unit: draft.unit.trim() || null,
        stage: draft.stage,
        targetPrice: draft.target.trim() || null,
        marketBenchmark: resale?.text || null,
        timeline: draft.timeline,
        funding: draft.funding,
        offerInHand: draft.offer.trim() || null,
        via: how,
      },
      createdAt: Date.now(),
    });

    saveMandate({
      city: draft.city,
      project: draft.project.trim(),
      config: draft.config,
      sizeSqft: draft.sizeSqft,
      unit: draft.unit.trim(),
      stage: draft.stage,
      target: draft.target.trim(),
      timeline: draft.timeline,
      funding: draft.funding,
      offer: draft.offer.trim(),
      name: name.trim() || acct?.name || "",
      phone: how === "otp" ? `${dial} ${num}`.trim() : (s?.phone ?? ""),
      via: how,
      submittedAt: Date.now(),
    });

    track("deal_room_mandate_submitted", {
      projectName: draft.project.trim() || undefined,
      props: { via: how, stage: draft.stage, city: draft.city, target: draft.target },
    });

    try { window.localStorage.removeItem(DRAFT_KEY); } catch {}
    setScreen("done");
    window.scrollTo(0, 0);
  }

  async function sendCode() {
    if (busy) return;
    if (!numValid) { setErr("Enter a valid mobile number."); return; }
    setErr(""); setBusy(true);
    const r = await sendOtp("mobile", num.replace(/\D/g, ""), dial);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "Couldn't send the code. Try again."); return; }
    setOtpSent(true);
  }

  async function verifySubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (!name.trim()) { setErr("Please add your full name."); return; }
    if (!d.target.trim()) { setErr("Please set your target price in Step 2."); return; }
    if (!otpSent) { await sendCode(); return; }
    if (!otpComplete) { setErr(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setErr(""); setBusy(true);
    const r = await verifyOtp("mobile", num.replace(/\D/g, ""), otp.join(""), name.trim(), dial);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "That code didn't match."); return; }
    submitMandate(d, "otp");
  }

  async function googleContinue() {
    if (busy) return;
    setBusy(true); setErr("");
    stashDraft();
    const r = await signInWithGoogle();
    if (!r.ok) { setBusy(false); setErr(r.error ?? "Google sign-in didn't start — try the number instead."); }
  }

  // ── shared visual styling ──
  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e6b45] px-6 py-3.5 text-[0.92rem] font-semibold text-white shadow-[0_14px_34px_-14px_rgba(30,107,69,.8)] transition-colors hover:bg-[#2e8b57] disabled:opacity-50";
  const btnGhost = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9a96e]/25 px-6 py-3.5 text-[0.9rem] font-medium text-[#f4efe6] transition-colors hover:border-[#c9a96e]/60 hover:bg-[#c9a96e]/[0.08]";
  const label = "block font-mono text-[0.64rem] uppercase tracking-[0.14em] text-[#a9a196] mb-3";
  const field = "w-full rounded-xl border border-[#c9a96e]/20 bg-[#191510] px-4 py-3.5 text-[1rem] text-[#f4efe6] placeholder-[#6f685c] outline-none transition-colors focus:border-[#c9a96e]";
  const eyebrow = "font-mono text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]";

  // ── target calculation & slider anchors ──
  const targetNum = digitsToNum(d.target);
  const mktLow = resale?.low ?? null;
  const mktHigh = resale?.high ?? null;
  const hasBar = mktLow != null && mktHigh != null;
  const barMin = hasBar ? Math.round(mktLow * 0.75) : 0; // Steal deal floor (~25% below market low)
  const barMax = hasBar ? Math.round(mktHigh * 1.05) : 0; // Market top ceiling
  const barVal = hasBar ? Math.min(barMax, Math.max(barMin, targetNum || Math.round(mktLow * 0.9))) : 0;
  const barPct = (v: number) => (barMax > barMin ? Math.min(100, Math.max(0, ((v - barMin) / (barMax - barMin)) * 100)) : 0);

  if (screen === "landing") return <DealRoomLanding onEnter={openWizard} />;

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4efe6]" style={{ fontFeatureSettings: '"ss01"' }}>
      <SiteHeader />

      <div className="mx-auto flex min-h-[calc(100dvh-96px)] max-w-5xl items-start px-6 pb-16 pt-6 md:items-center md:px-10">
        <div className="grid w-full gap-10 md:grid-cols-[200px_1fr] md:gap-14">
          
          {/* Sidebar navigation */}
          <aside className="md:sticky md:top-6 md:self-start">
            <div className="flex gap-2 overflow-x-auto md:flex-col md:gap-0">
              {PHASES.map((p, i) => (
                <div key={p} className={`flex items-start gap-3 py-2.5 transition-opacity ${i === step ? "opacity-100" : "opacity-45"}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[0.72rem] transition-colors ${i < step ? "border-[#1e6b45] bg-[#1e6b45] text-white" : i === step ? "border-[#c9a96e] bg-[#c9a96e]/[0.12] text-[#e7cf95]" : "border-[#c9a96e]/25 text-[#a9a196]"}`}>
                    {i < step ? "✓" : i + 1}
                  </span>
                  <span className={`hidden pt-1 text-[0.85rem] md:block ${i === step ? "text-[#f4efe6]" : "text-[#a9a196]"}`}>{p}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 hidden rounded-lg border border-[#c9a96e]/20 px-3 py-2.5 font-mono text-[0.6rem] uppercase leading-relaxed tracking-[0.1em] text-[#d99a4e] md:block">
              {COHORT}<br />{SEATS_TOTAL - SEATS_CLAIMED} seats left
            </div>
          </aside>

          {/* Step panels */}
          <div>
            {/* STEP 1: City -> Project Name -> Config -> Size */}
            {step === 0 && (
              <div>
                <span className={eyebrow}>Step 1 of 3 · The asset</span>
                <h2 className="mt-2 font-serif text-[1.85rem] font-medium leading-tight">Which home are you buying?</h2>
                <p className="mt-3 max-w-[50ch] text-[0.96rem] leading-relaxed text-[#a9a196]">
                  Select the city, project name, configuration, and unit size to establish the exact pricing benchmark.
                </p>

                <div className="mt-8 flex flex-col gap-7">
                  {/* 1. City */}
                  <div>
                    <span className={label}>City</span>
                    <select value={d.city} onChange={(e) => set("city", e.target.value)} className={`${field} appearance-none`}>
                      {CITIES.map((c) => <option key={c} value={c} className="bg-[#191510]">{c}</option>)}
                    </select>
                  </div>

                  {/* 2. Project Name */}
                  <div>
                    <span className={label}>Project Name</span>
                    <div className="relative">
                      <input
                        value={d.project}
                        onChange={(e) => { set("project", e.target.value); setProjOpen(true); }}
                        onFocus={() => setProjOpen(true)}
                        onBlur={() => setTimeout(() => setProjOpen(false), 160)}
                        autoComplete="off"
                        placeholder="Type or pick a project (e.g. DLF Privana, Smartworld The Edition)"
                        className={field}
                      />
                      {projOpen && d.project.trim().length >= 2 && (() => {
                        const q = d.project.trim().toLowerCase();
                        const matches = projectNames.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
                        if (!matches.length) return null;
                        return (
                          <ul className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-[#c9a96e]/25 bg-[#1d1811] py-1 shadow-[0_20px_44px_-18px_rgba(0,0,0,.75)]">
                            {matches.map((n) => (
                              <li key={n}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    set("project", n);
                                    // A new project is a new context: the
                                    // suggestion engine owns the size again
                                    // until the buyer types over it.
                                    sizeEdited.current = false;
                                    const cfgs = configsFor(n);
                                    const defaultCfg = cfgs[0] || "3 BHK";
                                    // Pass n explicitly — d.project still
                                    // holds the half-typed query this tick.
                                    handleConfigChange(defaultCfg, n);
                                    setProjOpen(false);
                                  }}
                                  className="block w-full px-4 py-2.5 text-left text-[0.9rem] text-[#f4efe6] transition-colors hover:bg-[#c9a96e]/[0.12]"
                                >
                                  {n}
                                </button>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                    {projectNames.length > 0 && (
                      <p className="mt-2 text-[0.72rem] text-[#6f685c]">{projectNames.length}+ tracked projects with live filed rates — or type any custom project name.</p>
                    )}
                  </div>

                  {/* 3. Configuration */}
                  <div>
                    <span className={label}>Configuration</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {configsFor(d.project).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleConfigChange(c)}
                          aria-pressed={d.config === c}
                          className={`rounded-xl border px-3 py-3 text-[0.84rem] font-medium transition-colors ${d.config === c ? "border-[#c9a96e] bg-[#c9a96e]/[0.12] text-[#e7cf95]" : "border-[#c9a96e]/20 bg-[#191510] text-[#a9a196] hover:border-[#c9a96e]/50 hover:text-[#f4efe6]"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Unit Size (Super Built-up Area) */}
                  <div>
                    <span className={label}>Unit Size (Super Built-up Area in Sq Ft)</span>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={d.sizeSqft}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          // A keystroke here is the buyer taking the field
                          // over; clearing it hands it back to the engine.
                          sizeEdited.current = !!val;
                          set("sizeSqft", val ? inrGroup(Number(val)) : "");
                        }}
                        placeholder={String(DEFAULT_AREAS[d.config.toLowerCase()] || 2150)}
                        className={field}
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[0.82rem] text-[#6f685c]">
                        sq ft
                      </span>
                    </div>
                    {/* Size suggestions if project has filed unit areas */}
                    {(() => {
                      const proj = d.project.trim();
                      const homes = (projectHomes[proj] || []).filter((h) => h.config.trim().toLowerCase() === d.config.trim().toLowerCase() && h.superSqft > 0);
                      if (!homes.length) return null;
                      return (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-[0.72rem] text-[#6f685c]">Filed layouts:</span>
                          {homes.map((h) => (
                            <button
                              key={h.superSqft}
                              type="button"
                              onClick={() => { sizeEdited.current = true; set("sizeSqft", String(h.superSqft)); }}
                              className={`rounded-lg border px-2.5 py-1 text-[0.74rem] transition-colors ${d.sizeSqft === String(h.superSqft) ? "border-[#c9a96e] bg-[#c9a96e]/20 text-[#e7cf95]" : "border-[#c9a96e]/20 bg-[#191510] text-[#a9a196] hover:border-[#c9a96e]/40"}`}
                            >
                              {inrGroup(h.superSqft)} sq ft
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Optional: Unit / Tower details */}
                  <div>
                    <span className={label}>Unit Details <span className="ml-1 text-[#6f685c]">optional</span></span>
                    <input value={d.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Tower / floor / facing (if finalized)" className={field} />
                  </div>
                </div>

                {err && <p className="mt-4 text-[0.84rem] text-[#e6a189]">{err}</p>}

                <div className="mt-9 flex justify-between items-center">
                  <button onClick={() => setScreen("landing")} className="text-[0.85rem] text-[#a9a196] hover:text-[#f4efe6]">← Back</button>
                  <button onClick={goToTerms} disabled={!d.project.trim()} className={btnPrimary}>
                    Continue to Pricing →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Live Pricing in Crores + Slider (or Manual Target Entry) + Context Questions */}
            {step === 1 && (
              <div>
                <span className={eyebrow}>Step 2 of 3 · The terms</span>
                <h2 className="mt-2 font-serif text-[1.85rem] font-medium leading-tight">What would a win look like?</h2>
                <p className="mt-3 max-w-[52ch] text-[0.96rem] leading-relaxed text-[#a9a196]">
                  Set the target price in Crores you&apos;d be thrilled to close at. On the call, we benchmark it against live market comps so you negotiate with verified data.
                </p>

                {/* Benchmark & Target Price Card */}
                <div className="mt-8 overflow-hidden rounded-2xl border border-[#c9a96e]/25 bg-gradient-to-b from-[#221c13] to-[#18140f] p-6 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
                  
                  {/* Case A: Tracked in Live DB -> Show Benchmark Range & PSF */}
                  {hasBar && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c9a96e]/15 pb-4">
                      <div>
                        <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c9a96e]">Estimated Current Market Price</span>
                        <p className="mt-1 font-serif text-[1.65rem] font-semibold leading-tight text-[#e7cf95]">
                          {resale!.text}
                        </p>
                      </div>
                      {resolvedPsf && (
                        <div className="text-right">
                          <span className="rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.06em] text-[#e7cf95]">
                            @ ₹{inrGroup(resolvedPsf.low)}/sq ft
                          </span>
                          <p className="mt-1 text-[0.72rem] text-[#a9a196]">
                            for {d.sizeSqft ? `${d.sizeSqft} sq ft` : ""} {d.config}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case B: External / Untracked Project -> Manual Entry Note */}
                  {!hasBar && (
                    <div className="border-b border-[#c9a96e]/15 pb-4">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c9a96e]">Custom Project Mandate</span>
                      <p className="mt-1 font-serif text-[1.3rem] font-medium leading-tight text-[#f4efe6]">
                        {d.project} ({d.config} · {d.sizeSqft ? `${d.sizeSqft} sq ft` : ""})
                      </p>
                      <p className="mt-1.5 text-[0.8rem] text-[#a9a196]">
                        Enter your target price directly below. We will ground it against verified off-market seller comps on your lock-in call.
                      </p>
                    </div>
                  )}

                  {/* Target Price Big Input in Crores */}
                  <div className="mt-6">
                    <span className={label}>Your Target Closing Price</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-serif text-[1.9rem] leading-none text-[#6f685c]">₹</span>
                      <input
                        value={d.target}
                        onChange={(e) => {
                          const dg = e.target.value.replace(/\D/g, "");
                          set("target", dg ? inrGroup(Number(dg)) : "");
                        }}
                        inputMode="numeric"
                        placeholder="2,50,00,000"
                        className="w-full rounded-2xl border border-[#c9a96e]/25 bg-[#14110d] py-5 pl-12 pr-28 font-serif text-[1.9rem] font-semibold leading-none text-[#f4efe6] placeholder-[#4a453d] outline-none transition-colors focus:border-[#c9a96e]"
                      />
                      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-serif text-[1.2rem] font-medium text-[#e7cf95]">
                        {targetNum ? formatCr(targetNum) : ""}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Slider Bar (rendered when DB benchmark exists) */}
                  {hasBar && (
                    <div className="mt-7">
                      <div className="relative select-none">
                        <div className="relative h-3 rounded-full bg-gradient-to-r from-[#1e6b45] via-[#c9a96e] to-[#8a5a2b]">
                          {/* Market band overlay */}
                          <div
                            className="absolute inset-y-0 rounded-full bg-[#14110d]/40 ring-1 ring-inset ring-[#f4efe6]/30"
                            style={{ left: `${barPct(mktLow!)}%`, right: `${100 - barPct(mktHigh!)}%` }}
                            aria-hidden
                          />
                        </div>
                        {/* Interactive thumb */}
                        <div
                          className="pointer-events-none absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#c9a96e] bg-[#f4efe6] shadow-[0_2px_8px_rgba(0,0,0,.6)]"
                          style={{ left: `${barPct(barVal)}%` }}
                          aria-hidden
                        />
                        <input
                          type="range"
                          min={barMin}
                          max={barMax}
                          step={50000}
                          value={barVal}
                          onChange={(e) => set("target", inrGroup(Number(e.target.value)))}
                          aria-label="Target closing price slider"
                          className="absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent opacity-0"
                        />
                      </div>

                      <div className="mt-2.5 flex justify-between font-mono text-[0.58rem] uppercase tracking-[0.14em]">
                        <span className="text-[#7fd0a3]">◀ Steal deal ({formatCr(barMin)})</span>
                        <span className="text-[#d99a4e]">Market top ({formatCr(barMax)}) ▶</span>
                      </div>

                      {/* Live Target Assessment */}
                      <div className="mt-4 border-t border-[#c9a96e]/10 pt-3 text-[0.88rem]">
                        {(() => {
                          const t = targetNum || barVal;
                          if (!t) return <span className="text-[#6f685c]">Slide to set your target price.</span>;
                          if (t < mktLow!) {
                            const diffPct = Math.max(1, Math.round(((mktLow! - t) / mktLow!) * 100));
                            return (
                              <p className="text-[#f4efe6]">
                                Target <b className="font-serif text-[1.05rem] text-[#e7cf95]">{formatCr(t)}</b> (~₹{inrGroup(t)}) —{" "}
                                <span className="text-[#7fd0a3] font-medium">~{diffPct}% below market floor — a strong ask we go get.</span>
                              </p>
                            );
                          }
                          if (t <= mktHigh!) {
                            return (
                              <p className="text-[#f4efe6]">
                                Target <b className="font-serif text-[1.05rem] text-[#e7cf95]">{formatCr(t)}</b> (~₹{inrGroup(t)}) —{" "}
                                <span className="text-[#d9b45e] font-medium">within today’s market trading range.</span>
                              </p>
                            );
                          }
                          return (
                            <p className="text-[#f4efe6]">
                              Target <b className="font-serif text-[1.05rem] text-[#e7cf95]">{formatCr(t)}</b> —{" "}
                              <span className="text-[#e6a189]">above market rate — we will negotiate lower for you.</span>
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Context Questions */}
                <div className="mt-8 flex flex-col gap-7">
                  <div>
                    <span className={label}>How set are you on this home?</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => set("stage", s)}
                          aria-pressed={d.stage === s}
                          className={`rounded-xl border px-3 py-3.5 text-[0.86rem] transition-colors ${d.stage === s ? "border-[#c9a96e] bg-[#c9a96e]/[0.12] text-[#e7cf95]" : "border-[#c9a96e]/20 bg-[#191510] text-[#a9a196] hover:border-[#c9a96e]/50 hover:text-[#f4efe6]"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className={label}>Already been quoted a price? <span className="ml-1 text-[#6f685c]">optional</span></span>
                    <textarea
                      value={d.offer}
                      onChange={(e) => set("offer", e.target.value)}
                      placeholder="Paste what a broker or owner quoted — base rate, floor rise, PLC, or parking. It helps us beat it."
                      className={`${field} min-h-[76px] resize-y text-[0.92rem]`}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className={label}>Timeline to close</span>
                      <select value={d.timeline} onChange={(e) => set("timeline", e.target.value)} className={`${field} appearance-none`}>
                        {TIMELINES.map((t) => <option key={t} className="bg-[#191510]">{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className={label}>How are you funding it?</span>
                      <select value={d.funding} onChange={(e) => set("funding", e.target.value)} className={`${field} appearance-none`}>
                        {FUNDING.map((f) => <option key={f} className="bg-[#191510]">{f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-9 flex justify-between items-center">
                  <button onClick={() => go(0)} className="text-[0.85rem] text-[#a9a196] hover:text-[#f4efe6]">← Back</button>
                  <button onClick={() => go(2)} disabled={!d.target.trim()} className={btnPrimary}>
                    Continue to Summary →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Summary Docket + Buyer Signup & Verification */}
            {step === 2 && (
              <form onSubmit={verifySubmit}>
                <span className={eyebrow}>Step 3 of 3 · Summary &amp; verify</span>
                <h2 className="mt-2 font-serif text-[1.85rem] font-medium leading-tight">Review your mandate &amp; sign up.</h2>
                <p className="mt-3 max-w-[50ch] text-[0.96rem] leading-relaxed text-[#a9a196]">
                  Sellers only compete for verified buyers — it&apos;s why offers come in writing. No upfront fee.
                </p>

                {/* Summary Docket Card */}
                <div className="mt-8 rounded-2xl border border-[#c9a96e]/30 bg-[#1b1712] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between border-b border-[#c9a96e]/15 pb-3">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c9a96e]">Mandate Summary Docket</span>
                    <span className="rounded-full bg-[#1e6b45]/20 px-2.5 py-0.5 text-[0.65rem] font-semibold text-[#7fd0a3]">Ready to float</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-[0.86rem] sm:grid-cols-3">
                    <div>
                      <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-[#6f685c]">Project &amp; Asset</span>
                      <p className="mt-0.5 font-medium text-[#f4efe6]">{d.project}</p>
                      <p className="text-[0.76rem] text-[#a9a196]">{d.config} · {d.sizeSqft} sq ft</p>
                    </div>

                    <div>
                      <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-[#6f685c]">Target Price</span>
                      <p className="mt-0.5 font-serif text-[1.1rem] font-bold text-[#e7cf95]">
                        {targetNum ? formatCr(targetNum) : `₹${d.target}`}
                      </p>
                      <p className="text-[0.74rem] text-[#7fd0a3]">
                        {targetNum && mktLow && targetNum < mktLow ? `~${Math.round(((mktLow - targetNum) / mktLow) * 100)}% below market` : "Negotiated rate"}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-[#6f685c]">Timeline &amp; Funding</span>
                      <p className="mt-0.5 font-medium text-[#f4efe6]">{d.timeline}</p>
                      <p className="text-[0.76rem] text-[#a9a196]">{d.funding}</p>
                    </div>
                  </div>
                </div>

                {/* Signup & Verification Inputs */}
                <div className="mt-8 flex flex-col gap-5">
                  <div>
                    <span className={label}>Full Name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={field} />
                  </div>

                  <div>
                    <span className={label}>Mobile Number</span>
                    <div className="flex gap-3">
                      <div className="w-[116px] shrink-0">
                        <select value={dial} onChange={(e) => setDial(e.target.value)} disabled={otpSent} className={`${field} appearance-none`}>
                          {DIAL.map((x) => <option key={x.code} value={x.code} className="bg-[#191510]">{x.flag} {x.code}</option>)}
                        </select>
                      </div>
                      <input
                        value={num}
                        onChange={(e) => setNum(e.target.value.replace(/[^\d\s]/g, ""))}
                        disabled={otpSent}
                        inputMode="tel"
                        placeholder="98xxxxxx21"
                        className={`${field} min-w-0 flex-1`}
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="rounded-xl border border-[#c9a96e]/20 bg-[#16120d] p-4">
                      <p className="mb-3 text-[0.8rem] text-[#a9a196]">
                        Enter the {OTP_LENGTH}-digit code sent to {dial} {num}{" · "}
                        <button type="button" onClick={() => { setOtpSent(false); setOtp(Array(OTP_LENGTH).fill("")); setErr(""); }} className="text-[#c9a96e] hover:underline">
                          change number
                        </button>
                      </p>
                      <OtpDigits
                        value={otp}
                        onChange={setOtp}
                        len={OTP_LENGTH}
                        autoFocus
                        onComplete={verifySubmit}
                        boxClass="h-14 w-full rounded-lg border border-[#c9a96e]/25 bg-[#191510] text-center font-serif text-[1.3rem] text-[#f4efe6] outline-none focus:border-[#c9a96e]"
                      />
                    </div>
                  )}
                </div>

                {err && <p className="mt-3 text-[0.82rem] text-[#e6a189]">{err}</p>}

                <button type="submit" disabled={busy} className={`mt-6 w-full ${btnPrimary}`}>
                  {busy ? (otpSent ? "Verifying…" : "Sending…") : otpSent ? "Verify & Submit Deal Room Mandate →" : "Send Verification Code →"}
                </button>

                {!otpSent && (
                  <>
                    <div className="my-5 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#6f685c]">
                      <span className="h-px flex-1 bg-[#c9a96e]/10" />or<span className="h-px flex-1 bg-[#c9a96e]/10" />
                    </div>
                    <button
                      type="button"
                      onClick={googleContinue}
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-6 py-3.5 text-[0.92rem] font-semibold text-[#1a1a1a] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M23.7 12.3c0-.7-.1-1.4-.2-2.1H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3h3.9c2.3-2.1 3.6-5.2 3.6-9.1z" />
                        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.8-2.1-6.7-4.9H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
                        <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
                        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" />
                      </svg>
                      Continue with Google
                    </button>
                  </>
                )}

                <div className="mt-6">
                  <button type="button" onClick={() => go(1)} className="text-[0.85rem] text-[#a9a196] hover:text-[#f4efe6]">← Back to Pricing</button>
                </div>
                <p className="mt-4 text-[0.76rem] text-[#6f685c]">
                  Zero upfront cost. We never share your phone number with brokers.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Done Screen */}
      {screen === "done" && (
        <div className="mx-auto max-w-xl px-6 py-20 text-center md:px-10">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-[#2e8b57] bg-[#1e6b45]/[0.14] text-[#7fd0a3]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <span className={eyebrow}>{COHORT} · you&apos;re in</span>
          <h2 className="mt-3 font-serif text-[2rem] font-medium leading-tight">The market goes to work for you.</h2>
          <p className="mx-auto mt-4 max-w-[42ch] text-[0.96rem] text-[#a9a196]">
            Your mandate is logged for <b className="text-[#f4efe6]">{d.project}</b> ({d.config} · {d.sizeSqft} sq ft) at target <b className="text-[#e7cf95]">{targetNum ? formatCr(targetNum) : `₹${d.target}`}</b>.
          </p>

          <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-[#c9a96e]/25 bg-[#1d1811] px-5 py-3 text-[0.9rem]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e7cf95" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <span>An advisor calls you <b className="text-[#e7cf95]">within 24 hours</b> to ground and float your mandate.</span>
          </div>

          <div className="mx-auto mt-9 max-w-md rounded-2xl border border-[#c9a96e]/12 bg-[#1d1811] text-left">
            <p className="px-6 pt-5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#6f685c]">What happens next</p>
            <ol className="px-6 pb-4">
              {[
                "The lock-in call (within 24h). We confirm your mandate and ground your target against the real market.",
                "We float it (day 1). Your mandate goes to verified brokers, owners and developers — you stay anonymous.",
                "Offers land (2–4 days). Written, all-in, posted to your account as they come.",
                "You compare & we connect. Like an offer? We set up the call and keep every promise on the record."
              ].map((t, i) => (
                <li key={i} className="flex gap-3.5 border-b border-[#c9a96e]/10 py-3 text-[0.88rem] text-[#a9a196] last:border-none">
                  <span className="font-mono text-[0.7rem] text-[#c9a96e]">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="mx-auto mt-5 max-w-md border-l-2 border-[#c9a96e]/25 pl-4 text-left text-[0.78rem] leading-relaxed text-[#6f685c]">
            <b className="text-[#a9a196]">How we&apos;re paid — plainly.</b> Nothing to join. When you&apos;re confident enough to meet a seller, a fully refundable <b className="text-[#a9a196]">₹11,000</b> holds your seat — back in 60 days if nothing closes, no questions. After that we earn only a share of what we actually save you versus the market — never a rupee from the sellers, and nothing if we don&apos;t beat it.
          </p>

          <div className="mt-9 flex justify-center gap-4">
            <a href={`${basePath}/deal-room/track`} className={btnPrimary}>Track my mandate →</a>
            <button onClick={() => { setScreen("landing"); window.scrollTo(0, 0); }} className={btnGhost}>Back to the Deal Room</button>
          </div>
        </div>
      )}
    </div>
  );
}
