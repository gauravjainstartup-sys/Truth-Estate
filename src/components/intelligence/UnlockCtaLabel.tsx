"use client";

/* ────────────────────────────────────────────────────────────────────────
   UnlockCtaLabel — the two-line unlock CTA content: the price line
   ("Unlock the full read — ₹1,100 →" or the first-report-free variant) over
   the struck MRP + savings. Shared by the desktop rail card (UnlockDesk) and
   the mobile sticky bar (ProjectProfile) so the two CTAs are literally the
   same treatment and can never drift apart.

   Render it inside a GREEN button (the sub-line assumes a green ground —
   white text). The button owns its own chrome (radius, padding, width) and
   should carry the `group` class so the arrow's hover nudge works. All price
   logic reads the same device-trail cache the paywall resolves from, so it
   never quotes a price checkout disagrees with; it is reactive, so a claim
   that updates the cache corrects it in place.
   ──────────────────────────────────────────────────────────────────────── */

import { discountOf } from "@/lib/journey";
import { usePackage } from "@/lib/usePricing";
import { useFirstFree } from "@/lib/useFirstFree";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function UnlockCtaLabel() {
  const read = usePackage("read");
  const d = discountOf(read);
  const firstFree = useFirstFree();
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold">
        {firstFree ? "Unlock First Report at ₹0" : <>Unlock the full read — {inr(read.inr)}</>}
        <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
      </span>
      {firstFree
        ? <span className="text-[0.68rem] font-medium text-white/85"><span className="text-white/55 line-through">{inr(d?.mrp ?? read.inr)}</span> · your first report is free</span>
        : d && (
          <span className="text-[0.68rem] font-medium text-white/85">
            <span className="text-white/55 line-through">{inr(d.mrp)}</span> · save {inr(d.mrp - read.inr)} ({d.pct}% off)
          </span>
        )}
    </span>
  );
}
