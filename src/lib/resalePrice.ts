/* ════════════════════════════════════════════════════════════════
   RESALE PRICE — client bridge to the resale-price Edge Function.

   The Deal Room's step 2 asks: "what does this project resell for today?"
   The answer is fetched server-side (Gemini top model + live Google Search
   grounding) so the key stays off the client and the number is retrieved,
   not guessed. Returns "" whenever the market can't be read reliably — the
   caller shows nothing in that case, never a fabricated figure.

   Grounded reasoning on the top model is slow (several seconds), so callers
   should fire this as they enter the step and show a light loading state.
   ════════════════════════════════════════════════════════════════ */

const RESALE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/resale-price";

/* public anon key (RLS is the boundary; same value the other bridges use) */
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

export async function fetchResalePrice(project: string, city: string, timeoutMs = 35000): Promise<string> {
  const p = project.trim();
  if (!p) return "";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(RESALE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ project: p, city: city.trim() }),
      signal: ctrl.signal,
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { ok?: boolean; price?: string };
    return data?.ok && typeof data.price === "string" ? data.price.trim() : "";
  } catch {
    /* timeout, network, CORS, bad JSON — all mean "no number to show" */
    return "";
  } finally {
    clearTimeout(timer);
  }
}
