import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSessionChannelName,
  broadcastStudentCheckIn,
  broadcastReverificationPrompt,
  broadcastSessionStatus,
  broadcastToSession,
} from '@/lib/realtime/broadcast';

describe('Realtime Broadcast Module (src/lib/realtime/broadcast.ts)', () => {
  const sessionId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSessionChannelName', () => {
    it('returns canonical session channel string', () => {
      expect(getSessionChannelName('test-123')).toBe('session:test-123');
    });
  });

  describe('broadcastStudentCheckIn', () => {
    it('dispatches student_checked_in event with attendee payload to Supabase channel', async () => {
      const mockSend = vi.fn().mockResolvedValue({ status: 'ok' });
      const mockChannel = { send: mockSend };
      const mockSupabase = {
        channel: vi.fn().mockReturnValue(mockChannel),
      };

      const result = await broadcastStudentCheckIn(
        sessionId,
        {
          recordId: 'rec-1',
          studentId: 'stu-1',
          fullName: 'Jane Doe',
          rollNumber: 'STU-001',
          checkInTime: '2026-10-07T14:15:00Z',
          status: 'present',
        },
        mockSupabase as any
      );

      expect(result).toBe(true);
      expect(mockSupabase.channel).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(mockSend).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'student_checked_in',
        payload: {
          sessionId,
          recordId: 'rec-1',
          studentId: 'stu-1',
          fullName: 'Jane Doe',
          rollNumber: 'STU-001',
          checkInTime: '2026-10-07T14:15:00Z',
          status: 'present',
        },
      });
    });
  });

  describe('broadcastReverificationPrompt', () => {
    it('dispatches reverify_prompt event with challenge window details', async () => {
      const mockSend = vi.fn().mockResolvedValue({ status: 'ok' });
      const mockChannel = { send: mockSend };
      const mockSupabase = {
        channel: vi.fn().mockReturnValue(mockChannel),
      };

      const result = await broadcastReverificationPrompt(
        sessionId,
        {
          challengeId: 'chal-100',
          issuedAt: '2026-10-07T14:45:00Z',
          expiresAt: '2026-10-07T14:46:00Z',
          promptType: 'one_touch_ack',
          windowSeconds: 60,
        },
        mockSupabase as any
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'reverify_prompt',
        payload: {
          sessionId,
          challengeId: 'chal-100',
          issuedAt: '2026-10-07T14:45:00Z',
          expiresAt: '2026-10-07T14:46:00Z',
          promptType: 'one_touch_ack',
          windowSeconds: 60,
        },
      });
    });
  });

  describe('broadcastSessionStatus', () => {
    it('dispatches session_status_changed event on lifecycle transitions', async () => {
      const mockSend = vi.fn().mockResolvedValue({ status: 'ok' });
      const mockChannel = { send: mockSend };
      const mockSupabase = {
        channel: vi.fn().mockReturnValue(mockChannel),
      };

      const result = await broadcastSessionStatus(sessionId, 'ended', mockSupabase as any);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'session_status_changed',
          payload: expect.objectContaining({
            sessionId,
            status: 'ended',
          }),
        })
      );
    });
  });

  describe('Resilience & Non-Blocking Behavior', () => {
    it('returns false and does not throw exception when WebSocket delivery fails', async () => {
      const mockSupabase = {
        channel: vi.fn(() => ({
          send: vi.fn().mockRejectedValue(new Error('WebSocket connection timed out')),
        })),
      };

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await broadcastToSession(
        sessionId,
        'test_event',
        { data: 123 },
        mockSupabase as any
      );

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Realtime Broadcast Warning]'),
        expect.any(Error)
      );
    });
  });
});
