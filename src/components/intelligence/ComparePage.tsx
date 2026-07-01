"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { RATING_META, FIN_METRICS, type FinRating } from "@/lib/developers";
import { SCORE_INPUTS, fmtPsf } from "@/lib/projects";
import { compareTitle, type ResolvedCompare } from "@/lib/compare";

const basePath = "/Truth-Estate";

const rateVal = (r: FinRating) => (r === "strong" ? 3 : r === "moderate" ? 2 : 1);
const winHigher = (a: number, b: number): Win => (a === b ? undefined : a > b ? "a" : "b");
const winLower = (a: number, b: number): Win => (a === b ? undefined : a < b ? "a" : "b");
type Win = "a" | "b" | undefined;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

const GRID = "grid grid-cols-[0.78fr_1fr_1fr] items-center gap-3 md:gap-5";

function Row({ label, a, b, win }: { label: string; a: React.ReactNode; b: React.ReactNode; win?: Win }) {
  const cell = (side: "a" | "b", v: React.ReactNode) => (
    <div className={`flex items-center gap-2 text-[0.9rem] md:text-[0.98rem] ${win === side ? "font-medium text-[#1a1a1a]" : "font-light text-[#1a1a1a]/60"}`}>
      {v}{win === side && <span className="text-[0.7rem] text-[#1e6b45]" aria-label="leads">▲</span>}
    </div>
  );
  return (
    <div className={`${GRID} border-t border-[#1a1a1a]/8 py-4`}>
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40 md:text-[0.7rem]">{label}</p>
      {cell("a", a)}
      {cell("b", b)}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#1a1a1a]/40">{title}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ScoreBadge({ n }: { n: number }) {
  return <span className="font-mono text-[1.4rem] font-light text-[#1e6b45]">{n}<span className="ml-1 text-[0.6rem] uppercase tracking-[0.14em] text-[#1a1a1a]/35">score</span></span>;
}
function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "neutral" }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] ${tone === "good" ? "border-[#1e6b45]/30 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/45"}`}>{children}</span>;
}

export default function ComparePage({ r }: { r: ResolvedCompare }) {
  const { open } = useJourney();

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={basePath} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <button onClick={() => open()} className="ml-auto rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5">
            Request Independent Advice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-[14vh] pt-[6vh] md:px-10">
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
function ProjectCompare({ r }: { r: Extract<ResolvedCompare, { kind: "project" }> }) {
  const { a, b } = r;
  const win = winHigher(a.truthScore, b.truthScore);
  const winner = a.truthScore >= b.truthScore ? a : b;
  const other = winner === a ? b : a;

  return (
    <>
      <div className="mt-10 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
        <Eyebrow>Our read</Eyebrow>
        <p className="mt-5 font-serif text-[1.3rem] font-normal leading-[1.5] md:text-[1.6rem]">
          {a.truthScore === b.truthScore
            ? `Line-ball on the headline score (${a.truthScore} each) — the choice comes down to ${a.tags[0]?.toLowerCase()} versus ${b.tags[0]?.toLowerCase()}.`
            : `${winner.name} leads on our score (${winner.truthScore} vs ${other.truthScore}). ${winner.reason} ${other.name} still earns its place on ${other.tags[0]?.toLowerCase()}.`}
        </p>
      </div>

      <div className="mt-10">
        <Heads aName={a.name} bName={b.name}
          aHref={`${basePath}/intelligence/projects/${a.slug}`} bHref={`${basePath}/intelligence/projects/${b.slug}`}
          aBadge={<div className="flex items-center gap-3"><ScoreBadge n={a.truthScore} /></div>}
          bBadge={<div className="flex items-center gap-3"><ScoreBadge n={b.truthScore} /></div>} />

        <Row label="Recommendation" a={a.recommendation} b={b.recommendation} />
        <Row label="Developer" a={a.developer} b={b.developer} />
        <Row label="Market" a={a.marketShort} b={b.marketShort} />
        <Row label="Ticket" a={`₹${a.budget[0]}–${a.budget[1]} Cr`} b={`₹${b.budget[0]}–${b.budget[1]} Cr`} />
        <Row label="Configs" a={a.configs.join(", ")} b={b.configs.join(", ")} />
        <Row label="Corridor ₹/sq ft" a={a.psf ? fmtPsf(a.psf.avg) : "—"} b={b.psf ? fmtPsf(b.psf.avg) : "—"} />
      </div>

      <Section title="Truth Score anatomy">
        {SCORE_INPUTS.map((s) => (
          <SignalRow key={s.key} label={s.label} a={a.anatomy[s.key]} b={b.anatomy[s.key]} />
        ))}
      </Section>

      <Section title="Strengths">
        <div className="mt-2 grid gap-5 md:grid-cols-2">
          <StrengthCol name={a.name} items={a.strengths} />
          <StrengthCol name={b.name} items={b.strengths} />
        </div>
      </Section>
    </>
  );
}

function StrengthCol({ name, items }: { name: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-6">
      <p className="font-serif text-[1.1rem] text-[#1a1a1a]">{name}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((s) => (
          <li key={s} className="flex gap-2.5 text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/65"><span className="mt-0.5 text-[#1e6b45]">+</span>{s}</li>
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
        <p className="mt-5 font-serif text-[1.3rem] font-normal leading-[1.5] md:text-[1.6rem]">
          {a.name} is the {a.tier.toLowerCase()} play; {b.name} the {b.tier.toLowerCase()} one. {a.short} for {a.bestFor.split("·")[0]?.trim().toLowerCase()}; {b.short} for {b.bestFor.split("·")[0]?.trim().toLowerCase()}.
        </p>
      </div>

      <div className="mt-10">
        <Heads aName={a.name} bName={b.name}
          aHref={`${basePath}/intelligence/markets/${a.slug}`} bHref={`${basePath}/intelligence/markets/${b.slug}`}
          aBadge={<Pill>{a.tier}</Pill>} bBadge={<Pill>{b.tier}</Pill>} />

        <Row label="Projects tracked" a={a.projectCount} b={b.projectCount} win={winHigher(a.projectCount, b.projectCount)} />
        <Row label="Avg ₹/sq ft" a={fmtPsf(a.psf.avg)} b={fmtPsf(b.psf.avg)} />
        <Row label="Price range" a={`${fmtPsf(a.psf.low)}–${fmtPsf(a.psf.high)}`} b={`${fmtPsf(b.psf.low)}–${fmtPsf(b.psf.high)}`} />
        <Row label="3-year trend" a={a.appreciation3Y} b={b.appreciation3Y} />
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
