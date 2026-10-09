-- ==============================================================================
-- AttendGuard Migration 006: Data Retention & Relational Integrity
-- Replaces destructive cascades with archival flags, protects historical
-- attendance records from hard deletion, and enforces session-teacher ownership.
-- ==============================================================================

-- 1. Add Archival and Deactivation Columns
ALTER TABLE public.classes 
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.attendance_sessions 
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ NULL;

-- 2. Add Composite Unique Constraint on classes(id, teacher_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_class_teacher_ownership'
  ) THEN
    ALTER TABLE public.classes 
      ADD CONSTRAINT unique_class_teacher_ownership UNIQUE (id, teacher_id);
  END IF;
END $$;

-- 3. Trigger Function: Verify Session Teacher Ownership (Problem H)
-- Guarantees at the database level that an attendance session cannot reference a class
-- owned by a different instructor.
CREATE OR REPLACE FUNCTION public.verify_session_teacher_ownership()
RETURNS TRIGGER AS $$
DECLARE
  v_class_teacher_id UUID;
  v_is_archived BOOLEAN;
BEGIN
  SELECT teacher_id, is_archived INTO v_class_teacher_id, v_is_archived 
  FROM public.classes 
  WHERE id = NEW.class_id;

  IF v_class_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Referenced class (ID: %) does not exist.', NEW.class_id
      USING ERRCODE = '23503';
  END IF;

  IF v_class_teacher_id <> NEW.teacher_id THEN
    RAISE EXCEPTION 'Session teacher_id (%) does not match class owner (%). Cross-teacher session creation is prohibited.',
      NEW.teacher_id, v_class_teacher_id
      USING ERRCODE = '42501';
  END IF;

  IF v_is_archived THEN
    RAISE EXCEPTION 'Cannot start attendance sessions for an archived class (ID: %).', NEW.class_id
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verify_session_teacher_ownership ON public.attendance_sessions;

CREATE TRIGGER trigger_verify_session_teacher_ownership
  BEFORE INSERT OR UPDATE OF class_id, teacher_id ON public.attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_session_teacher_ownership();

-- 4. Trigger Function: Prevent Hard Deletion of Historical Records (Problem D)
-- Protects attendance records and verification evidence from accidental hard deletes.
CREATE OR REPLACE FUNCTION public.prevent_historical_attendance_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Hard deletion of verified attendance records is strictly prohibited by institutional policy. Retain records or flag as archived.'
    USING ERRCODE = '23503';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_attendance_records_deletion ON public.attendance_records;

CREATE TRIGGER trigger_prevent_attendance_records_deletion
  BEFORE DELETE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_historical_attendance_deletion();

-- 5. Trigger Function: Prevent Hard Deletion of Sessions with Attendance History
CREATE OR REPLACE FUNCTION public.prevent_session_hard_deletion_with_records()
RETURNS TRIGGER AS $$
DECLARE
  v_record_count INT;
BEGIN
  SELECT COUNT(*) INTO v_record_count 
  FROM public.attendance_records 
  WHERE session_id = OLD.id;

  IF v_record_count > 0 THEN
    RAISE EXCEPTION 'Attendance session % possesses % verified attendance records. Hard deletion is forbidden; mark session as ended and archived.',
      OLD.id, v_record_count
      USING ERRCODE = '23503';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_session_hard_deletion ON public.attendance_sessions;

CREATE TRIGGER trigger_prevent_session_hard_deletion
  BEFORE DELETE ON public.attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_session_hard_deletion_with_records();

-- 6. Trigger Function: Prevent Hard Deletion of Classes with Sessions
CREATE OR REPLACE FUNCTION public.prevent_class_hard_deletion_with_sessions()
RETURNS TRIGGER AS $$
DECLARE
  v_session_count INT;
BEGIN
  SELECT COUNT(*) INTO v_session_count 
  FROM public.attendance_sessions 
  WHERE class_id = OLD.id;

  IF v_session_count > 0 THEN
    RAISE EXCEPTION 'Class % possesses % attendance sessions. Hard deletion is forbidden; set is_archived = true instead.',
      OLD.id, v_session_count
      USING ERRCODE = '23503';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_class_hard_deletion ON public.classes;

CREATE TRIGGER trigger_prevent_class_hard_deletion
  BEFORE DELETE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_class_hard_deletion_with_sessions();
