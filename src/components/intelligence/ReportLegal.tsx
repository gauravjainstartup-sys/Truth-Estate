import { developerOf, legalStatus, type ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar IV — Legal & Compliance. The signature "project clean,
   developer history" split, a risk matrix, the developer's public cases each
   with a buyer-impact read, and a before-you-sign checklist. Inverts to a
   red-led layout when the project itself is flagged. */

type Lvl = "Low" | "Moderate" | "High";
const LVL: Record<Lvl, string> = {
  Low: "text-[#1e6b45] border-[#1e6b45]/25 bg-[#1e6b45]/[0.05]",
  Moderate: "text-[#9a7a2e] border-[#9a7a2e]/25 bg-[#9a7a2e]/[0.06]",
  High: "text-[#b0503e] border-[#b0503e]/28 bg-[#b0503e]/[0.05]",
};
const DOT: Record<Lvl, string> = { Low: "bg-[#1e6b45]", Moderate: "bg-[#9a7a2e]", High: "bg-[#b0503e]" };

export default function ReportLegal({ p }: { p: ProjectIntel }) {
  const dev = developerOf(p);
  const status = legalStatus(p);
  const cases = dev?.legalCases ?? [];
  const hasHistory = cases.length > 0;
  const flagged = status === "flagged";

  const matrix: { label: string; level: Lvl; note: string }[] = [
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
          <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">{flagged ? "This one has problems of its own." : "The project is clean. Is the developer?"}</h3>
          <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">A forensic sweep of land title, RERA status and every court that has ruled on this builder — because the biggest risk here often isn&apos;t the address.</p>
        </div>
      </div>

      {dev && (
        <div className="mt-6 rounded-2xl border-l-2 border-[#9a7a2e]/50 bg-white/50 p-6 md:p-7">
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
          <p className="mt-2.5 font-serif text-[1.15rem] leading-[1.45] md:text-[1.3rem]">{dev.legal}</p>
          <p className="mt-3 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Updated {`${new Date().getFullYear()}`} · Source: e-Courts + RERA litigation repositories · independently verifiable.</p>
        </div>
      )}

      {/* Risk matrix */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {matrix.map((m) => (
          <div key={m.label} className={`rounded-xl border p-4 ${LVL[m.level]}`}>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.1em] opacity-70">{m.label}</p>
            <p className="mt-2 flex items-center gap-2 text-[1.05rem] font-semibold"><span className={`h-[8px] w-[8px] rounded-full ${DOT[m.level]}`} />{m.level}</p>
            <p className="mt-2 text-[0.62rem] font-light leading-[1.4] text-[#1a1a1a]/45">{m.note}</p>
          </div>
        ))}
      </div>

      {/* The signature split */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl border p-6 md:p-7 ${flagged ? "border-[#b0503e]/28 bg-gradient-to-br from-[#b0503e]/[0.07] to-[#b0503e]/[0.02]" : "border-[#1e6b45]/25 bg-gradient-to-br from-[#1e6b45]/[0.07] to-[#1e6b45]/[0.01]"}`}>
          <p className={`inline-flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.1em] ${flagged ? "text-[#b0503e]" : "text-[#1e6b45]"}`}>{flagged ? "⚠ This project" : "✓ This project"}</p>
          <h4 className="mt-3 font-serif text-[1.35rem] font-medium">{flagged ? "Carries live flaws" : "Clean & RERA-current"}</h4>
          <p className="mt-2.5 text-[0.86rem] font-light leading-[1.65] text-[#1a1a1a]/65">
            {flagged
              ? "This project has active issues on record — read the cases below before committing any capital."
              : <>Registered under HRERA{p.ops?.reraId ? <> <b className="font-medium text-[#1a1a1a]">{p.ops.reraId}</b></> : ""} ({p.ops?.launch ?? "on launch"}). No consumer complaints or regulatory orders against {p.name} in public databases as of {new Date().getFullYear()}.</>}
          </p>
          <p className={`mt-3.5 text-[0.8rem] font-semibold ${flagged ? "text-[#b0503e]" : "text-[#1e6b45]"}`}>{flagged ? "The risk IS the address." : "Baseline buyer protection is in place."}</p>
        </div>
        <div className={`rounded-2xl border p-6 md:p-7 ${hasHistory && !flagged ? "border-[#b0503e]/28 bg-gradient-to-br from-[#b0503e]/[0.07] to-[#b0503e]/[0.02]" : "border-[#1e6b45]/25 bg-gradient-to-br from-[#1e6b45]/[0.07] to-[#1e6b45]/[0.01]"}`}>
          <p className={`inline-flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.1em] ${hasHistory && !flagged ? "text-[#b0503e]" : "text-[#1e6b45]"}`}>{hasHistory && !flagged ? "⚠ This developer" : "✓ This developer"}</p>
          <h4 className="mt-3 font-serif text-[1.35rem] font-medium">{hasHistory && !flagged ? "Carries real history" : "Clean track record"}</h4>
          <p className="mt-2.5 text-[0.86rem] font-light leading-[1.65] text-[#1a1a1a]/65">
            {hasHistory
              ? <>{dev?.name} has a <b className="font-medium text-[#1a1a1a]">Supreme-Court loss for possession delay</b> and a <b className="font-medium text-[#1a1a1a]">CCI penalty</b> for one-sided buyer agreements — same city, same kind of project.</>
              : `${dev?.name ?? "The developer"} carries no material public disputes on our read.`}
          </p>
          <p className={`mt-3.5 text-[0.8rem] font-semibold ${hasHistory && !flagged ? "text-[#b0503e]" : "text-[#1e6b45]"}`}>{hasHistory && !flagged ? "The risk isn't the address — it's the counterparty." : "A strong, clean counterparty."}</p>
        </div>
      </div>

      {/* Litigation cards */}
      {hasHistory && (
        <>
          <div className="mt-8 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">The cases that matter to a buyer</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>
          {cases.map((c) => (
            <div key={c.title} className="mt-4 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h5 className="text-[1.05rem] font-semibold leading-tight">{c.title}</h5>
                  <p className="mt-1 text-[0.64rem] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/40">{c.court}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <Chip>{c.status}</Chip><Chip>{c.relevance}</Chip><Chip hi>Impact: {c.impact}</Chip>
                </div>
              </div>
              <p className="mt-3 text-[0.86rem] font-light leading-[1.65] text-[#1a1a1a]/65">{c.summary}</p>
              <div className="mt-3.5 rounded-r-lg border-l-2 border-[#9a7a2e] bg-[#9a7a2e]/[0.07] px-4 py-3">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#9a7a2e]">What it means for you</p>
                <p className="mt-1 text-[0.84rem] font-medium leading-[1.55] text-[#1a1a1a]/80">{c.buyerImpact}</p>
              </div>
              {c.ref && <p className="mt-3 text-[0.66rem] font-light text-[#1a1a1a]/35">{c.ref} · view source ↗</p>}
            </div>
          ))}
        </>
      )}

      {/* Due-diligence checklist */}
      <div className="mt-6 rounded-2xl border border-[#9a7a2e]/28 bg-[#FBF8F2] p-6 md:p-7">
        <p className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[#9a7a2e]">⚑ Before you sign — your due-diligence plan</p>
        <ol className="mt-4 space-y-0">
          {[
            <>Verify HRERA status &amp; the latest QPR yourself on <b className="font-medium text-[#1a1a1a]">haryanarera.gov.in</b>{p.ops?.reraId ? <> using {p.ops.reraId}</> : ""}.</>,
            <>Get an <b className="font-medium text-[#1a1a1a]">independent lawyer</b> to read the Agreement to Sell clause-by-clause — penalty terms, force-majeure wording and delay-compensation are where {dev?.name ?? "this developer"} has lost before.</>,
            <>Insist the <b className="font-medium text-[#1a1a1a]">revised RERA possession date</b> is written into the builder-buyer agreement, and hold ~5% against on-time handover.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3.5 border-b border-dotted border-[#1a1a1a]/12 py-3 last:border-none">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#9a7a2e] font-mono text-[0.72rem] font-bold text-white">{i + 1}</span>
              <span className="min-w-0 flex-1 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Chip({ children, hi }: { children: React.ReactNode; hi?: boolean }) {
  return <span className={`rounded border px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.06em] ${hi ? "border-[#b0503e]/40 bg-[#b0503e]/[0.05] text-[#9a4130]" : "border-[#1a1a1a]/12 text-[#1a1a1a]/45"}`}>{children}</span>;
}
