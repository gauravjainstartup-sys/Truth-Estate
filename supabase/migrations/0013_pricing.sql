-- ════════════════════════════════════════════════════════════════
-- 0013 — PRICING (DB-driven packages + discounts)
--
-- Until now a price was a hard-coded constant repeated in five places —
-- razorpay-order (the charge authority), razorpay-verify (the amount
-- check), billing (receipt labels), and the client's PACKAGES + a few
-- display strings — all kept in sync by hand, with no discount concept
-- and a redeploy needed to change a number.
--
-- This table is the single source of truth. razorpay-order charges from
-- it, the public `pricing` function serves it to the UI, and both apply
-- the same rule: the buyer pays `price_inr`, `mrp_inr` is the struck-out
-- list price, and the gap is the discount. Change a price or turn the
-- inaugural offer on or off with an UPDATE — no deploy.
--
-- price_inr is the AUTHORITY for what is charged; the browser never sends
-- an amount. mrp_inr only ever affects presentation (the strike-through).
--
-- Safe on a live database: it only ADDS a table + two nullable payment
-- columns, and seeds with ON CONFLICT DO NOTHING so re-running never
-- clobbers a price the founder has since edited.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.pricing (
  package_id       text primary key,                       -- 'read' | 'read3d' | 'all' (mirrors PackageId)
  label            text not null,
  scope            text not null check (scope in ('project', 'site')),
  mrp_inr          integer not null check (mrp_inr > 0),    -- list price (the strike-through)
  price_inr        integer not null check (price_inr > 0),  -- what is actually charged
  discount_label   text,                                    -- e.g. 'Inaugural offer'; null hides the discount UI
  discount_ends_at timestamptz,                             -- optional auto-expiry; past it, mrp is charged
  includes_3d      boolean not null default false,
  blurb            text,
  active           boolean not null default true,           -- offered on the site (inactive = honoured, not sold)
  sort             integer not null default 0,
  updated_at       timestamptz not null default now(),
  check (price_inr <= mrp_inr)                              -- a discount can never be negative
);

comment on table public.pricing is
  'Single source of truth for package prices + discounts. price_inr is charged; mrp_inr is the struck list price. RLS: public read of active rows.';

-- ── the live sheet ──────────────────────────────────────────────
-- read / all are on the inaugural offer; read3d is retired (kept for the
-- upgrade-credit maths, active=false so it is never offered). DO NOTHING
-- so a re-run of this migration cannot reset a price changed since.
insert into public.pricing
  (package_id, label, scope, mrp_inr, price_inr, discount_label, includes_3d, blurb, active, sort)
values
  ('read',   'Full Read',              'project',  2100,  1100, 'Inaugural offer', false,
     'This project''s complete forensic read — every pillar, the price journey, ROI model and verdict.', true, 10),
  ('all',    'All-Access',             'site',    11000,  5100, 'Inaugural offer', true,
     'Every read and every 3D across the site — plus 2 on-demand project reports & 3Ds.', true, 20),
  ('read3d', 'Read + Sun & Vastu 3D',  'project',  1499,  1499, null, true,
     'The full read plus the interactive Sun & Vastu 3D advisor for this project.', false, 30)
on conflict (package_id) do nothing;

-- keep updated_at honest without the editor having to remember it
create or replace function public.touch_pricing_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists pricing_touch on public.pricing;
create trigger pricing_touch before update on public.pricing
  for each row execute function public.touch_pricing_updated_at();

-- ── RLS: prices are public, and only active rows ────────────────
-- Anon and signed-in may read active rows (the `pricing` function uses
-- the service role and bypasses this; the policy is for any direct
-- PostgREST read and a future admin). Writes are service-role/SQL only —
-- no policy grants insert/update/delete, so the table fails closed to
-- everyone the app talks to as anon.
alter table public.pricing enable row level security;

drop policy if exists pricing_public_read on public.pricing;
create policy pricing_public_read on public.pricing
  for select to anon, authenticated
  using (active = true);

-- ── record the discount on the receipt ──────────────────────────
-- An invoice is immutable history: the MRP and the offer name are frozen
-- at purchase time, so a later price change never rewrites an old receipt.
-- Nullable — every existing row predates the discount model and correctly
-- shows no strike-through.
alter table public.payments add column if not exists mrp_inr        integer;
alter table public.payments add column if not exists discount_label text;

comment on column public.payments.mrp_inr is
  'List price at purchase time (frozen). NULL on pre-discount-model rows. amount stays the charged total.';
