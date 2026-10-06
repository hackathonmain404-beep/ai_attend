/**
 * AttendGuard API - Student Attendance Advisor Endpoint
 * Route: POST /api/student/advisor
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import { answerAttendanceQuestion } from '@/lib/ai/advisor.ts';
import { fetchStudentAttendance } from '@/lib/analytics/data-adapter.ts';

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

    // 1. Retrieve trusted attendance data via resilient data adapter
    const { profile, context } = await fetchStudentAttendance({
      studentId: body.studentId,
      scenarioId: body.scenarioId,
    });

    // 2. Process question through AI Attendance Advisor
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
