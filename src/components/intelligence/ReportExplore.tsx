"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_INTEL, alternativesIn, type ProjectIntel } from "@/lib/projects";
import { loadBuyData, matchScoreFor, type BuyData } from "@/lib/journey";
import ProjectOptionCard from "./ProjectOptionCard";

/* Chapter V — if not this, then what. The strongest alternatives as the
   shared project-option card, ranked to the reader's brief when they've set
   one, then a "widen the lens" row to the developer / corridor / compare.
   Every card is a real report link — the evidence layer never breaks. */

const basePath = "/Truth-Estate";

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
        {picks.map(({ x, m }, i) => (
          <ProjectOptionCard
            key={x.slug}
            p={x}
            rank={i + 1}
            matchPct={hasBrief ? m : null}
            onSelect={embedded ? () => onSelect?.(x.name) : undefined}
          />
        ))}
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
