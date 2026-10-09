-- ==============================================================================
-- AttendGuard: Consolidated Hackathon Database Setup & Security Hardening
-- Combines Migrations 005 through 013 into a single, idempotent, copy-pasteable script.
-- Fixes missing relation "security_events", resolves RLS infinite recursion on
-- "class_enrollments", and sets up all attendance lifecycle & WebAuthn tables.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILE IMMUTABILITY & ROLE SECURITY (Migration 005)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_immutable_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_is_service_role BOOLEAN;
BEGIN
  v_is_service_role := (current_setting('request.jwt.claim.role', true) = 'service_role')
                       OR (current_user IN ('postgres', 'supabase_admin'));

  IF v_is_service_role THEN
    RETURN NEW;
  END IF;

  IF (NEW.id IS DISTINCT FROM OLD.id) THEN
    RAISE EXCEPTION 'Modification of profile ID is strictly forbidden.' USING ERRCODE = '42501';
  END IF;

  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    RAISE EXCEPTION 'Modifying profile role is forbidden. Privileged roles must be assigned by an administrator.' USING ERRCODE = '42501';
  END IF;

  IF (NEW.identifier IS DISTINCT FROM OLD.identifier) THEN
    RAISE EXCEPTION 'Modifying institutional identifier is forbidden. Contact the registrar.' USING ERRCODE = '42501';
  END IF;

  IF (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    NEW.created_at := OLD.created_at;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS before_profile_update_protection ON public.profiles;
CREATE TRIGGER before_profile_update_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_immutable_fields();

-- ------------------------------------------------------------------------------
-- 2. DATA RETENTION & RELATIONAL INTEGRITY (Migration 006)
-- ------------------------------------------------------------------------------
ALTER TABLE public.classes 
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.attendance_sessions 
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_class_teacher_ownership'
  ) THEN
    ALTER TABLE public.classes 
      ADD CONSTRAINT unique_class_teacher_ownership UNIQUE (id, teacher_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.verify_session_teacher_ownership()
RETURNS TRIGGER AS $$
DECLARE
  v_class_teacher_id UUID;
  v_is_archived BOOLEAN;
BEGIN
  SELECT teacher_id, is_archived INTO v_class_teacher_id, v_is_archived 
  FROM public.classes 
  WHERE id = NEW.class_id;

  IF v_class_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Referenced class (ID: %) does not exist.', NEW.class_id USING ERRCODE = '23503';
  END IF;

  IF v_class_teacher_id <> NEW.teacher_id THEN
    RAISE EXCEPTION 'Session teacher_id (%) does not match class owner (%). Cross-teacher session creation is prohibited.',
      NEW.teacher_id, v_class_teacher_id USING ERRCODE = '42501';
  END IF;

  IF v_is_archived THEN
    RAISE EXCEPTION 'Cannot start attendance sessions for an archived class (ID: %).', NEW.class_id USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verify_session_teacher_ownership ON public.attendance_sessions;
CREATE TRIGGER trigger_verify_session_teacher_ownership
  BEFORE INSERT OR UPDATE OF class_id, teacher_id ON public.attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_session_teacher_ownership();

CREATE OR REPLACE FUNCTION public.prevent_historical_attendance_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Hard deletion of verified attendance records is strictly prohibited by institutional policy.' USING ERRCODE = '23503';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_attendance_records_deletion ON public.attendance_records;
CREATE TRIGGER trigger_prevent_attendance_records_deletion
  BEFORE DELETE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_historical_attendance_deletion();

-- ------------------------------------------------------------------------------
-- 3. DEVICE SECURITY & RE-VERIFICATION PERSISTENCE (Migration 007)
-- ------------------------------------------------------------------------------
ALTER TABLE public.attendance_sessions
  ADD COLUMN IF NOT EXISTS reverify_challenge_id UUID NULL,
  ADD COLUMN IF NOT EXISTS reverify_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_reverify_challenge
  ON public.attendance_sessions (id, reverify_challenge_id)
  WHERE reverify_challenge_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.verify_attendance_record_device_ownership()
RETURNS TRIGGER AS $$
DECLARE
  v_device_student_id UUID;
  v_device_is_active BOOLEAN;
BEGIN
  SELECT student_id, is_active 
  INTO v_device_student_id, v_device_is_active
  FROM public.registered_devices
  WHERE id = NEW.device_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Device with ID % does not exist in registered_devices.', NEW.device_id;
  END IF;

  IF v_device_student_id <> NEW.student_id THEN
    RAISE EXCEPTION 'Device with ID % does not belong to student %. Proxy submission blocked.', 
      NEW.device_id, NEW.student_id;
  END IF;

  IF v_device_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Device with ID % is inactive or has been revoked.', NEW.device_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_attendance_record_device_ownership ON public.attendance_records;
CREATE TRIGGER trg_verify_attendance_record_device_ownership
  BEFORE INSERT OR UPDATE OF device_id, student_id ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_attendance_record_device_ownership();

CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are strictly immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_modification
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- ------------------------------------------------------------------------------
-- 4. IP VERIFICATION & SECURITY EVENTS TABLE (Migration 010)
-- ------------------------------------------------------------------------------
ALTER TABLE public.attendance_records 
  ADD COLUMN IF NOT EXISTS ip_verification_status TEXT NOT NULL DEFAULT 'skipped',
  ADD COLUMN IF NOT EXISTS verification_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS ip_address TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_records_ip_status 
  ON public.attendance_records (ip_verification_status);

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  student_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id UUID NULL REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_student_id ON public.security_events (student_id);
CREATE INDEX IF NOT EXISTS idx_security_events_session_id ON public.security_events (session_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events (created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own security events" ON public.security_events;
CREATE POLICY "Students view own security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.security_events FROM authenticated, anon;

-- ------------------------------------------------------------------------------
-- 5. ATTENDANCE RECORD LIFECYCLE & REVIEW STATUS (Migration 008 & 011)
-- ------------------------------------------------------------------------------
UPDATE public.attendance_records SET re_verified = false WHERE re_verified IS NULL;
UPDATE public.attendance_records SET re_verified_at = COALESCE(re_verified_at, check_in_time, created_at, NOW()) WHERE status = 'present' AND re_verified = true AND re_verified_at IS NULL;
UPDATE public.attendance_records SET re_verified = false, re_verified_at = NULL WHERE status IN ('re_verify_failed', 'absent') AND (re_verified = true OR re_verified_at IS NOT NULL);
UPDATE public.attendance_records SET status = 'present' WHERE status NOT IN ('present', 'absent', 're_verify_failed', 'review_required') OR status IS NULL;

ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_status_check
  CHECK (status IN ('present', 'absent', 're_verify_failed', 'review_required'));

ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS chk_attendance_record_lifecycle;
ALTER TABLE public.attendance_records ADD CONSTRAINT chk_attendance_record_lifecycle
  CHECK (
    (status = 'present' AND (re_verified = false OR (re_verified = true AND re_verified_at IS NOT NULL))) OR
    (status = 're_verify_failed' AND re_verified = false) OR
    (status = 'absent' AND re_verified = false) OR
    (status = 'review_required' AND re_verified = false)
  );

CREATE OR REPLACE FUNCTION public.validate_attendance_record_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.re_verified = true AND NEW.re_verified = false THEN
    RAISE EXCEPTION 'Cannot revoke confirmed re-verification status without administrative override.';
  END IF;

  IF OLD.status = 're_verify_failed' AND NEW.status = 'present' AND NEW.re_verified = false THEN
    RAISE EXCEPTION 'Cannot transition re_verify_failed record directly to unverified present status.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_attendance_record_transition ON public.attendance_records;
CREATE TRIGGER trg_validate_attendance_record_transition
  BEFORE UPDATE OF status, re_verified ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_attendance_record_transition();

CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records (status);

-- ------------------------------------------------------------------------------
-- 6. RESOLVE RLS INFINITE RECURSION ON CLASS_ENROLLMENTS (Migration 012)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_is_teacher() 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_student_enrolled_in_class(p_class_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = p_class_id AND student_id = p_student_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id UUID, p_teacher_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = p_teacher_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student_in_teacher_classes(p_student_id UUID, p_teacher_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.classes c ON ce.class_id = c.id
    WHERE ce.student_id = p_student_id AND c.teacher_id = p_teacher_id
  );
$$;

DROP POLICY IF EXISTS "Teachers can read student profiles in their classes" ON public.profiles;
CREATE POLICY "Teachers can read student profiles in their classes" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (
    public.auth_is_teacher() AND public.is_student_in_teacher_classes(id, auth.uid())
  );

DROP POLICY IF EXISTS "Students can read enrolled classes" ON public.classes;
CREATE POLICY "Students can read enrolled classes" 
  ON public.classes FOR SELECT 
  TO authenticated 
  USING (
    public.is_student_enrolled_in_class(id, auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can read enrollments for their classes" ON public.class_enrollments;
CREATE POLICY "Teachers can read enrollments for their classes" 
  ON public.class_enrollments FOR SELECT 
  TO authenticated 
  USING (
    public.is_teacher_of_class(class_id, auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can manage enrollments for their classes" ON public.class_enrollments;
CREATE POLICY "Teachers can manage enrollments for their classes" 
  ON public.class_enrollments FOR ALL 
  TO authenticated 
  USING (
    public.is_teacher_of_class(class_id, auth.uid())
  )
  WITH CHECK (
    public.is_teacher_of_class(class_id, auth.uid())
  );

DROP POLICY IF EXISTS "Enrolled students can read active sessions" ON public.attendance_sessions;
CREATE POLICY "Enrolled students can read active sessions" 
  ON public.attendance_sessions FOR SELECT 
  TO authenticated 
  USING (
    public.is_student_enrolled_in_class(class_id, auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can view devices of students in their classes" ON public.registered_devices;
CREATE POLICY "Teachers can view devices of students in their classes" 
  ON public.registered_devices FOR SELECT 
  TO authenticated 
  USING (
    public.auth_is_teacher() AND public.is_student_in_teacher_classes(student_id, auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can read scoped audit logs" ON public.audit_logs;
CREATE POLICY "Teachers can read scoped audit logs" 
  ON public.audit_logs FOR SELECT 
  TO authenticated 
  USING (
    public.auth_is_teacher() AND (
      actor_id = auth.uid() OR
      public.is_student_in_teacher_classes(audit_logs.entity_id, auth.uid())
    )
  );

-- ------------------------------------------------------------------------------
-- 7. WEBAUTHN CREDENTIALS & CHALLENGES (Migration 013)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT NULL,
  backed_up BOOLEAN NOT NULL DEFAULT false,
  transports TEXT[] NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  CONSTRAINT uq_webauthn_credential_id UNIQUE (credential_id)
);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON public.webauthn_credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_active ON public.webauthn_credentials (user_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('registration', 'attendance_authentication')),
  token_fingerprint TEXT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_lookup ON public.webauthn_challenges (id, user_id, purpose) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON public.webauthn_challenges (expires_at);

ALTER TABLE public.security_events DROP CONSTRAINT IF EXISTS security_events_event_type_check;
ALTER TABLE public.security_events ADD CONSTRAINT security_events_event_type_check
CHECK (
  event_type IN (
    'EXPIRED_QR',
    'INVALID_QR',
    'DUPLICATE_ATTENDANCE',
    'NETWORK_MISMATCH',
    'UNAUTHORIZED_ACCESS',
    'DEVICE_MISMATCH',
    'LOCATION_MISMATCH',
    'ATTENDANCE_CORRECTION',
    'WEBAUTHN_REGISTER_SUCCESS',
    'WEBAUTHN_REGISTER_FAILED',
    'WEBAUTHN_AUTH_SUCCESS',
    'WEBAUTHN_AUTH_FAILED',
    'WEBAUTHN_CHALLENGE_EXPIRED',
    'WEBAUTHN_CHALLENGE_REPLAY',
    'WEBAUTHN_CREDENTIAL_REVOKED'
  )
);

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own webauthn credentials" ON public.webauthn_credentials;
CREATE POLICY "Students can view own webauthn credentials"
  ON public.webauthn_credentials FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.webauthn_credentials FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.webauthn_challenges FROM authenticated, anon;
REVOKE SELECT ON public.webauthn_challenges FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.attendance_records FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.attendance_verifications FROM authenticated, anon;
REVOKE UPDATE, DELETE ON public.registered_devices FROM authenticated, anon;
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;
