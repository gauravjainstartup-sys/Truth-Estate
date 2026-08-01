"use client";

/* ════════════════════════════════════════════════════════════════
   HELP CENTRE — what you have paid for, and the receipts.

   Lives inside TruthGuide rather than as its own page, because that is
   where someone already is when the question occurs to them: they are
   reading a report, they wonder what they bought or want the receipt,
   and the guide is the thing on screen. A separate billing page is a
   place people have to be told about.

   PAID AUDIENCE ONLY, and the gate is the server's answer. It asks the
   billing function, which resolves identity from the verified anon→user
   claim and returns only that account's own rows. Nothing here is
   decided by localStorage: a device that has never paid cannot talk its
   way in by editing a key, and a customer who paid on the old site sees
   their history here on first load because both sites write the same
   `payments` table.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { fetchBilling, openReceipt, inr, paidOn, type Billing, type Payment } from "@/lib/billing";
import { track } from "@/lib/events";

type State = { phase: "loading" } | { phase: "ready"; data: Billing } | { phase: "error" };

export default function HelpCentre({ onClose, onAskAdvisor }: { onClose: () => void; onAskAdvisor: (q: string) => void }) {
  const [s, setS] = useState<State>({ phase: "loading" });

  useEffect(() => {
    track("help_centre_opened");
    fetchBilling(true)
      .then((d) => setS(d ? { phase: "ready", data: d } : { phase: "error" }))
      .catch(() => setS({ phase: "error" }));
  }, []);

  const paid = s.phase === "ready" ? s.data.payments.filter((p) => p.status === "completed") : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[#1a1a1a]/8 px-5 py-3.5">
        <button onClick={onClose} aria-label="Back to TruthGuide"
          className="text-[0.8rem] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/75">← Back</button>
        <p className="ml-auto text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-[#c9a96e]">Help Centre</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {s.phase === "loading" && <p className="text-[0.85rem] font-light text-[#1a1a1a]/45">Looking up your account…</p>}

        {s.phase === "error" && (
          <div>
            <p className="text-[0.9rem] font-light leading-[1.7] text-[#1a1a1a]/65">
              We couldn&rsquo;t reach your billing record just now. Nothing is lost — it lives on our servers, not in this browser.
            </p>
            <button onClick={() => { setS({ phase: "loading" }); fetchBilling(true).then((d) => setS(d ? { phase: "ready", data: d } : { phase: "error" })); }}
              className="mt-4 rounded-md bg-[#1e6b45] px-4 py-2.5 text-[0.82rem] font-medium text-white transition-colors hover:bg-[#238c55]">
              Try again
            </button>
          </div>
        )}

        {s.phase === "ready" && !s.data.userId && (
          /* Not signed in. Deliberately NOT "you have no purchases" — a
             customer who bought on the old site would read that as their
             money having vanished. */
          <div>
            <p className="font-serif text-[1.15rem] font-medium leading-snug">Confirm your number to see your purchases.</p>
            <p className="mt-3 text-[0.88rem] font-light leading-[1.7] text-[#1a1a1a]/60">
              Your receipts are tied to your account, not to this browser. Sign in from any report and everything you have bought — including on the old site — appears here.
            </p>
          </div>
        )}

        {s.phase === "ready" && s.data.userId && paid.length === 0 && (
          <div>
            <p className="font-serif text-[1.15rem] font-medium leading-snug">Nothing on your account yet.</p>
            <p className="mt-3 text-[0.88rem] font-light leading-[1.7] text-[#1a1a1a]/60">
              When you unlock a report, the receipt appears here — and stays, whatever device you sign in from.
            </p>
          </div>
        )}

        {s.phase === "ready" && paid.length > 0 && (
          <>
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-[1.15rem] font-medium">Your purchases</p>
              <p className="font-mono text-[0.78rem] tabular-nums text-[#1a1a1a]/50">{inr(s.data.totalInr)} total</p>
            </div>

            <div className="mt-4 space-y-3">
              {paid.map((p) => <Row key={p.paymentId ?? p.id} p={p} />)}
            </div>

            <p className="mt-6 text-[0.7rem] font-light leading-[1.7] text-[#1a1a1a]/40">
              Receipts are payment records, not GST tax invoices. Need one for accounting? Ask below and your advisor will raise it.
            </p>
          </>
        )}

        {/* Always available — a Help Centre that can only show a table is a
            table. These hand the question to the guide with the context
            already written, rather than making someone phrase it. */}
        <div className="mt-7 border-t border-[#1a1a1a]/8 pt-5">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">Common questions</p>
          <div className="mt-3 flex flex-col gap-2">
            {[
              "I need a GST invoice for my purchase",
              "I paid but the report is still locked",
              "What exactly does my package include?",
              "Can I upgrade to All-Access and get credit for what I paid?",
              "I want a refund",
            ].map((q) => (
              <button key={q} onClick={() => onAskAdvisor(q)}
                className="rounded-lg border border-[#1a1a1a]/12 bg-white/70 px-3.5 py-2.5 text-left text-[0.82rem] font-light leading-snug text-[#1a1a1a]/70 transition-colors hover:border-[#1e6b45]/35 hover:text-[#1a1a1a]">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ p }: { p: Payment }) {
  const [opened, setOpened] = useState<null | boolean>(null);
  return (
    <div className="rounded-xl border border-[#1a1a1a]/10 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.9rem] font-medium text-[#1a1a1a]">{p.projectName ?? p.packageLabel}</p>
          {p.projectName && <p className="mt-0.5 text-[0.74rem] font-light text-[#1a1a1a]/50">{p.packageLabel}</p>}
        </div>
        <span className="shrink-0 font-mono text-[0.88rem] tabular-nums">{inr(p.amountInr)}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[0.62rem] uppercase tracking-[0.06em] text-[#1a1a1a]/35">
        <span>{paidOn(p.paidAt)}</span>
        {p.paymentId && <><span className="text-[#1a1a1a]/15">·</span><span className="truncate">{p.paymentId}</span></>}
      </div>
      <button
        onClick={() => setOpened(openReceipt(p))}
        className="mt-3 text-[0.78rem] font-medium text-[#1e6b45] underline decoration-[#1e6b45]/25 underline-offset-4 transition-colors hover:decoration-[#1e6b45]"
      >
        Receipt →
      </button>
      {/* A popup blocker swallowing the tab silently is the failure mode
          here, and it looks exactly like a dead button. */}
      {opened === false && (
        <p className="mt-2 text-[0.72rem] leading-snug text-[#8f3a2b]">Your browser blocked the new tab — allow pop-ups for this site and tap again.</p>
      )}
    </div>
  );
}
