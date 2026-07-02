import type { ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar V — Project USPs. Evidence-led differentiators, not
   brochure adjectives — each card is a substantiated advantage that moves
   livability, safety or resale. */

const ICONS = ["⇅", "❦", "⌂", "◈", "✦", "◎"];

export default function ReportUSPs({ p }: { p: ProjectIntel }) {
  const usps = p.ops?.usps ?? [];
  if (usps.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar V · Project USPs</p>
      <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">What actually makes it different?</h3>
      <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">Not the brochure adjectives — the non-obvious advantages that move livability, safety and resale, each one we can point to a source for.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usps.map((u, i) => (
          <div key={u.title} className="rounded-2xl border border-[#1a1a1a]/8 bg-gradient-to-br from-white/70 to-[#faf6ee] p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#9a7a2e]/10 text-[1.25rem] text-[#9a7a2e]" aria-hidden>{ICONS[i % ICONS.length]}</span>
            <h5 className="mt-3.5 font-serif text-[1.12rem] font-medium leading-tight">{u.title}</h5>
            <p className="mt-2 text-[0.84rem] font-light leading-[1.6] text-[#1a1a1a]/60">{u.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/45"><b className="font-medium text-[#1a1a1a]/70">How we read USPs:</b> we only count a differentiator if it&apos;s verifiable and it changes how you live or how the asset holds value. Marketing adjectives don&apos;t make this list.</p>
    </div>
  );
}
