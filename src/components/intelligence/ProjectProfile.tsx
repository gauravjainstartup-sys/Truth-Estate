"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { RATING_META, type FinRating } from "@/lib/developers";
import { SCORE_INPUTS, alternativesIn, fmtPsf, type ProjectIntel } from "@/lib/projects";

const basePath = "/Truth-Estate";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

const recoTone = (r: string) =>
  r.includes("Strong") ? "border-[#1e6b45]/30 text-[#1e6b45] bg-[#1e6b45]/8"
  : r === "Buy" ? "border-[#3e8e62]/30 text-[#3e8e62] bg-[#3e8e62]/8"
  : "border-[#9a7a2e]/30 text-[#9a7a2e] bg-[#c9a96e]/10";

/* A single Truth Score input on the strained→strong spectrum — a signal,
   not a figure. Same visual language as the developer financial gauges. */
function Signal({ rating, label, meaning }: { rating: FinRating; label: string; meaning: string }) {
  const m = RATING_META[rating];
  return (
    <div className="rounded-xl border border-[#1a1a1a]/8 bg-white/60 p-5">
      <p className="text-[0.92rem] font-medium text-[#1a1a1a]/85">{label}</p>
      <p className="mt-1 text-[0.76rem] font-light leading-[1.5] text-[#1a1a1a]/40">{meaning}</p>
      <div className="relative mt-5 h-[6px] w-full rounded-full" style={{ background: "linear-gradient(90deg, rgba(176,80,62,0.18), rgba(189,139,60,0.18) 50%, rgba(30,107,69,0.18))" }}>
        <span
          className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
          style={{ left: `${m.pos}%`, backgroundColor: m.color, boxShadow: `0 0 0 4px ${m.color}22` }}
        />
      </div>
      <div className="mt-3 flex justify-between">
        <span className="text-[0.58rem] uppercase tracking-[0.12em] text-[#1a1a1a]/20">Strained</span>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.08em]" style={{ color: m.color }}>{m.label}</span>
        <span className="text-[0.58rem] uppercase tracking-[0.12em] text-[#1a1a1a]/20">Strong</span>
      </div>
    </div>
  );
}

function Num({ v, k, accent }: { v: string; k: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-[1.5rem] font-light leading-none md:text-[1.7rem] ${accent ? "text-[#3e8e62]" : "text-[#1a1a1a]"}`}>{v}</p>
      <p className="mt-2.5 text-[0.66rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}

export default function ProjectProfile({
  p,
  embedded = false,
  onClose,
  onBack,
  onConsult,
  onChallenge,
  onSelectAlternative,
}: {
  p: ProjectIntel;
  /* When rendered inside the journey modal: drop the page chrome, keep the
     reader in the flow, and route actions back to the journey. */
  embedded?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onConsult?: () => void;
  onChallenge?: () => void;
  onSelectAlternative?: (name: string) => void;
}) {
  const { open } = useJourney();
  const consult = onConsult ?? (() => open());
  const alts = alternativesIn(p.market, p.name);
  const devHref = p.devSlug ? `${basePath}/intelligence/developers/${p.devSlug}` : undefined;
  const marketHref = p.marketSlug ? `${basePath}/intelligence/markets/${p.marketSlug}` : undefined;

  return (
    <div className={`${embedded ? "h-full overflow-y-auto" : "min-h-svh"} bg-[#F5F0E8] text-[#1a1a1a]`}>
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4 md:px-10">
          {embedded ? (
            <>
              <Logo color="#1a1a1a" className="h-7 w-auto opacity-80" />
              <span className="ml-auto hidden text-[10px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/40 md:block">Project Intelligence</span>
              <button onClick={onClose} aria-label="Close" className="ml-auto text-[11px] font-light tracking-[0.18em] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a] md:ml-8">
                CLOSE
              </button>
            </>
          ) : (
            <>
              <a href={basePath} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
              <button onClick={consult} className="ml-auto rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5">
                Request Independent Advice
              </button>
            </>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-[12vh] pt-[6vh] md:px-10">
        {/* Breadcrumb / back to shortlist */}
        {embedded ? (
          <button onClick={onBack} className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80">
            <span aria-hidden>&larr;</span> Back to shortlist
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
            <a href={`${basePath}/intelligence/projects`} className="transition-colors hover:text-[#1a1a1a]/70">Projects</a>
            <span className="text-[#1a1a1a]/20">/</span>
            <span className="text-[#1a1a1a]/55">{p.name}</span>
          </div>
        )}

        {/* Hero */}
        <div className="mt-9 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Project Intelligence</Eyebrow>
            <h1 className="mt-5 font-serif text-[2.7rem] font-medium leading-[1.02] tracking-[-0.02em] md:text-[4rem]">{p.name}</h1>
            <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.92rem] font-light text-[#1a1a1a]/55">
              {devHref ? <a href={devHref} className="underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/80">{p.developer}</a> : <span>{p.developer}</span>}
              <span className="text-[#1a1a1a]/25">·</span>
              {marketHref ? <a href={marketHref} className="underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/80">{p.market}</a> : <span>{p.market}</span>}
              <span className="text-[#1a1a1a]/25">·</span>
              <span>{p.configs.join(" · ")}</span>
            </p>
          </div>
          {/* Truth Score */}
          <div className="flex shrink-0 items-end gap-5">
            <div className="text-right">
              <p className="font-mono text-[3.4rem] font-light leading-none text-[#1e6b45] md:text-[4rem]">{p.truthScore}</p>
              <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/40">Truth Score</p>
            </div>
            <div className="mb-2 flex flex-col items-start gap-2">
              <span className={`rounded-full border px-3 py-1 text-[0.66rem] font-medium ${recoTone(p.recommendation)}`}>{p.recommendation}</span>
              <span className="text-[0.66rem] font-light text-[#1a1a1a]/40">{p.confidence} confidence</span>
            </div>
          </div>
        </div>

        {/* Truth Verdict */}
        <div className="mt-11 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
          <Eyebrow>Truth Verdict</Eyebrow>
          <p className="mt-5 font-serif text-[1.4rem] font-normal leading-[1.5] md:text-[1.7rem]">{p.reason}</p>
        </div>

        {/* 01 · Truth Score anatomy */}
        <Section n="01" title="Truth Score anatomy">
          <p className="-mt-2 mb-7 max-w-2xl text-[0.95rem] font-light leading-[1.8] text-[#1a1a1a]/55">
            No black box. The score is built from six inputs, each assessed independently — never supplied by the developer. Here is where this project sits on every one.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCORE_INPUTS.map((s) => (
              <Signal key={s.key} rating={p.anatomy[s.key]} label={s.label} meaning={s.meaning} />
            ))}
          </div>
        </Section>

        {/* 02 · The numbers */}
        <Section n="02" title="The numbers">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-8 md:grid-cols-4 md:p-10">
            <Num v={`₹${p.budget[0]}–${p.budget[1]} Cr`} k="Ticket size" />
            <Num v={p.configs.join(" · ")} k="Configurations" />
            <Num v={p.psf ? fmtPsf(p.psf.avg) : "—"} k="Corridor avg / sq ft" />
            <Num v={p.sizeBand ?? "—"} k="Indicative size" />
          </div>
          {p.psf && (
            <div className="mt-3 flex items-center gap-3 text-[0.78rem] font-light text-[#1a1a1a]/45">
              <span>{p.marketShort} price range</span>
              <span className="h-px flex-1 bg-[#1a1a1a]/10" />
              <span className="font-mono text-[#1a1a1a]/70">{fmtPsf(p.psf.low)} <span className="text-[#1a1a1a]/35">low</span> &nbsp;·&nbsp; {fmtPsf(p.psf.high)} <span className="text-[#1a1a1a]/35">high</span></span>
            </div>
          )}
        </Section>

        {/* 03 · Strengths & watch-outs */}
        <Section n="03" title="Strengths & watch-outs">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[#1e6b45]/15 bg-[#1e6b45]/[0.04] p-7">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#1e6b45]">What works</p>
              <ul className="mt-4 space-y-3">
                {p.strengths.map((s) => (
                  <li key={s} className="flex gap-3 text-[0.95rem] font-light leading-[1.6] text-[#1a1a1a]/70"><span className="mt-0.5 text-[#1e6b45]">+</span>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#9a7a2e]/20 bg-[#c9a96e]/[0.06] p-7">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#9a7a2e]">What to watch</p>
              <ul className="mt-4 space-y-3">
                {p.watchouts.map((w) => (
                  <li key={w} className="flex gap-3 text-[0.95rem] font-light leading-[1.6] text-[#1a1a1a]/70"><span className="mt-0.5 text-[#9a7a2e]">!</span>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* 04 · What this serves */}
        <Section n="04" title="What this serves">
          <p className="-mt-2 mb-5 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/50">The buyer priorities this project genuinely answers — on the evidence, not the brochure.</p>
          <div className="flex flex-wrap gap-2.5">
            {p.tags.map((t) => (
              <span key={t} className="rounded-full border border-[#1a1a1a]/12 px-4 py-2 text-[0.82rem] font-light text-[#1a1a1a]/65">{t}</span>
            ))}
          </div>
        </Section>

        {/* 05 · Context — developer + market (standalone page only) */}
        {!embedded && (
          <Section n="05" title="Context">
            <div className="grid gap-5 md:grid-cols-2">
              <ContextCard kicker="Developer" title={p.developer} href={devHref} cta="Open developer dossier" />
              <ContextCard kicker="Location" title={p.market} href={marketHref} cta={`Open ${p.marketShort} intelligence`} />
            </div>
          </Section>
        )}

        {/* Alternatives */}
        {alts.length > 0 && (
          <section className="mt-16 border-t border-[#1a1a1a]/8 pt-12">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[0.8rem] text-[#c9a96e]">→</span>
              <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] md:text-[2.1rem]">Also in {p.marketShort}</h2>
            </div>
            <div className="mt-8 divide-y divide-[#1a1a1a]/8 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/50">
              {alts.map((a) => {
                const cls = "flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/70 md:p-6";
                const inner = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-[1.15rem] text-[#1a1a1a]">{a.name}</p>
                      <p className="mt-1 font-mono text-[0.68rem] tracking-[0.04em] text-[#1a1a1a]/40">{a.developer.toUpperCase()} · ₹{a.budget[0]}–{a.budget[1]} CR</p>
                    </div>
                    <span className={`hidden rounded-full border px-3 py-1 text-[0.64rem] font-medium sm:inline-block ${recoTone(a.recommendation)}`}>{a.recommendation}</span>
                    <span className="w-10 text-right font-mono text-[1.3rem] font-light text-[#1e6b45]">{a.truthScore}</span>
                  </>
                );
                return embedded ? (
                  <button key={a.slug} onClick={() => onSelectAlternative?.(a.name)} className={cls}>{inner}</button>
                ) : (
                  <a key={a.slug} href={`${basePath}/intelligence/projects/${a.slug}`} className={cls}>{inner}</a>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-14 flex flex-col items-start gap-5 rounded-2xl bg-[#1a1a1a] p-9 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="font-serif text-[1.5rem] font-medium leading-[1.2] md:text-[1.8rem]">Considering {p.name}?</p>
            <p className="mt-2 text-[0.88rem] font-light text-white/55">Get an independent read — the right price, the right stack, the honest risks — before you commit.</p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            {embedded && onChallenge && (
              <button onClick={onChallenge} className="rounded-sm border border-white/25 px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:border-white/55">
                Challenge TruthGuide
              </button>
            )}
            <button onClick={consult} className="rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
              Request Independent Advice
            </button>
          </div>
        </div>

        <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
          Independent assessment by Truth Estate. We take no developer commissions. The Truth Score and its inputs are our own evidence-based reads; ticket and price bands are tracked estimates that vary by tower, floor and stack. Not investment advice — confirm specifics with your advisor.
        </p>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[0.8rem] text-[#c9a96e]">{n}</span>
        <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] text-[#1a1a1a] md:text-[2.1rem]">{title}</h2>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function ContextCard({ kicker, title, href, cta }: { kicker: string; title: string; href?: string; cta: string }) {
  const body = (
    <>
      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">{kicker}</p>
      <p className="mt-3 font-serif text-[1.6rem] font-medium text-[#1a1a1a]">{title}</p>
      {href && <p className="mt-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#1e6b45]">{cta} <span aria-hidden>→</span></p>}
    </>
  );
  return href ? (
    <a href={href} className="group rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-7 transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/80">{body}</a>
  ) : (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-7">{body}</div>
  );
}
