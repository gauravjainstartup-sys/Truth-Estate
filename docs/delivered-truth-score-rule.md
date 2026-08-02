# Delivered-project Truth Score rule (upstream pipeline spec)

**Status:** proposed · **Owner:** data pipeline (the job that writes
`backlog_project_data.expected_roi.truth_score` and the row's `truth_score`)
**Consumer:** the site reads these verbatim — no frontend change is required or
wanted.

## Problem

A project with its Occupancy/Completion Certificate on record still carries a
Truth Score computed as if it were mid-construction. It is scored on
forward-looking execution risk — build pace vs schedule, delay probability,
"will it get its OC" — that the certificate has already resolved. So a delivered
project reads lower than the risk it actually carries. (Whiteland Blissville
Phase 3: OC granted **9 Jun 2026**, ~7 months **ahead** of its 31 Dec 2026 RERA
promise, yet scored on a "51% chance of delay" model.)

## Principle

**An OC resolves *execution/completion* risk — not *title* risk.** The rule
lifts a delivered project's score by exactly the execution-risk drag the
certificate removes, and **no more**. Title, mortgage, litigation and
governance drag are untouched. Delivery must never launder an encumbrance.

## Trigger

Apply when, in `backlog_project_data`:

```
overrides.delivered_oc_date  IS NOT NULL
```

(Same authoritative flag the site uses for the "delivered" state. `delivered_oc_date`
is nested in the `overrides` JSONB — it is **not** a top-level column.)
`delivered_certificate_url`, if present, raises confidence but is not required.

Let `ahead_months = months_between(delivered_oc_date, rera_promise_date)`
(positive ⇒ delivered early).

## The adjustment

Applied to the seven sub-metric scores **before** the pillar means and the
composite `truth_score` are computed. Weights are **unchanged**. Bands are
derived from the final scores as today.

| Sub-metric | Pillar | OC resolves it? | Delivered rule |
|---|---|---|---|
| `construction_pace` | construction | **Yes — fully** | Pin to full credit for delivery; add an early-delivery bonus scaled by `ahead_months` (cap at the top band). A delivered project has no remaining schedule risk. |
| `demand` | construction | No | Unchanged (absorption/sales is a real, standing signal). |
| `legal` | legal | **Partially** | In the pipeline's own legal computation, treat the **occupancy/completion-pending** and **construction-linked regulatory** factors as satisfied (the OC *is* that approval). Leave **title_risk (mortgage/encumbrance), litigation_risk, and developer-governance** factors exactly as-is. |
| `past_record` | developer | Marginally | Optional small credit **only** when this is among the developer's first delivered projects (it retires a "first-delivery track-record" risk). Otherwise negligible — one delivery barely moves a portfolio metric. |
| `developer_financial` | developer | No | Unchanged. |
| `location` | location | No | Unchanged. |
| `x_factors` | usps | No | Unchanged. |

Then recompute exactly as the pipeline already does: each pillar score = the
weight-weighted mean of its members; `truth_score` = the weighted mean of the
pillars; clamp to 100. Because the pipeline rewrites **both** the pillar
breakdown and the headline together, the site's "pillars compose to the
headline" invariant holds automatically.

## Guardrails

1. **Bounded lift.** The delivered adjustment is a *removal of execution-risk
   drag*, not an additive bonus on top of everything. A delivered project cannot
   score above what its standing fundamentals (title, location, demand,
   developer, USPs) support. A delivered project with a serious mortgage stays
   in Fair/Watch.
2. **Title stays visible.** Never touch `title_risk`, `litigation_risk`, or
   governance factors. This is what keeps the report honest (Blissville still
   shows its active Bajaj mortgage and its 2022 CBI flag) and consistent with
   the Legal section's "these persist after possession" framing already live.
3. **Idempotent.** The adjustment is a pure function of delivered state — re-runs
   yield the same score, never a creeping bonus.
4. **Auditable.** Record which sub-metrics were adjusted (e.g.
   `truth_score.delivered_adjustment: { construction_pace: +Δ, legal: +Δ,
   ahead_months }`) so the reason is inspectable and the site can later surface
   "execution risk resolved" as the *why* if desired.

## Worked examples

**A. Title-encumbered (Blissville P3).** Its legal drag is title (mortgage) +
governance (CBI), which the OC does **not** clear; its construction was already
near-complete. So the lift is small:

```
before  Dev 4.2·.25  Constr 8.9·.22  Loc 7.5·.26  Legal 5.8·.15  USP 6.4·.12  → 66
after   Dev ~4.4     Constr ~9.3      Loc 7.5       Legal ~6.2      USP 6.4      → ~68
```

66 → ~68. **Correct** — delivery doesn't erase the mortgage. (Exact deltas
depend on the pipeline's internal sub-factor weights; illustrative.)

**B. Execution-limited (clean-title project that was behind schedule / OC
pending).** Here the drag *was* `construction_pace` + the completion component of
`legal` — both resolved by the OC — so the same rule produces a large, and
honest, jump (e.g. low-70s → mid-80s).

The same rule yields a small lift for A and a large lift for B, because it only
ever credits the risk the certificate actually retired.

## Out of scope

No change to the site. The site already reads `truth_score` and
`expected_roi.truth_score.pillars` verbatim; once the pipeline writes the
adjusted values, delivered projects show the higher score with the same
weights, and the delivered *presentation* (OC banner, "Complete", legal
framing, delivered short-answer) is already live.
