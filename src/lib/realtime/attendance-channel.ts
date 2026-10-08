import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeAttendanceEvent,
  RealtimeAttendanceCallbacks,
  StudentCheckedInEvent,
  ProxyBlockedEvent,
  ReverifyAcknowledgedEvent,
  SessionEndedEvent,
} from "@/types/realtime";
import type { SessionAttendee } from "@/types/teacher";

// In-memory event subscriber registry
type Listener = (event: RealtimeAttendanceEvent) => void;
const sessionListeners = new Map<string, Set<Listener>>();

/**
 * Subscribes to real-time events for an active lecture session.
 * Subscribes to live Supabase WebSocket channel in browser and local bus in all runtimes.
 * Returns an unsubscription callback to prevent memory leaks.
 */
export function subscribeToAttendanceSession(
  sessionId: string,
  callbacks: RealtimeAttendanceCallbacks
): () => void {
  if (!sessionListeners.has(sessionId)) {
    sessionListeners.set(sessionId, new Set());
  }

  const listener: Listener = (event) => {
    if (event.sessionId !== sessionId) return;

    switch (event.type) {
      case "student_checked_in":
        callbacks.onStudentCheckedIn?.(event);
        break;
      case "proxy_blocked":
        callbacks.onProxyBlocked?.(event);
        break;
      case "reverify_acknowledged":
        callbacks.onReverifyAcknowledged?.(event);
        break;
      case "session_ended":
        callbacks.onSessionEnded?.(event);
        break;
    }
  };

  sessionListeners.get(sessionId)!.add(listener);

  let supabaseChannel: any = null;
  if (typeof window !== "undefined") {
    try {
      const supabase = createClient();
      supabaseChannel = supabase.channel(`session:${sessionId}`);
      supabaseChannel
        .on("broadcast", { event: "student_checked_in" }, ({ payload }: any) => {
          broadcastRealtimeEvent({
            type: "student_checked_in",
            sessionId,
            student: {
              studentId: payload.studentId,
              fullName: payload.fullName || "Enrolled Student",
              rollNumber: payload.rollNumber || "STU-VERIFIED",
              checkInTime: payload.checkInTime
                ? new Date(payload.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              status: payload.status || "present",
              reVerified: false,
              deviceName: payload.deviceName || "Registered Device",
            },
          });
        })
        .on("broadcast", { event: "proxy_blocked" }, ({ payload }: any) => {
          broadcastRealtimeEvent({
            type: "proxy_blocked",
            sessionId,
            alert: {
              studentName: payload.studentName || "Flagged Student",
              rollNumber: payload.rollNumber || "UNKNOWN",
              reason: payload.reason || "Proxy violation detected",
              attemptedDevice: payload.attemptedDevice || "Unregistered Hardware",
              timestamp: payload.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            },
          });
        })
        .on("broadcast", { event: "reverify_acknowledged" }, ({ payload }: any) => {
          broadcastRealtimeEvent({
            type: "reverify_acknowledged",
            sessionId,
            studentId: payload.studentId,
            fullName: payload.fullName || "Student",
            timestamp: payload.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          });
        })
        .on("broadcast", { event: "session_status_changed" }, ({ payload }: any) => {
          if (payload.status === "ended") {
            broadcastRealtimeEvent({
              type: "session_ended",
              sessionId,
              totalPresent: payload.totalPresent ?? 0,
              totalAbsent: payload.totalAbsent ?? 0,
            });
          }
        })
        .subscribe();
    } catch (err) {
      console.warn("[Realtime Channel Subscription Warning]:", err);
    }
  }

  return () => {
    if (supabaseChannel && typeof window !== "undefined") {
      try {
        const supabase = createClient();
        supabase.removeChannel(supabaseChannel);
      } catch {}
    }

    const listeners = sessionListeners.get(sessionId);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        sessionListeners.delete(sessionId);
      }
    }
  };
}

/**
 * Broadcasts an attendance event to all active subscribers.
 */
export function broadcastRealtimeEvent(event: RealtimeAttendanceEvent): void {
  const listeners = sessionListeners.get(event.sessionId);
  if (listeners) {
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("Error executing real-time listener callback:", err);
      }
    });
  }
}

// SIMULATOR HELPERS FOR HACKATHON DEMONSTRATIONS
const MOCK_STUDENT_NAMES = [
  { name: "Sarah Connor", roll: "STU2026-0899", device: "Sarah's Pixel 8" },
  { name: "Marcus Wright", roll: "STU2026-0901", device: "Marcus Galaxy S24" },
  { name: "Kyle Reese", roll: "STU2026-0902", device: "Kyle's iPhone 14" },
  { name: "Grace Phillips", roll: "STU2026-0903", device: "Grace's OnePlus 12" },
];

let studentSimIndex = 0;

/**
 * Simulates an incoming valid QR check-in from a registered smartphone.
 */
export function simulateRealtimeCheckIn(
  sessionId = "44444444-4444-4444-4444-444444444441",
  customName?: string
): SessionAttendee {
  const chosen = MOCK_STUDENT_NAMES[studentSimIndex % MOCK_STUDENT_NAMES.length];
  studentSimIndex++;

  const student: SessionAttendee = {
    studentId: "stu-sim-" + Math.random().toString(16).substring(2, 8),
    fullName: customName || chosen.name,
    rollNumber: chosen.roll,
    checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    status: "present",
    reVerified: false,
    deviceName: chosen.device,
  };

  broadcastRealtimeEvent({
    type: "student_checked_in",
    sessionId,
    student,
  });

  return student;
}

/**
 * Simulates a blocked proxy attempt (unregistered hardware rejected by server).
 */
export function simulateRealtimeProxyBlocked(
  sessionId = "44444444-4444-4444-4444-444444444441"
) {
  const alert = {
    studentName: "Bob Brown",
    rollNumber: "STU2026-0894",
    reason: "Unregistered hardware fingerprint mismatch (403 Forbidden)",
    attemptedDevice: "Xiaomi Redmi Note 12 (Foreign Hardware)",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };

  broadcastRealtimeEvent({
    type: "proxy_blocked",
    sessionId,
    alert,
  });

  return alert;
}

/**
 * Simulates student spot re-verification acknowledgment.
 */
export function simulateRealtimeReverify(
  sessionId = "44444444-4444-4444-4444-444444444441",
  studentId = "00000000-0000-0000-0000-000000000002"
) {
  broadcastRealtimeEvent({
    type: "reverify_acknowledged",
    sessionId,
    studentId,
    fullName: "Jane Doe",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  });

  return studentId;
}
