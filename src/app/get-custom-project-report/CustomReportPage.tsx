"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import OtpSheet from "@/components/shortlist/OtpSheet";
import { saveLead, emptyBuyData, type BuyData } from "@/lib/journey";
import { pushDemand } from "@/lib/heroSearch";
import { maskContact, type Verified } from "@/lib/shortlistAuth";

/* ════════════════════════════════════════════════════════════════
   GET A CUSTOM PROJECT REPORT — the destination for the homepage
   search's "Request a custom report" (a project we don't cover yet).
   A branching two-step form that captures a VERIFIED lead against a
   specific project, pan-India:
     Step 1 · the project + intent (looking to invest / already invested)
     Step 2 · requirements (only when "looking to invest") → name +
              OTP-verified mobile → a ₹999 willingness signal
     → a premium thank-you.
   Layout: desktop is two columns (the pitch on the left, sticky; the
   form on the right). Mobile stacks to one column with a persistent
   bottom CTA bar so the primary action is always in view.
   Reuses OtpSheet (verification) and saveLead/pushDemand (persistence).
   ════════════════════════════════════════════════════════════════ */

const CITIES = ["Gurugram", "Mumbai", "Bengaluru", "Pune", "Hyderabad", "Noida"];
const CONFIGS = ["2 BHK", "3 BHK", "4 BHK", "Penthouse"];
const BUDGETS = ["Under ₹3 Cr", "₹3–5 Cr", "₹5–8 Cr", "₹8 Cr+"];
const HOLDING = ["1–3 yrs", "3–5 yrs", "5+ yrs"];
const TRUST: [string, string][] = [
  ["No developer money", "— ever"],
  ["Buyer-side only", ", never shared"],
  ["Flat fee", ", confirmed upfront"],
  ["The founder reviews", " every request"],
];

type Intent = "looking" | "invested";

const chip = (on: boolean) =>
  `rounded-full border px-3.5 py-2 text-[0.84rem] font-medium transition-colors ${
    on ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#1a1a1a]/22 bg-white text-[#1a1a1a]/70 hover:border-[#9a7a2e]/70"
  }`;

export default function CustomReportPage() {
  const [step, setStep] = useState<1 | 2>(1);

  // step 1 — the project
  const [project, setProject] = useState("");
  const [developer, setDeveloper] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [cityOther, setCityOther] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);

  // step 2 — requirements (looking only) + contact + willingness
  const [config, setConfig] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [holding, setHolding] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [verified, setVerified] = useState<Verified | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [pay999, setPay999] = useState<"yes" | "no" | null>(null);

  const [done, setDone] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const firstStep = useRef(true);

  // prefill the project from the search that sent them here (?project= / ?q=)
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const q = p.get("project") || p.get("q");
      if (q) setProject(q);
    } catch {
      /* ignore */
    }
  }, []);

  // on step change, bring the form back into view (matters on mobile)
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const looking = intent === "looking";
  const cityFinal = (city && city !== "Other" ? city : cityOther).trim();
  const step1ok = project.trim().length > 0 && cityFinal.length > 0 && intent !== null;
  const step2ok = name.trim().length > 0 && verified !== null && pay999 !== null;

  // one source of truth for the primary CTA, shared by the in-card button
  // (desktop) and the sticky bottom bar (mobile)
  const primaryLabel = step === 1 ? "Continue →" : "Request my report →";
  const primaryDisabled = step === 1 ? !step1ok : !step2ok;
  const primaryAction = () => (step === 1 ? setStep(2) : submit());

  function submit() {
    if (!step2ok) return;
    const buy: BuyData | undefined = looking
      ? {
          ...emptyBuyData,
          purchaseType: "Investment",
          configs: config ? [config] : [],
          locations: cityFinal ? [cityFinal] : [],
          notes: [budget && `Budget ${budget}`, holding && `Holding ${holding}`].filter(Boolean).join(" · "),
        }
      : undefined;
    saveLead({
      name: name.trim(),
      email: "",
      phone: verified ? `${verified.cc ?? ""} ${verified.contact}`.trim() : undefined,
      project: project.trim(),
      intent: "custom-report",
      message: [
        looking ? "Looking to invest" : "Already invested",
        cityFinal,
        developer.trim() && `Developer: ${developer.trim()}`,
        `Would pay ₹999: ${pay999}`,
      ]
        .filter(Boolean)
        .join(" · "),
      buy,
      createdAt: Date.now(),
    });
    pushDemand(project.trim());
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="border-b border-[#1a1a1a]/[0.07]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <a href="/Truth-Estate" aria-label="Truth Estate — home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">The Independent Buyer&rsquo;s Office</span>
        </div>
      </header>

      {done ? (
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-10 md:px-8 md:pt-14">
          <Success project={project} contact={verified ? maskContact(verified) : ""} looking={looking} pay={pay999} />
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-6 pb-32 pt-10 md:px-8 md:pt-14 lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:items-start lg:gap-14 lg:pb-24 xl:gap-20">
          {/* ── LEFT · the pitch (sticky on desktop) ── */}
          <div className="lg:sticky lg:top-14 lg:self-start">
            <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#9a7a2e]">Custom Report</p>
            <h1 className="mt-3 max-w-[15ch] font-serif text-[2.15rem] font-medium leading-[1.05] tracking-[-0.01em] md:text-[2.9rem] lg:text-[3rem]">
              Considering a project we haven&rsquo;t covered?
            </h1>
            <p className="mt-4 max-w-[46ch] text-[1.02rem] font-light leading-relaxed text-[#1a1a1a]/65">
              Tell us the project — anywhere in India. Our analysts build you the same independent, buyer-side report, from
              RERA filings and public records. <b className="font-medium text-[#1a1a1a]">Never paid by builders.</b>
            </p>
            <span className="mt-4 inline-block rounded-full bg-[#9a7a2e]/12 px-3 py-1.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#9a7a2e]">
              ✦ Now pan-India
            </span>

            {/* trust — vertical list, desktop only */}
            <ul className="mt-9 hidden gap-3 border-t border-[#1a1a1a]/10 pt-7 lg:grid">
              {TRUST.map(([a, b]) => (
                <li key={a} className="flex items-start gap-2.5 text-[0.88rem] text-[#1a1a1a]/60">
                  <span className="mt-0.5 text-[#9a7a2e]" aria-hidden>✦</span>
                  <span><b className="font-semibold text-[#1a1a1a]">{a}</b>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── RIGHT · the form ── */}
          <div className="mt-8 lg:mt-0">
            <div ref={cardRef} className="scroll-mt-6 rounded-[16px] border border-[#1a1a1a]/12 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] md:p-8">
              {/* progress */}
              <div className="mb-6 flex items-center gap-2.5">
                <Pip on />
                <Pip on={step === 2} />
                <span className="ml-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#1a1a1a]/55">Step {step} of 2</span>
              </div>

              {step === 1 ? (
                <>
                  <GroupLabel>The project</GroupLabel>
                  <Field label="Project name">
                    <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Emerald Heights" className={inputCls(project)} />
                  </Field>
                  <Field label="Developer" optional>
                    <input value={developer} onChange={(e) => setDeveloper(e.target.value)} placeholder="e.g. DLF, Lodha…" className={inputCls(developer)} />
                  </Field>
                  <Field label="City">
                    <div className="flex flex-wrap gap-2">
                      {CITIES.map((c) => (
                        <button key={c} type="button" onClick={() => setCity(c)} className={chip(city === c)}>{c}</button>
                      ))}
                      <button type="button" onClick={() => setCity("Other")} className={chip(city === "Other")}>Other…</button>
                    </div>
                    {city === "Other" && (
                      <input value={cityOther} onChange={(e) => setCityOther(e.target.value)} placeholder="Which city?" className={`${inputCls(cityOther)} mt-2.5`} />
                    )}
                  </Field>
                  <Field label="Where are you with this project?">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <SegOption label="Looking to invest" sub="Considering a purchase" on={intent === "looking"} onClick={() => setIntent("looking")} />
                      <SegOption label="Already invested" sub="I own / have booked" on={intent === "invested"} onClick={() => setIntent("invested")} />
                    </div>
                  </Field>

                  <button type="button" disabled={!step1ok} onClick={() => setStep(2)} className={`${ctaCls} hidden lg:block`}>
                    Continue →
                  </button>
                </>
              ) : (
                <>
                  {looking && (
                    <>
                      <GroupLabel>Your requirement</GroupLabel>
                      <Field label="Configuration" optional>
                        <div className="flex flex-wrap gap-2">
                          {CONFIGS.map((c) => (
                            <button key={c} type="button" onClick={() => setConfig(config === c ? null : c)} className={chip(config === c)}>{c}</button>
                          ))}
                        </div>
                      </Field>
                      <Field label="Budget" optional>
                        <div className="flex flex-wrap gap-2">
                          {BUDGETS.map((c) => (
                            <button key={c} type="button" onClick={() => setBudget(budget === c ? null : c)} className={chip(budget === c)}>{c}</button>
                          ))}
                        </div>
                      </Field>
                      <Field label="Holding period" optional>
                        <div className="flex flex-wrap gap-2">
                          {HOLDING.map((c) => (
                            <button key={c} type="button" onClick={() => setHolding(holding === c ? null : c)} className={chip(holding === c)}>{c}</button>
                          ))}
                        </div>
                      </Field>
                    </>
                  )}

                  <GroupLabel className={looking ? "mt-7" : ""}>Where to send it</GroupLabel>
                  <Field label="Full name">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls(name)} />
                  </Field>
                  <Field label="Mobile">
                    {verified ? (
                      <div className="flex items-center gap-2.5 rounded-lg border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-3.5 py-3 text-[0.9rem] text-[#1e6b45]">
                        <span aria-hidden>✓</span>
                        <span className="font-medium tabular-nums">{maskContact(verified)}</span>
                        <span className="text-[0.74rem] text-[#1a1a1a]/55">verified · buyer-side only</span>
                        <button type="button" onClick={() => setVerified(null)} className="ml-auto text-[0.72rem] text-[#1a1a1a]/45 underline underline-offset-2">change</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOtpOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1e6b45] bg-[#1e6b45]/[0.06] py-3 text-[0.9rem] font-semibold text-[#1e6b45] transition-colors hover:bg-[#1e6b45]/[0.12]"
                      >
                        Verify your mobile →
                      </button>
                    )}
                  </Field>

                  {/* willingness to pay — captured as a signal only */}
                  <div className="mt-5 rounded-[11px] border border-[#9a7a2e]/25 bg-[#9a7a2e]/[0.05] p-4">
                    <p className="font-serif text-[1rem] text-[#1a1a1a]">Would you pay ₹999 for this report?</p>
                    <p className="mt-0.5 text-[0.76rem] text-[#1a1a1a]/60">Independent, forensic, buyer-side. A flat fee — no surprises.</p>
                    <div className="mt-3 flex gap-2.5">
                      {(["yes", "no"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPay999(v)}
                          className={`flex-1 rounded-lg border py-2.5 text-[0.88rem] font-semibold capitalize transition-colors ${
                            pay999 === v ? "border-[#1e6b45] bg-[#1e6b45]/[0.08] text-[#1e6b45]" : "border-[#1a1a1a]/22 bg-white text-[#1a1a1a]/70"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="button" disabled={!step2ok} onClick={submit} className={`${ctaCls} hidden lg:block`}>
                    Request my report →
                  </button>
                  <div className="mt-3 hidden items-center justify-between lg:flex">
                    <button type="button" onClick={() => setStep(1)} className="font-mono text-[0.7rem] text-[#1a1a1a]/45 hover:text-[#1a1a1a]/75">← Back</button>
                    <p className="font-mono text-[0.58rem] tracking-[0.03em] text-[#1a1a1a]/45">A real analyst reviews every request</p>
                  </div>
                </>
              )}
            </div>

            {/* trust — inline row, mobile only (below the form) */}
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[0.8rem] text-[#1a1a1a]/60 lg:hidden">
              {TRUST.map(([a, b]) => (
                <span key={a}>✦ <b className="font-semibold text-[#1a1a1a]">{a}</b>{b}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── mobile sticky CTA — keeps the primary action always in view ── */}
      {!done && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1a1a1a]/10 bg-[#F5F0E8]/95 backdrop-blur-sm lg:hidden"
          style={{ paddingBottom: "max(0.7rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 pt-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="shrink-0 rounded-[11px] border border-[#1a1a1a]/20 px-4 py-3.5 text-[0.9rem] font-medium text-[#1a1a1a]/70"
              >
                Back
              </button>
            )}
            <button
              type="button"
              disabled={primaryDisabled}
              onClick={primaryAction}
              className="flex-1 rounded-[11px] bg-[#1e6b45] py-3.5 text-[0.95rem] font-semibold text-white transition-all duration-300 enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      )}

      <OtpSheet
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerified={(v) => { setVerified(v); setOtpOpen(false); }}
        title="Verify your mobile"
        subtitle="One quick step, so an analyst can reach you about this report — never shared with a developer."
      />
    </main>
  );
}

const ctaCls =
  "mt-6 w-full rounded-[11px] bg-[#1e6b45] py-4 text-[0.95rem] font-semibold text-white transition-all duration-300 enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-35";

const inputCls = (v: string) =>
  `w-full rounded-lg border px-3.5 py-3 text-[0.95rem] outline-none transition-colors ${
    v ? "border-[#1a1a1a]/40 bg-white" : "border-[#1a1a1a]/22 bg-[#faf8f4]"
  } focus:border-[#9a7a2e]`;

function Pip({ on = false }: { on?: boolean }) {
  return <span className={`h-[4px] w-16 rounded-full ${on ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/12"}`} />;
}

function GroupLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-3.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#9a7a2e] ${className}`}>{children}</p>;
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[0.74rem] text-[#1a1a1a]/70">
        {label}
        {optional && <span className="text-[#1a1a1a]/35"> · optional</span>}
      </label>
      {children}
    </div>
  );
}

function SegOption({ label, sub, on, onClick }: { label: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[11px] border px-4 py-3 text-left transition-colors ${
        on ? "border-[#1e6b45] bg-[#1e6b45]/[0.05] shadow-[inset_0_0_0_1px_#1e6b45]" : "border-[#1a1a1a]/22 bg-white hover:border-[#9a7a2e]/70"
      }`}
    >
      <span className={`block font-serif text-[1.05rem] ${on ? "text-[#1e6b45]" : "text-[#1a1a1a]"}`}>{label}</span>
      <span className="mt-0.5 block text-[0.72rem] text-[#1a1a1a]/55">{sub}</span>
    </button>
  );
}

function Success({ project, contact, looking, pay }: { project: string; contact: string; looking: boolean; pay: "yes" | "no" | null }) {
  return (
    <div className="mx-auto max-w-xl pt-6 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1e6b45]/12 text-[1.5rem] text-[#1e6b45]" aria-hidden>✓</span>
      <h1 className="mt-6 font-serif text-[2.1rem] font-medium leading-tight tracking-[-0.01em]">Your request is with us.</h1>
      <p className="mx-auto mt-4 max-w-[42ch] text-[1rem] font-light leading-relaxed text-[#1a1a1a]/65">
        An analyst will personally review <b className="font-medium text-[#1a1a1a]">{project || "your project"}</b>
        {contact && <> and reach out on <b className="font-medium text-[#1a1a1a]">{contact}</b></>} within{" "}
        <b className="font-medium text-[#1a1a1a]">two working days</b> — to confirm the scope and your flat fee. No automated
        blast; a real person, on your side of the table.
      </p>

      <div className="mx-auto mt-9 max-w-sm text-left">
        <p className="mb-3 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#9a7a2e]">What happens next</p>
        {[
          "We pull the RERA filings, developer records and legal history",
          "You approve the ₹999 flat fee — nothing before you say so",
          "Your forensic report lands, with a call to walk you through it",
        ].map((t, i) => (
          <div key={i} className="flex items-start gap-3 border-t border-[#1a1a1a]/[0.08] py-3.5 text-[0.9rem] text-[#1a1a1a]/80">
            <span className="mt-px font-serif font-semibold text-[#1e6b45]">{i + 1}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      <a href="/Truth-Estate" className="mt-9 inline-block font-mono text-[0.74rem] tracking-[0.02em] text-[#1e6b45] underline underline-offset-4 hover:opacity-70">
        ← Back to Truth Estate
      </a>
    </div>
  );
}
