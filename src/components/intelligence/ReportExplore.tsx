"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_INTEL, alternativesIn, type ProjectIntel } from "@/lib/projects";
import { loadBuyData, matchScoreFor, type BuyData } from "@/lib/journey";

/* Chapter V — if not this, then what. The strongest alternatives as full
   cards (Truth Score + reco + thesis), ranked to the reader's brief when
   they've set one, then a "widen the lens" row to the developer / corridor /
   compare. Every card is a real report link — the evidence layer never
   breaks. */

const basePath = "/Truth-Estate";

const recoTone = (reco: string) =>
  /strong buy/i.test(reco)
    ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.09] text-[#1e6b45]"
    : /buy/i.test(reco)
    ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.14] text-[#9a7a2e]"
    : "border-[#1a1a1a]/15 bg-[#1a1a1a]/[0.04] text-[#1a1a1a]/55";

function ScoreRing({ score }: { score: number }) {
  const R = 22;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative h-[58px] w-[58px]">
      <svg viewBox="0 0 58 58" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="29" cy="29" r={R} fill="none" stroke="#1a1a1a" strokeOpacity="0.08" strokeWidth="4" />
        <circle cx="29" cy="29" r={R} fill="none" stroke="#1e6b45" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><span className="font-serif text-[1.15rem] font-medium leading-none text-[#1a1a1a]">{score}</span></div>
    </div>
  );
}

export default function ReportExplore({ p, embedded, onSelect }: { p: ProjectIntel; embedded?: boolean; onSelect?: (name: string) => void }) {
  const [buy, setBuy] = useState<BuyData | null>(null);
  useEffect(() => { try { setBuy(loadBuyData()); } catch {} }, []);
  const hasBrief = !!buy && (buy.locations.length > 0 || buy.budgetCr > 0 || buy.configs.length > 0 || buy.priorities.length > 0);

  const picks = useMemo(() => {
    const pool = new Map<string, ProjectIntel>();
    alternativesIn(p.market, p.name).forEach((x) => pool.set(x.name, x));
    PROJECT_INTEL.filter((x) => x.developer === p.developer && x.name !== p.name).forEach((x) => pool.set(x.name, x));
    PROJECT_INTEL.filter((x) => x.name !== p.name && x.budget[0] <= p.budget[1] && x.budget[1] >= p.budget[0]).forEach((x) => pool.set(x.name, x));
    pool.delete(p.name);
    return [...pool.values()]
      .map((x) => ({ x, m: hasBrief ? matchScoreFor(x, buy!) : x.truthScore }))
      .sort((a, b) => b.m - a.m || b.x.truthScore - a.x.truthScore)
      .slice(0, 3);
  }, [p, buy, hasBrief]);

  const links = [
    p.marketSlug ? { label: `All of ${p.marketShort}`, href: `${basePath}/intelligence/markets/${p.marketSlug}` } : null,
    p.devSlug ? { label: `${p.developer} dossier`, href: `${basePath}/intelligence/developers/${p.devSlug}` } : null,
    { label: "Compare side-by-side", href: `${basePath}/intelligence/compare` },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="mt-8">
      <div className="grid gap-5 md:grid-cols-3">
        {picks.map(({ x, m }, i) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <span className="font-serif text-[0.95rem] font-light text-[#1a1a1a]/30">{String(i + 1).padStart(2, "0")}</span>
                <span className={`rounded-full border px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.08em] ${recoTone(x.recommendation)}`}>{x.recommendation}</span>
              </div>
              <h3 className="mt-4 font-serif text-[1.3rem] font-medium leading-tight text-[#1a1a1a]">{x.name}</h3>
              <p className="mt-1.5 text-[0.74rem] font-light tracking-[0.02em] text-[#1a1a1a]/45">{x.developer} · {x.marketShort}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="text-center">
                  <ScoreRing score={x.truthScore} />
                  <p className="mt-1 text-[8px] font-light uppercase tracking-[0.14em] text-[#1a1a1a]/40">Truth Score</p>
                </div>
                {hasBrief && (
                  <>
                    <div className="h-11 w-px bg-[#1a1a1a]/10" />
                    <div>
                      <p className="font-serif text-[1.5rem] font-medium leading-none text-[#1e6b45]">{m}%</p>
                      <p className="mt-1 text-[8px] font-light uppercase tracking-[0.14em] text-[#1a1a1a]/40">Match to you</p>
                    </div>
                  </>
                )}
              </div>
              <p className="mt-4 flex-1 text-[0.84rem] font-light leading-[1.55] text-[#1a1a1a]/60">{x.reason}</p>
              <p className="mt-4 border-t border-[#1a1a1a]/[0.07] pt-3.5 text-[0.74rem] font-light text-[#1a1a1a]/50">
                {x.configs.slice(0, 3).join(" · ")}<span className="mx-2 text-[#c9a96e]">·</span>₹{x.budget[0]}–{x.budget[1]} Cr
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-[#1e6b45] transition-all duration-300 group-hover:gap-2.5">See the full read <span aria-hidden>→</span></span>
            </>
          );
          const cls = "group flex flex-col rounded-2xl border border-[#1a1a1a]/10 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1a1a1a]/20 hover:shadow-xl hover:shadow-black/[0.06]";
          return embedded ? (
            <button key={x.slug} onClick={() => onSelect?.(x.name)} className={cls}>{inner}</button>
          ) : (
            <a key={x.slug} href={`${basePath}/intelligence/projects/${x.slug}`} className={cls}>{inner}</a>
          );
        })}
      </div>

      {!embedded && links.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/40">Widen the lens</span>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-[0.78rem] font-semibold text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]">{l.label} →</a>
          ))}
        </div>
      )}
    </div>
  );
}
