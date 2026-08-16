"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — the flow, in one sheet.

   Every Deal Room CTA (band, rail, sticky) opens this. A mobile bottom
   sheet / desktop centred modal that runs the whole thing:

     details → name your target → where offers land → open.

   Dark, to match the Deal Room brand. Figures are illustrative, off the
   project's filed entry price; submission is a placeholder until the
   marketplace backend is wired (it lands on the confirmation step).
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { AuctionCard, computeDeal, cr, save, potentialRange } from "./DealRoom";

type Step = "details" | "target" | "contact" | "done";
const ORDER: Step[] = ["details", "target", "contact", "done"];

export default function DealRoomSheet({
  open, onClose, projectName, ticketCr,
}: {
  open: boolean;
  onClose: () => void;
  projectName: string;
  ticketCr: number;
}) {
  const deal = computeDeal(ticketCr);
  const [step, setStep] = useState<Step>("details");
  const [targetCr, setTargetCr] = useState<number>(deal ? deal.best : 0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("details");
    if (deal) setTargetCr(deal.best);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const idx = ORDER.indexOf(step);
  const saveCr = deal ? Math.max(0, deal.market - targetCr) : 0;

  const field = "w-full rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[0.9rem] text-white placeholder-white/35 outline-none transition-colors focus:border-[#5fd39a]";
  const primary = "group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f9a68] px-6 py-3.5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-[#38b37c] disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-[115]" role="dialog" aria-modal="true" aria-label="The Deal Room">
      <div className="absolute inset-0 animate-journey-fade bg-[#050a08]/70 backdrop-blur-xl" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex justify-center sm:inset-0 sm:items-center sm:p-6">
        <div className="animate-journey-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[26px] border border-white/10 bg-[#0B1F1A] text-white shadow-[0_-24px_70px_-20px_rgba(0,0,0,0.75)] sm:max-w-md sm:rounded-[24px]">
          <div aria-hidden className="h-px w-full shrink-0" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)" }} />

          {/* header */}
          <div className="flex items-center justify-between px-6 pt-5">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#c9a96e]">The Deal Room</span>
              {step !== "done" && (
                <span className="flex items-center gap-1">
                  {ORDER.slice(0, 3).map((s, i) => (
                    <span key={s} className={`h-1 w-4 rounded-full transition-colors ${i <= idx ? "bg-[#5fd39a]" : "bg-white/15"}`} />
                  ))}
                </span>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white/80">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {/* ── details ── */}
            {step === "details" && (
              <div>
                <h2 className="font-serif text-[1.7rem] font-medium leading-[1.15] text-white">Let the market compete for your price.</h2>
                {deal && (
                  <p className="mt-2.5 text-[0.9rem] font-light leading-relaxed text-white/60">
                    On {projectName}&rsquo;s <b className="font-medium text-white/80">{cr(deal.market)}</b> asking, our buyers typically settle{" "}
                    <b className="font-semibold text-[#e3c07f]">{potentialRange(deal.market)}</b> under.
                  </p>
                )}
                <div className="mt-5"><AuctionCard ticketCr={ticketCr} /></div>
                <ol className="mt-6 space-y-3">
                  {[
                    "Name your target price — anonymously.",
                    "Verified brokers, owners & developers send written offers in 2–4 days.",
                    "You pick the best. Walk away any time; ₹0 to start.",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3 text-[0.86rem] font-light leading-snug text-white/75">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-[0.68rem] font-bold text-[#5fd39a]">{i + 1}</span>
                      <span className="pt-0.5">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── target ── */}
            {step === "target" && deal && (
              <div>
                <h2 className="font-serif text-[1.6rem] font-medium leading-[1.15] text-white">What&rsquo;s your target?</h2>
                <p className="mt-2 text-[0.86rem] font-light text-white/55">Set the price you&rsquo;d sign at for {projectName}. Sellers compete to meet it.</p>
                <div className="mt-7 text-center">
                  <p className="font-serif text-[3rem] font-semibold leading-none text-white">{cr(targetCr)}</p>
                  <p className="mt-2 text-[0.82rem] font-medium text-[#5fd39a]">{saveCr > 0 ? `${save(saveCr)} under the ${cr(deal.market)} market` : "at the current market"}</p>
                </div>
                <input
                  type="range" min={deal.market * 0.85} max={deal.market} step={0.01} value={targetCr}
                  onChange={(e) => setTargetCr(parseFloat(e.target.value))}
                  className="mt-6 w-full accent-[#2f9a68]" aria-label="Target price"
                />
                <div className="mt-1 flex justify-between text-[0.62rem] font-mono text-white/35">
                  <span>{cr(deal.market * 0.85)}</span><span>{cr(deal.market)}</span>
                </div>
                <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[0.76rem] font-light leading-relaxed text-white/55">
                  Aim where you&rsquo;d truly sign — the desk advises what&rsquo;s realistic once offers land. Our buyers settle 5–10% under, on average.
                </p>
              </div>
            )}

            {/* ── contact ── */}
            {step === "contact" && (
              <div>
                <h2 className="font-serif text-[1.6rem] font-medium leading-[1.15] text-white">Where should the offers land?</h2>
                <p className="mt-2 text-[0.86rem] font-light text-white/55">You stay anonymous — sellers bid to your target and never see your details.</p>
                <div className="mt-6 space-y-3">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="Phone / WhatsApp" className={field} />
                </div>
                {deal && (
                  <div className="mt-5 flex items-baseline justify-between gap-2 rounded-xl border border-[#c9a96e]/25 bg-white/[0.04] px-4 py-3">
                    <span className="shrink-0 whitespace-nowrap text-[0.72rem] font-light text-white/55">Your target</span>
                    <span className="whitespace-nowrap text-right font-mono text-[0.9rem] font-semibold text-white">{cr(targetCr)} <span className="font-sans text-[0.7rem] font-medium text-[#5fd39a]">· save {save(saveCr)}</span></span>
                  </div>
                )}
                <p className="mt-4 text-[0.68rem] font-light leading-relaxed text-white/40">Neutral · on the record · we earn a share only of what we save you. No spam — one text when the first offer lands.</p>
              </div>
            )}

            {/* ── done ── */}
            {step === "done" && (
              <div className="py-4 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#2f9a68]/20 text-[#5fd39a]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <h2 className="mt-5 font-serif text-[1.7rem] font-medium leading-[1.15] text-white">Your Deal Room is open.</h2>
                <p className="mt-3 text-[0.9rem] font-light leading-relaxed text-white/60">
                  Verified sellers now compete for {projectName} at your target of <b className="font-medium text-white/85">{cr(targetCr)}</b>. Written offers land in <b className="font-medium text-white/85">2–4 days</b> — we&rsquo;ll text you the moment the first arrives.
                </p>
                <p className="mt-4 text-[0.68rem] font-light text-white/35">A mock for review — the live marketplace is being wired.</p>
              </div>
            )}
          </div>

          {/* footer CTA */}
          <div className="shrink-0 border-t border-white/10 px-6 py-4">
            {step === "details" && <button onClick={() => setStep("target")} className={primary} disabled={!deal}>Name your target <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></button>}
            {step === "target" && (
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("details")} className="shrink-0 rounded-lg border border-white/15 px-4 py-3.5 text-[0.86rem] font-medium text-white/70 transition-colors hover:bg-white/5">Back</button>
                <button onClick={() => setStep("contact")} className={primary}>Continue <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></button>
              </div>
            )}
            {step === "contact" && (
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("target")} className="shrink-0 rounded-lg border border-white/15 px-4 py-3.5 text-[0.86rem] font-medium text-white/70 transition-colors hover:bg-white/5">Back</button>
                <button onClick={() => setStep("done")} disabled={!name.trim() || phone.trim().length < 8} className={primary}>Open my Deal Room <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></button>
              </div>
            )}
            {step === "done" && <button onClick={onClose} className={primary}>Done</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
