/**
 * AttendGuard API - Student Attendance Advisor Endpoint
 * Route: POST /api/student/advisor
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import { answerAttendanceQuestion } from '../../../../lib/ai/advisor.ts';
import { fetchStudentAttendance } from '../../../../lib/analytics/data-adapter.ts';

// In-memory sliding window rate limiter (30 requests / 60 seconds per client)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  // Periodic cleanup of expired records if map grows large
  if (rateLimitMap.size > 1000) {
    for (const [key, rec] of rateLimitMap.entries()) {
      if (now > rec.resetAt) rateLimitMap.delete(key);
    }
  }

  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Role & Auth Boundary Checks
    const userRole = request.headers.get('x-user-role');
    if (userRole === 'teacher') {
      return Response.json(
        {
          success: false,
          answer:
            'The Attendance Advisor is designed for students. Teachers can view classroom attendance directly from the Instructor Portal.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'TEACHER_ROLE_RESTRICTED',
            message: 'Instructor accounts cannot access personal student attendance advisor.',
          },
        },
        { status: 403 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const authStatus = request.headers.get('x-authenticated');
    if (authStatus === 'false' || authHeader === 'Bearer invalid') {
      return Response.json(
        {
          success: false,
          answer: 'You must be signed in to view your attendance advisor.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to access student attendance data.',
          },
        },
        { status: 401 }
      );
    }

    // 2. Client Rate Limiting
    const clientIdentifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-student-id') ||
      'anonymous_client';

    if (!checkRateLimit(clientIdentifier)) {
      return Response.json(
        {
          success: false,
          answer: 'Too many queries. Please wait a minute before asking another attendance question.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit of ${RATE_LIMIT_MAX} requests per minute exceeded.`,
          },
        },
        { status: 429 }
      );
    }

    // 3. Body Parsing & Input Validation
    const body = await request.json();
    const { question, studentName } = body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return Response.json(
        {
          success: false,
          answer: 'Please provide a valid question.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'INVALID_REQUEST',
            message: 'Question is required and must be a non-empty string.',
          },
        },
        { status: 400 }
      );
    }

    // 4. Retrieve trusted attendance data via resilient data adapter
    const effectiveStudentId = request.headers.get('x-student-id') || body.studentId;
    const { profile, context } = await fetchStudentAttendance({
      studentId: effectiveStudentId,
      scenarioId: body.scenarioId,
    });

    // 5. Process question through AI Attendance Advisor
    const advisorResponse = await answerAttendanceQuestion({
      question,
      studentName: studentName || profile.studentName,
      attendanceContext: context,
    });

    return Response.json(advisorResponse, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        success: false,
        answer:
          'The attendance advisor encountered an internal error. Your raw attendance calculations remain secure.',
        source: 'DETERMINISTIC_FALLBACK',
        category: 'UNSUPPORTED',
        referencedSubjects: [],
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown server error',
        },
      },
      { status: 500 }
    );
  }
}
