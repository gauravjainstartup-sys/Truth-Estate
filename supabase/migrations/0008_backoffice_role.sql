-- ════════════════════════════════════════════════════════════════
-- 0008 — BACKOFFICE ROLE  (full read/write/delete, no authentication)
--
-- 0003 removed anon write access from the product tables, because the
-- anon key ships in the public site bundle and anyone holding it could
-- have run `delete from projects`. That also broke the AI Studio
-- back-office, which writes with a browser-side key and has no login.
--
-- This role restores full access for the back-office: every table in
-- public, select/insert/update/delete, plus tables created later. It is
-- reached with a dedicated key that exists only in the back-office and
-- appears in no other codebase.
--
-- WHY NOT JUST USE service_role
-- The founder asked for full table access, and this delivers it. The one
-- thing deliberately withheld is the AUTH SCHEMA: service_role can read
-- and delete auth.users directly and is a universally recognised name, so
-- a leak reads as total compromise. This role reaches all the DATA and
-- none of the account plumbing — same convenience, smaller blast radius,
-- and it is revoked with one statement instead of a key rotation that
-- would take the anon and service keys down with it.
-- ════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'backoffice') then
    create role backoffice nologin;
  end if;
end $$;

-- PostgREST connects as `authenticator` and switches role per request.
-- Without this grant the switch is refused and every call fails.
grant backoffice to authenticator;
grant usage on schema public to backoffice;

-- ── Everything in public, now and in future ─────────────────────
grant all on all tables    in schema public to backoffice;
grant all on all sequences in schema public to backoffice;
grant all on all functions in schema public to backoffice;

-- So a table added next month does not silently break the back-office.
-- Applies to objects created by BOTH owners that matter here: the
-- dashboard creates as `postgres`, the API/migrations as `supabase_admin`.
alter default privileges for role postgres        in schema public grant all on tables    to backoffice;
alter default privileges for role postgres        in schema public grant all on sequences to backoffice;
alter default privileges for role supabase_admin  in schema public grant all on tables    to backoffice;
alter default privileges for role supabase_admin  in schema public grant all on sequences to backoffice;

-- ── Get past RLS ────────────────────────────────────────────────
-- BYPASSRLS is the clean way and needs superuser, which Supabase may not
-- grant. Try it; if refused, fall back to a permissive policy per table.
-- The fallback is equivalent for existing tables — it just has to be
-- re-run when new ones appear (see MAINTENANCE below).
do $$
begin
  execute 'alter role backoffice bypassrls';
  raise notice 'backoffice: BYPASSRLS granted — per-table policies are belt-and-braces';
exception when others then
  raise notice 'backoffice: BYPASSRLS unavailable (%) — using per-table policies', sqlerrm;
end $$;

do $$
declare r record;
begin
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.tablename || '_backoffice', r.tablename);
    execute format(
      'create policy %I on public.%I for all to backoffice using (true) with check (true)',
      r.tablename || '_backoffice', r.tablename);
  end loop;
end $$;


-- ════════════════════════════════════════════════════════════════
-- ISSUING THE KEY — in the SQL editor, no local checkout needed.
--
-- A JWT is base64url(header).base64url(payload).base64url(HMAC), and
-- pgcrypto provides the HMAC. Replace the secret from
-- Settings → API → JWT Settings:
--
--   create extension if not exists pgcrypto with schema extensions;
--
--   with s as (select 'PASTE_JWT_SECRET_HERE'::text as secret),
--   parts as (
--     select
--       translate(replace(encode(convert_to('{"alg":"HS256","typ":"JWT"}','utf8'),
--         'base64'), E'\n',''), '+/=', '-_') as h,
--       translate(replace(encode(convert_to(json_build_object(
--           'role','backoffice',
--           'iss','supabase',
--           'iat',(extract(epoch from now()))::int,
--           'exp',(extract(epoch from now() + interval '5 years'))::int
--         )::text,'utf8'), 'base64'), E'\n',''), '+/=', '-_') as p
--   )
--   select parts.h||'.'||parts.p||'.'||
--     translate(replace(encode(extensions.hmac(parts.h||'.'||parts.p, s.secret, 'sha256'),
--       'base64'), E'\n',''), '+/=', '-_') as backoffice_key
--   from parts, s;
--
-- Three details that are load-bearing, not incidental:
--   • replace(..., E'\n', '')  — encode() wraps base64 at 76 chars, and a
--     newline inside a JWT segment makes the token silently invalid.
--   • translate(..., '+/=', '-_')  — base64 → base64url. '=' has no
--     counterpart in the target, which is how translate() DELETES it;
--     JWTs do not allow padding.
--   • the secret sits in the query text — DELETE THE SAVED SNIPPET
--     afterwards, the SQL editor keeps history.
--
-- Then in the back-office, as BOTH headers:
--   apikey: <backoffice key>
--   Authorization: Bearer <backoffice key>
--
--
-- MAINTENANCE — only if BYPASSRLS was refused above. After creating new
-- tables, re-run the second DO block to give them a backoffice policy.
--
--
-- REVOKING a leaked key — instant, and leaves anon/service_role alone:
--   revoke backoffice from authenticator;
-- (Rotating the JWT secret also works but invalidates every other key.)
--
--
-- VERIFY with the backoffice key:
--   curl -X PATCH "<URL>/rest/v1/project_extended_details?id=eq.<id>" \
--        -H "apikey: <BO>" -H "Authorization: Bearer <BO>" \
--        -H "content-type: application/json" -d '{"...":"..."}'
--   curl "<URL>/rest/v1/user_profiles?select=email&limit=1" \
--        -H "apikey: <BO>" -H "Authorization: Bearer <BO>"
-- Both should now succeed — this role has full table access by design.
-- ════════════════════════════════════════════════════════════════
