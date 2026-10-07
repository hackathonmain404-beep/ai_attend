/**
 * AttendGuard API - Student Attendance Advisor Endpoint
 * Route: POST /api/student/advisor
 * Member 4: AI Engineer (Intelligence & Analytics)
 *
 * Implements strict, fail-secure authentication and cross-user data isolation.
 * Resolves student identity exclusively from verified session credentials.
 */

import { answerAttendanceQuestion } from '../../../../lib/ai/advisor.ts';
import { fetchStudentAttendance } from '../../../../lib/analytics/data-adapter.ts';
import { resolveAuthenticatedUser } from '../../../../lib/ai/auth-resolver.ts';

// In-memory sliding window rate limiter (30 requests / 60 seconds per client)
// NOTE: Prototype/single-instance implementation. In distributed multi-instance production,
// replace with distributed Redis / Upstash sliding-window rate limiting.
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
    // 1. Cryptographic Authentication & Role Verification (Default Deny)
    const session = await resolveAuthenticatedUser(request);

    if (!session.isAuthenticated || !session.user) {
      return Response.json(
        {
          success: false,
          answer: 'You must be signed in to view your attendance advisor.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: session.errorCode || 'UNAUTHORIZED',
            message: session.errorMessage || 'Authentication required to access student attendance data.',
          },
        },
        { status: 401 }
      );
    }

    // Role-based boundary enforcement: Teachers must use the Instructor Portal
    if (session.user.role === 'teacher' || session.errorCode === 'TEACHER_ROLE_RESTRICTED') {
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
            message: session.errorMessage || 'Instructor accounts cannot access personal student attendance advisor.',
          },
        },
        { status: 403 }
      );
    }

    // 2. Client Rate Limiting (keyed on verified user ID or client IP)
    const clientIdentifier =
      session.user.userId ||
      session.user.id ||
      request.headers.get('x-forwarded-for') ||
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
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          answer: 'Invalid request payload. Expected JSON body.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'INVALID_REQUEST',
            message: 'Malformed JSON payload.',
          },
        },
        { status: 400 }
      );
    }

    // Support both 'question' and docs/API.md standard 'query'
    const rawQuestion = (body.question ?? body.query) as string | undefined;

    if (!rawQuestion || typeof rawQuestion !== 'string' || rawQuestion.trim() === '') {
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

    if (rawQuestion.length > 1000) {
      return Response.json(
        {
          success: false,
          answer: 'Question is too long. Please ask a concise attendance question (under 1000 characters).',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'QUESTION_TOO_LONG',
            message: 'Question exceeds maximum allowed length of 1000 characters.',
          },
        },
        { status: 400 }
      );
    }

    // 4. Cross-User Data Isolation & IDOR Defense
    // Prevent malicious clients from inspecting other students' records by supplying a different studentId or arbitrary identity fields
    const candidateClientIdentity =
      typeof body.studentId === 'string'
        ? body.studentId
        : typeof body.student_id === 'string'
        ? body.student_id
        : typeof body.userId === 'string'
        ? body.userId
        : typeof body.user_id === 'string'
        ? body.user_id
        : null;

    const requestedStudentId = candidateClientIdentity ? candidateClientIdentity.trim().toLowerCase() : null;
    const verifiedStudentId = (session.user.userId || session.user.id || '').toLowerCase();

    if (requestedStudentId && requestedStudentId !== verifiedStudentId) {
      // In demo environments, allow scenarioId switching if explicitly requested via scenarioId,
      // but strictly block arbitrary studentId tampering as an IDOR attempt.
      return Response.json(
        {
          success: false,
          answer: 'Access denied. You can only inspect your own verified attendance records.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'IDOR_ATTEMPT_BLOCKED',
            message: 'Cross-student attendance query rejected. Identity must match verified session.',
          },
        },
        { status: 403 }
      );
    }

    // Retrieve authoritative attendance data strictly using the verified student ID
    const effectiveScenarioId = typeof body.scenarioId === 'string' ? body.scenarioId : undefined;
    const { profile, context } = await fetchStudentAttendance({
      studentId: verifiedStudentId,
      scenarioId: effectiveScenarioId,
    });

    // 5. Process question through AI Attendance Advisor
    const studentName = session.user.name || profile.studentName;
    const advisorResponse = await answerAttendanceQuestion({
      question: rawQuestion,
      studentName,
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
