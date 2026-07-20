"use client";

import { useEffect, useRef, useState } from "react";
import type { BuyData } from "./journey";
import type { RankedIntel } from "./shortlist";
import { applyRerank, rerankRemote } from "./rerank";

/* ════════════════════════════════════════════════════════════════
   useAiRerank — hold the shortlist briefly while Gemini re-ranks it.

   Input: the deterministic ranking (already affordability-gated). Output:
   the final order + a `settled` flag the page waits on before rendering,
   so the buyer never sees cards shuffle after reveal. Bounded by the
   bridge's 3 s timeout; when the Edge Function isn't deployed the call
   fails in milliseconds — either way `settled` flips and the deterministic
   order renders. The AI can only ever re-order what the gate approved.
   ════════════════════════════════════════════════════════════════ */
export function useAiRerank(
  buy: BuyData | null,
  det: RankedIntel[],
): { recs: RankedIntel[]; settled: boolean } {
  const [state, setState] = useState<{ recs: RankedIntel[]; settled: boolean }>({ recs: det, settled: det.length === 0 });
  const runId = useRef(0);

  useEffect(() => {
    const id = ++runId.current;
    if (!buy || det.length < 2) {
      setState({ recs: det, settled: true });
      return;
    }
    setState({ recs: det, settled: false });
    rerankRemote(buy, det).then((picks) => {
      if (runId.current !== id) return; // a newer brief superseded this run
      setState({ recs: picks ? applyRerank(det, picks) : det, settled: true });
    });
  }, [buy, det]);

  return state;
}
