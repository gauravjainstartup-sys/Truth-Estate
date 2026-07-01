import { RATING_META, type FinRating } from "@/lib/developers";

/* A three-stop segmented rating — only the subject's level lights up in its
   tone; the other two stay faint so the scale reads at a glance. One shared
   meter across the report's Truth Score anatomy, the developer financial
   audit and anywhere else a strained→strong signal appears. */
const RATING_INDEX: Record<FinRating, number> = { weak: 0, moderate: 1, strong: 2 };
const RATING_STOPS = ["Strained", "Moderate", "Strong"];

export default function RatingMeter({ rating, label, meaning, sub }: { rating: FinRating; label: string; meaning?: string; sub?: string }) {
  const m = RATING_META[rating];
  const idx = RATING_INDEX[rating];
  return (
    <div className="rounded-xl border border-[#1a1a1a]/8 bg-white/60 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[0.9rem] font-medium text-[#1a1a1a]/85">{label}</p>
        {sub && <p className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[#1a1a1a]/30">{sub}</p>}
      </div>
      {meaning && <p className="mt-1 text-[0.75rem] font-light leading-[1.5] text-[#1a1a1a]/40">{meaning}</p>}
      <div className="mt-4 flex gap-1.5" role="img" aria-label={`${label}: ${m.label}`}>
        {RATING_STOPS.map((stop, i) => {
          const on = i === idx;
          return (
            <div
              key={stop}
              className={`flex-1 rounded-[4px] border py-1.5 text-center text-[0.56rem] font-semibold uppercase tracking-[0.06em] ${on ? "" : "border-transparent bg-[#1a1a1a]/[0.03] text-[#1a1a1a]/25"}`}
              style={on ? { backgroundColor: `${m.color}1a`, color: m.color, borderColor: `${m.color}55` } : undefined}
            >
              {stop}
            </div>
          );
        })}
      </div>
    </div>
  );
}
