import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { startAttendanceSession } from '@/lib/attendance/session-service';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';

describe('Phase 3 Security Suite: Database Integrity & Historical Data Retention (Problem D, Problem H)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Historical Attendance Record & Session Deletion Protection (Problem D)', () => {
    it('verifies migration 006 enforces deletion guards across records, sessions, and classes', () => {
      const migrationPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '006_data_retention_and_relational_integrity.sql'
      );
      const sqlContent = readFileSync(migrationPath, 'utf-8');

      // 1. Asserts hard deletion prevention on attendance records
      expect(sqlContent).toContain('prevent_historical_attendance_deletion()');
      expect(sqlContent).toContain('BEFORE DELETE ON public.attendance_records');

      // 2. Asserts hard deletion prevention on sessions with records
      expect(sqlContent).toContain('prevent_session_hard_deletion_with_records()');
      expect(sqlContent).toContain('BEFORE DELETE ON public.attendance_sessions');

      // 3. Asserts hard deletion prevention on classes with sessions
      expect(sqlContent).toContain('prevent_class_hard_deletion_with_sessions()');
      expect(sqlContent).toContain('BEFORE DELETE ON public.classes');
    });
  });

  describe('2. Cross-Teacher Session Ownership Verification (Problem H)', () => {
    it('verifies migration 006 enforces session-class teacher ownership matching in PostgreSQL', () => {
      const migrationPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '006_data_retention_and_relational_integrity.sql'
      );
      const sqlContent = readFileSync(migrationPath, 'utf-8');

      expect(sqlContent).toContain('verify_session_teacher_ownership()');
      expect(sqlContent).toContain('v_class_teacher_id <> NEW.teacher_id');
      expect(sqlContent).toContain('unique_class_teacher_ownership');
      expect(sqlContent).toContain('BEFORE INSERT OR UPDATE OF class_id, teacher_id ON public.attendance_sessions');
    });

    it('rejects teacher attempting to start attendance session for a class owned by another teacher', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'class-1',
              code: 'CS101',
              name: 'Intro to CS',
              teacher_id: 'legitimate-owner-teacher-uuid',
              is_archived: false,
            },
            error: null,
          }),
        }),
      };

      await expect(
        startAttendanceSession({
          teacherId: 'attacker-teacher-uuid', // Mismatch!
          classId: 'class-1',
          client: mockSupabase as any,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('3. Archival Lifecycle & Session Inactive Enforcement', () => {
    it('blocks starting an attendance session for an archived course with 409 Conflict', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'class-archived',
              code: 'MATH200',
              name: 'Calculus Past',
              teacher_id: 'teacher-owner-uuid',
              is_archived: true, // Archived!
            },
            error: null,
          }),
        }),
      };

      await expect(
        startAttendanceSession({
          teacherId: 'teacher-owner-uuid',
          classId: 'class-archived',
          client: mockSupabase as any,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('4. Enrollment & Attendance Uniqueness Constraints', () => {
    it('verifies unique_class_student_enrollment constraint exists in schema', () => {
      const schemaPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '001_initial_schema.sql'
      );
      const sqlContent = readFileSync(schemaPath, 'utf-8');

      expect(sqlContent).toContain('CONSTRAINT unique_class_student_enrollment UNIQUE (class_id, student_id)');
    });

    it('verifies unique_session_student_attendance constraint exists in schema', () => {
      const schemaPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '001_initial_schema.sql'
      );
      const sqlContent = readFileSync(schemaPath, 'utf-8');

      expect(sqlContent).toContain('CONSTRAINT unique_session_student_attendance UNIQUE (session_id, student_id)');
    });
  });
});
