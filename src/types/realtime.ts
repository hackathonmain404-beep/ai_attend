/**
 * AttendGuard Realtime Attendance & Security Alerts Types
 * Strictly conforms to docs/API.md real-time event architectures.
 */

import type { SessionAttendee } from "@/types/teacher";

export type RealtimeAttendanceEventType =
  | "student_checked_in"
  | "proxy_blocked"
  | "reverify_acknowledged"
  | "session_ended";

export interface StudentCheckedInEvent {
  type: "student_checked_in";
  sessionId: string;
  student: SessionAttendee;
}

export interface ProxyBlockedAlert {
  studentName: string;
  rollNumber: string;
  reason: string;
  attemptedDevice: string;
  timestamp: string;
}

export interface ProxyBlockedEvent {
  type: "proxy_blocked";
  sessionId: string;
  alert: ProxyBlockedAlert;
}

export interface ReverifyAcknowledgedEvent {
  type: "reverify_acknowledged";
  sessionId: string;
  studentId: string;
  fullName: string;
  timestamp: string;
}

export interface SessionEndedEvent {
  type: "session_ended";
  sessionId: string;
  totalPresent: number;
  totalAbsent: number;
}

export type RealtimeAttendanceEvent =
  | StudentCheckedInEvent
  | ProxyBlockedEvent
  | ReverifyAcknowledgedEvent
  | SessionEndedEvent;

export interface RealtimeAttendanceCallbacks {
  onStudentCheckedIn?: (event: StudentCheckedInEvent) => void;
  onProxyBlocked?: (event: ProxyBlockedEvent) => void;
  onReverifyAcknowledged?: (event: ReverifyAcknowledgedEvent) => void;
  onSessionEnded?: (event: SessionEndedEvent) => void;
}
