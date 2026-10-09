-- ==============================================================================
-- Migration 011: Attendance Review Required Lifecycle Status & Constraints
-- ==============================================================================
-- Allows attendance records flagged under IP mismatch review policy to be
-- persisted with status = 'review_required' (without counting towards confirmed attendance)
-- until authorized teacher review and resolution.
-- ==============================================================================

-- 1. Drop existing legacy check constraints on status if present
ALTER TABLE public.attendance_records
    DROP CONSTRAINT IF EXISTS attendance_records_status_check;

ALTER TABLE public.attendance_records
    ADD CONSTRAINT attendance_records_status_check
    CHECK (status IN ('present', 'absent', 're_verify_failed', 'review_required'));

-- 2. Update lifecycle check constraint to include review_required
ALTER TABLE public.attendance_records
    DROP CONSTRAINT IF EXISTS chk_attendance_record_lifecycle;

ALTER TABLE public.attendance_records
    ADD CONSTRAINT chk_attendance_record_lifecycle
    CHECK (
        (status = 'present' AND (re_verified = false OR (re_verified = true AND re_verified_at IS NOT NULL))) OR
        (status = 're_verify_failed' AND re_verified = false) OR
        (status = 'absent' AND re_verified = false) OR
        (status = 'review_required' AND re_verified = false)
    );

-- 3. Transition validation trigger
-- Ensures review_required can transition to present or absent upon teacher resolution,
-- while continuing to prevent tampering with confirmed re-verified records.
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

-- 4. Index on status for rapid filtering of review_required attendees
CREATE INDEX IF NOT EXISTS idx_attendance_records_status
ON public.attendance_records (status);
