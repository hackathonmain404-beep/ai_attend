import { MOCK_STUDENT_SUMMARY } from "@/mocks/student";
import { MOCK_ATTENDANCE_HISTORY } from "@/mocks/verification";
import type {
  AttendanceMarginMath,
  AttendanceSimulationResult,
  EnrolledSubjectDetails,
  RegulatoryAttendanceStatus,
} from "@/types/subject";

/**
 * Authoritative 75% regulatory university attendance margin calculator.
 */
export function calculateAttendanceMargin(
  attended: number,
  totalHeld: number
): AttendanceMarginMath {
  if (totalHeld <= 0) {
    return {
      currentPercentage: 100.0,
      status: "safe",
      canMissNext: 0,
      classesNeededFor75: 0,
      totalHeld: 0,
      attended: 0,
      missed: 0,
    };
  }

  const rawPercent = (attended / totalHeld) * 100;
  const currentPercentage = Math.round(rawPercent * 10) / 10;
  const missed = totalHeld - attended;

  let status: RegulatoryAttendanceStatus = "safe";
  let canMissNext = 0;
  let classesNeededFor75 = 0;

  if (currentPercentage >= 75.0) {
    status = "safe";
    // Formula: floor((attended - 0.75 * totalHeld) / 0.75)
    canMissNext = Math.max(0, Math.floor((attended - 0.75 * totalHeld) / 0.75));
    classesNeededFor75 = 0;
  } else {
    status = currentPercentage >= 65.0 ? "at_risk" : "critical";
    canMissNext = 0;
    // Formula: ceil((0.75 * totalHeld - attended) / 0.25)
    classesNeededFor75 = Math.max(1, Math.ceil((0.75 * totalHeld - attended) / 0.25));
  }

  return {
    currentPercentage,
    status,
    canMissNext,
    classesNeededFor75,
    totalHeld,
    attended,
    missed,
  };
}

/**
 * Projects future attendance percentage under hypothetical leave/attendance scenarios.
 */
export function simulateFutureAttendance(
  currentAttended: number,
  currentTotalHeld: number,
  additionalAttended: number,
  additionalMissed: number
): AttendanceSimulationResult {
  const projectedAttended = currentAttended + Math.max(0, additionalAttended);
  const projectedTotalHeld = currentTotalHeld + Math.max(0, additionalAttended) + Math.max(0, additionalMissed);

  const rawProjected = projectedTotalHeld > 0 ? (projectedAttended / projectedTotalHeld) * 100 : 100;
  const projectedPercentage = Math.round(rawProjected * 10) / 10;

  const currentPercent = currentTotalHeld > 0 ? (currentAttended / currentTotalHeld) * 100 : 100;
  const deltaPercentage = Math.round((projectedPercentage - currentPercent) * 10) / 10;

  let projectedStatus: RegulatoryAttendanceStatus = "safe";
  if (projectedPercentage < 65.0) {
    projectedStatus = "critical";
  } else if (projectedPercentage < 75.0) {
    projectedStatus = "at_risk";
  }

  let summaryMessage = "";
  if (projectedPercentage >= 75.0) {
    if (additionalMissed > 0) {
      summaryMessage = `You remain safe at ${projectedPercentage.toFixed(1)}% after taking ${additionalMissed} absence${additionalMissed > 1 ? "s" : ""}.`;
    } else {
      summaryMessage = `Attending upcoming classes elevates your standing to ${projectedPercentage.toFixed(1)}%.`;
    }
  } else {
    summaryMessage = `Warning: Projected attendance drops to ${projectedPercentage.toFixed(1)}% (< 75% regulatory requirement).`;
  }

  return {
    projectedAttended,
    projectedTotalHeld,
    projectedPercentage,
    deltaPercentage,
    projectedStatus,
    summaryMessage,
  };
}

/**
 * Retrieves comprehensive details for an enrolled course by UUID or Course Code.
 */
export function getSubjectDetails(subjectIdOrCode: string): EnrolledSubjectDetails | null {
  const matched = MOCK_STUDENT_SUMMARY.classes.find(
    (c) =>
      c.classId.toLowerCase() === subjectIdOrCode.toLowerCase() ||
      c.code.toLowerCase() === subjectIdOrCode.toLowerCase()
  );

  if (!matched) {
    // Default fallback to first class if not matched
    const fallback = MOCK_STUDENT_SUMMARY.classes[0];
    if (!fallback) return null;
    return getSubjectDetails(fallback.classId);
  }

  const margin = calculateAttendanceMargin(matched.attended, matched.totalHeld);

  const recentSessions = MOCK_ATTENDANCE_HISTORY.filter(
    (h) => h.classId === matched.classId || h.className.toLowerCase().includes(matched.code.toLowerCase())
  );

  return {
    id: matched.classId,
    code: matched.code,
    name: matched.className,
    teacherName: "Prof. Alan Turing",
    schedule: "Mon, Wed, Fri • 10:00 AM - 11:30 AM",
    semester: "Semester 5 • Fall 2026",
    credits: 4,
    room: "Auditorium Hall 4B",
    margin,
    recentSessions,
  };
}

/**
 * Generates standard RFC-4180 CSV content for a class attendance ledger.
 */
export function generateClassRosterCsv(
  courseCode: string,
  courseName: string,
  students: Array<{
    name: string;
    roll: string;
    email: string;
    rate: number;
    deviceBound?: boolean;
    proxyAlerts?: number;
  }>
): string {
  const headers = [
    "Course Code",
    "Course Name",
    "Roll Number",
    "Student Name",
    "Institutional Email",
    "Attendance Rate (%)",
    "Status",
    "Hardware Bound",
    "Proxy Anomalies Detected",
  ];

  const escape = (val: any) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = students.map((s) => [
    escape(courseCode),
    escape(courseName),
    escape(s.roll),
    escape(s.name),
    escape(s.email),
    escape(s.rate.toFixed(1)),
    escape(s.rate >= 75 ? "SAFE" : "AT_RISK"),
    escape(s.deviceBound !== false ? "YES" : "NO"),
    escape(s.proxyAlerts || 0),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Triggers client-side download of a generated CSV file.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
