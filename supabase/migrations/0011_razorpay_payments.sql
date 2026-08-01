-- ════════════════════════════════════════════════════════════════
-- RAZORPAY — the two columns that make a payment reconcilable.
--
-- `payments` already records user_id, status, project_name, package_name
-- and amount. What it has never recorded is the gateway's own identifiers,
-- and without them two things are impossible:
--
--   IDEMPOTENCY. Razorpay can deliver the same success more than once — a
--   retried callback, a double-tapped button, the webhook racing the
--   browser. Without a unique payment id there is nothing to collide
--   against, so the same ₹1,499 gets written twice and the grant array
--   gets two copies of the same report.
--
--   RECONCILIATION. When a payment succeeds and the grant write fails,
--   the only way back to the customer is the payment id. razorpay-verify
--   returns it to the buyer on that path and logs it; this is where it
--   has to be findable afterwards.
--
-- Safe to run more than once, and safe on a table with rows: both columns
-- are nullable, so every existing payment stays valid with them empty.
-- The unique index is PARTIAL — it constrains only rows that actually
-- carry a razorpay id, so the historical rows (which carry none) do not
-- all collide on NULL.
-- ════════════════════════════════════════════════════════════════

alter table public.payments
  add column if not exists razorpay_order_id   text,
  add column if not exists razorpay_payment_id text;

create unique index if not exists payments_razorpay_payment_id_uniq
  on public.payments (razorpay_payment_id)
  where razorpay_payment_id is not null;

create index if not exists payments_user_status_idx
  on public.payments (user_id, status);

comment on column public.payments.razorpay_order_id is
  'Razorpay order id (order_...). Set by the razorpay-verify edge function.';
comment on column public.payments.razorpay_payment_id is
  'Razorpay payment id (pay_...). Unique where present — the idempotency key for grant writes.';
