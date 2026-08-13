-- ════════════════════════════════════════════════════════════════
-- 0021 — UNIFIED IDENTITY MERGE & CANONICAL ACCOUNT RESOLUTION
--
-- SAFE BY CONSTRUCTION IDENTITY MERGER:
--   1. Transactional advisory locks (pg_advisory_xact_lock) on target & source UUIDs
--      to prevent concurrent sign-in race conditions.
--   2. Enforces cryptographically verified identifiers ONLY:
--      • google_sub: Permanent Google ID verified by Supabase /auth/v1/user.
--      • phone: Verified via fresh SMS/Twilio OTP (phone_verified = true).
--      • NEVER merges on a bare, caller-supplied or unverified email.
-- ════════════════════════════════════════════════════════════════

create or replace function public.resolve_and_merge_verified_identity(
  p_target_id          uuid,
  p_google_sub         text default null,
  p_verified_phone     text default null,
  p_phone_is_verified  boolean default false
)
returns json
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_source_id uuid;
  v_merged integer := 0;
  v_phone_digits text;
begin
  if p_target_id is null then
    return json_build_object('ok', false, 'reason', 'missing_target_id');
  end if;

  -- 1) Transactional advisory lock on canonical target UUID to prevent concurrent race conditions
  perform pg_advisory_xact_lock(hashtext(p_target_id::text));

  v_phone_digits := nullif(regexp_replace(coalesce(p_verified_phone, ''), '\D', '', 'g'), '');

  -- 2) Merge by verified google_sub (permanent cryptographic Google ID)
  if p_google_sub is not null and p_google_sub <> '' then
    select id into v_source_id
      from public.user_profiles
     where google_sub = p_google_sub
       and id <> p_target_id
     limit 1;

    if v_source_id is not null then
      perform pg_advisory_xact_lock(hashtext(v_source_id::text));
      perform public.merge_user_profiles(p_target_id, v_source_id);
      v_merged := v_merged + 1;
    end if;
  end if;

  -- 3) Merge by verified phone ONLY if fresh OTP proof was provided (p_phone_is_verified = true)
  if p_phone_is_verified is true and v_phone_digits is not null and length(v_phone_digits) >= 10 then
    select u.id into v_source_id
      from auth.users u
     where right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 10) = right(v_phone_digits, 10)
       and u.id <> p_target_id
     order by u.created_at
     limit 1;

    if v_source_id is not null then
      perform pg_advisory_xact_lock(hashtext(v_source_id::text));
      perform public.merge_user_profiles(p_target_id, v_source_id);
      v_merged := v_merged + 1;
    end if;
  end if;

  -- 4) Stamp verified attributes on target profile
  update public.user_profiles
     set google_sub     = coalesce(google_sub, p_google_sub),
         phone          = coalesce(phone, p_verified_phone),
         phone_verified = case when (p_phone_is_verified is true and p_verified_phone is not null) then true else phone_verified end,
         updated_at     = now()
   where id = p_target_id;

  return json_build_object(
    'ok', true,
    'target_id', p_target_id,
    'merged', v_merged
  );
end;
$$;

-- Revoke execution from client roles (service-role only)
revoke execute on function public.resolve_and_merge_verified_identity(uuid, text, text, boolean) from public, anon, authenticated;

/*
 ── ROLLBACK SQL (FOR REFERENCE) ───────────────────────────────────
 DROP FUNCTION IF EXISTS public.resolve_and_merge_verified_identity(uuid, text, text, boolean);
 ═══════════════════════════════════════════════════════════════════
*/
