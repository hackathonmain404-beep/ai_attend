import { describe, it, expect, vi } from "vitest";
import {
  subscribeToAttendanceSession,
  broadcastRealtimeEvent,
  simulateRealtimeCheckIn,
  simulateRealtimeProxyBlocked,
  simulateRealtimeReverify,
} from "@/lib/realtime/attendance-channel";
import type {
  StudentCheckedInEvent,
  ProxyBlockedEvent,
  ReverifyAcknowledgedEvent,
} from "@/types/realtime";

describe("Real-time Attendance Subscription & Event Broadcasting", () => {
  const sessionId = "session-realtime-test-suite-01";

  it("successfully subscribes to session and receives student_checked_in events", () => {
    const onStudentCheckedIn = vi.fn();
    const unsubscribe = subscribeToAttendanceSession(sessionId, { onStudentCheckedIn });

    const student = simulateRealtimeCheckIn(sessionId, "Sarah Connor");

    expect(onStudentCheckedIn).toHaveBeenCalledTimes(1);
    const eventArg: StudentCheckedInEvent = onStudentCheckedIn.mock.calls[0][0];
    expect(eventArg.type).toBe("student_checked_in");
    expect(eventArg.sessionId).toBe(sessionId);
    expect(eventArg.student.fullName).toBe("Sarah Connor");
    expect(eventArg.student.status).toBe("present");

    unsubscribe();
  });

  it("receives proxy_blocked security alerts in real time", () => {
    const onProxyBlocked = vi.fn();
    const unsubscribe = subscribeToAttendanceSession(sessionId, { onProxyBlocked });

    const alert = simulateRealtimeProxyBlocked(sessionId);

    expect(onProxyBlocked).toHaveBeenCalledTimes(1);
    const eventArg: ProxyBlockedEvent = onProxyBlocked.mock.calls[0][0];
    expect(eventArg.type).toBe("proxy_blocked");
    expect(eventArg.alert.studentName).toBe("Bob Brown");
    expect(eventArg.alert.reason).toContain("Unregistered hardware");

    unsubscribe();
  });

  it("receives reverify_acknowledged confirmation events", () => {
    const onReverifyAcknowledged = vi.fn();
    const unsubscribe = subscribeToAttendanceSession(sessionId, { onReverifyAcknowledged });

    simulateRealtimeReverify(sessionId, "00000000-0000-0000-0000-000000000002");

    expect(onReverifyAcknowledged).toHaveBeenCalledTimes(1);
    const eventArg: ReverifyAcknowledgedEvent = onReverifyAcknowledged.mock.calls[0][0];
    expect(eventArg.type).toBe("reverify_acknowledged");
    expect(eventArg.studentId).toBe("00000000-0000-0000-0000-000000000002");

    unsubscribe();
  });

  it("cleans up listener upon unsubscription so subsequent events are ignored", () => {
    const onStudentCheckedIn = vi.fn();
    const unsubscribe = subscribeToAttendanceSession(sessionId, { onStudentCheckedIn });

    // 1st event delivered
    simulateRealtimeCheckIn(sessionId, "First Student");
    expect(onStudentCheckedIn).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsubscribe();

    // 2nd event ignored
    simulateRealtimeCheckIn(sessionId, "Second Student");
    expect(onStudentCheckedIn).toHaveBeenCalledTimes(1);
  });

  it("ignores events from other session IDs", () => {
    const onStudentCheckedIn = vi.fn();
    const unsubscribe = subscribeToAttendanceSession(sessionId, { onStudentCheckedIn });

    // Broadcast to a completely different session ID
    simulateRealtimeCheckIn("different-session-uuid-999", "Alien Student");
    expect(onStudentCheckedIn).not.toHaveBeenCalled();

    unsubscribe();
  });
});
