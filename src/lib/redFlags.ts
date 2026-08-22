/* ════════════════════════════════════════════════════════════════
   RED FLAGS — recomputed at bake time, never read stored.

   The pipeline writes a `redFlags` column, but an audit against its own
   ingredient columns reproduced it on only 34 of 107 projects — counts
   with no supporting evidence, and evidence with no count. A number a
   buyer cannot trace to the data beside it fails the site's whole
   premise, so the FOUNDER'S RULE SET is applied here, at bake time,
   over the same row the page renders. The count can never drift from
   its inputs again, because it has no existence apart from them.

   The four checks (founder-specified, 2026-08-20):
     1 · Track record (max 2)
         · lapsed projects ≥ 5% of launched, where launched =
           delivered + ongoing + lapsed (reconciles to the developer
           page's own total — Signature Global: 11 + 34 + 24 = 69)
         · overall average delay ≥ 12 months
     2 · Financials (max 5)
         · one flag per audited ratio scoring under 40 (of the five in
           financial_subscores)
     3 · Legal (max 4)
         · one flag per HIGH/CRITICAL dimension in the filed risk
           matrix (legal_risks: title / developer / litigation /
           regulatory)
     4 · Construction pace (max 1)
         · predicted completion ≥ 12 months behind the filed RERA date

   Returns null when NO ingredient is present at all — the caller may
   then fall back — but never mixes: a computable row is computed in
   full.
   ════════════════════════════════════════════════════════════════ */

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export type RedFlagBreakdown = {
  /* Developer DNA — track record (max 2) + developer financials (max 5).
     Grouped exactly as the Truth-Score pillars group them (backlogRow.ts
     PILLAR_GROUPS.developer = past_record + developer_financial), so the
     dossier chip agrees with the pillar the reader unlocks. */
  dev: number;
  /* Construction & sales — build pace behind the filed RERA date (max 1). */
  con: number;
  /* Legal & compliance — HIGH/CRITICAL dimensions in the filed matrix (max 4). */
  legal: number;
  total: number;
};

/* The audited count, split into the three report sections that carry a flag
   RULE. Same four checks, same order, same inputs as the flat count — only
   partitioned, so `total` is byte-identical to what computeRedFlags returned
   before. Sections with no flag concept (location, USPs, price, verdict) have
   no key here by construction; the dossier shows them no chip. Returns null on
   a row with no ingredient at all — the caller may then fall back. */
export function computeRedFlagBreakdown(r: Record<string, unknown>): RedFlagBreakdown | null {
  const delivered = num(r.developer_delivered_projects);
  const ongoing = num(r.developer_ongoing_projects);
  const lapsed = num(r.developer_lapsed_projects);
  const total = num(r.developer_total_projects);
  /* The developer's own stated average; the computed fallback exists on
     rows where the pipeline filled only one of the pair. avg_developer_
     delay is deliberately NOT consulted — its semantics are unclear and
     it disagrees with both named fields on live rows. */
  const avgDelay = num(r.developer_avg_delay_months) ?? num(r.developer_computed_avg_delay);
  const fin = (r.financial_subscores ?? null) as Record<string, unknown> | null;
  const legal = (r.legal_risks ?? null) as Record<string, unknown> | null;
  const paceDelay = num(r.predicted_delay_months);

  const anyIngredient =
    delivered != null || ongoing != null || lapsed != null || total != null ||
    avgDelay != null || fin != null || legal != null || paceDelay != null;
  if (!anyIngredient) return null;

  // Developer DNA — track record (max 2) + financials (max 5)
  let dev = 0;
  const launched = total ?? (delivered ?? 0) + (ongoing ?? 0) + (lapsed ?? 0);
  if (launched > 0 && (lapsed ?? 0) / launched >= 0.05) dev += 1;
  if (avgDelay != null && avgDelay >= 12) dev += 1;
  if (fin) {
    dev += Math.min(5, Object.values(fin).filter((v) => typeof v === "number" && v < 40).length);
  }

  // Legal & compliance — filed risk matrix (max 4)
  let legalFlags = 0;
  if (legal) {
    legalFlags += Math.min(
      4,
      Object.values(legal).filter(
        (v) => typeof v === "string" && ["HIGH", "CRITICAL"].includes(v.toUpperCase()),
      ).length,
    );
  }

  // Construction & sales — build pace behind RERA (max 1)
  let con = 0;
  if (paceDelay != null && paceDelay >= 12) con += 1;

  return { dev, con, legal: legalFlags, total: dev + con + legalFlags };
}

/* The flat audited count — the sum of the breakdown. Kept as the primary
   entry point (option cards, scored lists) so existing callers are unchanged. */
export function computeRedFlags(r: Record<string, unknown>): number | null {
  return computeRedFlagBreakdown(r)?.total ?? null;
}

/* The columns the computation reads — every fetch that wants a live
   red-flag count must select these alongside whatever else it needs. */
export const RED_FLAG_COLUMNS =
  "developer_delivered_projects,developer_ongoing_projects,developer_lapsed_projects,developer_total_projects," +
  "developer_avg_delay_months,developer_computed_avg_delay,financial_subscores,legal_risks,predicted_delay_months";

/* ── The other two chips on the option card ──────────────────────────
   Same derivations the founder approved on the mock, from the same
   fields the report itself renders. Null when the inputs are absent —
   a chip is omitted, never guessed. */

export type DelayRisk = "Low" | "Medium" | "High";

/* Filed QPR pace: actual completion % against RERA-expected %. On or
   ahead (within 2 points) is Low; more than 12 points behind is High. */
export function delayRiskOf(actualPct: number | null | undefined, expectedPct: number | null | undefined): DelayRisk | null {
  if (actualPct == null || expectedPct == null) return null;
  const gap = actualPct - expectedPct;
  if (gap >= -2) return "Low";
  if (gap >= -12) return "Medium";
  return "High";
}

export type RoiOutlook = "Strong" | "Fair" | "Modest";

/* Qualitative read of the audited model's projected CAGR — the number
   itself stays on the report, per the founder. */
export function roiOutlookOf(adjCagr: number | null | undefined): RoiOutlook | null {
  if (adjCagr == null || !(adjCagr > 0)) return null;
  if (adjCagr >= 11) return "Strong";
  if (adjCagr >= 9) return "Fair";
  return "Modest";
}
