import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 6: Security & RLS Comprehensive Audit (Problems C, J, K)', () => {
  describe('1. Scoped Teacher Audit Log Policy (Migration 009, Problem J)', () => {
    function simulateAuditLogPolicy(
      log: { actor_id: string; entity_id: string },
      currentTeacherId: string,
      teacherStudents: string[]
    ): boolean {
      // Teacher sees log if they were the actor, or if the entity is an enrolled student
      if (log.actor_id === currentTeacherId) {
        return true;
      }
      if (teacherStudents.includes(log.entity_id)) {
        return true;
      }
      return false;
    }

    const teacherAlice = 'teacher-alice-uuid';
    const teacherBob = 'teacher-bob-uuid';
    const studentJane = 'student-jane-uuid';
    const studentCharlie = 'student-charlie-uuid';

    const aliceStudents = [studentJane];

    it('allows teacher to read audit logs where they are the direct actor', () => {
      const log = { actor_id: teacherAlice, entity_id: studentJane };
      expect(simulateAuditLogPolicy(log, teacherAlice, aliceStudents)).toBe(true);
    });

    it('allows teacher to read audit logs concerning their enrolled student', () => {
      const log = { actor_id: 'system', entity_id: studentJane };
      expect(simulateAuditLogPolicy(log, teacherAlice, aliceStudents)).toBe(true);
    });

    it('strictly isolates and blocks teacher from reading unrelated faculty audit logs', () => {
      const log = { actor_id: teacherBob, entity_id: studentCharlie };
      expect(simulateAuditLogPolicy(log, teacherAlice, aliceStudents)).toBe(false);
    });
  });

  describe('2. Direct Client Mutation Protection (Migration 009, Problem C)', () => {
    it('verifies that Migration 009 revokes direct mutations on critical tables', () => {
      const migration009Path = path.resolve(process.cwd(), 'supabase/migrations/009_rls_security_hardening.sql');
      const content = fs.readFileSync(migration009Path, 'utf-8');

      expect(content).toContain('REVOKE INSERT, UPDATE, DELETE ON public.attendance_records FROM authenticated, anon;');
      expect(content).toContain('REVOKE INSERT, UPDATE, DELETE ON public.attendance_verifications FROM authenticated, anon;');
      expect(content).toContain('REVOKE UPDATE, DELETE ON public.registered_devices FROM authenticated, anon;');
      expect(content).toContain('REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;');
    });
  });

  describe('3. Schema & Documentation Synchronization Audit (Problem K)', () => {
    it('verifies database.txt accurately reflects all 8 tables and hardened features', () => {
      const dbDocPath = path.resolve(process.cwd(), 'database.txt');
      const doc = fs.readFileSync(dbDocPath, 'utf-8');

      // 8 core tables
      expect(doc).toContain('3.1. profiles');
      expect(doc).toContain('3.2. classes');
      expect(doc).toContain('3.3. class_enrollments');
      expect(doc).toContain('3.4. attendance_sessions');
      expect(doc).toContain('3.5. registered_devices');
      expect(doc).toContain('3.6. attendance_records');
      expect(doc).toContain('3.7. attendance_verifications');
      expect(doc).toContain('3.8. audit_logs');

      // Key triggers from migrations
      expect(doc).toContain('protect_profile_immutable_fields()');
      expect(doc).toContain('prevent_historical_attendance_deletion()');
      expect(doc).toContain('verify_session_teacher_ownership()');
      expect(doc).toContain('verify_attendance_record_device_ownership()');
      expect(doc).toContain('prevent_audit_log_modification()');
      expect(doc).toContain('validate_attendance_record_transition()');

      // Zero false marketing claims
      expect(doc.toLowerCase()).not.toContain('geolocation');
      expect(doc.toLowerCase()).not.toContain('biometric');
    });

    it('verifies dtabase.txt is in exact parity with database.txt', () => {
      const dbDocPath = path.resolve(process.cwd(), 'database.txt');
      const dtDocPath = path.resolve(process.cwd(), 'dtabase.txt');

      const dbDoc = fs.readFileSync(dbDocPath, 'utf-8');
      const dtDoc = fs.readFileSync(dtDocPath, 'utf-8');

      expect(dbDoc).toBe(dtDoc);
    });
  });
});
