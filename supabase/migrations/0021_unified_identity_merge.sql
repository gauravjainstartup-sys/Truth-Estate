-- ════════════════════════════════════════════════════════════════
-- 0021 — UNIFIED IDENTITY MERGE & CANONICAL ACCOUNT RESOLUTION
--
-- Extends migration 0015_identity_merge with a helper RPC `resolve_and_merge_identity`
-- that guarantees Phone OTP and Google SSO resolve to ONE canonical account.
--
-- SECURITY:
--   • SECURITY DEFINER + search_path pinned to public, auth, pg_temp.
--   • Revoked from public, anon, authenticated roles — executable ONLY by
--     service_role inside verified Edge Functions (chat-signin, twilio-otp, google-signin).
--   • Idempotent and non-destructive: uses merge_user_profiles to absorb any
--     duplicate source account without dropping unlocked reports or user data.
-- ════════════════════════════════════════════════════════════════

create or replace function public.resolve_and_merge_identity(
  p_primary_id   uuid,
  p_phone        text default null,
  p_email        text default null,
  p_google_sub   text default null
)
returns json
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_canonical_id uuid := p_primary_id;
  v_match_id     uuid;
  v_phone_digits text;
  v_clean_email  text;
  v_merged_count integer := 0;
begin
  if p_primary_id is null then
    return json_build_object('ok', false, 'reason', 'missing_primary_id');
  end if;

  v_phone_digits := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
  v_clean_email  := nullif(lower(trim(coalesce(p_email, ''))), '');

  -- Ignore synthetic placeholder emails (phone_*@truthestate.com) for identity matching
  if v_clean_email like 'phone_%@truthestate.%' or v_clean_email like 'intl_%@truthestate.%' then
    v_clean_email := null;
  end if;

  -- 1) Lookup existing account by google_sub if provided
  if p_google_sub is not null and p_google_sub <> '' then
    select id into v_match_id
      from public.user_profiles
     where google_sub = p_google_sub
       and id <> v_canonical_id
     limit 1;

    if v_match_id is not null then
      perform public.merge_user_profiles(v_canonical_id, v_match_id);
      v_merged_count := v_merged_count + 1;
    end if;
  end if;

  -- 2) Lookup existing account by verified email if provided
  if v_clean_email is not null then
    select id into v_match_id
      from public.user_profiles
     where lower(email) = v_clean_email
       and id <> v_canonical_id
     limit 1;

    if v_match_id is not null then
      perform public.merge_user_profiles(v_canonical_id, v_match_id);
      v_merged_count := v_merged_count + 1;
    end if;
  end if;

  -- 3) Lookup existing account by phone (last 10 digits) if provided
  if v_phone_digits is not null and length(v_phone_digits) >= 10 then
    select u.id into v_match_id
      from auth.users u
     where right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 10) = right(v_phone_digits, 10)
       and u.id <> v_canonical_id
     order by u.created_at
     limit 1;

    if v_match_id is not null then
      perform public.merge_user_profiles(v_canonical_id, v_match_id);
      v_merged_count := v_merged_count + 1;
    end if;
  end if;

  -- 4) Stamp verified attributes onto canonical profile
  update public.user_profiles
     set google_sub      = coalesce(google_sub, p_google_sub),
         email           = coalesce(email, v_clean_email),
         phone           = coalesce(phone, p_phone),
         phone_verified  = case when p_phone is not null then true else phone_verified end,
         updated_at      = now()
   where id = v_canonical_id;

  return json_build_object(
    'ok', true,
    'canonical_id', v_canonical_id,
    'merged_count', v_merged_count
  );
end;
$$;

-- Revoke execution from client roles (service-role only)
revoke execute on function public.resolve_and_merge_identity(uuid, text, text, text) from public, anon, authenticated;

/*
 ── ROLLBACK SQL (FOR REFERENCE) ───────────────────────────────────
 DROP FUNCTION IF EXISTS public.resolve_and_merge_identity(uuid, text, text, text);
 ═══════════════════════════════════════════════════════════════════
*/
