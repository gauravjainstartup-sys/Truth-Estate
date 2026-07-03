"use client";

import { useEffect, useState } from "react";
import { saveLead } from "@/lib/journey";

/* Chapter IV closer — rate the report, report an error, share. The rating
   persists locally; "report an error" and "share feedback" open a short
   form (identity → detail → submitting → success), logged as a lead, so
   the trust signal is a first-class flow, not a buried mailto. */

type Intent = "report-error" | "feedback";
type Stage = "form" | "sending" | "done";
const IDENTITIES = ["Developer", "Investor", "End User", "Broker"];

export default function ReportFeedback({ slug, name }: { slug: string; name: string }) {
  const KEY = `truthEstate.reportRating.${slug}`;
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<Intent | null>(null);

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
          <button onClick={() => setOpen("report-error")} className="inline-flex items-center gap-1.5 text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"><span className="text-[#9a7a2e]" aria-hidden>⚑</span> Report an error</button>
          <button onClick={() => setOpen("feedback")} className="inline-flex items-center gap-1.5 text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"><span className="text-[#9a7a2e]" aria-hidden>✎</span> Share feedback</button>
          <button onClick={share} className="inline-flex items-center gap-1.5 text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"><span className="text-[#9a7a2e]" aria-hidden>↗</span> {copied ? "Link copied ✓" : "Share this report"}</button>
        </div>
      </div>
      <p className="mt-4 text-center text-[0.7rem] font-light leading-[1.6] text-[#1a1a1a]/40">
        Every report is re-checked quarterly · <b className="font-medium text-[#1a1a1a]/60">no developer pays to appear or to score</b> · spotted something off? Tell us — we fix it fast.
      </p>

      {open && <FeedbackModal intent={open} project={name} onClose={() => setOpen(null)} />}
    </div>
  );
}

function FeedbackModal({ intent, project, onClose }: { intent: Intent; project: string; onClose: () => void }) {
  const isError = intent === "report-error";
  const [stage, setStage] = useState<Stage>("form");
  const [identity, setIdentity] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const submit = () => {
    if (!message.trim() || stage !== "form") return;
    setStage("sending");
    saveLead({ name: "", email: contact.trim(), project, intent, identity: identity || undefined, message: message.trim(), createdAt: Date.now() });
    setTimeout(() => setStage("done"), 850);
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-[#0B1F1A]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-2xl bg-[#FBF8F2] shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {stage === "done" ? (
          <div className="px-7 py-12 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#1e6b45]/12 text-[1.5rem] text-[#1e6b45]" aria-hidden>✓</span>
            <p className="mt-5 font-serif text-[1.5rem] font-medium leading-tight text-[#1a1a1a]">{isError ? "Flagged with the desk." : "Thank you — logged."}</p>
            <p className="mx-auto mt-2.5 max-w-[300px] text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/55">
              {isError
                ? "We re-check every flagged item against source — usually within a day. If you left a contact, we'll tell you what we found."
                : "Real feedback shapes what we track next. If you left a contact, we may follow up."}
            </p>
            <button onClick={onClose} className="mt-7 w-full rounded-xl bg-[#0B1F1A] py-3.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#123d2e]">Done</button>
          </div>
        ) : (
          <div className="px-6 py-7 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`grid h-11 w-11 place-items-center rounded-xl text-[1.2rem] ${isError ? "bg-[#b0503e]/10 text-[#b0503e]" : "bg-[#9a7a2e]/12 text-[#9a7a2e]"}`} aria-hidden>{isError ? "⚑" : "✎"}</span>
                <h3 className="mt-3.5 font-serif text-[1.45rem] font-medium leading-tight text-[#1a1a1a]">{isError ? "Report an error" : "Share feedback"}</h3>
                <p className="mt-1 text-[0.8rem] font-light text-[#1a1a1a]/50">On the {project} report.</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="-mr-1 text-[0.7rem] font-medium tracking-[0.12em] text-[#1a1a1a]/35 transition-colors hover:text-[#1a1a1a]/70">CLOSE</button>
            </div>

            <p className="mt-6 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#1a1a1a]/45">You are a</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {IDENTITIES.map((id) => (
                <button key={id} onClick={() => setIdentity(id)}
                  className={`rounded-xl border py-2.5 text-[0.82rem] font-medium transition-colors ${identity === id ? "border-[#1e6b45] bg-[#1e6b45]/[0.06] text-[#1a1a1a]" : "border-[#1a1a1a]/12 bg-white text-[#1a1a1a]/60 hover:border-[#1a1a1a]/30"}`}>
                  {id}
                </button>
              ))}
            </div>

            <p className="mt-5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#1a1a1a]/45">{isError ? "What's off?" : "What could be better?"}</p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} autoFocus
              placeholder={isError ? "Describe the discrepancy — the number, the section, what it should be…" : "Tell us what would make this report more useful…"}
              className="mt-2.5 w-full resize-none rounded-xl border border-[#1a1a1a]/12 bg-white px-3.5 py-3 text-[0.86rem] leading-[1.6] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#1e6b45]" />

            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone (optional — so we can reply)"
              className="mt-2.5 w-full rounded-xl border border-[#1a1a1a]/12 bg-white px-3.5 py-2.5 text-[0.82rem] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#1e6b45]" />

            <button onClick={submit} disabled={!message.trim() || stage === "sending"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F1A] py-3.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#123d2e] disabled:cursor-not-allowed disabled:opacity-40">
              {stage === "sending" ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
              ) : (
                isError ? "Submit report" : "Send feedback"
              )}
            </button>
            <p className="mt-3 text-center text-[0.66rem] font-light text-[#1a1a1a]/40">Goes straight to the desk. We read every one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
