-- ==============================================================================
-- AttendGuard Migration 002: Row Level Security (RLS) Policies
-- Enforces data isolation between students, teachers, and service-role operations.
-- ==============================================================================

-- Enable RLS across all 8 tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Helper Security Functions
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_is_teacher() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- 1. PROFILES RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Teachers can read student profiles in their classes" ON profiles;
CREATE POLICY "Teachers can read student profiles in their classes" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  auth_is_teacher() AND EXISTS (
    SELECT 1 FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.student_id = profiles.id AND c.teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. CLASSES RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can read own classes" ON classes;
CREATE POLICY "Teachers can read own classes" 
ON classes FOR SELECT 
TO authenticated 
USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students can read enrolled classes" ON classes;
CREATE POLICY "Students can read enrolled classes" 
ON classes FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments 
    WHERE class_id = classes.id AND student_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can insert classes" ON classes;
CREATE POLICY "Teachers can insert classes" 
ON classes FOR INSERT 
TO authenticated 
WITH CHECK (teacher_id = auth.uid() AND auth_is_teacher());

DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
CREATE POLICY "Teachers can update own classes" 
ON classes FOR UPDATE 
TO authenticated 
USING (teacher_id = auth.uid() AND auth_is_teacher())
WITH CHECK (teacher_id = auth.uid() AND auth_is_teacher());

-- ------------------------------------------------------------------------------
-- 3. CLASS_ENROLLMENTS RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can read own enrollments" ON class_enrollments;
CREATE POLICY "Students can read own enrollments" 
ON class_enrollments FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can read enrollments for their classes" ON class_enrollments;
CREATE POLICY "Teachers can read enrollments for their classes" 
ON class_enrollments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_enrollments.class_id AND classes.teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can manage enrollments for their classes" ON class_enrollments;
CREATE POLICY "Teachers can manage enrollments for their classes" 
ON class_enrollments FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_enrollments.class_id AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_enrollments.class_id AND classes.teacher_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 4. ATTENDANCE_SESSIONS RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage sessions for own classes" ON attendance_sessions;
CREATE POLICY "Teachers can manage sessions for own classes" 
ON attendance_sessions FOR ALL 
TO authenticated 
USING (teacher_id = auth.uid() AND auth_is_teacher())
WITH CHECK (teacher_id = auth.uid() AND auth_is_teacher());

DROP POLICY IF EXISTS "Enrolled students can read active sessions" ON attendance_sessions;
CREATE POLICY "Enrolled students can read active sessions" 
ON attendance_sessions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments 
    WHERE class_id = attendance_sessions.class_id AND student_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 5. REGISTERED_DEVICES RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can view own registered devices" ON registered_devices;
CREATE POLICY "Students can view own registered devices" 
ON registered_devices FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view devices of students in their classes" ON registered_devices;
CREATE POLICY "Teachers can view devices of students in their classes" 
ON registered_devices FOR SELECT 
TO authenticated 
USING (
  auth_is_teacher() AND EXISTS (
    SELECT 1 FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.student_id = registered_devices.student_id AND c.teacher_id = auth.uid()
  )
);

-- Students may register a device only if they have no currently active device
DROP POLICY IF EXISTS "Students can register initial device" ON registered_devices;
CREATE POLICY "Students can register initial device" 
ON registered_devices FOR INSERT 
TO authenticated 
WITH CHECK (
  student_id = auth.uid() AND 
  NOT EXISTS (
    SELECT 1 FROM registered_devices 
    WHERE student_id = auth.uid() AND is_active = true
  )
);

-- ------------------------------------------------------------------------------
-- 6. ATTENDANCE_RECORDS RLS
-- CRITICAL SECURITY RULE: Clients cannot INSERT or UPDATE attendance directly!
-- Only server Route Handlers via service-role can create or mutate attendance.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can read own attendance records" ON attendance_records;
CREATE POLICY "Students can read own attendance records" 
ON attendance_records FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can read attendance records for their sessions" ON attendance_records;
CREATE POLICY "Teachers can read attendance records for their sessions" 
ON attendance_records FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions s
    WHERE s.id = attendance_records.session_id AND s.teacher_id = auth.uid()
  )
);

-- Direct client writes are blocked (No INSERT/UPDATE/DELETE policy for authenticated role)
-- Service-role bypasses RLS and writes authenticated records.

-- ------------------------------------------------------------------------------
-- 7. ATTENDANCE_VERIFICATIONS RLS
-- Forensic attempt logs: Read-only for authorized actors, append-only via service role
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can read verification logs for their sessions" ON attendance_verifications;
CREATE POLICY "Teachers can read verification logs for their sessions" 
ON attendance_verifications FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions s
    WHERE s.id = attendance_verifications.session_id AND s.teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can read own verification attempts" ON attendance_verifications;
CREATE POLICY "Students can read own verification attempts" 
ON attendance_verifications FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. AUDIT_LOGS RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can read audit logs" ON audit_logs;
CREATE POLICY "Teachers can read audit logs" 
ON audit_logs FOR SELECT 
TO authenticated 
USING (auth_is_teacher());
