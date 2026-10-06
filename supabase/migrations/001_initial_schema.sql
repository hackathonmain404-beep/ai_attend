-- ==============================================================================
-- AttendGuard Migration 001: Initial Relational Schema
-- Core tables, constraints, foreign keys, and integrity enums.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES
-- Extended user profile linked 1:1 with Supabase auth.users.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    identifier TEXT NOT NULL UNIQUE, -- Roll Number for students, Faculty ID for teachers
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. CLASSES
-- Course management entity owned by a teacher.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    schedule TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. CLASS_ENROLLMENTS
-- Junction table mapping students to enrolled courses.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_class_student_enrollment UNIQUE (class_id, student_id)
);

-- ------------------------------------------------------------------------------
-- 4. ATTENDANCE_SESSIONS
-- Teacher-hosted live attendance events.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 're_verifying', 'ended')) DEFAULT 'active',
    qr_rotation_interval_sec INTEGER NOT NULL DEFAULT 20,
    active_token_hash TEXT NULL,
    token_expires_at TIMESTAMPTZ NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ NULL
);

-- ------------------------------------------------------------------------------
-- 5. REGISTERED_DEVICES
-- Trusted client hardware/browser fingerprints bound to student accounts.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registered_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT NOT NULL,
    user_agent TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce maximum of ONE active registered device per student account
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_device_per_student 
ON registered_devices (student_id) 
WHERE is_active = true;

-- ------------------------------------------------------------------------------
-- 6. ATTENDANCE_RECORDS
-- Authoritative attendance ledger.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES registered_devices(id),
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 're_verify_failed')) DEFAULT 'present',
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    re_verified BOOLEAN NOT NULL DEFAULT false,
    re_verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- CRITICAL ANTI-FRAUD INVARIANT: A student can have at most one record per session
    CONSTRAINT unique_session_student_attendance UNIQUE (session_id, student_id)
);

-- ------------------------------------------------------------------------------
-- 7. ATTENDANCE_VERIFICATIONS
-- Audit log of all verification attempts (successful or rejected).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('initial_qr', 're_verify_challenge')),
    status TEXT NOT NULL CHECK (status IN ('success', 'expired', 'invalid', 'duplicate', 'device_mismatch')),
    token_used TEXT NULL,
    ip_address TEXT NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. AUDIT_LOGS
-- Append-only tamper-evident administrative log.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
