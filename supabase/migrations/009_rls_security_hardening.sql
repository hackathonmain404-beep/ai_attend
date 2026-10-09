-- ==============================================================================
-- Migration 009: Row Level Security (RLS) Hardening & Scoped Audit Isolation
-- Conforms to Problem C & Problem J Remediation in docs/ROOT-CAUSE-REPORT.md.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCOPED AUDIT LOG READ ACCESS FOR TEACHERS
-- Restricts teachers from viewing the entire institution's audit logs.
-- Teachers may only view audit logs where:
-- (a) They were the direct actor (actor_id = auth.uid()), OR
-- (b) The event concerns a student currently enrolled in one of their classes.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Teachers can read scoped audit logs" ON public.audit_logs;

CREATE POLICY "Teachers can read scoped audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (
    auth_is_teacher() AND (
        actor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.class_enrollments ce
            JOIN public.classes c ON ce.class_id = c.id
            WHERE c.teacher_id = auth.uid() 
            AND ce.student_id::text = audit_logs.entity_id
        )
    )
);

-- ------------------------------------------------------------------------------
-- 2. CONFIRM DIRECT CLIENT MUTATION BLOCKS ACROSS CRITICAL TABLES
-- Ensure that client roles (authenticated and anon) cannot execute direct
-- INSERT, UPDATE, or DELETE on tamper-evident tables. All mutations must flow
-- through backend Route Handlers with the service_role key.
-- ------------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.attendance_records FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.attendance_verifications FROM authenticated, anon;
REVOKE UPDATE, DELETE ON public.registered_devices FROM authenticated, anon;
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;
