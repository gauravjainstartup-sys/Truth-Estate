"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — TRACK

   Where a buyer watches their mandate go to work. Reads the mandate the
   flow mirrored into localStorage (see src/lib/dealRoomMandate.ts) and lays
   out the pipeline: mandate received → lock-in call → float → offers →
   compare. Honest by construction — the cohort is concierge-run this month,
   so the live truth is "logged, advisor call pending." We never invent offer
   progress; the moment there is a seller portal, the same rail fills from it.

   Static export reads localStorage only after mount, so the first paint is a
   stable shell (no server/client hydration mismatch), then the mandate — or
   a gentle empty state — fills in.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import { basePath } from "@/lib/site";
import { track } from "@/lib/events";
import { loadMandate, type SavedMandate, COHORT } from "@/lib/dealRoomMandate";



type StageState = "done" | "current" | "upcoming";
type Stage = { title: string; when: string; body: string };

const PIPELINE: Stage[] = [
  { title: "Mandate received", when: "", body: "Your brief is in — the asset, your target and your terms, on the record." },
  { title: "The lock-in call", when: "within 24h", body: "A real advisor calls to confirm the mandate and ground your target against filed rates and recent closings — no invented number." },
  { title: "We float it to the market", when: "day 1", body: "Your mandate goes to verified brokers, owners and developers. You stay anonymous; they compete for you." },
  { title: "Written offers land", when: "2–4 days", body: "All-in, in writing, posted here as they arrive — nothing verbal, nothing off the record." },
  { title: "You compare, we connect", when: "when you’re ready", body: "Like an offer? We set up the meeting and keep every promise in writing, all the way to keys." },
];
/* Post-submit, the buyer's next real move is the lock-in call. Everything
   after it is concierge-run this month, so the honest "current" step is 1. */
const CURRENT_INDEX = 1;

function ago(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DealRoomTrack() {
  // undefined = not read yet (first paint), null = read, none found.
  const [m, setM] = useState<SavedMandate | null | undefined>(undefined);

  useEffect(() => {
    // Read localStorage only after mount so the static-export markup and the
    // first client paint agree (no hydration mismatch), then fill it in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setM(loadMandate());
    track("deal_room_track_viewed", {});
  }, []);

  const eyebrow = "font-mono text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]";
  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e6b45] px-6 py-3.5 text-[0.92rem] font-semibold text-white shadow-[0_14px_34px_-14px_rgba(30,107,69,.8)] transition-colors hover:bg-[#2e8b57]";
  const btnGhost = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9a96e]/25 px-6 py-3.5 text-[0.9rem] font-medium text-[#f4efe6] transition-colors hover:border-[#c9a96e]/60 hover:bg-[#c9a96e]/[0.08]";

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4efe6]" style={{ fontFeatureSettings: '"ss01"' }}>
      {/* nav — the shared site menu */}
      <SiteHeader />

      {/* First paint / reading localStorage */}
      {m === undefined && (
        <div className="mx-auto max-w-xl px-6 py-24 text-center text-[0.9rem] text-[#6f685c]">Opening your mandate…</div>
      )}

      {/* No mandate yet */}
      {m === null && (
        <div className="mx-auto max-w-xl px-6 py-24 text-center md:px-10">
          <span className={eyebrow}>The Deal Room</span>
          <h1 className="mt-3 font-serif text-[2.1rem] font-medium leading-tight">No live mandate yet.</h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[0.96rem] leading-relaxed text-[#a9a196]">
            When you commission a mandate, this is where you watch the market go to work — your brief, the lock-in call, and every written offer as it lands.
          </p>
          <div className="mt-9">
            <a href={`${basePath}/deal-room`} className={btnPrimary}>Start a Deal Room mandate →</a>
          </div>
        </div>
      )}

      {/* The live mandate */}
      {m && (
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-4 md:px-10">
          {/* header */}
          <span className={eyebrow}>{COHORT} · mandate live</span>
          <h1 className="mt-3 font-serif text-[2.1rem] font-medium leading-tight md:text-[2.5rem]">
            The market is going to work for {m.project}.
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9rem] text-[#a9a196]">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7fd0a3]" />
              Logged {ago(m.submittedAt)}
            </span>
            <span className="text-[#6f685c]">·</span>
            <span>awaiting your lock-in call</span>
          </p>

          {/* advisor pill */}
          <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-[#c9a96e]/25 bg-[#1d1811] px-5 py-3 text-[0.9rem]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e7cf95" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <span>
              {m.phone ? <>An advisor calls <b className="text-[#e7cf95]">{m.phone}</b> within <b className="text-[#e7cf95]">24 hours</b>.</> : <>An advisor calls you <b className="text-[#e7cf95]">within 24 hours</b>.</>}
            </span>
          </div>

          {/* the brief */}
          <div className="mt-8 rounded-2xl border border-[#c9a96e]/12 bg-[#1d1811] p-6 md:p-7">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#6f685c]">Your mandate</p>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Fact k="The asset" v={`${m.project}${m.config ? ` · ${m.config}` : ""}${m.sizeSqft ? ` (${m.sizeSqft} sq ft)` : ""}${m.unit ? ` · ${m.unit}` : ""}`} />
              <Fact k="City" v={m.city} />
              <Fact k="Your target" v={m.target ? `₹ ${m.target}` : "We’ll ground it together on the call"} accent={!!m.target} />
              <Fact k="Timeline" v={m.timeline} />
              <Fact k="Where you are" v={m.stage} />
              <Fact k="Funding" v={m.funding} />
              {m.offer ? <Fact k="Offer already in hand" v={m.offer} span /> : null}
            </dl>
          </div>

          {/* the pipeline */}
          <div className="mt-9">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#6f685c]">Where it goes from here</p>
            <ol className="mt-5">
              {PIPELINE.map((s, i) => {
                const state: StageState = i < CURRENT_INDEX ? "done" : i === CURRENT_INDEX ? "current" : "upcoming";
                const last = i === PIPELINE.length - 1;
                return (
                  <li key={s.title} className="relative flex gap-4 pb-7 last:pb-0">
                    {/* spine */}
                    {!last && <span className="absolute left-[13px] top-8 bottom-1 w-px bg-[#c9a96e]/15" aria-hidden />}
                    {/* node */}
                    <span
                      className={
                        "relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[0.7rem] " +
                        (state === "done"
                          ? "border-[#2e8b57] bg-[#1e6b45] text-white"
                          : state === "current"
                          ? "border-[#e7cf95] bg-[#c9a96e]/[0.14] text-[#e7cf95]"
                          : "border-[#c9a96e]/25 text-[#6f685c]")
                      }
                    >
                      {state === "done" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : state === "current" ? (
                        <span className="dr-pulse h-2 w-2 rounded-full bg-[#e7cf95]" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {/* copy */}
                    <div className={state === "upcoming" ? "opacity-60" : ""}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="font-serif text-[1.12rem] font-medium leading-tight text-[#f4efe6]">{s.title}</h3>
                        {state === "current" && <span className="rounded-full border border-[#e7cf95]/40 px-2.5 py-0.5 font-mono text-[0.54rem] uppercase tracking-[0.12em] text-[#e7cf95]">Next</span>}
                        {i === 0 && <span className="font-mono text-[0.62rem] text-[#7fd0a3]">{ago(m.submittedAt)}</span>}
                        {s.when && i !== 0 && <span className="font-mono text-[0.62rem] text-[#6f685c]">{s.when}</span>}
                      </div>
                      <p className="mt-1.5 max-w-[54ch] text-[0.9rem] leading-relaxed text-[#a9a196]">{s.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* how we're paid — the same plain promise as the confirmation */}
          <p className="mt-9 max-w-2xl border-l-2 border-[#c9a96e]/25 pl-4 text-[0.78rem] leading-relaxed text-[#6f685c]">
            <b className="text-[#a9a196]">How we’re paid — plainly.</b> Nothing to join. When you’re confident enough to meet a seller, a fully refundable <b className="text-[#a9a196]">₹11,000</b> holds your seat — back in 60 days if nothing closes, no questions. After that we earn only a share of what we actually save you versus the market — never a rupee from the sellers, and nothing if we don’t beat it. All figures are on the property price only, <b className="text-[#a9a196]">excluding GST, stamp duty &amp; registration.</b>
          </p>

          <div className="mt-9">
            <a href={`${basePath}/deal-room`} className={btnGhost}>← Back to the Deal Room</a>
          </div>
        </div>
      )}

      <style>{`@keyframes drpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}.dr-pulse{animation:drpulse 1.8s ease-in-out infinite}`}</style>
    </div>
  );
}

function Fact({ k, v, accent, span }: { k: string; v: string; accent?: boolean; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#6f685c]">{k}</dt>
      <dd className={"mt-1.5 text-[0.98rem] " + (accent ? "font-serif text-[1.25rem] text-[#e7cf95]" : "text-[#f4efe6]")}>{v}</dd>
    </div>
  );
}
