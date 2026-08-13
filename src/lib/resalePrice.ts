/* ════════════════════════════════════════════════════════════════
   RESALE PRICE — client bridge to the resale-price Edge Function.

   The Deal Room's step 2 asks: "what does this project (this configuration)
   sell for today?" The answer is fetched server-side (Gemini top model + live
   Google Search grounding) so the key stays off the client and the number is
   retrieved, not guessed. Returns a blank text whenever the market can't be
   read reliably — the caller shows nothing, never a fabricated figure.

   The function replies with a display string (a total-price range or a single
   figure, Indian commas). We also parse the numeric total(s) out of it so the
   step-2 "steal deal → high entry" bar can anchor on the market.
   ════════════════════════════════════════════════════════════════ */

const RESALE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/resale-price";

/* public anon key (RLS is the boundary; same value the other bridges use) */
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

export type ResalePrice = {
  status: "ok" | "error"; // "ok" = we heard back (text may still be ""); "error" = couldn't reach it
  text: string; // display string, e.g. "₹4,90,00,000 - ₹5,20,00,000" (or "" when unknown)
  low: number | null; // total ₹ low, when parseable
  high: number | null; // total ₹ high, when parseable
};

const EMPTY_OK: ResalePrice = { status: "ok", text: "", low: null, high: null }; // heard back, no reliable price
const ERR: ResalePrice = { status: "error", text: "", low: null, high: null }; // timeout / network / bad response

/* Pull total-rupee figures out of the reply. Totals only — anything tagged
   "/sq ft" or smaller than ₹1,00,000 is ignored, so a stray rate never
   anchors the bar. */
export function parseTotals(text: string): { low: number | null; high: number | null } {
  const tokens = [...text.matchAll(/₹\s?([\d,]+)\s*(\/\s*sq\.?\s*ft)?/gi)];
  const totals = tokens
    .filter((m) => !m[2])
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n >= 100000);
  if (!totals.length) return { low: null, high: null };
  return { low: Math.min(...totals), high: Math.max(...totals) };
}

export async function fetchResalePrice(
  project: string,
  city: string,
  config: string,
  model = "", // "" = server default; pass e.g. "gemini-2.5-flash" for a faster lookup
  timeoutMs = 60000, // grounded lookups can spike; don't abort a valid answer
): Promise<ResalePrice> {
  const p = project.trim();
  if (!p) return EMPTY_OK;
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
      body: JSON.stringify({ project: p, city: city.trim(), config: config.trim(), ...(model ? { model } : {}) }),
      signal: ctrl.signal,
    });
    if (!res.ok) return ERR;
    const data = (await res.json()) as { ok?: boolean; price?: string };
    if (!data?.ok) return ERR;
    const text = typeof data.price === "string" ? data.price.trim() : "";
    if (!text) return EMPTY_OK; // heard back, but no reliable price — show nothing
    return { status: "ok", text, ...parseTotals(text) };
  } catch {
    /* timeout, network, CORS, bad JSON — a reachability problem, offer a retry */
    return ERR;
  } finally {
    clearTimeout(timer);
  }
}
