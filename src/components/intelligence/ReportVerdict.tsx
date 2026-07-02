"use client";

import { useState } from "react";
import { deliveryOutlook, roiModel, developerOf, rankContext, type ProjectIntel } from "@/lib/projects";

/* Chapter IV — the verdict, tuned to who's buying. One project, four calls:
   the same evidence lands differently for a first-timer, an upgrader, an
   investor and an end-user/NRI. Composed from the data we already hold. */

type ProfileKey = "first" | "upgrader" | "investor" | "enduser";
const PROFILES: { key: ProfileKey; label: string; icon: string }[] = [
  { key: "first", label: "First-time buyer", icon: "◔" },
  { key: "upgrader", label: "Upgrader", icon: "⇧" },
  { key: "investor", label: "Investor", icon: "◆" },
  { key: "enduser", label: "End-user / NRI", icon: "⌂" },
];

type Call = { tone: "buy" | "fit" | "consider" | "stretch"; short: string; head: string; body: string; fits: string[]; watch: string[] };
const TONE = {
  buy: { text: "text-[#1e6b45]", chip: "text-[#1e6b45]" },
  fit: { text: "text-[#238c55]", chip: "text-[#238c55]" },
  consider: { text: "text-[#9a7a2e]", chip: "text-[#9a7a2e]" },
  stretch: { text: "text-[#c56a56]", chip: "text-[#c56a56]" },
};

function buildCalls(p: ProjectIntel): Record<ProfileKey, Call> {
  const roi = roiModel(p);
  const out = deliveryOutlook(p);
  const dev = developerOf(p);
  const ctx = rankContext(p);
  const ticketMid = (p.budget[0] + p.budget[1]) / 2;
  const cagr = roi?.adjCagr ?? 7;
  const hasHistory = (dev?.legalCases?.length ?? 0) > 0;
  const supplyRisk = p.watchouts.find((w) => /supply|inventory|liquid/i.test(w));
  const legalWatch = hasHistory ? "Have a lawyer vet the Agreement to Sell — this developer's contracts have lost in court before." : "Standard legal checks still apply — verify RERA yourself.";
  const handover = out?.predictedDate ?? p.ops?.possession ?? "handover";

  const investor: Call = cagr >= 8
    ? { tone: "buy", short: "Strong buy", head: "Strong buy — with a clock on it.",
        body: `The maths works: a construction-linked entry models a real (cash-flow) return above the ~${cagr}% price CAGR on a ${out && out.absorptionPct >= 98 ? "sold-out, " : ""}${out && out.aheadOfPlan > 0 ? "ahead-of-schedule " : ""}tower. Treat it as buy-and-exit, not hold-forever${supplyRisk ? " — new corridor supply will cap the late-decade premium" : ""}.`,
        fits: [`Models ~${cagr}% CAGR — and higher XIRR on a staged plan`, out && out.absorptionPct >= 98 ? "Fully absorbed — exit demand is proven" : "Healthy absorption at current velocity", `${p.truthScore} Truth Score — top ${ctx.topPct}% of tracked projects`],
        watch: [supplyRisk ? `Plan the exit: ${supplyRisk.toLowerCase()}` : "Plan your exit window before you enter", legalWatch] }
    : { tone: "consider", short: "Consider", head: "Consider — the return is fair, not exceptional.",
        body: `Modelled at ~${cagr}% CAGR, this compounds respectably but doesn't beat the corridor. Buy it for the asset quality, not for outsized returns.`,
        fits: ["Quality asset in a tracked corridor", `${p.truthScore} Truth Score — execution risk is contained`],
        watch: ["Returns hug the corridor benchmark — negotiate entry hard", legalWatch] };

  const first: Call = ticketMid >= 4
    ? { tone: "stretch", short: "Stretch", head: `A stretch — ₹${p.budget[0]}–${p.budget[1]} Cr locks your capital till ${handover}.`,
        body: `As a first home this parks a very large share of net worth in one under-construction asset with no rental income until ${handover}. If your finances absorb that comfortably, the quality is real — but a first-timer usually shouldn't need to prove it.`,
        fits: ["If bought, delivery certainty protects a first purchase", "Strong resale depth if plans change"],
        watch: ["Capital locked through construction — stress-test the EMIs", "Consider the corridor's ready or near-ready options first"] }
    : { tone: "fit", short: "Sound first buy", head: "A sound first home — with the boxes ticked.",
        body: `Ticket size is manageable for the segment and the delivery record de-risks the wait. Verify the paperwork and buy the stack you'd live in, not the cheapest.`,
        fits: ["Manageable ticket for the corridor", "Delivery record protects a first purchase"],
        watch: ["Don't skip the legal read", "Match the payment plan to your income, not the discount"] };

  const upgrader: Call = p.truthScore >= 86
    ? { tone: "fit", short: "Strong fit", head: "Strong fit — a durable upgrade.",
        body: `Bridging from an existing home, you're trading into a ${ctx.corridorRank === 1 ? "corridor-leading" : "top-tier"} address with real scarcity value. Your existing asset funds the equity; the delivery record protects the bridge.`,
        fits: ["Corridor-leading quality — the upgrade holds value", "Sell-side liquidity on your current home does the funding"],
        watch: ["Sequence the sale → purchase bridge carefully", legalWatch] }
    : { tone: "consider", short: "Consider", head: "A fair upgrade — compare within the corridor first.",
        body: `The project is sound, but at this score there are peers worth a side-by-side before you commit the bridge.`,
        fits: ["Sound asset; genuine lifestyle uplift"],
        watch: ["Compare against the corridor's top-scored peer", legalWatch] };

  const enduser: Call = (out?.delayChance ?? 30) <= 25
    ? { tone: "fit", short: "Strong fit", head: `Strong fit — low handover risk for a ${handover} move.`,
        body: `For living in (or moving back to), the risk that matters is the handover date — and this one models ${out ? `${out.delayChance}% delay risk` : "contained delay risk"} with a ${out && out.ahead > 0 ? `forecast ${Math.abs(out.ahead)} months early` : "credible forecast"}. NRIs: we handle the paperwork and remote milestones end-to-end.`,
        fits: [out ? `Forecast handover ${out.predictedDate} — ${out.delayChance}% delay risk` : "Credible handover forecast", "Low-density, end-user-grade specification"],
        watch: ["Write the revised RERA date into the agreement", "NRI: plan TDS/222A paperwork before the first milestone"] }
    : { tone: "consider", short: "Consider", head: "Consider — time your move around the real date.",
        body: `Livability case is strong, but plan your move around our forecast date, not the brochure's.`,
        fits: ["Genuine end-user specification"],
        watch: ["Keep rent runway till the verified handover", legalWatch] };

  return { first, upgrader, investor, enduser };
}

export default function ReportVerdict({ p, onConsult }: { p: ProjectIntel; onConsult: () => void }) {
  const [active, setActive] = useState<ProfileKey>("investor");
  const calls = buildCalls(p);
  const call = calls[active];
  const roi = roiModel(p);

  return (
    <div className="mt-8">
      <p className="max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">You&apos;ve seen the trust and the money. Here&apos;s the call — and it&apos;s not the same call for everyone. Tell us who you are.</p>

      {/* profile selector */}
      <div className="mt-5 flex flex-wrap gap-2">
        {PROFILES.map((pr) => (
          <button key={pr.key} onClick={() => setActive(pr.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[0.82rem] font-medium transition-colors ${active === pr.key ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#1a1a1a]/12 bg-white/70 text-[#1a1a1a]/60 hover:text-[#1a1a1a]"}`}>
            <span aria-hidden>{pr.icon}</span>{pr.label}
          </button>
        ))}
      </div>

      {/* verdict card */}
      <div className="mt-5 rounded-2xl border border-[#1e6b45]/28 bg-gradient-to-br from-[#1e6b45]/[0.05] to-transparent p-7 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#1e6b45]">The verdict · for {PROFILES.find((x) => x.key === active)!.label.toLowerCase()}</p>
            <h3 className={`mt-2.5 font-serif text-[1.7rem] font-medium leading-[1.1] md:text-[2rem] ${TONE[call.tone].text}`}>{call.head}</h3>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <MiniStat n={`${p.truthScore}`} k="Truth" green />
            {roi && <MiniStat n={`${roi.adjCagr}%`} k="Model CAGR" green />}
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/70">{call.body}</p>
        <div className="mt-5 grid overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-white md:grid-cols-2">
          <div className="border-b border-[#1a1a1a]/10 p-5 md:border-b-0 md:border-r">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#1e6b45]">Why it fits you</p>
            <ul className="mt-2.5 space-y-2">{call.fits.map((f) => <li key={f} className="flex gap-2.5 text-[0.84rem] font-light leading-[1.5] text-[#1a1a1a]/70"><span className="text-[#1e6b45]">✓</span>{f}</li>)}</ul>
          </div>
          <div className="p-5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#9a7a2e]">What to watch</p>
            <ul className="mt-2.5 space-y-2">{call.watch.map((w) => <li key={w} className="flex gap-2.5 text-[0.84rem] font-light leading-[1.5] text-[#1a1a1a]/70"><span className="text-[#9a7a2e]">⚠</span>{w}</li>)}</ul>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[0.72rem] font-light text-[#1a1a1a]/45">Our evidence-based opinion — pressure-test it against your own numbers before you act.</p>
          <button onClick={onConsult} className="rounded-lg bg-[#1e6b45] px-5 py-3 text-[0.82rem] font-semibold text-white transition-colors hover:bg-[#238c55]">Pressure-test this with an advisor →</button>
        </div>
      </div>

      {/* how the call changes */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {PROFILES.map((pr) => {
          const c = calls[pr.key];
          return (
            <button key={pr.key} onClick={() => setActive(pr.key)}
              className={`rounded-xl border bg-white/70 p-4 text-left transition-all ${active === pr.key ? "border-[#1a1a1a] shadow-[0_0_0_1px_#1a1a1a]" : "border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30"}`}>
              <p className="text-[0.7rem] font-light text-[#1a1a1a]/50">{pr.label}</p>
              <p className={`mt-1 text-[0.95rem] font-semibold ${TONE[c.tone].chip}`}>{c.short}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[0.72rem] font-light leading-[1.55] text-[#1a1a1a]/40">Same project, four different calls — a ₹{p.budget[0]}–{p.budget[1]} Cr commitment lands differently depending on what it has to do for you. We tell you which one is you, and why.</p>
    </div>
  );
}

function MiniStat({ n, k, green }: { n: string; k: string; green?: boolean }) {
  return (
    <div className="rounded-lg border border-[#1a1a1a]/10 bg-white px-3.5 py-2.5 text-center">
      <p className={`font-mono text-[1.1rem] font-semibold leading-none ${green ? "text-[#1e6b45]" : "text-[#1a1a1a]"}`}>{n}</p>
      <p className="mt-1 text-[0.52rem] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}
