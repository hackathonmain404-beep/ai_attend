/**
 * AttendGuard API - Student Attendance Advisor Endpoint
 * Route: POST /api/student/advisor
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import { answerAttendanceQuestion } from '@/lib/ai/advisor.ts';
import { generateAttendanceContext } from '@/lib/analytics/insights.ts';
import { getStudentAttendanceRecords } from '@/lib/analytics/mock-data.ts';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { question, studentName } = body;

    if (!question || typeof question !== 'string') {
      return Response.json(
        {
          success: false,
          answer: 'Please provide a valid question.',
          source: 'DETERMINISTIC_FALLBACK',
          category: 'UNSUPPORTED',
          referencedSubjects: [],
          error: {
            code: 'INVALID_REQUEST',
            message: 'Question is required and must be a string.',
          },
        },
        { status: 400 }
      );
    }

    // 1. Retrieve trusted attendance data (swappable for live backend DB query)
    const rawAttendance = getStudentAttendanceRecords();

    // 2. Compute authoritative context deterministically
    const attendanceContext = generateAttendanceContext(rawAttendance);

    // 3. Process question through AI Attendance Advisor
    const advisorResponse = await answerAttendanceQuestion({
      question,
      studentName,
      attendanceContext,
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
