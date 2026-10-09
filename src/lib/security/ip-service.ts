/**
 * AttendGuard Campus IP & Network Verification Service
 * Server-authoritative network location verification for attendance integrity.
 *
 * Requirements:
 * - Server-side client IP extraction with configurable trusted reverse proxy handling
 * - IPv4, IPv6, and IPv4-mapped IPv6 normalization
 * - CIDR range matching for IPv4 and IPv6
 * - Configurable enforcement: IP_CHECK_ENABLED, IP_MISMATCH_POLICY (review | reject)
 * - Safe handling of unconfigured allowlists (returns not_configured without blocking development)
 * - Never trusts client-supplied IP addresses from request body or query
 */

import { config } from '@/lib/config';

export type IpVerificationStatus =
  | 'matched'
  | 'network_mismatch'
  | 'not_configured'
  | 'skipped'
  | 'review_required';

export type IpVerificationReason =
  | 'MATCHED'
  | 'NETWORK_MISMATCH'
  | 'IP_CHECK_DISABLED'
  | 'ALLOWLIST_NOT_CONFIGURED'
  | 'INVALID_IP';

export interface IpVerificationResult {
  status: IpVerificationStatus;
  reason: IpVerificationReason;
  observedIp: string | null;
  isAllowed: boolean;
  policy: 'review' | 'reject';
  details?: string;
}

export interface ExtractClientIpOptions {
  trustProxy?: boolean;
  trustedProxyCount?: number;
}

/**
 * Normalizes an IP address:
 * - Trims whitespace
 * - Strips IPv4-mapped IPv6 prefixes (e.g., ::ffff:192.168.1.1 -> 192.168.1.1)
 * - Strips bracketed IPv6 formatting (e.g., [::1] -> ::1)
 */
export function normalizeIp(ip: string | null | undefined): string | null {
  if (!ip || typeof ip !== 'string') return null;
  let cleaned = ip.trim();
  if (!cleaned) return null;

  // Remove surrounding brackets if present (e.g., [::1])
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1);
  }

  // IPv4-mapped IPv6 prefix (e.g., ::ffff:192.168.1.1 or ::ffff:127.0.0.1)
  const ipv4MappedMatch = cleaned.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (ipv4MappedMatch) {
    return ipv4MappedMatch[1];
  }

  return cleaned.toLowerCase();
}

/**
 * Safely extracts the authoritative client IP from a Request / NextRequest / Express request.
 * Does not trust arbitrary frontend headers unless trusted reverse proxy forwarding is enabled.
 */
export function extractClientIp(
  request: any,
  options?: ExtractClientIpOptions
): string | null {
  if (!request) return null;

  const trustProxy = options?.trustProxy ?? config.security.trustProxy;
  const trustedProxyCount = options?.trustedProxyCount ?? config.security.trustedProxyCount;

  // Helper to extract header regardless of Request vs Express Request shape
  const getHeader = (name: string): string | null => {
    if (typeof request.headers?.get === 'function') {
      return request.headers.get(name);
    }
    if (request.headers && typeof request.headers === 'object') {
      const val = request.headers[name] || request.headers[name.toLowerCase()];
      if (Array.isArray(val)) return val[0] || null;
      return typeof val === 'string' ? val : null;
    }
    return null;
  };

  const directSocketIp = normalizeIp(
    request.ip ||
    request.socket?.remoteAddress ||
    request.connection?.remoteAddress
  );

  // If reverse proxies are untrusted, return socket IP immediately without reading X-Forwarded-For
  if (!trustProxy) {
    return directSocketIp;
  }

  // Trusted proxy mode: inspect X-Forwarded-For
  const forwardedFor = getHeader('x-forwarded-for');
  if (forwardedFor) {
    const rawIps = forwardedFor
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (rawIps.length > 0) {
      // In X-Forwarded-For: client, proxy1, proxy2...
      // With trustedProxyCount = N, the real client is N hops back from the right
      const targetIndex = Math.max(0, rawIps.length - trustedProxyCount);
      const chosenIp = normalizeIp(rawIps[targetIndex]);
      if (chosenIp) {
        return chosenIp;
      }
    }
  }

  // Fallback to X-Real-IP if set by upstream trusted reverse proxy
  const realIp = getHeader('x-real-ip');
  if (realIp) {
    const normalized = normalizeIp(realIp);
    if (normalized) return normalized;
  }

  return directSocketIp;
}

/**
 * Parses an IPv4 string into a 32-bit unsigned number.
 * Returns null if not a valid IPv4 address.
 */
function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let num = 0;
  for (let i = 0; i < 4; i++) {
    const octet = Number(parts[i]);
    if (isNaN(octet) || octet < 0 || octet > 255 || parts[i].trim() !== String(octet)) {
      return null;
    }
    num = ((num << 8) | octet) >>> 0;
  }
  return num;
}

/**
 * Checks if an IPv4 address falls within a given CIDR block or matches exactly.
 */
export function isIpv4InCidr(ip: string, cidrOrIp: string): boolean {
  const ipNum = ipv4ToNumber(ip);
  if (ipNum === null) return false;

  const [rangeIp, prefixStr] = cidrOrIp.split('/');
  const rangeNum = ipv4ToNumber(rangeIp);
  if (rangeNum === null) return false;

  if (prefixStr === undefined) {
    // Exact IP match
    return ipNum === rangeNum;
  }

  const prefix = Number(prefixStr);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  if (prefix === 0) return true;

  const mask = prefix === 32 ? 0xffffffff : ((~0 << (32 - prefix)) >>> 0);
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Expands an IPv6 address into 8 16-bit numeric segments.
 */
function expandIpv6(ip: string): number[] | null {
  let cleaned = ip.toLowerCase();
  // Strip zone index if present (e.g., fe80::1%eth0)
  const zoneIndex = cleaned.indexOf('%');
  if (zoneIndex !== -1) {
    cleaned = cleaned.slice(0, zoneIndex);
  }

  // Handle :: expansion
  const doubleColonIndex = cleaned.indexOf('::');
  if (doubleColonIndex !== -1) {
    const left = cleaned.slice(0, doubleColonIndex).split(':').filter(Boolean);
    const right = cleaned.slice(doubleColonIndex + 2).split(':').filter(Boolean);
    const missingCount = 8 - (left.length + right.length);
    if (missingCount < 1) return null;
    const zeros = new Array(missingCount).fill('0');
    const full = [...left, ...zeros, ...right];
    if (full.length !== 8) return null;
    return full.map((seg) => parseInt(seg, 16));
  }

  const parts = cleaned.split(':');
  if (parts.length !== 8) return null;
  return parts.map((seg) => parseInt(seg, 16));
}

/**
 * Checks if an IPv6 address matches an IPv6 address or CIDR range.
 */
export function isIpv6InCidr(ip: string, cidrOrIp: string): boolean {
  const [rangeIp, prefixStr] = cidrOrIp.split('/');
  const ipSegments = expandIpv6(ip);
  const rangeSegments = expandIpv6(rangeIp);

  if (!ipSegments || !rangeSegments) return false;

  if (prefixStr === undefined) {
    return ipSegments.every((seg, i) => seg === rangeSegments[i]);
  }

  const prefix = Number(prefixStr);
  if (isNaN(prefix) || prefix < 0 || prefix > 128) return false;

  let remainingBits = prefix;
  for (let i = 0; i < 8; i++) {
    if (remainingBits >= 16) {
      if (ipSegments[i] !== rangeSegments[i]) return false;
      remainingBits -= 16;
    } else if (remainingBits > 0) {
      const mask = (0xffff << (16 - remainingBits)) & 0xffff;
      if ((ipSegments[i] & mask) !== (rangeSegments[i] & mask)) return false;
      remainingBits = 0;
    } else {
      break;
    }
  }

  return true;
}

/**
 * Matches an IP against an allowlist pattern (single IP or CIDR, IPv4 or IPv6).
 */
export function matchesIpPattern(clientIp: string, pattern: string): boolean {
  const normClient = normalizeIp(clientIp);
  const normPattern = pattern.trim();
  if (!normClient || !normPattern) return false;

  // Special localhost equivalence
  if ((normClient === '127.0.0.1' || normClient === '::1') &&
      (normPattern === '127.0.0.1' || normPattern === '::1' || normPattern === 'localhost')) {
    return true;
  }

  const isClientIpv4 = normClient.includes('.');
  const isPatternIpv4 = normPattern.includes('.');

  if (isClientIpv4 && isPatternIpv4) {
    return isIpv4InCidr(normClient, normPattern);
  }

  if (!isClientIpv4 && !isPatternIpv4) {
    return isIpv6InCidr(normClient, normPattern);
  }

  return false;
}

/**
 * Parses a comma-separated allowlist string into a list of cleaned entries.
 */
export function parseAllowlist(rawAllowlist?: string | null): string[] {
  if (!rawAllowlist) return [];
  return rawAllowlist
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface VerifyCampusIpOptions {
  enabled?: boolean;
  policy?: 'review' | 'reject';
  allowlist?: string | string[];
}

/**
 * Authoritative campus IP verification function.
 * Evaluates the observed client IP against the institution's allowlist.
 */
export function verifyCampusIp(
  clientIp: string | null | undefined,
  options?: VerifyCampusIpOptions
): IpVerificationResult {
  const enabled = options?.enabled ?? config.security.ipCheckEnabled;
  const policy = options?.policy ?? config.security.ipMismatchPolicy;
  const rawAllowlist = options?.allowlist ?? config.security.campusIpAllowlist;

  const normalizedIp = normalizeIp(clientIp);

  // 1. IP Check Disabled
  if (!enabled) {
    return {
      status: 'skipped',
      reason: 'IP_CHECK_DISABLED',
      observedIp: normalizedIp,
      isAllowed: true,
      policy,
      details: 'Campus IP verification is disabled in server configuration.',
    };
  }

  // 2. Unconfigured Allowlist (Dev / Sandbox Safety)
  const allowlist = Array.isArray(rawAllowlist) ? rawAllowlist : parseAllowlist(rawAllowlist);
  if (allowlist.length === 0) {
    return {
      status: 'not_configured',
      reason: 'ALLOWLIST_NOT_CONFIGURED',
      observedIp: normalizedIp,
      isAllowed: true,
      policy,
      details: 'CAMPUS_IP_ALLOWLIST is not configured. Request permitted in permissive development mode.',
    };
  }

  // 3. Missing or Malformed Client IP
  if (!normalizedIp) {
    const isAllowed = policy === 'review';
    return {
      status: isAllowed ? 'review_required' : 'network_mismatch',
      reason: 'INVALID_IP',
      observedIp: null,
      isAllowed,
      policy,
      details: 'Unable to detect authoritative client IP from request.',
    };
  }

  // 4. Evaluate against Allowlist
  const isMatch = allowlist.some((entry) => matchesIpPattern(normalizedIp, entry));

  if (isMatch) {
    return {
      status: 'matched',
      reason: 'MATCHED',
      observedIp: normalizedIp,
      isAllowed: true,
      policy,
      details: `Client IP matched campus network allowlist.`,
    };
  }

  // 5. Network Mismatch: Enforce Configured Policy
  if (policy === 'reject') {
    return {
      status: 'network_mismatch',
      reason: 'NETWORK_MISMATCH',
      observedIp: normalizedIp,
      isAllowed: false,
      policy: 'reject',
      details: `Client IP (${normalizedIp}) is not within the campus allowlist. Rejected by strict policy.`,
    };
  }

  // Default Policy: 'review'
  return {
    status: 'review_required',
    reason: 'NETWORK_MISMATCH',
    observedIp: normalizedIp,
    isAllowed: true,
    policy: 'review',
    details: `Client IP (${normalizedIp}) is outside the campus network. Attendance flagged for teacher review.`,
  };
}
