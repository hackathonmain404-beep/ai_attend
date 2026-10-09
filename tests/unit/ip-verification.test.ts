import { describe, it, expect } from 'vitest';
import {
  normalizeIp,
  extractClientIp,
  isIpv4InCidr,
  isIpv6InCidr,
  matchesIpPattern,
  verifyCampusIp,
} from '@/lib/security/ip-service';

describe('Campus IP & Network Verification Service (src/lib/security/ip-service.ts)', () => {
  describe('normalizeIp', () => {
    it('normalizes IPv4-mapped IPv6 addresses to standard IPv4', () => {
      expect(normalizeIp('::ffff:192.168.1.100')).toBe('192.168.1.100');
      expect(normalizeIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
    });

    it('strips bracketed IPv6 formatting', () => {
      expect(normalizeIp('[::1]')).toBe('::1');
      expect(normalizeIp('[2001:db8::1]')).toBe('2001:db8::1');
    });

    it('handles null, undefined, or empty strings gracefully', () => {
      expect(normalizeIp(null)).toBeNull();
      expect(normalizeIp(undefined)).toBeNull();
      expect(normalizeIp('')).toBeNull();
      expect(normalizeIp('   ')).toBeNull();
    });
  });

  describe('extractClientIp & Trusted Reverse Proxy Handling', () => {
    it('uses socket remote address when trustProxy is false (ignores spoofed X-Forwarded-For)', () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.195', // Spoofed client header
        },
        socket: {
          remoteAddress: '192.0.2.1', // Real TCP peer
        },
      };

      const extracted = extractClientIp(mockReq, { trustProxy: false });
      expect(extracted).toBe('192.0.2.1');
    });

    it('extracts real client IP and discards client-forged prefix with trustedProxyCount = 1', () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '1.1.1.1, 198.51.100.42', // spoofed prefix, verified client appended by proxy
        },
        socket: {
          remoteAddress: '10.0.0.1',
        },
      };

      const extracted = extractClientIp(mockReq, { trustProxy: true, trustedProxyCount: 1 });
      expect(extracted).toBe('198.51.100.42');
    });

    it('works with NextRequest style headers.get()', () => {
      const mockNextReq = {
        headers: new Headers({
          'x-forwarded-for': '203.0.113.50',
        }),
      };

      const extracted = extractClientIp(mockNextReq, { trustProxy: true, trustedProxyCount: 1 });
      expect(extracted).toBe('203.0.113.50');
    });
  });

  describe('IPv4 and IPv6 CIDR Subnet Evaluation', () => {
    it('matches IPv4 addresses inside CIDR /24 block', () => {
      expect(isIpv4InCidr('192.168.1.1', '192.168.1.0/24')).toBe(true);
      expect(isIpv4InCidr('192.168.1.254', '192.168.1.0/24')).toBe(true);
      expect(isIpv4InCidr('192.168.2.1', '192.168.1.0/24')).toBe(false);
    });

    it('matches IPv4 addresses inside large /8 CIDR block', () => {
      expect(isIpv4InCidr('10.250.12.3', '10.0.0.0/8')).toBe(true);
      expect(isIpv4InCidr('11.0.0.1', '10.0.0.0/8')).toBe(false);
    });

    it('matches exact IPv4 address', () => {
      expect(isIpv4InCidr('172.16.5.9', '172.16.5.9')).toBe(true);
      expect(isIpv4InCidr('172.16.5.10', '172.16.5.9')).toBe(false);
    });

    it('matches IPv6 addresses inside /32 CIDR block', () => {
      expect(isIpv6InCidr('2001:db8:1234::1', '2001:db8::/32')).toBe(true);
      expect(isIpv6InCidr('2001:db9::1', '2001:db8::/32')).toBe(false);
    });

    it('matches exact IPv6 addresses and localhost', () => {
      expect(matchesIpPattern('::1', '::1')).toBe(true);
      expect(matchesIpPattern('127.0.0.1', '127.0.0.1')).toBe(true);
      expect(matchesIpPattern('::ffff:127.0.0.1', '127.0.0.1')).toBe(true);
    });
  });

  describe('verifyCampusIp Policy Enforcement', () => {
    const campusAllowlist = '198.51.100.0/24, 203.0.113.5, 2001:db8::/48, 127.0.0.1';

    it('Outcome 1: Approved campus IP returns status "matched"', () => {
      const res = verifyCampusIp('198.51.100.55', {
        enabled: true,
        allowlist: campusAllowlist,
      });

      expect(res.status).toBe('matched');
      expect(res.reason).toBe('MATCHED');
      expect(res.isAllowed).toBe(true);
      expect(res.observedIp).toBe('198.51.100.55');
    });

    it('Outcome 2: Unapproved IP with default review policy returns status "review_required"', () => {
      const res = verifyCampusIp('45.33.32.156', {
        enabled: true,
        policy: 'review',
        allowlist: campusAllowlist,
      });

      expect(res.status).toBe('review_required');
      expect(res.reason).toBe('NETWORK_MISMATCH');
      expect(res.isAllowed).toBe(true); // Permitted for attendance, but flagged for teacher
      expect(res.policy).toBe('review');
    });

    it('Outcome 3: Unapproved IP with strict reject policy returns status "network_mismatch" and isAllowed false', () => {
      const res = verifyCampusIp('45.33.32.156', {
        enabled: true,
        policy: 'reject',
        allowlist: campusAllowlist,
      });

      expect(res.status).toBe('network_mismatch');
      expect(res.reason).toBe('NETWORK_MISMATCH');
      expect(res.isAllowed).toBe(false);
      expect(res.policy).toBe('reject');
    });

    it('Outcome 4: Disabled IP checking returns status "skipped"', () => {
      const res = verifyCampusIp('45.33.32.156', {
        enabled: false,
        allowlist: campusAllowlist,
      });

      expect(res.status).toBe('skipped');
      expect(res.reason).toBe('IP_CHECK_DISABLED');
      expect(res.isAllowed).toBe(true);
    });

    it('Outcome 5: Unconfigured / empty allowlist returns status "not_configured" without blocking requests', () => {
      const res = verifyCampusIp('192.168.1.5', {
        enabled: true,
        allowlist: '',
      });

      expect(res.status).toBe('not_configured');
      expect(res.reason).toBe('ALLOWLIST_NOT_CONFIGURED');
      expect(res.isAllowed).toBe(true);
    });

    it('Outcome 6: Missing client IP under strict policy is blocked', () => {
      const res = verifyCampusIp(null, {
        enabled: true,
        policy: 'reject',
        allowlist: campusAllowlist,
      });

      expect(res.status).toBe('network_mismatch');
      expect(res.reason).toBe('INVALID_IP');
      expect(res.isAllowed).toBe(false);
    });
  });
});
