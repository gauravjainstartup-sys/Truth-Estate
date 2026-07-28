"use client";
import { useState } from "react";
import type { RelatedGroups, RelatedProject } from "@/lib/relatedProjects";

/* "If not this project, then what?" — three ways to ask it.
 *
 * EVERY LIST IS IN THE DOM, ALWAYS. The inactive tabs are hidden with a
 * class, not skipped with a conditional. This is the whole reason the
 * groups are computed at build time: a crawler does not click tabs, so
 * conditionally rendering them would put two thirds of this page's
 * outbound links behind a state change no crawler will ever make — which
 * is the exact bug the comparable-projects work was written to fix, just
 * wearing a different hat. Eighteen links in the static HTML, six visible.
 */

const TABS = [
  { key: "sameMarket", label: "Same corridor", blurb: (m: string) => `Other projects on ${m} — the comparison you are actually making.` },
  { key: "nearby", label: "Within 5 km", blurb: () => "Same commute, same schools, same catchment — often under a different corridor name." },
  { key: "samePrice", label: "Similar ticket", blurb: () => "What the same rate per square foot buys elsewhere in the city." },
] as const;

export default function ReportAlternatives({
  groups,
  marketShort,
  basePath,
  projectName,
}: {
  groups: RelatedGroups;
  marketShort: string;
  basePath: string;
  projectName: string;
}) {
  const live = TABS.filter((t) => groups[t.key].length > 0);
  const [active, setActive] = useState<string>(live[0]?.key ?? "sameMarket");
  if (!live.length) return null;

  return (
    <div>
      <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
        The projects we would weigh against {projectName} — each with its own forensic read, scored the same way.
      </p>

      {/* the switch */}
      <div role="tablist" aria-label="Ways to compare" className="flex flex-wrap gap-2">
        {live.map((t) => {
          const on = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`alt-${t.key}`}
              onClick={() => setActive(t.key)}
              className={`rounded-full border px-4 py-2 text-[0.78rem] font-medium transition-colors ${
                on
                  ? "border-[#1e6b45]/30 bg-[#1e6b45]/[0.08] text-[#1e6b45]"
                  : "border-[#1a1a1a]/12 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/25 hover:text-[#1a1a1a]/80"
              }`}
            >
              {t.label}
              <span className="ml-1.5 font-mono text-[0.7rem] opacity-55">{groups[t.key].length}</span>
            </button>
          );
        })}
      </div>

      {live.map((t) => (
        <div
          key={t.key}
          id={`alt-${t.key}`}
          role="tabpanel"
          /* hidden, not unmounted — see the note at the top of this file */
          className={t.key === active ? "mt-5" : "hidden"}
        >
          <p className="mb-4 max-w-2xl text-[0.84rem] font-light leading-[1.6] text-[#1a1a1a]/45">{t.blurb(marketShort)}</p>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.07] sm:grid-cols-2">
            {groups[t.key].map((r) => (
              <Row key={`${t.key}-${r.seoSlug}`} r={r} basePath={basePath} showKm={t.key === "nearby"} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Row({ r, basePath, showKm }: { r: RelatedProject; basePath: string; showKm: boolean }) {
  /* The sub-line answers "why is this one here" — the corridor normally,
     the distance on the nearby tab, where that is the whole point of it. */
  const sub = showKm && r.km != null ? `${r.km} km away${r.microMarket ? ` · ${r.microMarket}` : ""}` : r.microMarket;
  return (
    <li className="bg-[#F5F0E8]">
      <a
        href={`${basePath}/projects/${r.seoSlug}`}
        className="group flex h-full items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#1e6b45]/[0.06]"
      >
        <span className="min-w-0">
          <span className="block truncate font-serif text-[1.02rem] font-medium text-[#1a1a1a]/85">{r.name}</span>
          {sub && <span className="mt-0.5 block truncate text-[0.76rem] font-light text-[#1a1a1a]/45">{sub}</span>}
        </span>
        {r.truthScore != null && (
          <span className="shrink-0 font-mono text-[0.8rem] font-bold tabular-nums text-[#9a7a2e]">{Math.round(r.truthScore)}</span>
        )}
      </a>
    </li>
  );
}
