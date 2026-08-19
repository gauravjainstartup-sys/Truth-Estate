/* ════════════════════════════════════════════════════════════════
   BILLING — the account's payment history, and a printable receipt.

   ON THE WORD "INVOICE". What this produces is a PAYMENT RECEIPT, and it
   says so on its face. A GST tax invoice under Indian law needs the
   supplier's GSTIN, an invoice number from a gapless series, the place of
   supply, an HSN/SAC code and the CGST/SGST/IGST split. None of those are
   in this database, and inventing them would produce a document that
   looks like a tax invoice, is not one, and that a buyer might file as
   though it were. A receipt is honest and immediately useful; the tax
   invoice can follow once the founder supplies a GSTIN and a numbering
   series, at which point this is where it goes.

   The receipt is rendered as self-contained HTML into a new window, and
   printing it produces a PDF through the browser's own dialog. No PDF
   library, nothing added to the bundle, and it prints identically on
   every platform because it is just a document.
   ════════════════════════════════════════════════════════════════ */
import { getAnonId } from "@/lib/truthGuideChat";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_bLpHCRL6Xa0viqYeEuM3NA_U5VvNWwq";

export type Payment = {
  id: string;
  status: string;
  packageId: string | null;
  packageLabel: string;
  projectSlug: string | null;
  projectName: string | null;
  amountInr: number;
  paidAt: string | null;
  orderId: string | null;
  paymentId: string | null;
};

export type Billing = { userId: string | null; payments: Payment[]; totalInr: number };

let cache: Billing | null = null;
let inFlight: Promise<Billing | null> | null = null;

export async function fetchBilling(force = false): Promise<Billing | null> {
  if (!force && cache) return cache;
  if (!force && inFlight) return inFlight;
  inFlight = (async () => {
    const anonId = getAnonId();
    if (!anonId) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/billing`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ anonId }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json().catch(() => null) as ({ ok?: boolean } & Billing) | null;
      if (!data?.ok) return null;
      cache = {
        userId: data.userId ?? null,
        payments: Array.isArray(data.payments) ? data.payments : [],
        totalInr: data.totalInr ?? 0,
      };
      return cache;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/* A purchase has just landed — the cached list is a payment short. */
export const invalidateBilling = (): void => { cache = null; };

export const inr = (n: number): string => `₹${n.toLocaleString("en-IN")}`;

export const paidOn = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/* ── the receipt document ──
   Serif headings and the brand's own palette, so a customer forwarding
   this to a spouse or an accountant is forwarding something that looks
   like it came from us. @media print strips the button and the chrome. */
export function receiptHtml(p: Payment): string {
  const ref = p.paymentId ?? p.id ?? "—";
  const item = p.projectName ? `${p.packageLabel} — ${p.projectName}` : p.packageLabel;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt ${esc(ref)} · Truth Estate</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:48px 24px;background:#F5F0E8;color:#1a1a1a;
       font:400 15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  .sheet{max-width:640px;margin:0 auto;background:#fff;border:1px solid rgba(26,26,26,.1);
         border-radius:14px;padding:40px}
  h1{margin:0;font:500 1.6rem/1.2 Georgia,"Times New Roman",serif;letter-spacing:-.01em}
  .eyebrow{margin:0 0 6px;font-size:10px;font-weight:600;letter-spacing:.28em;
           text-transform:uppercase;color:#c9a96e}
  .muted{color:rgba(26,26,26,.5)}
  table{width:100%;border-collapse:collapse;margin-top:28px}
  th,td{text-align:left;padding:11px 0;border-bottom:1px solid rgba(26,26,26,.08);vertical-align:top}
  th{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(26,26,26,.45)}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
  .total td{border-bottom:none;padding-top:18px;font-size:1.15rem;font-weight:600}
  .meta{margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:14px 24px;font-size:13px}
  .meta div span{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;
                 color:rgba(26,26,26,.4);margin-bottom:3px}
  .note{margin-top:30px;padding-top:18px;border-top:1px solid rgba(26,26,26,.08);
        font-size:12px;line-height:1.7;color:rgba(26,26,26,.45)}
  .btn{display:block;margin:24px auto 0;padding:11px 26px;border:0;border-radius:5px;
       background:#1e6b45;color:#fff;font-size:14px;cursor:pointer}
  @media print{body{background:#fff;padding:0}.sheet{border:0;border-radius:0;padding:0}.btn{display:none}}
</style></head><body>
<div class="sheet">
  <p class="eyebrow">Payment receipt</p>
  <h1>Truth Estate</h1>
  <p class="muted" style="margin:6px 0 0;font-size:13px">Independent real estate intelligence &amp; advisory</p>

  <table>
    <tr><th>Item</th><th class="num">Amount</th></tr>
    <tr><td>${esc(item)}</td><td class="num">${inr(p.amountInr)}</td></tr>
    <tr class="total"><td>Total paid</td><td class="num">${inr(p.amountInr)}</td></tr>
  </table>

  <div class="meta">
    <div><span>Receipt reference</span>${esc(ref)}</div>
    <div><span>Date</span>${esc(paidOn(p.paidAt))}</div>
    <div><span>Order</span>${esc(p.orderId ?? "—")}</div>
    <div><span>Status</span>${esc(p.status === "completed" ? "Paid" : p.status || "—")}</div>
  </div>

  <p class="note">
    ${p.amountInr === 0 ? "Complimentary — your first report, on the house." : "Paid securely via Razorpay. Truth Estate never stores card details."}<br>
    This is a payment receipt, not a GST tax invoice. Need one for accounting?
    Reply to your advisor and we will raise it.
  </p>
</div>
<button class="btn" onclick="window.print()">Print / Save as PDF</button>
</body></html>`;
}

/* Opened via a Blob rather than document.write into about:blank — a
   blank-document write inherits the opener's origin and is blocked by
   some hardened browsers, and this way the tab has a real URL the reader
   can bookmark or re-print. */
export function openReceipt(p: Payment): boolean {
  if (typeof window === "undefined") return false;
  const url = URL.createObjectURL(new Blob([receiptHtml(p)], { type: "text/html" }));
  const w = window.open(url, "_blank", "noopener");
  /* Revoked late: too early and the tab loads nothing. */
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return !!w;
}
