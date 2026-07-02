"use client";

import { useEffect, useState } from "react";

/* Chapter IV closer — rate the report, report an error, share. The rating
   persists locally; "report an error" is a first-class trust signal, not a
   buried support link. */

export default function ReportFeedback({ slug, name }: { slug: string; name: string }) {
  const KEY = `truthEstate.reportRating.${slug}`;
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { const v = Number(localStorage.getItem(KEY) ?? 0); if (v) { setRating(v); setSaved(true); } } catch {}
  }, [KEY]);

  const rate = (v: number) => {
    setRating(v); setSaved(true);
    try { localStorage.setItem(KEY, String(v)); } catch {}
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) { await navigator.share({ title: `${name} — Truth Estate report`, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const mail = (subject: string) =>
    `mailto:desk@truthestate.in?subject=${encodeURIComponent(`${subject} — ${name}`)}&body=${encodeURIComponent(`Report: ${typeof window !== "undefined" ? window.location.href : name}\n\n`)}`;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-dashed border-[#1a1a1a]/15 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="text-[0.86rem] font-semibold">{saved ? "Thank you — noted." : "Was this report useful?"}</span>
          <span className="flex gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => rate(v)} aria-label={`${v} star${v > 1 ? "s" : ""}`}
                className={`text-[1.25rem] leading-none transition-colors ${v <= rating ? "text-[#9a7a2e]" : "text-[#1a1a1a]/15 hover:text-[#c9a96e]"}`}>★</button>
            ))}
          </span>
        </div>
        <div className="flex flex-wrap gap-5 text-[0.78rem]">
          <a href={mail("Report an error")} className="inline-flex items-center gap-1.5 text-[#1a1a1a]/60 hover:text-[#1a1a1a]"><span className="text-[#9a7a2e]" aria-hidden>⚑</span> Report an error</a>
          <a href={mail("Feedback")} className="inline-flex items-center gap-1.5 text-[#1a1a1a]/60 hover:text-[#1a1a1a]"><span className="text-[#9a7a2e]" aria-hidden>✎</span> Share feedback</a>
          <button onClick={share} className="inline-flex items-center gap-1.5 text-[#1a1a1a]/60 hover:text-[#1a1a1a]"><span className="text-[#9a7a2e]" aria-hidden>↗</span> {copied ? "Link copied ✓" : "Share this report"}</button>
        </div>
      </div>
      <p className="mt-4 text-center text-[0.7rem] font-light leading-[1.6] text-[#1a1a1a]/40">
        Every report is re-checked quarterly · <b className="font-medium text-[#1a1a1a]/60">no developer pays to appear or to score</b> · spotted something off? Tell us — we fix it fast.
      </p>
    </div>
  );
}
