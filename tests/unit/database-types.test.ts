import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { UserRole, SessionStatus, AttendanceStatus, AttendanceRecord } from '@/types/database';

describe('Database Schema & Type Invariants (Phase 1)', () => {
  it('should verify migration files exist and contain core tables', () => {
    const migration1Path = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql');
    const migration2Path = path.resolve(__dirname, '../../supabase/migrations/002_rls_policies.sql');
    const migration3Path = path.resolve(__dirname, '../../supabase/migrations/003_performance_indexes.sql');
    const seedPath = path.resolve(__dirname, '../../supabase/seed.sql');

    expect(fs.existsSync(migration1Path)).toBe(true);
    expect(fs.existsSync(migration2Path)).toBe(true);
    expect(fs.existsSync(migration3Path)).toBe(true);
    expect(fs.existsSync(seedPath)).toBe(true);

    const schemaSql = fs.readFileSync(migration1Path, 'utf-8');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS profiles');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS classes');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS class_enrollments');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS attendance_sessions');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS registered_devices');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS attendance_records');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS attendance_verifications');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS audit_logs');
  });

  it('should verify critical database constraints in Migration 001', () => {
    const migration1Path = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql');
    const schemaSql = fs.readFileSync(migration1Path, 'utf-8');

    // Anti-duplicate composite unique constraint
    expect(schemaSql).toContain('CONSTRAINT unique_session_student_attendance UNIQUE (session_id, student_id)');

    // Single active device partial unique index
    expect(schemaSql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_device_per_student');
    expect(schemaSql).toContain('WHERE is_active = true');

    // Unique enrollment constraint
    expect(schemaSql).toContain('CONSTRAINT unique_class_student_enrollment UNIQUE (class_id, student_id)');
  });

  it('should verify RLS policies in Migration 002 block direct client attendance insertion', () => {
    const migration2Path = path.resolve(__dirname, '../../supabase/migrations/002_rls_policies.sql');
    const rlsSql = fs.readFileSync(migration2Path, 'utf-8');

    // RLS enabled on all critical tables
    expect(rlsSql).toContain('ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;');
    expect(rlsSql).toContain('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;');
    expect(rlsSql).toContain('ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;');

    // Attendance records only allows SELECT for students
    expect(rlsSql).toContain('CREATE POLICY "Students can read own attendance records"');
    // Ensure no client insert policy is granted on attendance_records
    expect(rlsSql).not.toContain('ON attendance_records FOR INSERT TO authenticated');
  });

  it('should construct valid typed AttendanceRecord object without TypeScript errors', () => {
    const record: AttendanceRecord = {
      id: '00000000-0000-0000-0000-000000000001',
      sessionId: '44444444-4444-4444-4444-444444444441',
      studentId: '00000000-0000-0000-0000-000000000002',
      deviceId: '33333333-3333-3333-3333-333333333331',
      status: 'present',
      checkInTime: new Date().toISOString(),
      reVerified: false,
      reVerifiedAt: null,
      createdAt: new Date().toISOString(),
    };

    expect(record.status).toBe('present');
    expect(record.reVerified).toBe(false);

    const reviewRecord: AttendanceRecord = {
      ...record,
      status: 'review_required',
    };
    expect(reviewRecord.status).toBe('review_required');
  });

  it('should verify Migration 011 defines review_required status and lifecycle constraint', () => {
    const migration11Path = path.resolve(__dirname, '../../supabase/migrations/011_attendance_review_status.sql');
    expect(fs.existsSync(migration11Path)).toBe(true);

    const sql = fs.readFileSync(migration11Path, 'utf-8');
    expect(sql).toContain("review_required");
    expect(sql).toContain("chk_attendance_record_lifecycle");
    expect(sql).toContain("trg_validate_attendance_record_transition");
  });
});
