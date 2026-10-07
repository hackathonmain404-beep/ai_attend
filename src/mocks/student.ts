import type { StudentAttendanceSummary } from "@/types/student";

/**
 * Contract-Compatible Mock Attendance Summary
 * Strictly models student profile and classes from docs/API.md & supabase/seed.sql.
 */
export const MOCK_STUDENT_SUMMARY: StudentAttendanceSummary = {
  student: {
    id: "00000000-0000-0000-0000-000000000002",
    fullName: "Jane Doe",
    identifier: "STU-2026-001",
    email: "jane.doe@university.edu",
    semester: "Semester 5 (Fall 2026)",
    cohort: "B.Tech Computer Science & Engineering",
    device: {
      isRegistered: true,
      deviceName: "Jane iPhone 15 Pro",
      registeredAt: "2026-09-15T09:12:00.000Z",
    },
  },
  overallPercentage: 82.5,
  totalHeld: 51,
  totalAttended: 42,
  streakDays: 7,
  classes: [
    {
      classId: "11111111-1111-1111-1111-111111111111",
      code: "CS301",
      className: "Distributed Systems & Cloud",
      totalHeld: 20,
      attended: 17,
      percentage: 85.0,
      status: "safe",
      classesNeededFor75: 0,
      canMissNext: 2,
    },
    {
      classId: "22222222-2222-2222-2222-222222222222",
      code: "MATH202",
      className: "Linear Algebra & Probability",
      totalHeld: 22,
      attended: 15,
      percentage: 68.2,
      status: "at_risk",
      classesNeededFor75: 3,
      canMissNext: 0,
    },
    {
      classId: "33333333-3333-3333-3333-333333333333",
      code: "CS205",
      className: "C & Systems Programming",
      totalHeld: 20,
      attended: 13,
      percentage: 65.0,
      status: "critical",
      classesNeededFor75: 4,
      canMissNext: 0,
    },
    {
      classId: "44444444-4444-4444-4444-444444444444",
      code: "CHEM101",
      className: "Applied Materials & Chemistry",
      totalHeld: 11,
      attended: 10,
      percentage: 90.9,
      status: "safe",
      classesNeededFor75: 0,
      canMissNext: 3,
    },
  ],
  todayLectures: [
    {
      classId: "11111111-1111-1111-1111-111111111111",
      code: "CS301",
      className: "Distributed Systems & Cloud",
      time: "10:00 AM – 11:30 AM",
      room: "Auditorium Hall B2",
      status: "active",
      sessionId: "44444444-4444-4444-4444-444444444441",
    },
    {
      classId: "22222222-2222-2222-2222-222222222222",
      code: "MATH202",
      className: "Linear Algebra & Probability",
      time: "02:00 PM – 03:30 PM",
      room: "Lecture Hall A1",
      status: "upcoming",
    },
  ],
};
