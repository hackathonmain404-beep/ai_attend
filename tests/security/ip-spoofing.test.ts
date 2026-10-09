import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractClientIp, verifyCampusIp } from '@/lib/security/ip-service';
import { getTeacherSecurityAlerts } from '@/lib/security/audit-service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Security & Anti-Spoofing Verification (tests/security/ip-spoofing.test.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('IP Header Forgery & Reverse Proxy Hardening', () => {
    it('prevents client IP spoofing when reverse proxy is disabled or direct connection is used', () => {
      // Attacker sends forged X-Forwarded-For claiming to be on campus
      const forgedRequest = {
        headers: {
          'x-forwarded-for': '198.51.100.5', // Spoofed campus IP
          'x-real-ip': '198.51.100.5',
        },
        socket: {
          remoteAddress: '203.0.113.195', // Attacker's real external IP
        },
      };

      // With trustProxy: false, extractClientIp ignores forged headers and binds to socket
      const observedIp = extractClientIp(forgedRequest, { trustProxy: false });
      expect(observedIp).toBe('203.0.113.195');

      // Evaluated against campus allowlist
      const verification = verifyCampusIp(observedIp, {
        enabled: true,
        policy: 'reject',
        allowlist: '198.51.100.0/24',
      });

      expect(verification.status).toBe('network_mismatch');
      expect(verification.isAllowed).toBe(false);
    });

    it('prevents multi-hop injection attack in X-Forwarded-For chain with trusted proxy', () => {
      // Attacker injects fake internal IP into their outgoing request:
      // Client -> CDN (10.0.0.1) -> Server
      // Attacker sends: X-Forwarded-For: 198.51.100.5 (forged campus IP)
      // CDN receives connection from 203.0.113.77 and appends it:
      // X-Forwarded-For: 198.51.100.5, 203.0.113.77
      const chainedRequest = {
        headers: {
          'x-forwarded-for': '198.51.100.5, 203.0.113.77',
        },
        socket: {
          remoteAddress: '10.0.0.1', // Trusted reverse proxy
        },
      };

      // With trustedProxyCount = 1, server looks 1 hop back from proxy: 203.0.113.77 (attacker's real IP)
      const observedIp = extractClientIp(chainedRequest, {
        trustProxy: true,
        trustedProxyCount: 1,
      });

      expect(observedIp).toBe('203.0.113.77');

      // Verification correctly flags attacker's real external IP
      const verification = verifyCampusIp(observedIp, {
        enabled: true,
        policy: 'reject',
        allowlist: '198.51.100.0/24',
      });

      expect(verification.isAllowed).toBe(false);
      expect(verification.status).toBe('network_mismatch');
    });
  });

  describe('Audit Log Isolation & Authorization', () => {
    it('enforces teacher-session isolation so teachers cannot view alerts from other faculty classes', async () => {
      const mockQueryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      } as unknown as SupabaseClient;

      await getTeacherSecurityAlerts('teacher-alice-id', {
        sessionId: 'session-bob-id',
        client: mockSupabase,
      });

      // Query MUST enforce teacher_id = teacher-alice-id
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        'attendance_sessions.teacher_id',
        'teacher-alice-id'
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        'session_id',
        'session-bob-id'
      );
    });
  });
});
