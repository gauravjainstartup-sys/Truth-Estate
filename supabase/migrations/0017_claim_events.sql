-- ════════════════════════════════════════════════════════════════
-- 0017 — claim_anonymous_history must also claim EVENTS (fix web/SSO pay)
--
-- Two sign-in paths claim a device's pre-sign-in trail onto the account:
--
--   • link_verified_phone (0010) — the PHONE path (chat-signin). Claims
--     chat_sessions, contact_leads AND public.events (sets events.user_id).
--   • claim_anonymous_history (0006) — the WEB / Google-SSO path (called by
--     the browser after sign-in). Claimed chat_sessions and contact_leads
--     only — NEVER events.
--
-- But razorpay-order, entitlements and track all resolve "who is this device"
-- from the newest events row where user_id is set (events.user_id). So a
-- member who signed in with Google had no claimed events row and read as
-- UNVERIFIED: at checkout, razorpay-order returned reason "unverified" and the
-- paywall bounced them to the phone-OTP step right before Razorpay — and their
-- unlocks / attribution wouldn't resolve either. (Razorpay itself asks for
-- nothing; this was our own identity check.)
--
-- This redefines claim_anonymous_history to also claim events, closing the
-- asymmetry so a Google/web sign-in is recognised exactly like a phone one.
-- Idempotent create-or-replace; grants unchanged from 0006.
-- ════════════════════════════════════════════════════════════════

create or replace function public.claim_anonymous_history(
  p_anon_id    text,
  p_session_id text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user   uuid := auth.uid();
  v_chats  integer := 0;
  v_leads  integer := 0;
  v_events integer := 0;
begin
  -- Unauthenticated callers get nothing. Without this, SECURITY DEFINER
  -- would happily set user_id to NULL for every matching row.
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_anon_id is null or length(p_anon_id) < 8 then
    return json_build_object('chats', 0, 'leads', 0, 'events', 0);
  end if;

  update public.chat_sessions
     set user_id = v_user
   where anon_id = p_anon_id
     and user_id is null;
  get diagnostics v_chats = row_count;

  -- The pre-sign-in browsing trail. razorpay-order / entitlements / track all
  -- resolve identity from events.user_id, so without this a web/SSO sign-in is
  -- invisible to them (the phone path already claims events, in
  -- link_verified_phone). events.user_id is uuid — no cast, matching that path.
  update public.events
     set user_id = v_user
   where anon_id = p_anon_id
     and user_id is null;
  get diagnostics v_events = row_count;

  -- contact_leads.user_id is TEXT here while the others are UUID.
  -- The cast is load-bearing, not cosmetic: this schema is inconsistent and
  -- an uncast comparison fails with "operator does not exist: text = uuid".
  update public.contact_leads
     set user_id = v_user::text
   where user_id is null
     and (
       session_id = p_anon_id
       or (p_session_id is not null and session_id = p_session_id)
     );
  get diagnostics v_leads = row_count;

  return json_build_object('chats', v_chats, 'leads', v_leads, 'events', v_events);
end;
$$;

revoke all on function public.claim_anonymous_history(text, text) from public, anon;
grant execute on function public.claim_anonymous_history(text, text) to authenticated;
