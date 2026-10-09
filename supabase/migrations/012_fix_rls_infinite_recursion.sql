-- ==============================================================================
-- Migration 012: Fix RLS Policy Circular Recursion on class_enrollments & classes
-- ==============================================================================
-- Eliminates "infinite recursion detected in policy for relation 'class_enrollments'"
-- by introducing SECURITY DEFINER helper functions that break cyclic RLS evaluation
-- between public.class_enrollments, public.classes, public.profiles, and public.registered_devices.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper Security Functions (SECURITY DEFINER bypasses RLS in subqueries)
-- ------------------------------------------------------------------------------

-- Check if student is enrolled in a class (avoids evaluating class_enrollments RLS)
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

-- Check if teacher teaches a class (avoids evaluating classes RLS)
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

-- Check if student is in any class taught by teacher (avoids evaluating both classes & class_enrollments RLS)
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

-- ------------------------------------------------------------------------------
-- 2. Update PROFILES RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can read student profiles in their classes" ON public.profiles;
CREATE POLICY "Teachers can read student profiles in their classes" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  public.auth_is_teacher() AND public.is_student_in_teacher_classes(id, auth.uid())
);

-- ------------------------------------------------------------------------------
-- 3. Update CLASSES RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can read enrolled classes" ON public.classes;
CREATE POLICY "Students can read enrolled classes" 
ON public.classes FOR SELECT 
TO authenticated 
USING (
  public.is_student_enrolled_in_class(id, auth.uid())
);

-- ------------------------------------------------------------------------------
-- 4. Update CLASS_ENROLLMENTS RLS
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. Update ATTENDANCE_SESSIONS RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Enrolled students can read active sessions" ON public.attendance_sessions;
CREATE POLICY "Enrolled students can read active sessions" 
ON public.attendance_sessions FOR SELECT 
TO authenticated 
USING (
  public.is_student_enrolled_in_class(class_id, auth.uid())
);

-- ------------------------------------------------------------------------------
-- 6. Update REGISTERED_DEVICES RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can view devices of students in their classes" ON public.registered_devices;
CREATE POLICY "Teachers can view devices of students in their classes" 
ON public.registered_devices FOR SELECT 
TO authenticated 
USING (
  public.auth_is_teacher() AND public.is_student_in_teacher_classes(student_id, auth.uid())
);

-- ------------------------------------------------------------------------------
-- 7. Update AUDIT_LOGS RLS
-- ------------------------------------------------------------------------------
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
