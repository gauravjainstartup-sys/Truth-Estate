"use client";

import { useEffect } from "react";
import Logo from "../Logo";
import SearchPalette from "./SearchPalette";
import { projectHref } from "@/lib/projectHref";
import { useJourney } from "../journey/JourneyProvider";
import { RATING_META, FIN_METRICS, type FinRating } from "@/lib/developers";
import { fmtPsf, pillars, priceJourney, deliveryOutlook, roiModel, type ProjectIntel, type Pillar } from "@/lib/projects";
import { streetAddress } from "./ProjectOptionCard";
import { compareTitle, type ResolvedCompare } from "@/lib/compare";
import { track } from "@/lib/events";
import { basePath, homeHref } from "@/lib/site";
import { useUnlocked, Gate, LockRow, LockLines, LockPill, CompareUnlock } from "./CompareGate";
import CompareGlimpse from "./CompareGlimpse";


const rateVal = (r: FinRating) => (r === "strong" ? 3 : r === "moderate" ? 2 : 1);
const winHigher = (a: number, b: number): Win => (a === b ? undefined : a > b ? "a" : "b");
const winLower = (a: number, b: number): Win => (a === b ? undefined : a < b ? "a" : "b");
type Win = "a" | "b" | undefined;

/* Live rows can carry a single-point ticket ([lo, lo]) or none — render a clean
   single value / dash rather than "₹5–5 Cr" or "₹0–0 Cr". Curated ranges are
   unaffected. */
const ticketLabel = (p: ProjectIntel): string => {
  const [lo, hi] = p.budget;
  if (!lo && !hi) return "—";
  return lo === hi ? `₹${lo} Cr` : `₹${lo}–${hi} Cr`;
};
/* first positioning tag, with a graceful fallback when a live row has none */
const tagOf = (p: ProjectIntel): string => p.tags[0]?.toLowerCase() ?? "its fundamentals";

/* PSF in one consistent "K" language across the row — a whole number when it
   lands on one, else one decimal (20000 → "20", 19500 → "19.5"); wrapped as
   ₹…K by the caller so a range reads "₹20K–22K", never "₹20,000–22.0k". */
const kNum = (v: number): string => {
  const k = v / 1000;
  return Number.isInteger(k) ? `${k}` : k.toFixed(1);
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

const GRID = "grid grid-cols-[0.78fr_1fr_1fr] items-start gap-3 md:gap-5";

function Row({ label, a, b, subA, subB, win }: { label: string; a: React.ReactNode; b: React.ReactNode; subA?: React.ReactNode; subB?: React.ReactNode; win?: Win }) {
  const cell = (side: "a" | "b", v: React.ReactNode, sub?: React.ReactNode) => (
    <div className="min-w-0">
      <div className={`flex items-center gap-2 text-[0.9rem] tabular-nums md:text-[0.98rem] ${win === side ? "font-medium text-[#1a1a1a]" : "font-light text-[#1a1a1a]/60"}`}>
        {v}{win === side && <span className="text-[0.7rem] text-[#1e6b45]" aria-label="leads">▲</span>}
      </div>
      {sub && <p className="mt-0.5 text-[0.64rem] font-light leading-snug text-[#1a1a1a]/40">{sub}</p>}
    </div>
  );
  return (
    <div className={`${GRID} border-t border-[#1a1a1a]/8 py-4`}>
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40 md:text-[0.7rem]">{label}</p>
      {cell("a", a, subA)}
      {cell("b", b, subB)}
    </div>
  );
}

function SignalRow({ label, a, b }: { label: string; a: FinRating; b: FinRating }) {
  const win = winHigher(rateVal(a), rateVal(b));
  const tag = (r: FinRating) => <span style={{ color: RATING_META[r].color }} className="font-medium">{RATING_META[r].label}</span>;
  return <Row label={label} a={tag(a)} b={tag(b)} win={win} />;
}

function Heads({ aName, bName, aHref, bHref, aBadge, bBadge }: { aName: string; bName: string; aHref: string; bHref: string; aBadge?: React.ReactNode; bBadge?: React.ReactNode }) {
  const head = (name: string, href: string, badge?: React.ReactNode) => (
    <div>
      <a href={href} className="font-serif text-[1.3rem] font-medium leading-tight text-[#1a1a1a] underline decoration-[#c9a96e]/30 underline-offset-4 hover:text-[#1e6b45] md:text-[1.7rem]">{name}</a>
      {badge && <div className="mt-2">{badge}</div>}
    </div>
  );
  return (
    <div className={`${GRID} pb-5`}>
      <span />
      {head(aName, aHref, aBadge)}
      {head(bName, bHref, bBadge)}
    </div>
  );
}

/* section header in the report's voice — label + hairline */
function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">{title}</span>
        <span className="h-px flex-1 bg-[#1a1a1a]/10" />
      </div>
      {note && <p className="mt-2 text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/45">{note}</p>}
      {/* the section header rule is the divider — drop the first row's own top
         border so a section break shows one line, not two */}
      <div className="mt-2 [&>*:first-child]:border-t-0">{children}</div>
    </section>
  );
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "neutral" }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] ${tone === "good" ? "border-[#1e6b45]/30 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/45"}`}>{children}</span>;
}

export default function ComparePage({ r }: { r: ResolvedCompare }) {
  const { open } = useJourney();

  /* Fire a type-specific "compare opened" event once per page (on top of the
     generic page_viewed): compare_projects / compare_developers / compare_markets. */
  useEffect(() => {
    const name = r.kind === "developer" ? "compare_developers" : r.kind === "market" ? "compare_markets" : "compare_projects";
    track(name, { props: { a: r.a.name, b: r.b.name } });
  }, [r.kind, r.a.name, r.b.name]);

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={homeHref} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <SearchPalette className="ml-auto" />
          <button onClick={() => open()} className="rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5">
            Request Independent Advice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-[14vh] pt-[6vh] md:px-10">
        <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
          <a href={`${basePath}/intelligence/compare`} className="transition-colors hover:text-[#1a1a1a]/70">Compare</a>
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">{compareTitle(r)}</span>
        </div>

        <div className="mt-9">
          <Eyebrow>{r.kind === "project" ? "Project comparison" : r.kind === "developer" ? "Developer comparison" : "Market comparison"}</Eyebrow>
          <h1 className="mt-5 font-serif text-[2.3rem] font-medium leading-[1.05] tracking-[-0.02em] md:text-[3.4rem]">
            {r.a.name} <span className="text-[#1a1a1a]/30">vs</span> {r.b.name}
          </h1>
        </div>

        {r.kind === "project" && <ProjectCompare r={r} />}
        {r.kind === "developer" && <DeveloperCompare r={r} />}
        {r.kind === "market" && <MarketCompare r={r} />}

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start gap-5 rounded-2xl bg-[#1a1a1a] p-9 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="font-serif text-[1.5rem] font-medium leading-[1.2] md:text-[1.8rem]">Still deciding between the two?</p>
            <p className="mt-2 text-[0.88rem] font-light text-white/55">An independent advisor can weigh them against your exact budget, horizon and priorities.</p>
          </div>
          <button onClick={() => open()} className="shrink-0 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Request Independent Advice
          </button>
        </div>

        <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
          Independent comparison by Truth Estate. No developer can pay for a higher score or a better placement. Scores, signals and bands are our own evidence-based reads and vary by tower, floor and stack — not investment advice.
        </p>
      </div>
    </div>
  );
}

/* ── PROJECT ─────────────────────────────────────────────────────── */

const BAND_COLOR: Record<Pillar["band"], string> = {
  exceptional: "#1e6b45", strong: "#238c55", moderate: "#9a7a2e", watch: "#9a4130",
};

function PillarVal({ pl }: { pl: Pillar }) {
  return (
    <span className="tabular-nums font-medium" style={{ color: BAND_COLOR[pl.band] }}>
      {pl.score.toFixed(1)}<span className="ml-0.5 text-[0.7rem] font-light text-[#1a1a1a]/35">/10</span>
    </span>
  );
}

function ProjectHead({ p }: { p: ProjectIntel }) {
  const reco = p.recommendation;
  const tone = /strong buy/i.test(reco)
    ? "border-[#1e6b45]/30 bg-[#1e6b45]/[0.07] text-[#1e6b45]"
    : /buy/i.test(reco)
      ? "border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.08] text-[#8a6a1e]"
      : "border-[#1a1a1a]/15 bg-white/60 text-[#1a1a1a]/55";
  return (
    <div className="flex h-full min-w-0 flex-col">
      <a href={projectHref(p)}
        className="font-serif text-[1.25rem] font-medium leading-[1.15] text-[#1a1a1a] underline decoration-[#c9a96e]/30 underline-offset-4 hover:text-[#1e6b45] md:text-[1.6rem]">
        {p.name}
      </a>
      <p className="mt-1.5 text-[0.68rem] font-light leading-snug text-[#1a1a1a]/45 md:text-[0.74rem]">{streetAddress(p)}</p>
      {/* score + verdict pinned to the column's base so both sides' scores land
          on one line however many lines the name wraps to */}
      <div className="mt-auto pt-4">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[2.1rem] font-medium leading-none text-[#1e6b45]">{p.truthScore}</span>
          <span className="font-mono text-[0.52rem] uppercase tracking-[0.16em] text-[#1a1a1a]/35">/100 Truth Score</span>
        </div>
        <span className={`mt-2.5 inline-block rounded-full border px-2.5 py-1 text-[0.62rem] font-medium ${tone}`}>{reco}</span>
      </div>
    </div>
  );
}

function ProjectCompare({ r }: { r: Extract<ResolvedCompare, { kind: "project" }> }) {
  const { a, b } = r;
  // Lead gate — project↔project only. Signed in reveals every gated block; the
  // page is otherwise fully public, so this is conversion, not access control.
  const unlocked = useUnlocked();
  const winner = a.truthScore >= b.truthScore ? a : b;
  const other = winner === a ? b : a;

  const [ja, jb] = [priceJourney(a), priceJourney(b)];
  const [oa, ob] = [deliveryOutlook(a), deliveryOutlook(b)];
  const [ma, mb] = [roiModel(a), roiModel(b)];
  const [pilA, pilB] = [pillars(a), pillars(b)];

  const effOf = (p: ProjectIntel) => {
    const hs = p.ops?.homes?.filter((h) => h.carpetSqft != null && h.superSqft > 0);
    if (!hs?.length) return null;
    return Math.max(...hs.map((h) => Math.round((h.carpetSqft! / h.superSqft) * 100)));
  };
  const supRange = (p: ProjectIntel) => {
    const hs = p.ops?.homes;
    if (!hs?.length) return null;
    const v = hs.map((h) => h.superSqft);
    return `${Math.min(...v).toLocaleString("en-IN")}–${Math.max(...v).toLocaleString("en-IN")} sq ft`;
  };
  /* small green quality pill for the vitals rows — mirrors the report's Vitals
     strip (Low-density ≤50 /acre, Green ≥80% open area) */
  const vtag = (t: string) => (
    <span className="ml-1.5 inline-block rounded-full border border-[#1e6b45]/25 bg-[#1e6b45]/[0.06] px-1.5 py-0.5 align-middle text-[0.5rem] font-medium uppercase tracking-[0.08em] text-[#1e6b45]">{t}</span>
  );
  const unitsLine = (p: ProjectIntel, o: ReturnType<typeof deliveryOutlook>) => {
    const total = p.ops?.units;
    if (!o || total == null) return undefined;
    return `${Math.round((total * o.absorptionPct) / 100).toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} units`;
  };
  const OUTLOOK_VAL = { High: 3, Medium: 2, Low: 1 } as const;
  const outlookOf = (m: ReturnType<typeof roiModel>) =>
    m ? ((m.adjCagr >= 8.5 ? "High" : m.adjCagr >= 6 ? "Medium" : "Low") as keyof typeof OUTLOOK_VAL) : null;
  const [olA, olB] = [outlookOf(ma), outlookOf(mb)];
  const [effA, effB] = [effOf(a), effOf(b)];

  const premiumClause = ja && jb && ja.premiumPct !== jb.premiumPct
    ? ` Since launch, ${ja.premiumPct > jb.premiumPct ? a.name : b.name} has compounded harder (+${Math.max(ja.premiumPct, jb.premiumPct)}% vs +${Math.min(ja.premiumPct, jb.premiumPct)}%).`
    : "";

  return (
    <>
      <div className="mt-10 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
        <Eyebrow>Our read</Eyebrow>
        <p className="mt-5 font-serif text-[1.3rem] font-normal leading-[1.5] md:text-[1.6rem]">
          {a.truthScore === b.truthScore
            ? `Line-ball on the headline score (${a.truthScore} each) — the choice comes down to ${tagOf(a)} versus ${tagOf(b)}.`
            : `${winner.name} leads on our score (${winner.truthScore} vs ${other.truthScore}).${winner.reason ? ` ${winner.reason}` : ""}${premiumClause} ${other.name} still earns its place on ${tagOf(other)}.`}
        </p>
      </div>

      <div className="mt-10">
        <div className="grid grid-cols-[0.78fr_1fr_1fr] items-stretch gap-3 pb-5 md:gap-5">
          <span />
          <ProjectHead p={a} />
          <ProjectHead p={b} />
        </div>

        <Row label="Ticket" a={ticketLabel(a)} b={ticketLabel(b)} />
        <Row label="Developer" a={a.developer} b={b.developer} />
        <Row label="Corridor" a={a.marketShort} b={b.marketShort} />
      </div>

      <Section title="Vitals' comparison">
        <Row label="Total units"
          a={a.ops?.units != null ? a.ops.units.toLocaleString("en-IN") : "—"}
          b={b.ops?.units != null ? b.ops.units.toLocaleString("en-IN") : "—"} />
        <Row label="Towers"
          a={a.ops?.towers != null ? String(a.ops.towers) : "—"}
          b={b.ops?.towers != null ? String(b.ops.towers) : "—"} />
        <Row label="Floors" a={a.ops?.floors ?? "—"} b={b.ops?.floors ?? "—"} />
        <Row label="Land"
          a={a.ops?.landAcres != null ? `${a.ops.landAcres} acre` : "—"}
          b={b.ops?.landAcres != null ? `${b.ops.landAcres} acre` : "—"} />
        <Row label="Density"
          a={a.ops?.density != null ? <>{a.ops.density} / acre{a.ops.density <= 50 && vtag("Low-density")}</> : "—"}
          b={b.ops?.density != null ? <>{b.ops.density} / acre{b.ops.density <= 50 && vtag("Low-density")}</> : "—"} />
        <Row label="Open area"
          a={a.ops?.openAreaPct != null ? <>{a.ops.openAreaPct}%{a.ops.openAreaPct >= 80 && vtag("Green")}</> : "—"}
          b={b.ops?.openAreaPct != null ? <>{b.ops.openAreaPct}%{b.ops.openAreaPct >= 80 && vtag("Green")}</> : "—"} />
        <Row label="Possession" a={a.ops?.possession ?? "—"} b={b.ops?.possession ?? "—"} />
      </Section>

      <Section title="The homes">
        <Row label="Configurations" a={a.configs.join(" · ")} b={b.configs.join(" · ")} />
        <Row label="Super area" a={supRange(a) ?? "—"} b={supRange(b) ?? "—"} />
        <Row label="Best carpet efficiency"
          a={effA != null ? `${effA}%` : "—"} b={effB != null ? `${effB}%` : "—"}
          subA={effA != null ? "carpet ÷ super, best layout" : undefined}
          subB={effB != null ? "carpet ÷ super, best layout" : undefined}
          win={effA != null && effB != null ? winHigher(effA, effB) : undefined} />
      </Section>

      <Section title="The money">
        <Row label="Price today"
          a={ja ? `₹${kNum(ja.currentLow)}K–${kNum(ja.currentHigh)}K` : a.psf ? `₹${kNum(a.psf.avg)}K avg` : "—"}
          b={jb ? `₹${kNum(jb.currentLow)}K–${kNum(jb.currentHigh)}K` : b.psf ? `₹${kNum(b.psf.avg)}K avg` : "—"}
          subA={ja ? `from ₹${kNum(ja.launchPsf)}K at launch` : undefined}
          subB={jb ? `from ₹${kNum(jb.launchPsf)}K at launch` : undefined} />
        {/* Premium since launch — the crisp tease, shown in both states. */}
        <Row label="Premium since launch"
          a={ja ? `+${ja.premiumPct}%` : "—"} b={jb ? `+${jb.premiumPct}%` : "—"}
          subA={ja ? `over ${ja.years} yrs` : undefined} subB={jb ? `over ${jb.years} yrs` : undefined}
          win={ja && jb ? winHigher(ja.premiumPct, jb.premiumPct) : undefined} />
        {unlocked ? (
          <Row label="10-yr growth outlook"
            a={olA ?? "—"} b={olB ?? "—"}
            subA={olA ? "exact CAGR inside the report" : undefined}
            subB={olB ? "exact CAGR inside the report" : undefined}
            win={olA && olB ? winHigher(OUTLOOK_VAL[olA], OUTLOOK_VAL[olB]) : undefined} />
        ) : (
          /* Locked: the balance glimpse weighs the two projects — leak-safe (no
             number, no resting winner) — then the free-unlock card. The real
             head-to-head resolves on unlock via the page's AUTH_EVENT reveal. */
          <div className="border-t border-[#1a1a1a]/8 pt-5">
            <CompareGlimpse aName={a.name} bName={b.name} />
            <div className="mt-5 flex justify-center px-2">
              <CompareUnlock />
            </div>
          </div>
        )}
      </Section>

      <Section title="The build">
        {/* Construction progress stays open on the public page; the delivery
            forecast and the sold-through figure sit behind the free unlock —
            field names shown, values gated, same treatment as the pillars. */}
        <Row label="Built vs RERA-due"
          a={oa ? `${oa.actualPct}% vs ${oa.expectedPct}%` : "—"} b={ob ? `${ob.actualPct}% vs ${ob.expectedPct}%` : "—"}
          subA={oa ? `QPR ${oa.qpr}` : undefined} subB={ob ? `QPR ${ob.qpr}` : undefined}
          win={oa && ob ? winHigher(oa.aheadOfPlan, ob.aheadOfPlan) : undefined} />
        {unlocked ? (
          <Row label="Expected OC"
            a={oa ? oa.predictedDate : "—"} b={ob ? ob.predictedDate : "—"}
            subA={oa && oa.ahead !== 0 ? `${Math.abs(oa.ahead)} mo ${oa.ahead > 0 ? "before" : "after"} the RERA date` : undefined}
            subB={ob && ob.ahead !== 0 ? `${Math.abs(ob.ahead)} mo ${ob.ahead > 0 ? "before" : "after"} the RERA date` : undefined}
            win={oa && ob ? winHigher(oa.ahead, ob.ahead) : undefined} />
        ) : <LockRow label="Expected OC" />}
        {unlocked ? (
          <Row label="Units sold"
            a={oa ? `${oa.absorptionPct}%` : "—"} b={ob ? `${ob.absorptionPct}%` : "—"}
            subA={unitsLine(a, oa)} subB={unitsLine(b, ob)}
            win={oa && ob ? winHigher(oa.absorptionPct, ob.absorptionPct) : undefined} />
        ) : <LockRow label="Units sold" />}
      </Section>

      <Section title="Trust, pillar by pillar" note="The same five-pillar model that builds the Truth Score — weighted 28 · 22 · 22 · 18 · 10.">
        <Gate
          open={unlocked}
          tease={<Row key={pilA[0].key} label={pilA[0].label} a={<PillarVal pl={pilA[0]} />} b={<PillarVal pl={pilB[0]} />} win={winHigher(pilA[0].score, pilB[0].score)} />}
          full={pilA.slice(1).map((pl, i) => (
            <Row key={pl.key} label={pl.label} a={<PillarVal pl={pl} />} b={<PillarVal pl={pilB[i + 1]} />} win={winHigher(pl.score, pilB[i + 1].score)} />
          ))}
          locked={pilA.slice(1).map((pl) => <LockRow key={pl.key} label={pl.label} />)}
          invite={<LockPill label="All five pillars, side by side" />}
        />
      </Section>

      {(a.strengths.length > 0 || b.strengths.length > 0) && (
        <Section title="Strengths">
          <div className="mt-2 grid gap-5 md:grid-cols-2">
            {a.strengths.length > 0 && <PointCol name={a.name} items={a.strengths} tone="good" />}
            {b.strengths.length > 0 && <PointCol name={b.name} items={b.strengths} tone="good" />}
          </div>
        </Section>
      )}

      {(a.watchouts.length > 0 || b.watchouts.length > 0) && (
        <Section title="Watch-outs">
          {unlocked ? (
            <div className="mt-2 grid gap-5 md:grid-cols-2">
              {a.watchouts.length > 0 && <PointCol name={a.name} items={a.watchouts} tone="watch" />}
              {b.watchouts.length > 0 && <PointCol name={b.name} items={b.watchouts} tone="watch" />}
            </div>
          ) : (
            /* Truth-brand: a company that sells the unflattering truth never
               paywalls its warnings. Show ONE real red flag on each side even
               when locked, then dissolve the rest behind the free unlock. */
            <>
              <div className="mt-2 grid gap-5 md:grid-cols-2">
                {a.watchouts.length > 0 && <PointCol name={a.name} items={a.watchouts.slice(0, 1)} tone="watch" />}
                {b.watchouts.length > 0 && <PointCol name={b.name} items={b.watchouts.slice(0, 1)} tone="watch" />}
              </div>
              {(a.watchouts.length > 1 || b.watchouts.length > 1) && (
                <div className="relative mt-5">
                  <div aria-hidden className="pointer-events-none [-webkit-mask-image:linear-gradient(180deg,#000_0,transparent_88%)] [mask-image:linear-gradient(180deg,#000_0,transparent_88%)]">
                    <LockLines />
                  </div>
                  <div className="relative z-10 -mt-14 flex justify-center">
                    <LockPill label="Every red flag, both sides" />
                  </div>
                </div>
              )}
            </>
          )}
        </Section>
      )}
    </>
  );
}

function PointCol({ name, items, tone }: { name: string; items: string[]; tone: "good" | "watch" }) {
  // mirror the report's Strengths & watch-outs language: green "+" vs amber "!"
  const mark = tone === "good" ? "+" : "!";
  const color = tone === "good" ? "text-[#1e6b45]" : "text-[#9a7a2e]";
  return (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-6">
      <p className="font-serif text-[1.1rem] text-[#1a1a1a]">{name}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((s) => (
          <li key={s} className="flex gap-2.5 text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/65"><span className={`mt-0.5 ${color}`}>{mark}</span>{s}</li>
        ))}
      </ul>
    </div>
  );
}

/* ── DEVELOPER ───────────────────────────────────────────────────── */
function DeveloperCompare({ r }: { r: Extract<ResolvedCompare, { kind: "developer" }> }) {
  const { a, b } = r;
  return (
    <>
      <div className="mt-10 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
        <Eyebrow>Our read</Eyebrow>
        <p className="mt-5 font-serif text-[1.3rem] font-normal leading-[1.5] md:text-[1.6rem]">
          Two distinct profiles. {a.name} — {a.tagline} {b.name} — {b.tagline}
        </p>
      </div>

      <div className="mt-10">
        <Heads aName={a.name} bName={b.name}
          aHref={`${basePath}/intelligence/developers/${a.slug}`} bHref={`${basePath}/intelligence/developers/${b.slug}`}
          aBadge={<Pill tone={a.listed ? "good" : "neutral"}>{a.listed ? "Listed" : "Private"}</Pill>}
          bBadge={<Pill tone={b.listed ? "good" : "neutral"}>{b.listed ? "Listed" : "Private"}</Pill>} />

        <Row label="Established" a={a.est} b={b.est} />
        <Row label="On-time delivery" a={`${a.performance.onTimePct}%`} b={`${b.performance.onTimePct}%`} win={winHigher(a.performance.onTimePct, b.performance.onTimePct)} />
        <Row label="Avg delay" a={`${a.performance.avgDelayMonths} mo`} b={`${b.performance.avgDelayMonths} mo`} win={winLower(a.performance.avgDelayMonths, b.performance.avgDelayMonths)} />
        <Row label="Delivered" a={a.performance.delivered} b={b.performance.delivered} win={winHigher(a.performance.delivered, b.performance.delivered)} />
        <Row label="Launched" a={a.performance.launched} b={b.performance.launched} />
        <Row label="Ongoing" a={a.performance.ongoing} b={b.performance.ongoing} />
      </div>

      <Section title="Financial health — signals, not figures">
        {FIN_METRICS.map((m) => (
          <SignalRow key={m.key} label={m.label} a={a.financials[m.key]} b={b.financials[m.key]} />
        ))}
      </Section>

      <Section title="Verdict">
        <div className="mt-2 grid gap-5 md:grid-cols-2">
          <VerdictCol name={a.name} body={a.verdict} />
          <VerdictCol name={b.name} body={b.verdict} />
        </div>
      </Section>
    </>
  );
}

/* ── MARKET ──────────────────────────────────────────────────────── */
function MarketCompare({ r }: { r: Extract<ResolvedCompare, { kind: "market" }> }) {
  const { a, b } = r;
  return (
    <>
      <div className="mt-10 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
        <Eyebrow>Our read</Eyebrow>
        {/* Two corridors on the same tier made this read "Dwarka Expressway
            is the growth play; SPR the growth one." The sentence only works
            when the tiers differ; when they match, the tier is the thing
            they have in common, not the thing that separates them. */}
        <p className="mt-5 font-serif text-[1.3rem] font-normal leading-[1.5] md:text-[1.6rem]">
          {a.tier === b.tier
            ? `Both are ${a.tier.toLowerCase()} corridors — the difference is what each rewards.`
            : `${a.name} is the ${a.tier.toLowerCase()} play; ${b.name} the ${b.tier.toLowerCase()} one.`}{" "}
          {a.short} for {a.bestFor.split("·")[0]?.trim().toLowerCase()}; {b.short} for {b.bestFor.split("·")[0]?.trim().toLowerCase()}.
        </p>
      </div>

      <div className="mt-10">
        <Heads aName={a.name} bName={b.name}
          aHref={`${basePath}/intelligence/markets/${a.slug}`} bHref={`${basePath}/intelligence/markets/${b.slug}`}
          aBadge={<Pill>{a.tier}</Pill>} bBadge={<Pill>{b.tier}</Pill>} />

        <Row label="Projects tracked" a={a.projectCount} b={b.projectCount} win={winHigher(a.projectCount, b.projectCount)} />
        <Row label="Avg ₹/sq ft" a={fmtPsf(a.psf.avg)} b={fmtPsf(b.psf.avg)} />
        <Row label="Price range" a={`${fmtPsf(a.psf.low)}–${fmtPsf(a.psf.high)}`} b={`${fmtPsf(b.psf.low)}–${fmtPsf(b.psf.high)}`} />
        {/* Was a hand-set three-year band; now the corridor's own five-year
            CAGR estimate from the pipeline, so the label moved with it. */}
        <Row label="Expected CAGR" a={a.appreciation3Y} b={b.appreciation3Y} />
        <Row label="Typical ticket" a={a.unitBand} b={b.unitBand} />
      </div>

      <Section title="Where each is headed">
        <div className="mt-2 grid gap-5 md:grid-cols-2">
          <TrendCol name={a.short} now={a.currentTrend} next={a.futureTrend} />
          <TrendCol name={b.short} now={b.currentTrend} next={b.futureTrend} />
        </div>
      </Section>

      <Section title="Verdict">
        <div className="mt-2 grid gap-5 md:grid-cols-2">
          <VerdictCol name={a.name} body={a.verdict} />
          <VerdictCol name={b.name} body={b.verdict} />
        </div>
      </Section>
    </>
  );
}

function VerdictCol({ name, body }: { name: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-6">
      <p className="font-serif text-[1.1rem] text-[#1a1a1a]">{name}</p>
      <p className="mt-3 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/60">{body}</p>
    </div>
  );
}
function TrendCol({ name, now, next }: { name: string; now: string; next: string }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-6">
      <p className="font-serif text-[1.1rem] text-[#1a1a1a]">{name}</p>
      <p className="mt-3 text-[0.78rem] font-medium uppercase tracking-[0.1em] text-[#c9a96e]">Now</p>
      <p className="mt-1 text-[0.9rem] font-light leading-[1.65] text-[#1a1a1a]/60">{now}</p>
      <p className="mt-4 text-[0.78rem] font-medium uppercase tracking-[0.1em] text-[#c9a96e]">Next</p>
      <p className="mt-1 text-[0.9rem] font-light leading-[1.65] text-[#1a1a1a]/60">{next}</p>
    </div>
  );
}
