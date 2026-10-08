/**
 * AttendGuard Student Domain Types
 * Conforms strictly to docs/API.md specification (GET /api/student/attendance/summary).
 */

export interface SubjectAttendance {
  classId: string;
  className: string;
  code: string;
  totalHeld: number;
  attended: number;
  percentage: number;
  status: "safe" | "at_risk" | "critical";
  classesNeededFor75: number;
  canMissNext: number;
  schedule?: string;
  semester?: string;
  teacherName?: string;
}

export interface TodayLecture {
  classId: string;
  className: string;
  code: string;
  time: string;
  room: string;
  status: "upcoming" | "active" | "completed";
  sessionId?: string;
}

export interface StudentProfileSummary {
  id: string;
  fullName: string;
  identifier: string;
  email: string;
  semester: string;
  cohort: string;
  device: {
    isRegistered: boolean;
    deviceName: string | null;
    registeredAt: string | null;
  };
}

export interface StudentAttendanceSummary {
  student: StudentProfileSummary;
  overallPercentage: number;
  totalHeld: number;
  totalAttended: number;
  streakDays: number;
  classes: SubjectAttendance[];
  todayLectures: TodayLecture[];
}
