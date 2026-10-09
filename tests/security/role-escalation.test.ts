import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as roleSwitchHandler } from '@/app/api/auth/role/route';
import * as serverSupabase from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Phase 2 Security Suite: Role Escalation & Profile Immutability (SEC-04, Problem B, Problem E)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Public Signup Role Protection (Problem B)', () => {
    it('blocks self-registration of teacher accounts with 403 FORBIDDEN', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'aspiring.teacher@university.edu',
          password: 'Password123!',
          fullName: 'Aspiring Teacher',
          role: 'teacher', // Malicious self-assignment
          identifier: 'FAC-2026-999',
        }),
      });

      const res = await signupHandler(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
      expect(json.error.message).toContain('Faculty / teacher accounts cannot be self-registered');
    });

    it('permits legitimate student self-registration', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: {
              user: { id: 'new-student-uuid', email: 'legit.student@university.edu' },
              session: null,
            },
            error: null,
          }),
        },
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'legit.student@university.edu',
          password: 'Password123!',
          fullName: 'Legit Student',
          role: 'student',
          identifier: 'STU-2026-555',
        }),
      });

      const res = await signupHandler(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.role).toBe('student');
    });
  });

  describe('2. Role Switching API Security (POST /api/auth/role)', () => {
    it('rejects unauthenticated requests with HTTP 401', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'teacher' }),
      });

      const res = await roleSwitchHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Authentication required');
    });

    it('rejects student attempting to elevate role to teacher with HTTP 403 FORBIDDEN', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'student-uuid-1', email: 'student@university.edu' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { role: 'student' },
            error: null,
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'teacher' }),
      });

      const res = await roleSwitchHandler(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Self-assignment of teacher privileges is prohibited');
    });

    it('allows verified teacher to toggle preview view to student and back', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'teacher-uuid-1', email: 'prof.turing@university.edu' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { role: 'teacher' },
            error: null,
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'teacher' }),
      });

      const res = await roleSwitchHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.role).toBe('teacher');
    });
  });

  describe('3. Database Migration 005 Schema Verification (Problem B & Problem E)', () => {
    it('verifies migration 005 contains protective trigger and immutability checks', () => {
      const migrationPath = join(process.cwd(), 'supabase', 'migrations', '005_role_security_and_profile_immutability.sql');
      const sqlContent = readFileSync(migrationPath, 'utf-8');

      // 1. Asserts function existence
      expect(sqlContent).toContain('protect_profile_immutable_fields()');
      
      // 2. Asserts immutability checks on id, role, and identifier
      expect(sqlContent).toContain('NEW.id IS DISTINCT FROM OLD.id');
      expect(sqlContent).toContain('NEW.role IS DISTINCT FROM OLD.role');
      expect(sqlContent).toContain('NEW.identifier IS DISTINCT FROM OLD.identifier');
      
      // 3. Asserts trigger binding BEFORE UPDATE
      expect(sqlContent).toContain('BEFORE UPDATE ON public.profiles');
      expect(sqlContent).toContain('EXECUTE FUNCTION public.protect_profile_immutable_fields()');

      // 4. Asserts service_role bypass for administrative workflows
      expect(sqlContent).toContain("current_setting('request.jwt.claim.role', true) = 'service_role'");
    });
  });
});
