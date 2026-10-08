-- ==============================================================================
-- AttendGuard Migration 004: Automated & Idempotent Profile Provisioning
-- Provides a PostgreSQL trigger on auth.users to ensure all authenticated users
-- (OAuth or email/password) have a verified record in public.profiles.
-- ==============================================================================

-- 1. Create or replace the trigger handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_identifier TEXT;
  v_prefix TEXT;
  v_clean_uuid TEXT;
BEGIN
  -- 1. Extract role from user metadata with fail-safe default to 'student'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF v_role NOT IN ('student', 'teacher') THEN
    v_role := 'student';
  END IF;

  -- 2. Extract full name from provider metadata or institutional email prefix
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
    'Academic User'
  );

  -- 3. Determine institutional identifier prefix
  IF v_role = 'teacher' THEN
    v_prefix := 'FAC-';
  ELSE
    v_prefix := 'STU-';
  END IF;

  -- 4. Clean UUID representation for deterministic identifier generation
  v_clean_uuid := UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8));

  -- 5. Extract or derive unique institutional identifier
  v_identifier := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'identifier'), ''),
    v_prefix || v_clean_uuid
  );

  -- 6. Insert profile with ON CONFLICT resolution
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    identifier,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::TEXT || '@university.edu'),
    v_full_name,
    v_role,
    v_identifier,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN profiles.full_name = 'Academic User' AND EXCLUDED.full_name <> 'Academic User' 
      THEN EXCLUDED.full_name 
      ELSE profiles.full_name 
    END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log warning to Postgres log without aborting the authentication transaction
    RAISE WARNING '[handle_new_user]: Failed to provision profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Bind trigger to auth.users after insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Idempotent Backfill: Provision profiles for existing auth.users missing public.profiles
DO $$
DECLARE
  r RECORD;
  v_role TEXT;
  v_full_name TEXT;
  v_prefix TEXT;
  v_identifier TEXT;
BEGIN
  FOR r IN 
    SELECT 
      u.id, 
      u.email, 
      u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    v_role := COALESCE(r.raw_user_meta_data->>'role', 'student');
    IF v_role NOT IN ('student', 'teacher') THEN
      v_role := 'student';
    END IF;

    v_full_name := COALESCE(
      NULLIF(TRIM(r.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(r.raw_user_meta_data->>'name'), ''),
      NULLIF(TRIM(SPLIT_PART(r.email, '@', 1)), ''),
      'Academic User'
    );

    IF v_role = 'teacher' THEN
      v_prefix := 'FAC-';
    ELSE
      v_prefix := 'STU-';
    END IF;

    v_identifier := COALESCE(
      NULLIF(TRIM(r.raw_user_meta_data->>'identifier'), ''),
      v_prefix || UPPER(SUBSTRING(REPLACE(r.id::TEXT, '-', '') FROM 1 FOR 8))
    );

    BEGIN
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        identifier,
        created_at,
        updated_at
      )
      VALUES (
        r.id,
        COALESCE(r.email, r.id::TEXT || '@university.edu'),
        v_full_name,
        v_role,
        v_identifier,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[backfill]: Failed to backfill profile for user %: %', r.id, SQLERRM;
    END;
  END LOOP;
END;
$$;
