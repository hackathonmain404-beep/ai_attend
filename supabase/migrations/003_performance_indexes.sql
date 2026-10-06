-- ==============================================================================
-- AttendGuard Migration 003: Performance & Integrity Indexes
-- Optimizes high-throughput attendance lookups and live headcount counting.
-- ==============================================================================

-- 1. Classes & Enrollments Lookups
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id 
ON classes (teacher_id);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id 
ON class_enrollments (student_id);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id 
ON class_enrollments (class_id);

-- 2. Fast Active Session Queries
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_status 
ON attendance_sessions (class_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_status 
ON attendance_sessions (teacher_id, status);

-- 3. Live Headcount & Student Attendance Aggregations
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id 
ON attendance_records (session_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id 
ON attendance_records (student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student_session 
ON attendance_records (student_id, session_id);

-- 4. Device Fingerprint Resolution
CREATE INDEX IF NOT EXISTS idx_registered_devices_fingerprint 
ON registered_devices (device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_registered_devices_student_active 
ON registered_devices (student_id, is_active);

-- 5. Forensics & Audit Queries
CREATE INDEX IF NOT EXISTS idx_attendance_verifications_session_id 
ON attendance_verifications (session_id);

CREATE INDEX IF NOT EXISTS idx_attendance_verifications_student_id 
ON attendance_verifications (student_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id 
ON audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs (created_at DESC);
