/**
 * AttendGuard Realtime Broadcast Helper
 * Dispatches live WebSocket events over Supabase Realtime channels.
 * 
 * Channels:
 * - session:${sessionId}
 * 
 * Events:
 * - student_checked_in: Live attendee counter & roster update for teacher
 * - reverify_prompt: Instant 60s surprise verification prompt for students
 * - session_status_changed: Session lifecycle transition (e.g. ended)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AttendeeBroadcastPayload {
  recordId: string;
  studentId: string;
  fullName: string;
  rollNumber: string;
  checkInTime: string;
  status: 'present';
}

export interface ReverifyPromptBroadcastPayload {
  challengeId: string;
  issuedAt: string;
  expiresAt: string;
  promptType: 'one_touch_ack';
  windowSeconds?: number;
}

/**
 * Returns canonical channel name for a specific session.
 */
export function getSessionChannelName(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * Broadcasts an instant event to all active subscribers on a session channel.
 * Designed to be non-blocking and resilient to network/WebSocket drops.
 */
export async function broadcastToSession<T = Record<string, unknown>>(
  sessionId: string,
  event: string,
  payload: T,
  client?: SupabaseClient
): Promise<boolean> {
  try {
    const supabase = client || createAdminClient();
    if (typeof supabase?.channel !== 'function') {
      return false;
    }
    const channelName = getSessionChannelName(sessionId);
    const channel = supabase.channel(channelName);

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });

    return true;
  } catch (err) {
    // Non-fatal broadcast warning: Core HTTP flows must never fail due to WebSocket delivery issues
    console.warn(`[Realtime Broadcast Warning]: Failed to dispatch event "${event}" on session ${sessionId}:`, err);
    return false;
  }
}

/**
 * Broadcasts a student check-in event to update the live headcount counter and teacher roster.
 */
export async function broadcastStudentCheckIn(
  sessionId: string,
  attendee: AttendeeBroadcastPayload,
  client?: SupabaseClient
): Promise<boolean> {
  return broadcastToSession(
    sessionId,
    'student_checked_in',
    {
      sessionId,
      ...attendee,
    },
    client
  );
}

/**
 * Broadcasts an in-class surprise re-verification challenge prompt to student devices.
 */
export async function broadcastReverificationPrompt(
  sessionId: string,
  challenge: ReverifyPromptBroadcastPayload,
  client?: SupabaseClient
): Promise<boolean> {
  return broadcastToSession(
    sessionId,
    'reverify_prompt',
    {
      sessionId,
      challengeId: challenge.challengeId,
      issuedAt: challenge.issuedAt,
      expiresAt: challenge.expiresAt,
      promptType: challenge.promptType || 'one_touch_ack',
      windowSeconds: challenge.windowSeconds ?? 60,
    },
    client
  );
}

/**
 * Broadcasts a session lifecycle status change (e.g., active -> ended).
 */
export async function broadcastSessionStatus(
  sessionId: string,
  status: 'active' | 're_verifying' | 'ended',
  client?: SupabaseClient
): Promise<boolean> {
  return broadcastToSession(
    sessionId,
    'session_status_changed',
    {
      sessionId,
      status,
      timestamp: new Date().toISOString(),
    },
    client
  );
}
