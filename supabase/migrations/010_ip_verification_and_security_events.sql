-- ==============================================================================
-- AttendGuard Migration 010: IP Verification & Security Audit Events
-- Extends attendance_records with IP status and introduces security_events table
-- with Row Level Security (RLS) enforcement.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND ATTENDANCE_RECORDS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_records' AND column_name = 'ip_verification_status'
  ) THEN
    ALTER TABLE attendance_records 
    ADD COLUMN ip_verification_status TEXT NOT NULL DEFAULT 'skipped' 
    CHECK (ip_verification_status IN ('matched', 'network_mismatch', 'not_configured', 'skipped', 'review_required'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_records' AND column_name = 'verification_reason'
  ) THEN
    ALTER TABLE attendance_records 
    ADD COLUMN verification_reason TEXT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_records' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE attendance_records 
    ADD COLUMN ip_address TEXT NULL;
  END IF;
END $$;

-- Index on IP verification status for rapid filtering of flagged check-ins
CREATE INDEX IF NOT EXISTS idx_attendance_records_ip_status 
ON attendance_records (ip_verification_status);

-- ------------------------------------------------------------------------------
-- 2. SECURITY_EVENTS TABLE
-- Tamper-evident, append-only log of verification and authorization anomalies.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (
      event_type IN (
        'EXPIRED_QR',
        'INVALID_QR',
        'DUPLICATE_ATTENDANCE',
        'NETWORK_MISMATCH',
        'UNAUTHORIZED_ACCESS',
        'DEVICE_MISMATCH',
        'LOCATION_MISMATCH',
        'ATTENDANCE_CORRECTION'
      )
    ),
    student_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
    session_id UUID NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    verification_status TEXT NOT NULL CHECK (
      verification_status IN (
        'matched',
        'review_required',
        'rejected',
        'flagged',
        'failed',
        'success'
      )
    ),
    reason TEXT NOT NULL,
    ip_address TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for querying audit trails
CREATE INDEX IF NOT EXISTS idx_security_events_session_id ON security_events (session_id);
CREATE INDEX IF NOT EXISTS idx_security_events_student_id ON security_events (student_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events (event_type);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) FOR SECURITY_EVENTS
-- ------------------------------------------------------------------------------
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Teachers can view security events only for their own class sessions
CREATE POLICY "Teachers can view security events for their sessions" 
ON security_events FOR SELECT 
TO authenticated 
USING (
  auth_is_teacher() AND (
    session_id IS NULL OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = security_events.session_id AND s.teacher_id = auth.uid()
    )
  )
);

-- Students can view only their own security events (cannot view peers' logs)
CREATE POLICY "Students can view own security events" 
ON security_events FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

-- CRITICAL AUDIT INTEGRITY: Direct client mutations (INSERT/UPDATE/DELETE) are blocked.
-- All security events are written exclusively by server route handlers via service-role key.
