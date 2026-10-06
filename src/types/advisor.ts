/**
 * AttendGuard AI Attendance Advisor Types
 * Strictly conforms to docs/API.md section 6.
 */

export interface AdvisorQueryRequest {
  query: string;
}

export interface AdvisorContextSnapshot {
  classCode: string;
  currentPercentage: number;
  attended: number;
  totalHeld: number;
  targetPercentage: number;
  classesNeeded: number;
  canMiss: number;
}

export interface AdvisorResponseData {
  reply: string;
  contextSnapshot?: AdvisorContextSnapshot | null;
}

export interface AdvisorChatMessage {
  id: string;
  role: "user" | "advisor";
  content: string;
  timestamp: string;
  snapshot?: AdvisorContextSnapshot | null;
}
