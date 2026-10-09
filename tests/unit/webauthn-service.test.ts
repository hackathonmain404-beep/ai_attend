import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication,
  listStudentWebAuthnCredentials,
  revokeStudentWebAuthnCredential,
} from '@/lib/security/webauthn-service';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  ValidationError,
} from '@/lib/errors';
import { verifyRegistrationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server';

vi.mock('@simplewebauthn/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@simplewebauthn/server')>();
  return {
    ...actual,
    verifyRegistrationResponse: vi.fn(),
    verifyAuthenticationResponse: vi.fn(),
  };
});

// Helper to create a comprehensive chainable Supabase query mock
function createMockTable(getRows: () => any[], setRows: (rows: any[]) => void) {
  const executeFilter = (filters: any[], orClause?: string) => {
    let list = [...getRows()];
    for (const f of filters) {
      if (f.isNull !== undefined) {
        list = list.filter((r) => (f.isNull ? r[f.field] === null : r[f.field] !== null));
      } else if (f.gt !== undefined) {
        list = list.filter((r) => new Date(r[f.field]).getTime() > new Date(f.gt).getTime());
      } else {
        list = list.filter((r) => r[f.field] === f.val);
      }
    }
    if (orClause) {
      const match = orClause.match(/id\.eq\.([^,]+)/);
      if (match) {
        const targetId = match[1];
        list = list.filter((r) => r.id === targetId || r.credential_id === targetId);
      }
    }
    return list;
  };

  const createSelectChain = () => {
    const chain: any = {
      _filters: [],
      _or: undefined,
      _limit: undefined,
      eq: vi.fn((field: string, val: any) => {
        chain._filters.push({ field, val });
        return chain;
      }),
      is: vi.fn((field: string, val: any) => {
        chain._filters.push({ field, isNull: val === null });
        return chain;
      }),
      gt: vi.fn((field: string, val: any) => {
        chain._filters.push({ field, gt: val });
        return chain;
      }),
      or: vi.fn((clause: string) => {
        chain._or = clause;
        return chain;
      }),
      order: vi.fn(() => chain),
      limit: vi.fn((lim: number) => {
        chain._limit = lim;
        return chain;
      }),
      single: vi.fn(async () => {
        const rows = executeFilter(chain._filters, chain._or);
        if (rows.length > 0) return { data: rows[0], error: null };
        return { data: null, error: { message: 'Not found' } };
      }),
      maybeSingle: vi.fn(async () => {
        const rows = executeFilter(chain._filters, chain._or);
        return { data: rows[0] || null, error: null };
      }),
      then: (resolve: any) => {
        let rows = executeFilter(chain._filters, chain._or);
        if (chain._limit) rows = rows.slice(0, chain._limit);
        return Promise.resolve({ data: rows, error: null }).then(resolve);
      },
    };
    return chain;
  };

  return {
    select: vi.fn(() => createSelectChain()),
    insert: vi.fn((payload: any) => {
      const rows = getRows();
      const record = {
        id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        consumed_at: null,
        ...payload,
      };
      rows.push(record);
      setRows(rows);

      return {
        select: vi.fn(() => ({
          single: vi.fn(async () => {
            return { data: record, error: null };
          }),
        })),
        then: (resolve: any) => {
          return Promise.resolve({ data: record, error: null }).then(resolve);
        },
      };
    }),
    update: vi.fn((patch: any) => {
      const chain: any = {
        _filters: [],
        eq: vi.fn((field: string, val: any) => {
          chain._filters.push({ field, val });
          return chain;
        }),
        is: vi.fn((field: string, val: any) => {
          chain._filters.push({ field, isNull: val === null });
          return chain;
        }),
        gt: vi.fn((field: string, val: any) => {
          chain._filters.push({ field, gt: val });
          return chain;
        }),
        select: vi.fn(() => ({
          single: vi.fn(async () => {
            const rows = getRows();
            const idx = rows.findIndex((r) => {
              return chain._filters.every((f: any) => {
                if (f.isNull !== undefined) return f.isNull ? r[f.field] === null : r[f.field] !== null;
                if (f.gt !== undefined) return new Date(r[f.field]).getTime() > new Date(f.gt).getTime();
                return r[f.field] === f.val;
              });
            });
            if (idx !== -1) {
              Object.assign(rows[idx], patch);
              setRows(rows);
              return { data: rows[idx], error: null };
            }
            return { data: null, error: { message: 'Not found or criteria not met' } };
          }),
          maybeSingle: vi.fn(async () => {
            const rows = getRows();
            const idx = rows.findIndex((r) => {
              return chain._filters.every((f: any) => {
                if (f.isNull !== undefined) return f.isNull ? r[f.field] === null : r[f.field] !== null;
                if (f.gt !== undefined) return new Date(r[f.field]).getTime() > new Date(f.gt).getTime();
                return r[f.field] === f.val;
              });
            });
            if (idx !== -1) {
              Object.assign(rows[idx], patch);
              setRows(rows);
              return { data: rows[idx], error: null };
            }
            return { data: null, error: null };
          }),
        })),
        then: (resolve: any) => {
          const rows = getRows();
          const target = rows.find((r) =>
            chain._filters.every((f: any) => r[f.field] === f.val)
          );
          if (target) Object.assign(target, patch);
          return Promise.resolve({ data: target, error: null }).then(resolve);
        },
      };
      return chain;
    }),
  };
}

describe('WebAuthn Backend Service (tests/unit/webauthn-service.test.ts)', () => {
  const studentA = 'student-uuid-1111';
  const studentB = 'student-uuid-2222';
  const testSessionId = 'session-uuid-3333';
  const testFingerprint = 'sha256-token-fingerprint-abc';

  let mockDb: any;
  let inMemoryChallenges: any[];
  let inMemoryCredentials: any[];
  let inMemorySecurityEvents: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    inMemoryChallenges = [];
    inMemoryCredentials = [];
    inMemorySecurityEvents = [];

    const credTable = createMockTable(
      () => inMemoryCredentials,
      (rows) => {
        inMemoryCredentials = rows;
      }
    );

    const challengeTable = createMockTable(
      () => inMemoryChallenges,
      (rows) => {
        inMemoryChallenges = rows;
      }
    );

    mockDb = {
      from: vi.fn((table: string) => {
        if (table === 'webauthn_credentials') return credTable;
        if (table === 'webauthn_challenges') return challengeTable;
        if (table === 'security_events') {
          return {
            insert: vi.fn((events: any) => {
              const arr = Array.isArray(events) ? events : [events];
              inMemorySecurityEvents.push(...arr);
              return Promise.resolve({ data: arr, error: null });
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
          };
        }
        return {};
      }),
    };
  });

  // ==========================================================================
  // 1. REGISTRATION OPTIONS
  // ==========================================================================
  describe('Registration Options Generation', () => {
    it('generates fresh WebAuthn options and stores challenge bound to student', async () => {
      const result = await generateWebAuthnRegistrationOptions({
        userId: studentA,
        adminClient: mockDb,
      });

      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('challengeId');
      expect(result.options.challenge).toBeDefined();
      expect(result.options.rp.id).toBeDefined();
      expect(result.options.authenticatorSelection?.userVerification).toBe('required');

      // Verify challenge saved in DB
      expect(inMemoryChallenges.length).toBe(1);
      expect(inMemoryChallenges[0].user_id).toBe(studentA);
      expect(inMemoryChallenges[0].purpose).toBe('registration');
      expect(inMemoryChallenges[0].consumed_at).toBeNull();
    });

    it('rejects registration options for unauthenticated student ID', async () => {
      await expect(
        generateWebAuthnRegistrationOptions({
          userId: '',
          adminClient: mockDb,
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('excludes already registered credentials to prevent duplicate credentials', async () => {
      inMemoryCredentials.push({
        id: 'c1',
        user_id: studentA,
        credential_id: 'existing-cred-id-123',
        public_key: 'pk123',
        counter: 0,
        backed_up: false,
        revoked_at: null,
      });

      const result = await generateWebAuthnRegistrationOptions({
        userId: studentA,
        adminClient: mockDb,
      });
      expect(result.options.excludeCredentials?.length).toBe(1);
      expect(result.options.excludeCredentials?.[0].id).toBe('existing-cred-id-123');
    });
  });

  // ==========================================================================
  // 2. REGISTRATION VERIFICATION
  // ==========================================================================
  describe('Registration Verification', () => {
    it('successfully verifies valid registration response and stores public key', async () => {
      const { challengeId } = await generateWebAuthnRegistrationOptions({
        userId: studentA,
        adminClient: mockDb,
      });

      vi.mocked(verifyRegistrationResponse).mockResolvedValueOnce({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'new-reg-credential-123',
            publicKey: new Uint8Array([1, 2, 3, 4, 5]),
            counter: 0,
            transports: ['internal'],
          },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
        } as any,
      });

      const mockClientResponse: any = {
        id: 'new-reg-credential-123',
        rawId: 'new-reg-credential-123',
        response: {
          clientDataJSON: 'mock-clientData',
          attestationObject: 'mock-attestation',
        },
        type: 'public-key',
      };

      const result = await verifyWebAuthnRegistration({
        studentId: studentA,
        challengeId,
        response: mockClientResponse,
        adminClient: mockDb,
      });

      expect(result.verified).toBe(true);
      expect(result.credentialId).toBe('new-reg-credential-123');

      // Verify challenge consumed atomically
      expect(inMemoryChallenges[0].consumed_at).not.toBeNull();

      // Verify credential persisted in DB
      expect(inMemoryCredentials.length).toBe(1);
      expect(inMemoryCredentials[0].credential_id).toBe('new-reg-credential-123');
      expect(inMemoryCredentials[0].user_id).toBe(studentA);

      // Verify audit log recorded
      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_REGISTER_SUCCESS')).toBe(true);
    });

    it('rejects expired challenge during registration verification', async () => {
      const { challengeId } = await generateWebAuthnRegistrationOptions({
        userId: studentA,
        adminClient: mockDb,
      });
      // Expire challenge
      inMemoryChallenges[0].expires_at = new Date(Date.now() - 10000).toISOString();

      await expect(
        verifyWebAuthnRegistration({
          studentId: studentA,
          challengeId,
          response: { id: 'cred' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ConflictError);

      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_CHALLENGE_EXPIRED')).toBe(true);
    });

    it('rejects replayed / already consumed challenge during registration verification', async () => {
      const { challengeId } = await generateWebAuthnRegistrationOptions({
        userId: studentA,
        adminClient: mockDb,
      });
      // Mark consumed
      inMemoryChallenges[0].consumed_at = new Date().toISOString();

      await expect(
        verifyWebAuthnRegistration({
          studentId: studentA,
          challengeId,
          response: { id: 'cred' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ConflictError);

      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_CHALLENGE_REPLAY')).toBe(true);
    });

    it('rejects credential collision if already registered to another account', async () => {
      // Existing credential for studentB
      inMemoryCredentials.push({
        id: 'c1',
        user_id: studentB,
        credential_id: 'shared-colliding-cred-id',
        public_key: 'pk',
        counter: 0,
        backed_up: false,
        revoked_at: null,
      });

      const { challengeId } = await generateWebAuthnRegistrationOptions({
        userId: studentA,
        adminClient: mockDb,
      });

      vi.mocked(verifyRegistrationResponse).mockResolvedValueOnce({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'shared-colliding-cred-id',
            publicKey: new Uint8Array([1, 2, 3]),
            counter: 0,
          },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
        } as any,
      });

      await expect(
        verifyWebAuthnRegistration({
          studentId: studentA,
          challengeId,
          response: { id: 'shared-colliding-cred-id' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ConflictError);

      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_REGISTER_FAILED')).toBe(true);
    });

    it('rejects invalid cryptographic signature / library verification failure', async () => {
      const { challengeId } = await generateWebAuthnRegistrationOptions({
        userId: studentA,
        adminClient: mockDb,
      });

      vi.mocked(verifyRegistrationResponse).mockResolvedValueOnce({
        verified: false,
      } as any);

      await expect(
        verifyWebAuthnRegistration({
          studentId: studentA,
          challengeId,
          response: { id: 'bad-cred' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ValidationError);

      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_REGISTER_FAILED')).toBe(true);
    });
  });

  // ==========================================================================
  // 3. AUTHENTICATION CHALLENGE & ASSERTION VERIFICATION
  // ==========================================================================
  describe('Authentication Challenge Options', () => {
    it('returns requiresRegistration: true if student has no active credentials', async () => {
      const res = await generateWebAuthnAuthenticationOptions({
        studentId: studentA,
        sessionId: testSessionId,
        tokenFingerprint: testFingerprint,
        adminClient: mockDb,
      });

      expect(res.requiresRegistration).toBe(true);
      expect(res.options).toBeUndefined();
    });

    it('generates bound authentication challenge when student has registered credentials', async () => {
      inMemoryCredentials.push({
        id: 'c1',
        user_id: studentA,
        credential_id: 'cred-1',
        public_key: 'pk1',
        counter: 1,
        backed_up: false,
        revoked_at: null,
      });

      const res = await generateWebAuthnAuthenticationOptions({
        studentId: studentA,
        sessionId: testSessionId,
        tokenFingerprint: testFingerprint,
        adminClient: mockDb,
      });

      expect(res.requiresRegistration).toBe(false);
      expect(res.options).toBeDefined();
      expect(res.options?.userVerification).toBe('required');
      expect(res.challengeId).toBeDefined();

      expect(inMemoryChallenges.length).toBe(1);
      expect(inMemoryChallenges[0].purpose).toBe('attendance_authentication');
      expect(inMemoryChallenges[0].session_id).toBe(testSessionId);
      expect(inMemoryChallenges[0].token_fingerprint).toBe(testFingerprint);
    });
  });

  describe('Assertion Verification Before Attendance', () => {
    it('successfully verifies valid WebAuthn assertion signature', async () => {
      inMemoryCredentials.push({
        id: 'c1',
        user_id: studentA,
        credential_id: 'cred-1',
        public_key: Buffer.from(new Uint8Array([10, 20, 30])).toString('base64url'),
        counter: 5,
        backed_up: false,
        revoked_at: null,
      });

      const { challengeId } = await generateWebAuthnAuthenticationOptions({
        studentId: studentA,
        sessionId: testSessionId,
        tokenFingerprint: testFingerprint,
        adminClient: mockDb,
      });

      vi.mocked(verifyAuthenticationResponse).mockResolvedValueOnce({
        verified: true,
        authenticationInfo: {
          newCounter: 6,
          credentialID: 'cred-1',
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
        } as any,
      });

      const res = await verifyWebAuthnAuthentication({
        studentId: studentA,
        sessionId: testSessionId,
        tokenFingerprint: testFingerprint,
        challengeId: challengeId!,
        response: { id: 'cred-1' } as any,
        adminClient: mockDb,
      });

      expect(res.verified).toBe(true);
      expect(res.credentialId).toBe('cred-1');

      // Verify challenge consumed atomically
      expect(inMemoryChallenges[0].consumed_at).not.toBeNull();

      // Verify counter incremented in DB
      expect(inMemoryCredentials[0].counter).toBe(6);

      // Verify audit log
      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_AUTH_SUCCESS')).toBe(true);
    });

    it('rejects credential belonging to another user (wrong student)', async () => {
      inMemoryCredentials.push({
        id: 'c2',
        user_id: studentB,
        credential_id: 'cred-student-b',
        public_key: 'pk-b',
        counter: 1,
        backed_up: false,
        revoked_at: null,
      });

      const { challengeId } = await generateWebAuthnAuthenticationOptions({
        studentId: studentB,
        sessionId: testSessionId,
        tokenFingerprint: testFingerprint,
        adminClient: mockDb,
      });

      // Student A tries to verify with Student B's challenge/credential
      await expect(
        verifyWebAuthnAuthentication({
          studentId: studentA,
          sessionId: testSessionId,
          tokenFingerprint: testFingerprint,
          challengeId: challengeId!,
          response: { id: 'cred-student-b' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects revoked credential', async () => {
      inMemoryCredentials.push({
        id: 'c1',
        user_id: studentA,
        credential_id: 'cred-revoked',
        public_key: 'pk',
        counter: 1,
        backed_up: false,
        revoked_at: new Date().toISOString(), // Revoked!
      });

      inMemoryChallenges.push({
        id: 'chal-test',
        user_id: studentA,
        session_id: testSessionId,
        challenge: 'mock-chal',
        purpose: 'attendance_authentication',
        token_fingerprint: testFingerprint,
        expires_at: new Date(Date.now() + 60000).toISOString(),
        consumed_at: null,
      });

      await expect(
        verifyWebAuthnAuthentication({
          studentId: studentA,
          sessionId: testSessionId,
          tokenFingerprint: testFingerprint,
          challengeId: 'chal-test',
          response: { id: 'cred-revoked' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects challenge if token fingerprint mismatch (QR token switched)', async () => {
      inMemoryCredentials.push({
        id: 'c1',
        user_id: studentA,
        credential_id: 'cred-1',
        public_key: 'pk',
        counter: 1,
        backed_up: false,
        revoked_at: null,
      });

      const { challengeId } = await generateWebAuthnAuthenticationOptions({
        studentId: studentA,
        sessionId: testSessionId,
        tokenFingerprint: testFingerprint,
        adminClient: mockDb,
      });

      await expect(
        verifyWebAuthnAuthentication({
          studentId: studentA,
          sessionId: testSessionId,
          tokenFingerprint: 'different-fingerprint-xyz',
          challengeId: challengeId!,
          response: { id: 'cred-1' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects replayed authentication challenge', async () => {
      inMemoryCredentials.push({
        id: 'c1',
        user_id: studentA,
        credential_id: 'cred-1',
        public_key: 'pk',
        counter: 1,
        backed_up: false,
        revoked_at: null,
      });

      const { challengeId } = await generateWebAuthnAuthenticationOptions({
        studentId: studentA,
        sessionId: testSessionId,
        tokenFingerprint: testFingerprint,
        adminClient: mockDb,
      });

      // Mark challenge already consumed
      inMemoryChallenges[0].consumed_at = new Date().toISOString();

      await expect(
        verifyWebAuthnAuthentication({
          studentId: studentA,
          sessionId: testSessionId,
          tokenFingerprint: testFingerprint,
          challengeId: challengeId!,
          response: { id: 'cred-1' } as any,
          adminClient: mockDb,
        })
      ).rejects.toThrow(ConflictError);

      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_CHALLENGE_REPLAY')).toBe(true);
    });
  });

  // ==========================================================================
  // 4. CREDENTIAL MANAGEMENT & REVOCATION
  // ==========================================================================
  describe('Credential Management & Revocation', () => {
    it('lists only credentials belonging to authenticated student', async () => {
      inMemoryCredentials.push(
        { id: 'c1', user_id: studentA, credential_id: 'id1', revoked_at: null, created_at: new Date().toISOString() },
        { id: 'c2', user_id: studentB, credential_id: 'id2', revoked_at: null, created_at: new Date().toISOString() }
      );

      const list = await listStudentWebAuthnCredentials(studentA, undefined, mockDb);
      expect(list.length).toBe(1);
      expect(list[0].credentialId).toBe('id1');
    });

    it('prevents student from revoking another student credential', async () => {
      inMemoryCredentials.push({
        id: 'c-victim',
        user_id: studentB,
        credential_id: 'id-victim',
        revoked_at: null,
      });

      await expect(
        revokeStudentWebAuthnCredential({
          studentId: studentA,
          credentialId: 'c-victim',
          adminClient: mockDb,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows student to revoke their own compromised credential', async () => {
      inMemoryCredentials.push({
        id: 'c-mine',
        user_id: studentA,
        credential_id: 'id-mine',
        revoked_at: null,
      });

      const res = await revokeStudentWebAuthnCredential({
        studentId: studentA,
        credentialId: 'c-mine',
        adminClient: mockDb,
      });
      expect(res.success).toBe(true);
      expect(inMemoryCredentials[0].revoked_at).not.toBeNull();
      expect(inMemorySecurityEvents.some((e) => e.event_type === 'WEBAUTHN_CREDENTIAL_REVOKED')).toBe(true);
    });
  });
});
