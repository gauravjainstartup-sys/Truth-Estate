/* ════════════════════════════════════════════════════════════════
   RAZORPAY CHECKOUT — the browser half.

   What this replaces: UnlockModal's pay() called grantPackage() inside a
   900ms setTimeout labelled "simulate the Razorpay round-trip", wrote the
   entitlement to localStorage and unmasked the report. No order, no
   charge, no server. The screen even said so in the small print.

   The shape now:

     order()   → our function prices the package and creates a real order
     open()    → Razorpay's own checkout takes the money
     verify()  → our function checks the signature, asks Razorpay whether
                 the order is actually paid, and writes the grant

   NOTHING HERE GRANTS ANYTHING. This module cannot: the entitlement is
   written by razorpay-verify against the service role, and the client
   only learns about it by re-reading entitlements afterwards. That is the
   whole point — a payment flow whose success path runs in the browser is
   a payment flow with an opt-out button.

   The key id arrives from the order response rather than the bundle, so
   rotating Razorpay keys is a dashboard change, not a redeploy.
   ════════════════════════════════════════════════════════════════ */
import { getAnonId } from "@/lib/truthGuideChat";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

export type CheckoutFailure =
  | "unverified"        // no confirmed phone on this device yet
  | "not_configured"    // Razorpay keys absent — treat as "cannot sell"
  | "dismissed"         // reader closed the sheet; not an error
  | "declined"          // the bank or Razorpay refused it
  | "verification"      // paid, but the grant could not be confirmed
  | "network";

export type Receipt = {
  paymentId: string;
  orderId: string;
  amountInr: number;
  label: string;
  method: string | null;
  projectName: string | null;
  paidAt: string;
};

export type CheckoutResult =
  | { ok: true; packageId: string; slug: string | null; all: boolean; receipt?: Receipt }
  /* `code` is the server's own reason, carried through to the customer as
     a support code. The first live test failed on an order-status race and
     the screen could only say "we couldn't confirm it" — true, useless to
     both of us. A payment id plus a reason is a ticket somebody can
     actually action. */
  | { ok: false; reason: CheckoutFailure; paymentId?: string; code?: string };

type RzpSuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpCtor = new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (x: unknown) => void) => void };

declare global {
  interface Window { Razorpay?: RzpCtor }
}

let loading: Promise<boolean> | null = null;
function loadCheckoutJs(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_JS;
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    /* An ad blocker or a dead network must not leave the reader staring
       at a spinner — the caller shows "payments unavailable" instead. */
    s.onerror = () => { loading = null; resolve(false); };
    document.head.appendChild(s);
  });
  return loading;
}

async function fn<T>(name: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    return await res.json().catch(() => null) as T | null;
  } catch {
    return null;
  }
}

/* Warm the script while the reader is still choosing a package, so the
   sheet opens instantly on tap. Safe to call repeatedly. */
export const prewarmCheckout = (): void => { void loadCheckoutJs(); };

export async function payForPackage(
  packageId: "read" | "read3d" | "all",
  slug: string | undefined,
  who: { name?: string | null; phone?: string | null } = {},
): Promise<CheckoutResult> {
  const anonId = getAnonId();
  if (!anonId) return { ok: false, reason: "unverified" };

  const order = await fn<{
    ok?: boolean; reason?: string; orderId?: string; amountPaise?: number;
    currency?: string; keyId?: string; label?: string;
  }>("razorpay-order", { anonId, packageId, slug });

  if (!order) return { ok: false, reason: "network" };
  if (!order.ok) {
    if (order.reason === "unverified") return { ok: false, reason: "unverified" };
    if (order.reason === "not_configured") return { ok: false, reason: "not_configured" };
    return { ok: false, reason: "network" };
  }
  if (!(await loadCheckoutJs())) return { ok: false, reason: "network" };

  const success = await new Promise<RzpSuccess | null>((resolve) => {
    let settled = false;
    const finish = (v: RzpSuccess | null) => { if (!settled) { settled = true; resolve(v); } };
    const rzp = new window.Razorpay!({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: order.currency ?? "INR",
      name: "Truth Estate",
      description: order.label ?? "Report access",
      prefill: { name: who.name ?? undefined, contact: who.phone ?? undefined },
      theme: { color: "#1e6b45" },
      /* Razorpay calls ondismiss when the reader closes the sheet without
         paying. Without it the promise never settles and the button spins
         for ever. */
      modal: { ondismiss: () => finish(null) },
      handler: (r: RzpSuccess) => finish(r),
    });
    rzp.on("payment.failed", () => finish(null));
    rzp.open();
  });

  if (!success) return { ok: false, reason: "dismissed" };

  const verified = await fn<{ ok?: boolean; reason?: string; granted?: boolean; duplicate?: boolean; slug?: string | null; all?: boolean; receipt?: Receipt }>(
    "razorpay-verify",
    { anonId, ...success },
  );

  /* Money may well have left the reader's account by now. If verification
     fails we say so honestly and surface the payment id — never a silent
     failure, and never a grant handed out to paper over it. */
  if (!verified?.ok) {
    console.error("[checkout] verification failed", verified?.reason);
    return { ok: false, reason: "verification", paymentId: success.razorpay_payment_id, code: verified?.reason };
  }
  return {
    ok: true,
    packageId,
    slug: verified.slug ?? slug ?? null,
    all: verified.all === true,
    receipt: verified.receipt,
  };
}
