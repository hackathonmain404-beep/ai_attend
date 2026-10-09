-- ==============================================================================
-- AttendGuard Migration 011: Face Biometrics Enrollment & Template Storage
-- Introduces student_face_biometrics table with AES-256-GCM encrypted template
-- storage, explicit consent tracking, RLS policies, and security event auditing.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STUDENT_FACE_BIOMETRICS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_face_biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'revoked', 'pending')),
    
    -- Authenticated AES-256-GCM Encrypted Biometric Template
    encrypted_template TEXT NOT NULL,
    template_iv TEXT NOT NULL,
    template_tag TEXT NOT NULL,
    template_version TEXT NOT NULL DEFAULT 'v1-128d',
    template_hash TEXT NOT NULL,
    
    -- Image verification hash (transient image is discarded, hash retained for audit)
    image_sha256 TEXT NOT NULL,
    
    -- Explicit Consent Tracking
    consent_given BOOLEAN NOT NULL DEFAULT true,
    consent_text TEXT NOT NULL,
    consent_recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_withdrawn_at TIMESTAMPTZ NULL,
    
    -- Enrollment Metadata (Device, IP hash, Quality metrics, Model version)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure each student can have at most one active enrolled template at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_face_biometrics_active_unique 
ON student_face_biometrics (student_id) 
WHERE status = 'enrolled';

-- Performance indexes for rapid lookups and status filtering
CREATE INDEX IF NOT EXISTS idx_student_face_biometrics_student_id 
ON student_face_biometrics (student_id);

CREATE INDEX IF NOT EXISTS idx_student_face_biometrics_status 
ON student_face_biometrics (status);

CREATE INDEX IF NOT EXISTS idx_student_face_biometrics_template_hash 
ON student_face_biometrics (template_hash);

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) FOR STUDENT_FACE_BIOMETRICS
-- ------------------------------------------------------------------------------
ALTER TABLE student_face_biometrics ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollment metadata and consent record
CREATE POLICY "Students can view own biometric enrollment" 
ON student_face_biometrics FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

-- CRITICAL PRIVACY & SECURITY ENFORCEMENT:
-- Direct client mutations (INSERT, UPDATE, DELETE) are strictly forbidden for authenticated users.
-- All template encryptions, enrollments, replacements, and revocations are performed
-- exclusively by server Route Handlers using the server-side service-role key.

-- ------------------------------------------------------------------------------
-- 3. EXPAND SECURITY_EVENTS EVENT TYPES
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'security_events_event_type_check' 
    AND table_name = 'security_events'
  ) THEN
    ALTER TABLE security_events DROP CONSTRAINT security_events_event_type_check;
    ALTER TABLE security_events ADD CONSTRAINT security_events_event_type_check CHECK (
      event_type IN (
        'EXPIRED_QR',
        'INVALID_QR',
        'DUPLICATE_ATTENDANCE',
        'NETWORK_MISMATCH',
        'UNAUTHORIZED_ACCESS',
        'DEVICE_MISMATCH',
        'LOCATION_MISMATCH',
        'ATTENDANCE_CORRECTION',
        'BIOMETRIC_ENROLLED',
        'BIOMETRIC_VERIFIED',
        'BIOMETRIC_MISMATCH',
        'BIOMETRIC_INCONCLUSIVE',
        'BIOMETRIC_REVOKED'
      )
    );
  END IF;
END $$;
