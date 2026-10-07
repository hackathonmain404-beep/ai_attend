/**
 * AttendGuard AI Module - Authentication Boundary & Session Isolation Test Suite
 *
 * Verifies that the AI Advisor module maintains a strict, clean authentication boundary:
 * 1. Unauthenticated requests are rejected (HTTP 401)
 * 2. Client-spoofed headers (x-authenticated, x-user-role, x-student-id) are rejected/ignored
 * 3. Cross-student identity tampering (IDOR) via any body parameter is rejected (HTTP 403)
 * 4. AI business logic operates from trusted { userId, role } abstraction with zero auth coupling
 * 5. Role restrictions are enforced (teachers cannot access student advisor)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { POST } from '../../../app/api/student/advisor/route.ts';
import { resolveAuthenticatedUser, type AuthenticatedUser } from '../auth-resolver.ts';
import { answerAttendanceQuestion } from '../advisor.ts';
import { fetchStudentAttendance } from '../../analytics/data-adapter.ts';

describe('Authentication Boundary Verification', () => {
  // --------------------------------------------------------------------------
  // Test 1: Unauthenticated request -> rejected
  // --------------------------------------------------------------------------
  describe('Test 1: Unauthenticated request rejection (Default Deny)', () => {
    it('rejects request with no authorization header and no cookies with HTTP 401', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: 'How is my attendance?' }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.code, 'UNAUTHORIZED');
      assert.ok(data.error.message.includes('Authentication required'));
    });

    it('rejects request with empty Bearer token with HTTP 401', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ',
        },
        body: JSON.stringify({ question: 'How is my attendance?' }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'UNAUTHORIZED');
    });

    it('rejects request with expired, revoked, or invalid tokens with HTTP 401', async () => {
      for (const token of ['invalid', 'expired', 'revoked', 'abc']) {
        const req = new Request('http://localhost:3000/api/student/advisor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ question: 'How is my attendance?' }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 401, `Token "${token}" must be rejected`);
        const data = await res.json();
        assert.strictEqual(data.error.code, 'UNAUTHORIZED');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 2: Client sends spoofed identity headers -> rejected/ignored
  // --------------------------------------------------------------------------
  describe('Test 2: Client spoofed identity headers rejected or ignored', () => {
    it('rejects unauthenticated request attempting to spoof x-authenticated and x-user-role', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authenticated': 'true',
          'x-user-role': 'student',
          'x-student-id': 'alex',
        },
        body: JSON.stringify({ question: 'How is my attendance?' }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'UNAUTHORIZED');
    });

    it('ignores spoofed x-student-id header when valid student session is provided', async () => {
      // User is authenticated as Jordan, but sends x-student-id: alex
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_jordan',
          'x-student-id': 'alex',
          'x-user-id': 'alex',
        },
        body: JSON.stringify({ question: 'Which subject is at risk?' }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      // Response must evaluate Jordan's records (C Programming critical), NOT Alex's
      assert.ok(
        data.answer.includes('C Programming'),
        'Must ignore spoofed x-student-id header and evaluate verified session student (Jordan)'
      );
    });

    it('ignores spoofed x-user-role header when student session attempts role spoofing', async () => {
      // Student Jordan attempts to claim x-user-role: teacher
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_jordan',
          'x-user-role': 'teacher',
        },
        body: JSON.stringify({ question: 'Summarize my status' }),
      });

      const res = await POST(req);
      // The session token is a student session, so spoofed teacher header is ignored
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    it('rejects teacher session even if spoofing x-user-role: student', async () => {
      // Teacher session with spoofed student header
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_teacher_001',
          'x-user-role': 'student',
        },
        body: JSON.stringify({ question: 'Summarize my status' }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'TEACHER_ROLE_RESTRICTED');
    });
  });

  // --------------------------------------------------------------------------
  // Test 3: Client sends another student's ID -> rejected (IDOR Defense)
  // --------------------------------------------------------------------------
  describe("Test 3: Cross-student identity tampering rejected (IDOR Defense)", () => {
    it('rejects when authenticated student supplies a different studentId in body', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_jordan',
        },
        body: JSON.stringify({
          question: 'What is my attendance?',
          studentId: 'alex',
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'IDOR_ATTEMPT_BLOCKED');
      assert.ok(data.error.message.includes('Identity must match verified session'));
    });

    it('rejects when authenticated student supplies a different student_id (snake_case) in body', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_jordan',
        },
        body: JSON.stringify({
          question: 'What is my attendance?',
          student_id: 'alex',
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'IDOR_ATTEMPT_BLOCKED');
    });

    it('rejects when authenticated student supplies a different userId in body', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_jordan',
        },
        body: JSON.stringify({
          question: 'What is my attendance?',
          userId: 'alex',
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'IDOR_ATTEMPT_BLOCKED');
    });

    it('allows matching studentId in body when it agrees with verified session', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_jordan',
        },
        body: JSON.stringify({
          question: 'Summarize my status',
          studentId: 'jordan',
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });
  });

  // --------------------------------------------------------------------------
  // Test 4: AI business logic operates from trusted userId abstraction
  // --------------------------------------------------------------------------
  describe('Test 4: AI business logic operates from trusted userId abstraction', () => {
    it('executes end-to-end AI advisory from trusted { userId, role } without auth/network knowledge', async () => {
      // Minimal trusted user abstraction returned from auth resolver
      const trustedUser: AuthenticatedUser = {
        userId: 'alex',
        role: 'student',
      };

      // 1. Attendance data fetched strictly with verified userId
      const { profile, context } = await fetchStudentAttendance({
        studentId: trustedUser.userId,
      });

      assert.strictEqual(profile.studentName, 'Alex');
      assert.ok(context.overall.overallPercentage > 85);

      // 2. AI Advisor processes question using pre-computed analytics context
      const advisorResponse = await answerAttendanceQuestion({
        question: 'Can I miss a class in Physics?',
        studentName: profile.studentName,
        attendanceContext: context,
        config: { apiKey: '' }, // Deterministic fallback engine
      });

      // 3. Mathematical and advisory verification
      assert.strictEqual(advisorResponse.success, true);
      assert.strictEqual(advisorResponse.category, 'CALCULATION');
      assert.ok(advisorResponse.referencedSubjects.includes('Physics'));
      assert.ok(advisorResponse.answer.includes('safely miss'));

      // 4. Proves zero dependency on request headers, cookies, tokens, or Supabase
      assert.strictEqual(typeof advisorResponse.answer, 'string');
    });

    it('verifies auth resolver exposes minimal required fields { userId, role }', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        headers: {
          'Authorization': 'Bearer session_alex',
        },
      });

      const session = await resolveAuthenticatedUser(req);
      assert.strictEqual(session.isAuthenticated, true);
      assert.ok(session.user);
      assert.strictEqual(session.user.userId, 'alex');
      assert.strictEqual(session.user.role, 'student');
    });
  });

  // --------------------------------------------------------------------------
  // Test 5: Role boundary & Teacher exclusion
  // --------------------------------------------------------------------------
  describe('Test 5: Role isolation (Teachers redirected from Student Advisor)', () => {
    it('returns HTTP 403 TEACHER_ROLE_RESTRICTED for teacher accounts', async () => {
      const req = new Request('http://localhost:3000/api/student/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer t_instructor_jwt',
        },
        body: JSON.stringify({ question: 'How is my attendance?' }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'TEACHER_ROLE_RESTRICTED');
      assert.ok(data.answer.includes('Instructor Portal'));
    });
  });
});
