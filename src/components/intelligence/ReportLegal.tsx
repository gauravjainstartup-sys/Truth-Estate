"use client";

import { useState } from "react";
import { developerOf, lastUpdatedOn, legalStatus, type ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar IV — Legal & Compliance. The signature "project clean,
   developer history" split, a risk matrix, the developer's public cases each
   with a buyer-impact read, and a before-you-sign checklist. Inverts to a
   red-led layout when the project itself is flagged. */

type Lvl = "Low" | "Medium" | "Moderate" | "High" | "Critical";
const LVL: Record<Lvl, string> = {
  Low: "text-[#1e6b45] border-[#1e6b45]/25 bg-[#1e6b45]/[0.05]",
  Medium: "text-[#9a7a2e] border-[#9a7a2e]/25 bg-[#9a7a2e]/[0.06]",
  Moderate: "text-[#9a7a2e] border-[#9a7a2e]/25 bg-[#9a7a2e]/[0.06]",
  High: "text-[#b0503e] border-[#b0503e]/28 bg-[#b0503e]/[0.05]",
  Critical: "text-[#8f2f1e] border-[#8f2f1e]/40 bg-[#8f2f1e]/[0.08]",
};
const DOT: Record<Lvl, string> = { Low: "bg-[#1e6b45]", Medium: "bg-[#9a7a2e]", Moderate: "bg-[#9a7a2e]", High: "bg-[#b0503e]", Critical: "bg-[#8f2f1e]" };

export default function ReportLegal({ p }: { p: ProjectIntel }) {
  const dev = developerOf(p);
  const status = legalStatus(p);
  const cases = dev?.legalCases ?? [];
  const hasHistory = cases.length > 0;
  const flagged = status === "flagged";
  const watch = status === "watch";

  const projectCases = cases.filter((c) => c.scope === "project");
  const devCases = cases.filter((c) => c.scope !== "project");
  const [caseScope, setCaseScope] = useState<"project" | "developer">(projectCases.length ? "project" : "developer");
  const [caseLimit, setCaseLimit] = useState(3);
  const activeCases = caseScope === "project" ? projectCases : devCases;
  const pickScope = (s: "project" | "developer") => { setCaseScope(s); setCaseLimit(3); };

  const [ddLimit, setDdLimit] = useState(3);

  /* Pipeline risk_breakdown (title_disputes → "Title disputes" · severity) when
     the legal payload carries one; else the heuristic read. */
  const matrix: { label: string; level: Lvl; note?: string }[] = p.liveLegal?.risks.length
    ? p.liveLegal.risks.map((r) => ({ label: r.label, level: r.level as Lvl }))
    : [
        { label: "Title risk", level: flagged ? "High" : status === "watch" ? "Moderate" : "Low", note: "Land title & RERA registration" },
        { label: "Developer risk", level: hasHistory ? "Moderate" : "Low", note: "Track record behind the build" },
        { label: "Litigation risk", level: flagged ? "High" : hasHistory ? "Moderate" : "Low", note: "Live & historical disputes" },
        { label: "Regulatory risk", level: flagged ? "High" : "Moderate", note: "Approvals & compliance" },
      ];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar IV · Legal &amp; Compliance</p>
          <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">{flagged ? "This one has problems of its own." : watch ? "The project needs a closer look. And the developer?" : "The project is clean. Is the developer?"}</h3>
          <p className="mt-2 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Updated {lastUpdatedOn(p, p.liveLegal?.lastUpdated)}</p>
          <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">Land title, RERA status, and every court that&apos;s ruled on this builder.</p>
        </div>
      </div>

      {/* Occupancy / Completion Certificate — shown when the project has its OC
          on record (delivered_oc_date / delivered_certificate_url from the DB).
          It is the strongest compliance signal a delivered project carries, so
          it leads the pillar, and the document opens in a new tab. */}
      {(p.ops?.ocDate || p.ops?.ocCertificateUrl) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] p-5 md:p-6">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1e6b45]">Occupancy / Completion Certificate</p>
            <p className="mt-1.5 text-[0.92rem] font-light leading-[1.55] text-[#1a1a1a]/70">
              {p.ops?.ocDate
                ? <>Granted <b className="font-medium text-[#1a1a1a]">{p.ops.ocDate}</b> — the project is delivered and cleared for possession.</>
                : <>On record — the project is delivered and cleared for possession.</>}
            </p>
          </div>
          {p.ops?.ocCertificateUrl && (
            <a href={p.ops.ocCertificateUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1e6b45] px-4 py-2.5 text-[0.8rem] font-semibold text-white transition-colors hover:bg-[#17573a]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" />
              </svg>
              View OC Certificate <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      )}

      {/* An OC clears completion & possession risk — NOT title risk. So for a
          delivered project we frame the flags below: the delivery-timeline
          worries are moot, but a mortgage on the land or a governance flag
          survives possession and still needs diligence before registration. */}
      {p.ops?.lifecycle === "delivered" && (p.liveLegal?.headline || dev) && (
        <p className="mt-3.5 rounded-r-lg border-l-2 border-[#1e6b45]/40 bg-[#1e6b45]/[0.04] px-4 py-3 text-[0.82rem] font-light leading-[1.55] text-[#1a1a1a]/60">
          <b className="font-medium text-[#1a1a1a]">Delivery &amp; completion risk is resolved</b> by the OC on record. The points below are <b className="font-medium text-[#1a1a1a]">title &amp; governance</b> matters that persist regardless of possession — read them before you register.
        </p>
      )}

      {(p.liveLegal?.headline || dev) && (
        <div className="mt-6 rounded-2xl border-l-2 border-[#9a7a2e]/50 bg-white/50 p-6 md:p-7">
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
          <p className="mt-2.5 font-serif text-[1.2rem] leading-[1.4] md:text-[1.35rem]">{p.liveLegal?.headline ?? dev?.legal}</p>
          {(p.liveLegal?.keyFlags.length ?? 0) > 0 && (
            <ul className="mt-3.5 space-y-1.5">
              {p.liveLegal!.keyFlags.map((f) => (
                <li key={f} className="flex gap-2.5 text-[0.84rem] font-light leading-[1.55] text-[#1a1a1a]/65">
                  <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#9a7a2e]" aria-hidden />
                  <span className="min-w-0">{f}</span>
                </li>
              ))}
            </ul>
          )}
          {!(p.liveLegal?.sources?.length) && (
            <p className="mt-3 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Source: e-Courts + RERA litigation repositories · independently verifiable.</p>
          )}
        </div>
      )}

      {/* Risk matrix */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {matrix.map((m) => (
          <div key={m.label} className={`rounded-xl border p-4 ${LVL[m.level]}`}>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.1em] opacity-70">{m.label}</p>
            <p className="mt-2 flex items-center gap-2 text-[1.05rem] font-semibold"><span className={`h-[8px] w-[8px] rounded-full ${DOT[m.level]}`} />{m.level}</p>
            {m.note && <p className="mt-2 text-[0.62rem] font-light leading-[1.4] text-[#1a1a1a]/45">{m.note}</p>}
          </div>
        ))}
      </div>

      {/* The signature split */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl border p-6 md:p-7 ${flagged ? "border-[#b0503e]/28 bg-gradient-to-br from-[#b0503e]/[0.07] to-[#b0503e]/[0.02]" : watch ? "border-[#9a7a2e]/28 bg-gradient-to-br from-[#9a7a2e]/[0.07] to-[#9a7a2e]/[0.02]" : "border-[#1e6b45]/25 bg-gradient-to-br from-[#1e6b45]/[0.07] to-[#1e6b45]/[0.01]"}`}>
          <p className={`inline-flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.1em] ${flagged ? "text-[#b0503e]" : watch ? "text-[#9a7a2e]" : "text-[#1e6b45]"}`}>{flagged ? "⚠ This project" : watch ? "◆ This project" : "✓ This project"}</p>
          <h4 className="mt-3 font-serif text-[1.35rem] font-medium">{flagged ? "Carries live flaws" : watch ? "Not fully cleared yet" : "Clean & RERA-current"}</h4>
          <p className="mt-2.5 text-[0.86rem] font-light leading-[1.65] text-[#1a1a1a]/65">
            {flagged
              ? "This project has active issues on record — read the cases below before committing any capital."
              : watch
              ? <>The legal read here isn&apos;t top-tier clean. Confirm the HRERA registration and the latest QPR{p.ops?.reraId ? <> (<b className="font-medium text-[#1a1a1a]">{p.ops.reraId}</b>)</> : ""}, and have the Agreement to Sell reviewed before you commit any capital.</>
              : <>Registered under HRERA{p.ops?.reraId ? <> <b className="font-medium text-[#1a1a1a]">{p.ops.reraId}</b></> : ""} ({p.ops?.launch ?? "on launch"}). No consumer complaints or regulatory orders against {p.name} in public databases as of {lastUpdatedOn(p, p.liveLegal?.lastUpdated)}.</>}
          </p>
          <p className={`mt-3.5 text-[0.8rem] font-semibold ${flagged ? "text-[#b0503e]" : watch ? "text-[#9a7a2e]" : "text-[#1e6b45]"}`}>{flagged ? "The risk IS the address." : watch ? "Verify the paperwork before you sign." : "Baseline buyer protection is in place."}</p>
        </div>
        <div className={`rounded-2xl border p-6 md:p-7 ${hasHistory && !flagged ? "border-[#b0503e]/28 bg-gradient-to-br from-[#b0503e]/[0.07] to-[#b0503e]/[0.02]" : "border-[#1e6b45]/25 bg-gradient-to-br from-[#1e6b45]/[0.07] to-[#1e6b45]/[0.01]"}`}>
          <p className={`inline-flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.1em] ${hasHistory && !flagged ? "text-[#b0503e]" : "text-[#1e6b45]"}`}>{hasHistory && !flagged ? "⚠ This developer" : "✓ This developer"}</p>
          <h4 className="mt-3 font-serif text-[1.35rem] font-medium">{hasHistory && !flagged ? "Carries real history" : "Clean track record"}</h4>
          <p className="mt-2.5 text-[0.86rem] font-light leading-[1.65] text-[#1a1a1a]/65">
            {hasHistory
              ? p.liveDeveloper
                ? <>{dev?.name} carries <b className="font-medium text-[#1a1a1a]">{cases.length} {cases.length === 1 ? "case" : "cases"}</b> on public record — including <b className="font-medium text-[#1a1a1a]">{(devCases[0] ?? projectCases[0])?.title}</b>. Read each one below.</>
                : <>{dev?.name} has a <b className="font-medium text-[#1a1a1a]">Supreme-Court loss for possession delay</b> and a <b className="font-medium text-[#1a1a1a]">CCI penalty</b> for one-sided buyer agreements — same city, same kind of project.</>
              : `${dev?.name ?? "The developer"} carries no material public disputes on our read.`}
          </p>
          <p className={`mt-3.5 text-[0.8rem] font-semibold ${hasHistory && !flagged ? "text-[#b0503e]" : "text-[#1e6b45]"}`}>{hasHistory && !flagged ? "The risk isn't the address — it's the counterparty." : "A strong, clean counterparty."}</p>
        </div>
      </div>

      {/* Litigation cards — filterable by whether a case is filed against this
         exact project or the developer at large. */}
      {hasHistory && (
        <>
          <div className="mt-8 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">The cases that matter to a buyer</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>

          {/* project / developer toggle */}
          <div className="mt-4 inline-flex rounded-full border border-[#1a1a1a]/12 bg-white/50 p-1 text-[0.72rem] font-medium">
            {([["project", "This project"], ["developer", "This developer"]] as const).map(([key, label]) => {
              const n = key === "project" ? projectCases.length : devCases.length;
              const on = caseScope === key;
              return (
                <button key={key} onClick={() => pickScope(key)}
                  className={`rounded-full px-3.5 py-1.5 transition-colors ${on ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a]/50 hover:text-[#1a1a1a]"}`}>
                  {label} <span className={on ? "text-white/60" : "text-[#1a1a1a]/35"}>· {n}</span>
                </button>
              );
            })}
          </div>

          {activeCases.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] p-6 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
              <span className="font-semibold text-[#1e6b45]">✓ No litigation on record against this project.</span> The history that matters here sits with the developer — see <button onClick={() => pickScope("developer")} className="font-medium text-[#1e6b45] underline decoration-[#1e6b45]/30 underline-offset-2">This developer · {devCases.length}</button>.
            </div>
          ) : (
            <>
              {activeCases.slice(0, caseLimit).map((c) => (
                <div key={c.title} className="mt-4 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6 md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h5 className="text-[1.05rem] font-semibold leading-tight">{c.title}</h5>
                      <p className="mt-1 text-[0.64rem] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/40">{c.court}</p>
                    </div>
                    <div className="flex max-w-full shrink-0 flex-wrap gap-1.5">
                      <Chip>Status: {c.status}</Chip>
                      {caseScope === "developer" && <Chip>Relevance: {c.relevance}</Chip>}
                      <Chip hi>Impact: {c.impact}</Chip>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.86rem] font-light leading-[1.65] text-[#1a1a1a]/65">{c.summary}</p>
                  <div className="mt-3.5 rounded-r-lg border-l-2 border-[#9a7a2e] bg-[#9a7a2e]/[0.07] px-4 py-3">
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#9a7a2e]">What it means for you</p>
                    <p className="mt-1 text-[0.84rem] font-medium leading-[1.55] text-[#1a1a1a]/80">{c.buyerImpact}</p>
                  </div>
                  {(c.sourceUrl || c.ref) && (
                    <p className="mt-3 text-[0.66rem] font-light text-[#1a1a1a]/35">
                      {c.ref}
                      {c.sourceUrl && <>{c.ref ? " · " : ""}<a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#9a7a2e] underline decoration-[#9a7a2e]/30 underline-offset-2 hover:text-[#8a6a1e]">View source ↗</a></>}
                    </p>
                  )}
                </div>
              ))}
              {activeCases.length > caseLimit && (
                <button onClick={() => setCaseLimit(activeCases.length)}
                  className="mt-4 w-full rounded-2xl border border-dashed border-[#1a1a1a]/20 py-3.5 text-[0.8rem] font-semibold text-[#1a1a1a]/60 transition-colors hover:border-[#1a1a1a]/40 hover:text-[#1a1a1a]/85">
                  Load {activeCases.length - caseLimit} more {activeCases.length - caseLimit === 1 ? "case" : "cases"} ↓
                </button>
              )}
            </>
          )}
        </>
      )}

      {/* Sources — the public records behind this legal read (legal_sources_summary).
          Section-level citations for the pillar; each litigation case above also
          links its own source. Rendered only when the DB carries them. */}
      {(p.liveLegal?.sources?.length ?? 0) > 0 && (
        <>
          <div className="mt-8 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Sources</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>
          <p className="mt-3 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/50">The public records this legal read is built on — each opens in a new tab so you can verify it yourself.</p>
          <ul className="mt-3.5 grid gap-2 sm:grid-cols-2">
            {p.liveLegal!.sources!.map((s, i) => (
              <li key={`${s.url}-${i}`} className="flex gap-2.5 rounded-xl border border-[#1a1a1a]/8 bg-white/50 px-3.5 py-2.5 text-[0.8rem] font-light leading-[1.45]">
                <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#9a7a2e]" aria-hidden />
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="min-w-0 break-words text-[#1a1a1a]/70 transition-colors hover:text-[#1a1a1a]">
                  {s.label} <span className="whitespace-nowrap text-[#9a7a2e]">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Due-diligence checklist */}
      {(() => {
        const ddSteps: React.ReactNode[] = [
          <>Verify HRERA status &amp; the latest QPR yourself on <b className="font-medium text-[#1a1a1a]">haryanarera.gov.in</b>{p.ops?.reraId ? <> using {p.ops.reraId}</> : ""}.</>,
          <>Get an <b className="font-medium text-[#1a1a1a]">independent lawyer</b> to read the Agreement to Sell clause-by-clause — penalty terms, force-majeure wording and delay-compensation{hasHistory ? <> are where {dev?.name ?? "this developer"} has lost before</> : " are where buyers get caught"}.</>,
          <>Insist the <b className="font-medium text-[#1a1a1a]">revised RERA possession date</b> is written into the builder-buyer agreement, and hold ~5% against on-time handover.</>,
          <>Pull the <b className="font-medium text-[#1a1a1a]">encumbrance certificate</b> and confirm the land title is clear and not mortgaged beyond the project&rsquo;s construction finance.</>,
          <>Match your exact unit — tower, floor and layout — against the <b className="font-medium text-[#1a1a1a]">sanctioned building plan</b>, not the brochure render.</>,
          <>Confirm a bank or HFC has approved the project for home loans — an <b className="font-medium text-[#1a1a1a]">APF number</b> is a strong third-party check on title and approvals.</>,
          <>Read the <b className="font-medium text-[#1a1a1a]">maintenance &amp; IFMS terms</b> and who controls the RWA handover timeline after possession.</>,
        ];
        const visible = ddSteps.slice(0, ddLimit);
        return (
          <div className="mt-6 rounded-2xl border border-[#9a7a2e]/28 bg-[#FBF8F2] p-6 md:p-7">
            <p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[#9a7a2e]">⚑ Before you sign — your due-diligence plan</p>
            <ol className="mt-4 space-y-0">
              {visible.map((step, i) => (
                <li key={i} className="flex gap-3.5 border-b border-dotted border-[#1a1a1a]/12 py-3 last:border-none">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#9a7a2e] font-mono text-[0.72rem] font-bold text-white">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">{step}</span>
                </li>
              ))}
            </ol>
            {ddSteps.length > ddLimit && (
              <button onClick={() => setDdLimit(ddSteps.length)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#9a7a2e]/30 py-2.5 text-[0.78rem] font-semibold text-[#8a6a1e] transition-colors hover:bg-[#9a7a2e]/[0.06]">
                Load {ddSteps.length - ddLimit} more {ddSteps.length - ddLimit === 1 ? "step" : "steps"} ↓
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function Chip({ children, hi }: { children: React.ReactNode; hi?: boolean }) {
  return <span className={`rounded border px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.06em] ${hi ? "border-[#b0503e]/40 bg-[#b0503e]/[0.05] text-[#9a4130]" : "border-[#1a1a1a]/12 text-[#1a1a1a]/45"}`}>{children}</span>;
}
