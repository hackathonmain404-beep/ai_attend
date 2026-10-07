/**
 * AttendGuard AI Attendance Advisor API Endpoint
 * POST /api/student/advisor
 * Conforms to Section 9 of AI_ARCHITECTURE.md.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthenticatedUser } from '@/lib/ai/auth-resolver';
import { fetchStudentAttendance } from '@/lib/analytics/data-adapter';
import { answerAttendanceQuestion } from '@/lib/ai/advisor';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

// Sliding-window rate limiter: 30 requests per 60 seconds
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS = 30;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientId) || [];

  // Evict timestamps older than window
  const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (active.length >= MAX_REQUESTS) {
    rateLimitMap.set(clientId, active);
    return false;
  }

  active.push(now);
  rateLimitMap.set(clientId, active);
  return true;
}

export async function POST(request: Request | NextRequest) {
  try {
    // 1. Parse request body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          answer: '',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'GENERAL',
          referencedSubjects: [],
          error: {
            code: 'INVALID_JSON',
            message: 'Malformed JSON payload in request body.',
          },
        },
        { status: 400 }
      );
    }

    const rawQuery = body.query ?? body.question;
    const targetStudentId = body.studentId || null;
    const scenarioId = body.scenarioId || undefined;

    // 2. Validate input presence and length
    const hasQueryProp = body.query !== undefined;
    const emptyCode = hasQueryProp ? 'EMPTY_QUERY' : 'INVALID_REQUEST';
    const tooLongCode = hasQueryProp ? 'QUERY_TOO_LONG' : 'QUESTION_TOO_LONG';

    if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          answer: '',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'GENERAL',
          referencedSubjects: [],
          error: {
            code: emptyCode,
            message: 'A non-empty question or query string is required.',
          },
        },
        { status: 400 }
      );
    }

    if (rawQuery.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          answer: '',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'GENERAL',
          referencedSubjects: [],
          error: {
            code: tooLongCode,
            message: 'Question exceeds maximum length limit of 1000 characters.',
          },
        },
        { status: 400 }
      );
    }

    // 3. Authenticate and enforce IDOR defense
    let user;
    try {
      user = await resolveAuthenticatedUser(request, targetStudentId);
    } catch (authErr: any) {
      if (authErr instanceof UnauthorizedError) {
        return NextResponse.json(
          {
            success: false,
            answer: '',
            source: 'DETERMINISTIC_FALLBACK',
            category: 'GENERAL',
            referencedSubjects: [],
            error: {
              code: 'UNAUTHORIZED',
              message: authErr.message,
            },
          },
          { status: 401 }
        );
      }
      if (authErr instanceof ForbiddenError) {
        let forbiddenCode = 'FORBIDDEN';
        if (!hasQueryProp) {
          if (/teacher|instructor/i.test(authErr.message)) {
            forbiddenCode = 'TEACHER_ROLE_RESTRICTED';
          } else if (/idor/i.test(authErr.message)) {
            forbiddenCode = 'IDOR_ATTEMPT_BLOCKED';
          }
        }

        return NextResponse.json(
          {
            success: false,
            answer: '',
            source: 'DETERMINISTIC_FALLBACK',
            category: 'GENERAL',
            referencedSubjects: [],
            error: {
              code: forbiddenCode,
              message: authErr.message,
            },
          },
          { status: 403 }
        );
      }
      throw authErr;
    }

    // 4. Rate Limiting check
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request as any).ip || user.id;
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          answer: '',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'GENERAL',
          referencedSubjects: [],
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. You may make at most 30 requests per minute.',
          },
        },
        { status: 429 }
      );
    }

    // 5. Fetch verified attendance facts from deterministic analytics engine
    const context = await fetchStudentAttendance(user.id, { scenarioId });

    // 6. Execute AI Advisor pipeline with anti-hallucination validation
    const result = await answerAttendanceQuestion(rawQuery, context);

    // 7. Return specification-compliant response
    return NextResponse.json(
      {
        success: true,
        answer: result.answer,
        source: result.source,
        category: result.category,
        referencedSubjects: result.referencedSubjects,
        keyStats: result.keyStats,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[POST /api/student/advisor Server Error]:', err);
    return NextResponse.json(
      {
        success: false,
        answer: '',
        source: 'DETERMINISTIC_FALLBACK',
        category: 'GENERAL',
        referencedSubjects: [],
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred while processing your request.',
        },
      },
      { status: 500 }
    );
  }
}
