# Technical Specification: Real Estate Expected ROI & Risk-Adjusted ROI Model

**Author**: Truth Estate Quantitative Analytics  
**Audience**: Claude (CTO) / Engineering & Analytics Team  
**Status**: Ready for Implementation  
**Module Target**: `src/lib/analytics/roiEngine.ts`

---

## 1. Executive Summary

This document specifies the algorithmic approach and mathematical formulas for calculating **Expected ROI** and **Risk-Adjusted ROI** for real estate investors entering a project mid-construction (e.g., 2 years post-launch). 

The model separates **nominal market appreciation** (macro + city + micromarket baseline) from **time drag (predicted RERA delays)** and **counterparty/execution risk (Truth Score)**.

---

## 2. Complete Variable & Constant Dictionary

### 2.1 Inputs

| Symbol | Data Type | Range / Units | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| $P_{\text{entry}}$ | `number` | $> 0$ (in ₹ Cr or ₹) | Current capital deployed / buying price at entry ($t = 0$). | `5.00` |
| $t_{\text{entry}}$ | `number` | $\ge 0$ (Years) | Time elapsed since project launch at entry. | `2.0` |
| $T_{\text{contract}}$ | `number` | $> 0$ (Years) | Contracted remaining duration to RERA possession. | `3.0` |
| $g_{\text{India}}$ | `number` | Percentage (0..1) | National base GDP/real estate CAGR. | `0.090` (9.0%) |
| $\Delta g_{\text{city}}$ | `number` | Percentage (0..1) | City-level additive alpha (e.g., Gurugram). | `0.005` (+0.5%) |
| $g_{\text{micro}}$ | `number` | Percentage (0..1) | Localized micromarket baseline expected CAGR. | `0.120` (12.0%) |
| $S_{\text{Truth}}$ | `number` | $0 \text{ to } 100$ | Truth Score (RERA, title, builder velocity, solvency). | `70` |
| $D_{\text{months}}$ | `number` | $\ge 0$ (Months) | Model-predicted delay beyond RERA handover. | `8` |

---

### 2.2 System Parameters & Constants

| Symbol | Constant Value | Units | Description |
| :--- | :--- | :--- | :--- |
| $S_{\text{bench}}$ | `75.0` | Score points | Benchmark Truth Score representing an average Grade-A developer. |
| $k_{\text{score}}$ | `0.0005` | Per point multiplier | Sensitivity of project CAGR to Truth Score ($\pm 0.05\%$ per point). |
| $H_{\text{jump}}$ | `0.08` | Ratio (8%) | One-time price step-up upon physical handover & occupancy. |
| $r_{\text{cost\_of\_capital}}$| `0.085` | Per annum (8.5%) | Investor's cost of capital / Pre-EMI home loan interest rate. |
| $\sigma_{\text{market}}$ | `0.060` | Per annum (6.0%) | Real estate market volatility factor for risk discounting. |

---

### 2.3 Calculated Outputs

| Symbol | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| $\alpha_{\text{project}}$ | `number` | Percentage | Project-specific alpha derived from Truth Score. |
| $g_{\text{eff}}$ | `number` | Percentage | Effective annual growth rate for the asset. |
| $T_{\text{effective}}$ | `number` | Years | Total actual holding period including predicted delay. |
| $P_{\text{exit}}$ | `number` | ₹ Cr | Nominal expected valuation at physical handover. |
| $\text{CAGR}_{\text{expected}}$| `number` | Percentage p.a. | Nominal annualized return on investment (IRR). |
| $C_{\text{delay}}$ | `number` | ₹ Cr | Opportunity cost & carry cost caused by construction delay. |
| $\delta_{\text{risk}}$ | `number` | Percentage p.a. | Truth Score risk discount rate penalty. |
| $P_{\text{risk\_adj}}$ | `number` | ₹ Cr | Risk-adjusted Net Present Valuation at handover. |
| $\text{CAGR}_{\text{risk\_adj}}$| `number` | Percentage p.a. | Risk-adjusted annualized return on investment. |
| $\text{Spread}_{\text{risk}}$| `number` | Percentage p.a. | Yield haircut due to risk & delay ($\text{CAGR}_{\text{expected}} - \text{CAGR}_{\text{risk\_adj}}$). |

---

## 3. Mathematical Formulas

### Step 1: Effective Growth Rate ($g_{\text{eff}}$)

$$\alpha_{\text{project}} = k_{\text{score}} \times (S_{\text{Truth}} - S_{\text{bench}})$$

$$g_{\text{eff}} = g_{\text{micro}} + \alpha_{\text{project}}$$

---

### Step 2: Effective Timeline ($T_{\text{effective}}$)

$$T_{\text{effective}} = T_{\text{contract}} + \frac{D_{\text{months}}}{12}$$

---

### Step 3: Nominal Exit Valuation ($P_{\text{exit}}$) & Unadjusted ROI

$$P_{\text{exit}} = P_{\text{entry}} \times (1 + g_{\text{eff}})^{T_{\text{effective}}} \times (1 + H_{\text{jump}})$$

$$\text{Expected ROI (Absolute \%)} = \frac{P_{\text{exit}} - P_{\text{entry}}}{P_{\text{entry}}} \times 100$$

$$\text{CAGR}_{\text{expected}} = \left( \frac{P_{\text{exit}}}{P_{\text{entry}}} \right)^{\frac{1}{T_{\text{effective}}}} - 1$$

---

### Step 4: Delay Penalty ($C_{\text{delay}}$) & Risk Premium ($\delta_{\text{risk}}$)

$$C_{\text{delay}} = P_{\text{entry}} \times \left( (1 + r_{\text{cost\_of\_capital}})^{\frac{D_{\text{months}}}{12}} - 1 \right)$$

$$\delta_{\text{risk}} = \left( \frac{100 - S_{\text{Truth}}}{100} \right) \times \sigma_{\text{market}}$$

---

### Step 5: Risk-Adjusted Valuation ($P_{\text{risk\_adj}}$) & Risk-Adjusted ROI

$$P_{\text{risk\_adj}} = \frac{P_{\text{exit}} - C_{\text{delay}}}{(1 + \delta_{\text{risk}})^{T_{\text{effective}}}}$$

$$\text{CAGR}_{\text{risk\_adj}} = \left( \frac{P_{\text{risk\_adj}}}{P_{\text{entry}}} \right)^{\frac{1}{T_{\text{effective}}}} - 1$$

$$\text{Spread}_{\text{risk}} = \text{CAGR}_{\text{expected}} - \text{CAGR}_{\text{risk\_adj}}$$

---

## 4. TypeScript Implementation Reference

```typescript
export interface RoiInput {
  entryPrice: number;            // P_entry in Cr
  yearsPostLaunch: number;       // t_entry
  contractedYearsLeft: number;   // T_contract
  indiaBaseCagr?: number;        // Default 0.090
  gurugramAddonCagr?: number;    // Default 0.005
  micromarketCagr: number;       // g_micro (e.g. 0.120)
  truthScore: number;            // S_Truth (0..100)
  predictedDelayMonths: number;  // D_months
}

export interface RoiResult {
  effectiveCagr: number;
  effectiveHoldingYears: number;
  nominalExitPrice: number;
  nominalAbsoluteRoiPct: number;
  nominalAnnualizedRoiPct: number;
  delayCostPenalty: number;
  riskDiscountRate: number;
  riskAdjustedExitPrice: number;
  riskAdjustedAnnualizedRoiPct: number;
  riskHaircutSpreadPct: number;
}

const DEFAULT_PARAMS = {
  sBench: 75.0,
  kScore: 0.0005,
  hJump: 0.08,
  rCostOfCapital: 0.085,
  sigmaMarket: 0.060,
};

export function calculateRiskAdjustedRoi(
  input: RoiInput,
  params = DEFAULT_PARAMS
): RoiResult {
  const { entryPrice, contractedYearsLeft, micromarketCagr, truthScore, predictedDelayMonths } = input;
  const { sBench, kScore, hJump, rCostOfCapital, sigmaMarket } = params;

  // 1. Effective Growth Rate
  const alphaProject = kScore * (truthScore - sBench);
  const effectiveCagr = micromarketCagr + alphaProject;

  // 2. Timeline
  const delayYears = predictedDelayMonths / 12;
  const effectiveHoldingYears = contractedYearsLeft + delayYears;

  // 3. Nominal Valuation & ROI
  const nominalExitPrice =
    entryPrice *
    Math.pow(1 + effectiveCagr, effectiveHoldingYears) *
    (1 + hJump);

  const nominalAbsoluteRoiPct = ((nominalExitPrice - entryPrice) / entryPrice) * 100;
  const nominalAnnualizedRoiPct =
    (Math.pow(nominalExitPrice / entryPrice, 1 / effectiveHoldingYears) - 1) * 100;

  // 4. Delay Penalty & Risk Discount
  const delayCostPenalty =
    entryPrice * (Math.pow(1 + rCostOfCapital, delayYears) - 1);
  const riskDiscountRate = ((100 - truthScore) / 100) * sigmaMarket;

  // 5. Risk-Adjusted Valuation & ROI
  const riskAdjustedExitPrice =
    (nominalExitPrice - delayCostPenalty) /
    Math.pow(1 + riskDiscountRate, effectiveHoldingYears);

  const riskAdjustedAnnualizedRoiPct =
    (Math.pow(riskAdjustedExitPrice / entryPrice, 1 / effectiveHoldingYears) - 1) * 100;

  const riskHaircutSpreadPct = nominalAnnualizedRoiPct - riskAdjustedAnnualizedRoiPct;

  return {
    effectiveCagr,
    effectiveHoldingYears,
    nominalExitPrice,
    nominalAbsoluteRoiPct,
    nominalAnnualizedRoiPct,
    delayCostPenalty,
    riskDiscountRate,
    riskAdjustedExitPrice,
    riskAdjustedAnnualizedRoiPct,
    riskHaircutSpreadPct,
  };
}
```

---

## 5. Test Case Verification (Ground Truth)

```json
{
  "input": {
    "entryPrice": 5.00,
    "yearsPostLaunch": 2.0,
    "contractedYearsLeft": 3.0,
    "micromarketCagr": 0.120,
    "truthScore": 70,
    "predictedDelayMonths": 8
  },
  "output": {
    "effectiveCagr": 0.1175,
    "effectiveHoldingYears": 3.6667,
    "nominalExitPrice": 8.1147,
    "nominalAbsoluteRoiPct": 62.29,
    "nominalAnnualizedRoiPct": 13.78,
    "delayCostPenalty": 0.2818,
    "riskDiscountRate": 0.0180,
    "riskAdjustedExitPrice": 7.3340,
    "riskAdjustedAnnualizedRoiPct": 10.95,
    "riskHaircutSpreadPct": 2.83
  }
}
```
