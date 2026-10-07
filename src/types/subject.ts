/**
 * AttendGuard Subject-Wise Analytics & Attendance Simulation Types
 */

import type { AttendanceRecord } from "@/types/verification";

export type RegulatoryAttendanceStatus = "safe" | "at_risk" | "critical";

export interface AttendanceMarginMath {
  currentPercentage: number;
  status: RegulatoryAttendanceStatus;
  canMissNext: number;
  classesNeededFor75: number;
  totalHeld: number;
  attended: number;
  missed: number;
}

export interface AttendanceSimulationResult {
  projectedAttended: number;
  projectedTotalHeld: number;
  projectedPercentage: number;
  deltaPercentage: number;
  projectedStatus: RegulatoryAttendanceStatus;
  summaryMessage: string;
}

export interface EnrolledSubjectDetails {
  id: string;
  code: string;
  name: string;
  teacherName: string;
  schedule: string;
  semester: string;
  credits: number;
  room: string;
  margin: AttendanceMarginMath;
  recentSessions: AttendanceRecord[];
}

export interface CohortRiskDistribution {
  totalStudents: number;
  safeCount: number;
  warningCount: number;
  criticalCount: number;
  safePercentage: number;
  warningPercentage: number;
  criticalPercentage: number;
}
