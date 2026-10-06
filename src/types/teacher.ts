/**
 * AttendGuard Teacher Domain Types
 * Strictly conforms to docs/API.md sections 2 & 5.
 */

export interface TeacherProfile {
  id: string;
  fullName: string;
  identifier: string;
  email: string;
  department: string;
  office: string;
}

export interface TeacherClass {
  id: string;
  code: string;
  name: string;
  schedule: string;
  semester: string;
  enrolledCount: number;
  activeSessionId?: string | null;
}

export interface SessionAttendee {
  studentId: string;
  fullName: string;
  rollNumber: string;
  checkInTime: string;
  status: "present" | "late" | "flagged";
  reVerified: boolean;
  deviceFingerprintHash?: string;
  deviceName?: string;
}

export interface ActiveSessionData {
  sessionId: string;
  classId: string;
  className: string;
  courseCode: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt?: string | null;
  qrRotationIntervalSec: number;
  totalEnrolled: number;
  presentCount: number;
  reverifyTriggered: boolean;
  attendees: SessionAttendee[];
}

export interface SessionHistoryRecord {
  sessionId: string;
  classId: string;
  courseCode: string;
  className: string;
  date: string;
  totalEnrolled: number;
  presentCount: number;
  percentage: number;
  reverifyCount: number;
}

export interface TeacherOverviewData {
  teacher: TeacherProfile;
  metrics: {
    totalStudents: number;
    assignedClassesCount: number;
    averageAttendancePercentage: number;
    proxiesBlockedCount: number;
    nextLecture: {
      courseCode: string;
      courseName: string;
      time: string;
      room: string;
    };
  };
  classes: TeacherClass[];
  activeSession: ActiveSessionData | null;
  recentSessions: SessionHistoryRecord[];
}
