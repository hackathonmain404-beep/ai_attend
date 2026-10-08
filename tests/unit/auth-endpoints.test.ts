import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import * as serverSupabase from '@/lib/supabase/server';

describe('Backend Authentication System API (POST /api/auth/*)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('rejects invalid email formats with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notanemail', password: 'password123' }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid credentials with HTTP 401', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Invalid academic credentials' },
          }),
        },
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'unknown@university.edu', password: 'wrongpassword' }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('successfully authenticates valid academic student persona', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: { id: '00000000-0000-0000-0000-000000000002', email: 'jane.doe@university.edu' },
              session: { access_token: 'mock-session-token' },
            },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: '00000000-0000-0000-0000-000000000002',
              email: 'jane.doe@university.edu',
              full_name: 'Jane Doe',
              role: 'student',
              identifier: 'STU-2026-001',
            },
            error: null,
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jane.doe@university.edu', password: 'student123' }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('jane.doe@university.edu');
      expect(json.data.role).toBe('student');
    });

    it('successfully authenticates faculty professor persona', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: { id: '00000000-0000-0000-0000-000000000001', email: 'prof.turing@university.edu' },
              session: { access_token: 'mock-session-token' },
            },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: '00000000-0000-0000-0000-000000000001',
              email: 'prof.turing@university.edu',
              full_name: 'Prof. Alan Turing',
              role: 'teacher',
              identifier: 'FAC-2026-001',
            },
            error: null,
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'prof.turing@university.edu', password: 'teacher123' }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('prof.turing@university.edu');
      expect(json.data.role).toBe('teacher');
    });
  });

  describe('POST /api/auth/signup', () => {
    it('validates required fields during registration', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@university.edu' }),
      });

      const res = await signupHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('provisions valid new registration request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: {
              user: { id: 'new-user-123', email: 'new.student@university.edu' },
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
          email: 'new.student@university.edu',
          password: 'securepassword123',
          fullName: 'New Student',
          role: 'student',
          identifier: 'STU-2026-999',
        }),
      });

      const res = await signupHandler(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('new.student@university.edu');
      expect(json.data.role).toBe('student');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears session cookies and confirms sign out', async () => {
      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockResolvedValue({ error: null }),
        },
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const res = await logoutHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.message).toBeDefined();
    });
  });
});
