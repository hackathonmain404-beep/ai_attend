import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';

describe('Backend Authentication System API (POST /api/auth/*)', () => {
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
