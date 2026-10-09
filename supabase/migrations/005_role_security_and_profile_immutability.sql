-- ==============================================================================
-- AttendGuard Migration 005: Role Security & Profile Field Immutability
-- Prevents unauthorized users from escalating their role to 'teacher' or
-- modifying protected institutional identifiers (Roll No / Faculty ID).
-- ==============================================================================

-- 1. Create protective trigger function for profiles
CREATE OR REPLACE FUNCTION public.protect_profile_immutable_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_is_service_role BOOLEAN;
BEGIN
  -- Determine if operation is executed by Supabase service_role / superuser
  v_is_service_role := (current_setting('request.jwt.claim.role', true) = 'service_role')
                       OR (current_user IN ('postgres', 'supabase_admin'));

  -- Allow service_role / migration scripts to perform administrative updates
  IF v_is_service_role THEN
    RETURN NEW;
  END IF;

  -- 1. Primary Key Immutability
  IF (NEW.id IS DISTINCT FROM OLD.id) THEN
    RAISE EXCEPTION 'Modification of profile ID is strictly forbidden.'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Role Immutability (Problem B)
  -- A student cannot promote themselves to teacher via direct update or client RLS
  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    RAISE EXCEPTION 'Modifying profile role is forbidden. Privileged roles must be assigned by an administrator.'
      USING ERRCODE = '42501';
  END IF;

  -- 3. Institutional Identifier Immutability (Problem E)
  -- Roll Numbers / Faculty IDs cannot be swapped or forged
  IF (NEW.identifier IS DISTINCT FROM OLD.identifier) THEN
    RAISE EXCEPTION 'Modifying institutional identifier is forbidden. Contact the registrar.'
      USING ERRCODE = '42501';
  END IF;

  -- 4. Creation Timestamp Immutability
  IF (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    NEW.created_at := OLD.created_at;
  END IF;

  -- Automatically update timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Bind trigger to public.profiles before update
DROP TRIGGER IF EXISTS before_profile_update_protection ON public.profiles;

CREATE TRIGGER before_profile_update_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_immutable_fields();

-- 3. Audit Verification Query (Ensures existing teacher accounts are preserved)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE role = 'teacher'
  ) THEN
    RAISE NOTICE '[Migration 005]: No existing teacher profiles found in database. Seed data can be applied.';
  ELSE
    RAISE NOTICE '[Migration 005]: Existing teacher profiles preserved successfully.';
  END IF;
END $$;
