-- ==============================================================================
-- Migration 007: Device Security, Scoped Resets & Re-Verification Persistence
-- Conforms to AttendGuard Database Architecture & Phase 4 Specifications.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PERSISTENT RE-VERIFICATION CHALLENGE COLUMNS ON ATTENDANCE_SESSIONS
-- Enables stateless, multi-instance serverless presence verification.
-- ------------------------------------------------------------------------------
ALTER TABLE public.attendance_sessions
    ADD COLUMN IF NOT EXISTS reverify_challenge_id UUID NULL,
    ADD COLUMN IF NOT EXISTS reverify_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_reverify_challenge
    ON public.attendance_sessions (id, reverify_challenge_id)
    WHERE reverify_challenge_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. RELATIONAL BINDING: ATTENDANCE RECORD DEVICE OWNERSHIP
-- Guarantees that the device_id in attendance_records strictly belongs to the
-- student_id recording attendance and that the device is currently active.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. AUDIT LOG IMMUTABILITY & ENGINE-LEVEL WRITE PROTECTION
-- Guarantees that audit_logs entries can never be modified or deleted.
-- ------------------------------------------------------------------------------
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

-- Revoke any update/delete privileges from client roles
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;
