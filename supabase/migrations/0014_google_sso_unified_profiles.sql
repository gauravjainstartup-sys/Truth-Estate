-- ════════════════════════════════════════════════════════════════
-- 0014 — SCHEMA CAPTURE & UNIFIED PROFILES MIGRATION
--
-- Captures the schema for public.user_profiles and adds support
-- for Google SSO + phone authentication identity unification.
-- ════════════════════════════════════════════════════════════════

-- 1. Base Table Capture (Baseline)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  name text,
  phone_verified boolean DEFAULT false,
  auth_provider text DEFAULT 'phone',
  avatar_url text,
  google_sub text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Additive columns for existing installations
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'phone',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS google_sub text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- 3. RLS Lockdown & Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Partial unique index on email for Google SSO users
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_uniq
  ON public.user_profiles (email)
  WHERE email IS NOT NULL AND email != '';

-- 5. Automatic Postgres Trigger: Sync Supabase Auth (auth.users) to public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_google_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'google'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(user_profiles.name, EXCLUDED.name),
    avatar_url = COALESCE(user_profiles.avatar_url, EXCLUDED.avatar_url),
    auth_provider = COALESCE(user_profiles.auth_provider, 'google'),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_google_user_signup();
