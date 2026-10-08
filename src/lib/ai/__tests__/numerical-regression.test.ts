import { describe, it, expect } from 'vitest';
import { answerAttendanceQuestion } from '../advisor';
import { generateAttendanceSummary } from '../../analytics/insights';
import { DEFAULT_POLICY } from '../../analytics/types';
import { AttendanceContextPayload } from '../types';

const jordanCourses = [
  { courseCode: 'CS101', courseName: 'C Programming', attended: 17, totalHeld: 25 },
  { courseCode: 'CS102', courseName: 'Computer Architecture', attended: 19, totalHeld: 25 },
  { courseCode: 'MATH101', courseName: 'Mathematics', attended: 24, totalHeld: 29 },
  { courseCode: 'PHYS101', courseName: 'Physics', attended: 24, totalHeld: 28 },
  { courseCode: 'CHEM101', courseName: 'Chemistry', attended: 0, totalHeld: 0 },
];

const jordanSummary = generateAttendanceSummary(
  jordanCourses,
  { name: 'Jordan Lee', identifier: 'STU-1001' },
  DEFAULT_POLICY
);

const jordanContext: AttendanceContextPayload = {
  studentName: 'Jordan Lee',
  courses: jordanSummary.courses,
  summary: jordanSummary,
};

describe('AttendGuard AI Numerical Regression & Consistency Suite', () => {
  // Phase 17: Repeated Identical Run Consistency (20/20 test)
  describe('Repeated 20x Execution Consistency (Zero Variance)', () => {
    it('achieves 20/20 identical consistency on C Programming percentage (68.0%)', async () => {
      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const res = await answerAttendanceQuestion({
          question: 'What is my attendance in C Programming?',
          attendanceContext: jordanContext,
          config: { apiKey: '' },
        });
        expect(res.success).toBe(true);
        expect(res.answer).toContain('68.0%');
        expect(res.answer).toContain('C Programming');
        results.push(res.answer);
      }
      // Ensure all 20 responses are identical
      const first = results[0];
      for (const r of results) {
        expect(r).toBe(first);
      }
    });

    it('achieves 20/20 identical consistency on Recovery Target for C Programming (7 classes)', async () => {
      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const res = await answerAttendanceQuestion({
          question: 'How many classes do I need to attend to reach 75% in C Programming?',
          attendanceContext: jordanContext,
          config: { apiKey: '' },
        });
        expect(res.success).toBe(true);
        expect(res.answer).toContain('7 consecutive class(es)');
        results.push(res.answer);
      }
      const first = results[0];
      for (const r of results) {
        expect(r).toBe(first);
      }
    });

    it('achieves 20/20 identical consistency on Overall Attendance (78.5%)', async () => {
      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const res = await answerAttendanceQuestion({
          question: 'What is my overall attendance?',
          attendanceContext: jordanContext,
          config: { apiKey: '' },
        });
        expect(res.success).toBe(true);
        expect(res.answer).toContain('78.5%');
        results.push(res.answer);
      }
      const first = results[0];
      for (const r of results) {
        expect(r).toBe(first);
      }
    });
  });

  // Phase 10: 10 different question phrasings for same target facts
  describe('Phrasing Invariance (10 variations per factual target)', () => {
    const overallPhrasings = [
      'What is my overall attendance?',
      "What's my attendance percentage across all classes?",
      'Overall attendance percentage',
      'How is my total attendance?',
      'Give me my attendance summary',
      'How much attendance do I have in total?',
      'My overall attendance rate',
      'What is my aggregate attendance?',
      'Total attendance status',
      'Tell me my overall attendance',
    ];

    overallPhrasings.forEach((q, idx) => {
      it(`Overall phrasing ${idx + 1}: "${q}" -> 78.5%`, async () => {
        const res = await answerAttendanceQuestion({
          question: q,
          attendanceContext: jordanContext,
          config: { apiKey: '' },
        });
        expect(res.success).toBe(true);
        expect(res.answer).toContain('78.5%');
      });
    });

    const cProgrammingPhrasings = [
      'What is my attendance in C Programming?',
      'How is C Programming looking?',
      'CS101 attendance percentage',
      'What percentage do I have in C Programming?',
      'My standing in C Programming',
      'Attendance in C',
      'How am I doing in CS101?',
      'C Programming score',
      "What's my C Programming percentage?",
      'How is my C Programming attendance?',
    ];

    cProgrammingPhrasings.forEach((q, idx) => {
      it(`C Programming phrasing ${idx + 1}: "${q}" -> 68.0%`, async () => {
        const res = await answerAttendanceQuestion({
          question: q,
          attendanceContext: jordanContext,
          config: { apiKey: '' },
        });
        expect(res.success).toBe(true);
        expect(res.answer).toContain('68.0%');
        expect(res.answer).toContain('C Programming');
      });
    });

    const recoveryPhrasings = [
      'How many classes do I need to attend in C Programming?',
      'How many classes to reach 75% in C Programming?',
      'How many more classes must I attend in CS101?',
      'What is my recovery target in C Programming?',
      'How many consecutive classes do I need in C?',
      'Classes needed to reach 75 in CS101',
      'How many classes to recover in C Programming?',
      'How many classes do I need to reach the threshold in C Programming?',
      'C Programming classes needed for 75%',
      'How many classes must I attend to get to 75% in C Programming?',
    ];

    recoveryPhrasings.forEach((q, idx) => {
      it(`Recovery phrasing ${idx + 1}: "${q}" -> 7 classes`, async () => {
        const res = await answerAttendanceQuestion({
          question: q,
          attendanceContext: jordanContext,
          config: { apiKey: '' },
        });
        expect(res.success).toBe(true);
        expect(res.answer).toContain('7 consecutive class(es)');
        expect(res.answer).toContain('C Programming');
      });
    });

    const safeMissPhrasings = [
      'How many classes can I safely miss in Physics?',
      'Can I miss any classes in Physics?',
      'PHYS101 safe misses',
      'Safe absences in Physics',
      'How many classes can I skip in Physics?',
      'Can I skip Physics tomorrow?',
      'How many more classes can I skip safely in PHYS101?',
      'Physics safe miss allowance',
      'How many safe skips do I have in Physics?',
      'Can I afford to miss a Physics class?',
    ];

    safeMissPhrasings.forEach((q, idx) => {
      it(`Safe miss phrasing ${idx + 1}: "${q}" -> 4 safe misses`, async () => {
        const res = await answerAttendanceQuestion({
          question: q,
          attendanceContext: jordanContext,
          config: { apiKey: '' },
        });
        expect(res.success).toBe(true);
        expect(res.answer).toContain('4 upcoming class(es)');
        expect(res.answer).toContain('Physics');
      });
    });
  });
});
