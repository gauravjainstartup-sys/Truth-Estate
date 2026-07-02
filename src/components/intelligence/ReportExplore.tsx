import { PROJECT_INTEL, alternativesIn, type ProjectIntel } from "@/lib/projects";

/* Chapter IV — keep exploring. Three forward flows out of the report:
   nearby in the corridor, more from the developer, similar budget —
   every card carrying its Truth Score so the reader never leaves the
   evidence layer. */

const basePath = "/Truth-Estate";

export default function ReportExplore({ p, embedded, onSelect }: { p: ProjectIntel; embedded?: boolean; onSelect?: (name: string) => void }) {
  const nearby = alternativesIn(p.market, p.name).slice(0, 2);
  const sameDev = PROJECT_INTEL.filter((x) => x.developer === p.developer && x.name !== p.name).slice(0, 2);
  const similar = PROJECT_INTEL
    .filter((x) => x.name !== p.name && x.market !== p.market && x.budget[0] <= p.budget[1] && x.budget[1] >= p.budget[0])
    .slice(0, 2);

  const cols: { title: string; icon: string; items: ProjectIntel[]; more?: { label: string; href: string } }[] = [
    { title: `Nearby in ${p.marketShort}`, icon: "◉", items: nearby, more: p.marketSlug ? { label: `All of ${p.marketShort} →`, href: `${basePath}/intelligence/markets/${p.marketSlug}` } : undefined },
    { title: `More from ${p.developer}`, icon: "❦", items: sameDev, more: p.devSlug ? { label: "Developer dossier →", href: `${basePath}/intelligence/developers/${p.devSlug}` } : undefined },
    { title: `Similar budget · ₹${p.budget[0]}–${p.budget[1]} Cr`, icon: "◈", items: similar, more: { label: "Compare side-by-side →", href: `${basePath}/intelligence/compare` } },
  ];

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {cols.filter((c) => c.items.length > 0).map((col) => (
        <div key={col.title}>
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#1a1a1a]/45"><span className="mr-1.5 text-[#9a7a2e]" aria-hidden>{col.icon}</span>{col.title}</p>
          <div className="mt-3 space-y-2.5">
            {col.items.map((a) => {
              const inner = (
                <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1e6b45]/[0.08]">
                    <span className="text-center leading-none">
                      <span className="block font-mono text-[0.92rem] font-semibold text-[#1e6b45]">{a.truthScore}</span>
                      <span className="block text-[0.42rem] font-medium uppercase tracking-[0.06em] text-[#1a1a1a]/40">Truth</span>
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.88rem] font-semibold text-[#1a1a1a]">{a.name}</span>
                    <span className="block text-[0.68rem] font-light text-[#1a1a1a]/45">{a.marketShort} · ₹{a.budget[0]}–{a.budget[1]} Cr</span>
                  </span>
                  <span className="text-[#9a7a2e]" aria-hidden>→</span>
                </>
              );
              const cls = "flex w-full items-center gap-3 rounded-xl border border-[#1a1a1a]/8 bg-white/70 px-3.5 py-3 text-left transition-colors hover:border-[#9a7a2e]/40";
              return embedded ? (
                <button key={a.slug} onClick={() => onSelect?.(a.name)} className={cls}>{inner}</button>
              ) : (
                <a key={a.slug} href={`${basePath}/intelligence/projects/${a.slug}`} className={cls}>{inner}</a>
              );
            })}
          </div>
          {col.more && !embedded && <a href={col.more.href} className="mt-2.5 inline-block text-[0.76rem] font-semibold text-[#9a7a2e] hover:text-[#7a5f1e]">{col.more.label}</a>}
        </div>
      ))}
    </div>
  );
}
