-- ════════════════════════════════════════════════════════════════
-- 0006 — CLAIM ANONYMOUS HISTORY
--
-- Called once, immediately after a visitor verifies their phone. Attaches
-- every conversation and every lead from that device to the new account.
--
-- This is the payoff for carrying anon_id through the chat and the lead
-- capture: the questions someone asks BEFORE they trust you enough to
-- sign up are the most honest signal in the funnel, and until now they
-- were orphaned the moment they became a customer.
--
-- SECURITY. The account id comes from auth.uid() — read from the verified
-- JWT — never from an argument. A caller can only ever claim history onto
-- THEMSELVES. The anon_id they pass is one they already hold in their own
-- localStorage, and it is a v4 UUID, so guessing someone else's is not a
-- practical attack. `user_id is null` makes the claim idempotent and stops
-- an already-claimed row being reassigned.
--
-- SECURITY DEFINER is required: the tables' RLS policies grant SELECT on
-- own rows only, so an ordinary caller cannot UPDATE rows that are not yet
-- theirs — which is precisely the operation being performed. search_path
-- is pinned to defeat search-path injection, the standard hazard with
-- definer functions.
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
begin
  -- Unauthenticated callers get nothing. Without this, SECURITY DEFINER
  -- would happily set user_id to NULL for every matching row.
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_anon_id is null or length(p_anon_id) < 8 then
    return json_build_object('chats', 0, 'leads', 0);
  end if;

  update public.chat_sessions
     set user_id = v_user
   where anon_id = p_anon_id
     and user_id is null;
  get diagnostics v_chats = row_count;

  -- contact_leads.user_id is TEXT here while chat_sessions.user_id is UUID.
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

  return json_build_object('chats', v_chats, 'leads', v_leads);
end;
$$;

revoke all on function public.claim_anonymous_history(text, text) from public, anon;
grant execute on function public.claim_anonymous_history(text, text) to authenticated;


-- ════════════════════════════════════════════════════════════════
-- VERIFY
--
--   -- an anonymous caller must be refused (42501):
--   curl -X POST "<URL>/rest/v1/rpc/claim_anonymous_history" \
--        -H "apikey: <ANON_KEY>" -H "content-type: application/json" \
--        -d '{"p_anon_id":"whatever"}'
--
--   -- after a real sign-in through the chat, the history should carry a
--   -- user_id where it previously had none:
--   select count(*) filter (where user_id is not null) as claimed,
--          count(*)                                     as total
--     from public.chat_sessions where anon_id is not null;
-- ════════════════════════════════════════════════════════════════
