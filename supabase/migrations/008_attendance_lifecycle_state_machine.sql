-- ==============================================================================
-- Migration 008: Attendance Status Lifecycle State Machine & Integrity
-- Conforms to Problem I Remediation in docs/ROOT-CAUSE-REPORT.md.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. NORMALIZE PRE-EXISTING ATTENDANCE RECORDS
-- Ensure legacy or dirty rows comply with lifecycle state machine before constraint enforcement.
-- ------------------------------------------------------------------------------
-- Default any null re_verified booleans to false
UPDATE public.attendance_records
SET re_verified = false
WHERE re_verified IS NULL;

-- If marked present and re_verified = true, ensure re_verified_at timestamp is populated
UPDATE public.attendance_records
SET re_verified_at = COALESCE(re_verified_at, check_in_time, created_at, NOW())
WHERE status = 'present' AND re_verified = true AND re_verified_at IS NULL;

-- If marked failed or absent, reset re_verified flag to false and nullify timestamp
UPDATE public.attendance_records
SET re_verified = false, re_verified_at = NULL
WHERE status IN ('re_verify_failed', 'absent') AND (re_verified = true OR re_verified_at IS NOT NULL);

-- Normalize any non-conforming or null status values to 'present'
UPDATE public.attendance_records
SET status = 'present'
WHERE status NOT IN ('present', 'absent', 're_verify_failed') OR status IS NULL;

-- ------------------------------------------------------------------------------
-- 1. ATTENDANCE RECORD LIFECYCLE CHECK CONSTRAINT
-- Enforces valid combinations of (status, re_verified, re_verified_at) at the database engine level.
-- ------------------------------------------------------------------------------
ALTER TABLE public.attendance_records
    DROP CONSTRAINT IF EXISTS chk_attendance_record_lifecycle;

ALTER TABLE public.attendance_records
    ADD CONSTRAINT chk_attendance_record_lifecycle
    CHECK (
        (status = 'present' AND (re_verified = false OR (re_verified = true AND re_verified_at IS NOT NULL))) OR
        (status = 're_verify_failed' AND re_verified = false) OR
        (status = 'absent' AND re_verified = false)
    );

-- ------------------------------------------------------------------------------
-- 2. TRANSITION VALIDATION TRIGGER
-- Prevents illegal backwards or tampering transitions on verified records.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_attendance_record_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Cannot revoke confirmed re-verification status
    IF OLD.re_verified = true AND NEW.re_verified = false THEN
        RAISE EXCEPTION 'Cannot revoke confirmed re-verification status without administrative override.';
    END IF;

    -- Cannot silently revert a failed re-verification back to present
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
