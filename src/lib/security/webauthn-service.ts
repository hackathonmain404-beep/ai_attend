/**
 * AttendGuard WebAuthn & Cryptographic Biometric/Passkey Service
 * 
 * Provides server-authoritative FIDO2/WebAuthn ceremonies using @simplewebauthn/server:
 * 1. Platform authenticator registration (fingerprint, Face ID, Windows Hello, PIN)
 * 2. Fresh session-bound authentication challenge generation for attendance
 * 3. Cryptographic signature and assertion verification
 * 4. Atomic challenge nonce consumption (replay & race condition prevention)
 * 5. Credential counter integrity and revocation management
 * 6. Tamper-evident security event audit trails
 * 
 * Invariants:
 * - Never stores or handles raw biometric data, templates, or images
 * - Never accepts client-side claimed verification (e.g. biometricVerified: true)
 * - Challenges are single-use, server-stored, and bound to (student, session, QR token)
 * - Enforces userVerification: 'required'
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { config } from '@/lib/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError, UnauthorizedError, BadRequestError } from '@/lib/errors';
import { logSecurityEvent } from '@/lib/security/audit-service';
import { logAuditEvent } from '@/lib/audit/logger';

export interface WebAuthnRegistrationOptionsResult {
  options: any;
  challengeId: string;
}

export interface WebAuthnAuthenticationOptionsResult {
  options?: any;
  challengeId?: string;
  requiresRegistration: boolean;
  message?: string;
}

/**
 * 1. Generates fresh WebAuthn registration options for an authenticated student.
 */
export async function generateWebAuthnRegistrationOptions(params: {
  userId?: string;
  studentId?: string;
  email?: string;
  fullName?: string;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
}): Promise<WebAuthnRegistrationOptionsResult> {
  const userId = params.userId || params.studentId;
  if (!userId) {
    throw new UnauthorizedError('Student ID is required to generate registration options');
  }
  const email = params.email || `student-${userId}@attendguard.local`;
  const fullName = params.fullName || 'AttendGuard Student';
  const adminDb = params.adminClient || createAdminClient();

  // 1. Fetch any existing credentials to exclude them (prevents re-registering same device)
  const { data: existingCreds } = await adminDb
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', userId)
    .is('revoked_at', null);

  const excludeCredentials = (existingCreds || []).map((c: any) => ({
    id: c.credential_id,
    transports: c.transports || undefined,
  }));

  // 2. Generate registration options
  const options = await generateRegistrationOptions({
    rpName: config.webauthn.rpName,
    rpID: config.webauthn.rpID,
    userID: new TextEncoder().encode(userId),
    userName: email,
    userDisplayName: fullName || email,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Prefer device platform authenticator (fingerprint/face/PIN)
      userVerification: 'required',
      residentKey: 'preferred',
    },
    excludeCredentials,
  });

  const ttl = config.webauthn.challengeTtlSeconds;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  // 3. Store server-authoritative challenge nonce
  const { data: challengeRecord, error: challengeError } = await adminDb
    .from('webauthn_challenges')
    .insert({
      user_id: userId,
      session_id: null,
      challenge: options.challenge,
      purpose: 'registration',
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (challengeError || !challengeRecord) {
    throw new Error(`Failed to generate registration challenge: ${challengeError?.message}`);
  }

  return {
    options,
    challengeId: challengeRecord.id,
  };
}

/**
 * 2. Verifies student registration response and registers credential.
 */
export async function verifyWebAuthnRegistration(params: {
  userId?: string;
  studentId?: string;
  challengeId: string;
  response: RegistrationResponseJSON;
  ipAddress?: string | null;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
}): Promise<{ verified: boolean; credentialId: string }> {
  const userId = params.userId || params.studentId;
  if (!userId) {
    throw new UnauthorizedError('Student ID is required to verify registration');
  }
  const { challengeId, response, ipAddress } = params;
  const adminDb = params.adminClient || createAdminClient();

  if (!challengeId || typeof challengeId !== 'string') {
    throw new ValidationError('A valid challengeId is required.');
  }

  if (!response || !response.id) {
    throw new ValidationError('A valid WebAuthn registration response is required.');
  }

  // 1. Atomically consume the challenge nonce (protects against concurrent race conditions & reuse)
  const now = new Date().toISOString();
  const { data: consumedChallenge, error: consumeError } = await adminDb
    .from('webauthn_challenges')
    .update({ consumed_at: now })
    .eq('id', challengeId)
    .eq('user_id', userId)
    .eq('purpose', 'registration')
    .is('consumed_at', null)
    .gt('expires_at', now)
    .select('*')
    .maybeSingle();

  if (consumeError || !consumedChallenge) {
    // Audit investigation of failure reason
    const { data: staleChallenge } = await adminDb
      .from('webauthn_challenges')
      .select('consumed_at, expires_at')
      .eq('id', challengeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (staleChallenge?.consumed_at) {
      await logSecurityEvent(
        {
          eventType: 'WEBAUTHN_CHALLENGE_REPLAY',
          studentId: userId,
          verificationStatus: 'failed',
          reason: 'Attempted to replay consumed WebAuthn registration challenge',
          ipAddress,
        },
        adminDb
      );
      throw new ConflictError('WebAuthn challenge has already been consumed. Please restart registration.', 'CHALLENGE_REPLAYED' as any);
    }

    if (staleChallenge && new Date(staleChallenge.expires_at) <= new Date()) {
      await logSecurityEvent(
        {
          eventType: 'WEBAUTHN_CHALLENGE_EXPIRED',
          studentId: userId,
          verificationStatus: 'failed',
          reason: 'WebAuthn registration challenge expired before submission',
          ipAddress,
        },
        adminDb
      );
      throw new ConflictError('WebAuthn challenge has expired. Please restart registration.', 'CHALLENGE_EXPIRED' as any);
    }

    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_REGISTER_FAILED',
        studentId: userId,
        verificationStatus: 'failed',
        reason: 'Invalid or missing WebAuthn registration challenge reference',
        ipAddress,
      },
      adminDb
    );
    throw new ValidationError('Invalid registration challenge reference.');
  }

  // 2. Cryptographic signature and parameters verification
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: consumedChallenge.challenge,
      expectedOrigin: config.webauthn.origin,
      expectedRPID: config.webauthn.rpID,
      requireUserVerification: true,
    });
  } catch (err: any) {
    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_REGISTER_FAILED',
        studentId: userId,
        verificationStatus: 'failed',
        reason: err.message || 'Cryptographic WebAuthn registration verification failed',
        ipAddress,
      },
      adminDb
    );
    throw new ValidationError(`WebAuthn registration verification failed: ${err.message}`);
  }

  if (!verification.verified || !verification.registrationInfo) {
    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_REGISTER_FAILED',
        studentId: userId,
        verificationStatus: 'failed',
        reason: 'WebAuthn verification response indicated unverified registration',
        ipAddress,
      },
      adminDb
    );
    throw new ValidationError('WebAuthn registration could not be verified.');
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  // 3. Credential Ownership & Anti-Collision Policy Enforcement
  const { data: existingOwnership } = await adminDb
    .from('webauthn_credentials')
    .select('id, user_id, revoked_at')
    .eq('credential_id', credential.id)
    .maybeSingle();

  if (existingOwnership) {
    if (existingOwnership.user_id !== userId) {
      await logSecurityEvent(
        {
          eventType: 'WEBAUTHN_REGISTER_FAILED',
          studentId: userId,
          verificationStatus: 'rejected',
          reason: 'Attempted to register a WebAuthn credential already owned by another account',
          ipAddress,
          metadata: { credentialId: credential.id },
        },
        adminDb
      );
      throw new ConflictError('This authenticator is already registered to another student account.', 'CREDENTIAL_COLLISION' as any);
    }

    if (!existingOwnership.revoked_at) {
      // Already actively registered to this account
      return { verified: true, credentialId: credential.id };
    }
  }

  // 4. Safely encode public key for persistent relational storage (standard Base64URL string)
  const publicKeyBase64Url = Buffer.from(credential.publicKey).toString('base64url');

  const { error: insertError } = await adminDb
    .from('webauthn_credentials')
    .insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: publicKeyBase64Url,
      counter: credential.counter,
      device_type: credentialDeviceType,
      backed_up: credentialBackedUp,
      transports: credential.transports || [],
      last_used_at: now,
    });

  if (insertError) {
    throw new Error(`Failed to store registered WebAuthn credential: ${insertError.message}`);
  }

  // 5. Append tamper-evident security audit log
  await logSecurityEvent(
    {
      eventType: 'WEBAUTHN_REGISTER_SUCCESS',
      studentId: userId,
      verificationStatus: 'success',
      reason: 'Platform authenticator successfully registered for secure attendance',
      ipAddress,
      metadata: {
        credentialId: credential.id,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    },
    adminDb
  );

  await logAuditEvent(
    {
      actorId: userId,
      action: 'WEBAUTHN_CREDENTIAL_REGISTERED',
      entityType: 'webauthn_credentials',
      entityId: credential.id,
      details: {
        deviceType: credentialDeviceType,
        transports: credential.transports,
      },
      ipAddress: ipAddress || null,
    },
    adminDb
  );

  return {
    verified: true,
    credentialId: credential.id,
  };
}

/**
 * 3. Generates a fresh, session-bound WebAuthn challenge for attendance check-in.
 */
export async function generateWebAuthnAuthenticationOptions(params: {
  userId?: string;
  studentId?: string;
  sessionId: string;
  tokenFingerprint: string;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
}): Promise<WebAuthnAuthenticationOptionsResult> {
  const userId = params.userId || params.studentId;
  if (!userId) {
    throw new UnauthorizedError('Student ID is required to generate authentication options');
  }
  const { sessionId, tokenFingerprint } = params;
  const adminDb = params.adminClient || createAdminClient();

  // 1. Fetch active registered credentials for this student
  const { data: credentials, error: credError } = await adminDb
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', userId)
    .is('revoked_at', null);

  if (credError || !credentials || credentials.length === 0) {
    return {
      requiresRegistration: true,
      message: 'Secure authentication is not registered for this account. Please register your device authenticator before checking in.',
    };
  }

  // 2. Generate authentication challenge options
  const options = await generateAuthenticationOptions({
    rpID: config.webauthn.rpID,
    userVerification: 'required',
    allowCredentials: credentials.map((c: any) => ({
      id: c.credential_id,
      transports: c.transports || undefined,
    })),
  });

  const ttl = config.webauthn.challengeTtlSeconds;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  // 3. Atomically store challenge nonce bound to user, session, and QR fingerprint
  const { data: challengeRecord, error: challengeError } = await adminDb
    .from('webauthn_challenges')
    .insert({
      user_id: userId,
      session_id: sessionId,
      challenge: options.challenge,
      purpose: 'attendance_authentication',
      token_fingerprint: tokenFingerprint,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (challengeError || !challengeRecord) {
    throw new Error(`Failed to generate attendance authentication challenge: ${challengeError?.message}`);
  }

  return {
    options,
    challengeId: challengeRecord.id,
    requiresRegistration: false,
  };
}

/**
 * 4. Verifies a student's WebAuthn authentication assertion during attendance check-in.
 */
export async function verifyWebAuthnAuthentication(params: {
  studentId?: string;
  userId?: string;
  sessionId: string;
  tokenFingerprint: string;
  challengeId: string;
  response: AuthenticationResponseJSON;
  ipAddress?: string | null;
  adminClient?: SupabaseClient;
}): Promise<{ verified: boolean; credentialId: string }> {
  const studentId = params.studentId || params.userId;
  if (!studentId) {
    throw new UnauthorizedError('Student ID is required to verify authentication');
  }
  const { sessionId, tokenFingerprint, challengeId, response, ipAddress } = params;
  const adminDb = params.adminClient || createAdminClient();

  if (!challengeId || typeof challengeId !== 'string') {
    throw new ValidationError('A webauthnChallengeId reference is required.');
  }

  if (!response || !response.id) {
    throw new ValidationError('A webauthnResponse assertion is required.');
  }

  // 1. Atomically consume challenge nonce bound to this student, session, and operation
  const now = new Date().toISOString();
  const { data: challengeRecord, error: consumeError } = await adminDb
    .from('webauthn_challenges')
    .update({ consumed_at: now })
    .eq('id', challengeId)
    .eq('user_id', studentId)
    .eq('session_id', sessionId)
    .eq('purpose', 'attendance_authentication')
    .is('consumed_at', null)
    .gt('expires_at', now)
    .select('*')
    .maybeSingle();

  if (consumeError || !challengeRecord) {
    const { data: staleChallenge } = await adminDb
      .from('webauthn_challenges')
      .select('consumed_at, expires_at, session_id, user_id')
      .eq('id', challengeId)
      .maybeSingle();

    if (staleChallenge?.consumed_at) {
      await logSecurityEvent(
        {
          eventType: 'WEBAUTHN_CHALLENGE_REPLAY',
          studentId,
          sessionId,
          verificationStatus: 'failed',
          reason: 'Attempted to replay consumed WebAuthn attendance challenge',
          ipAddress,
        },
        adminDb
      );
      throw new ConflictError('WebAuthn authentication challenge already consumed. Please re-scan QR.', 'CHALLENGE_REPLAYED' as any);
    }

    if (staleChallenge && new Date(staleChallenge.expires_at) <= new Date()) {
      await logSecurityEvent(
        {
          eventType: 'WEBAUTHN_CHALLENGE_EXPIRED',
          studentId,
          sessionId,
          verificationStatus: 'failed',
          reason: 'WebAuthn authentication challenge expired before assertion completion',
          ipAddress,
        },
        adminDb
      );
      throw new ConflictError('WebAuthn authentication challenge expired. Please re-scan QR.', 'CHALLENGE_EXPIRED' as any);
    }

    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_AUTH_FAILED',
        studentId,
        sessionId,
        verificationStatus: 'failed',
        reason: 'Invalid challenge binding or unauthorized attendance challenge reference',
        ipAddress,
      },
      adminDb
    );
    throw new ForbiddenError('Unauthorized or invalid WebAuthn attendance challenge reference.');
  }

  // 2. Validate challenge was created for this specific QR token fingerprint
  if (challengeRecord.token_fingerprint && challengeRecord.token_fingerprint !== tokenFingerprint) {
    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_AUTH_FAILED',
        studentId,
        sessionId,
        verificationStatus: 'rejected',
        reason: 'WebAuthn challenge token fingerprint mismatch with scanned QR token',
        ipAddress,
      },
      adminDb
    );
    throw new ForbiddenError('WebAuthn challenge was not generated for this classroom QR token.');
  }

  // 3. Retrieve student's registered credential
  const { data: credential, error: credError } = await adminDb
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', response.id)
    .eq('user_id', studentId)
    .is('revoked_at', null)
    .single();

  if (credError || !credential) {
    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_AUTH_FAILED',
        studentId,
        sessionId,
        verificationStatus: 'rejected',
        reason: 'WebAuthn assertion used unknown, revoked, or un-enrolled credential',
        ipAddress,
        metadata: { credentialId: response.id },
      },
      adminDb
    );
    throw new ForbiddenError('WebAuthn credential does not belong to this student or has been revoked.');
  }

  // 4. Verify cryptographic assertion signature
  const publicKeyBytes = new Uint8Array(Buffer.from(credential.public_key, 'base64url'));

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: config.webauthn.origin,
      expectedRPID: config.webauthn.rpID,
      credential: {
        id: credential.credential_id,
        publicKey: publicKeyBytes,
        counter: Number(credential.counter || 0),
        transports: credential.transports || undefined,
      },
      requireUserVerification: true,
    });
  } catch (err: any) {
    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_AUTH_FAILED',
        studentId,
        sessionId,
        verificationStatus: 'failed',
        reason: err.message || 'Cryptographic WebAuthn assertion verification failed',
        ipAddress,
      },
      adminDb
    );
    throw new ForbiddenError(`WebAuthn biometric/passkey verification failed: ${err.message}`);
  }

  if (!verification.verified) {
    await logSecurityEvent(
      {
        eventType: 'WEBAUTHN_AUTH_FAILED',
        studentId,
        sessionId,
        verificationStatus: 'failed',
        reason: 'WebAuthn assertion could not be verified by relying party',
        ipAddress,
      },
      adminDb
    );
    throw new ForbiddenError('WebAuthn biometric/passkey assertion could not be verified.');
  }

  // 5. Update credential counter and last_used_at timestamp
  await adminDb
    .from('webauthn_credentials')
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: now,
    })
    .eq('id', credential.id);

  // 6. Record successful biometric verification audit event
  await logSecurityEvent(
    {
      eventType: 'WEBAUTHN_AUTH_SUCCESS',
      studentId,
      sessionId,
      verificationStatus: 'success',
      reason: 'Biometric / passkey user verification verified cryptographically',
      ipAddress,
      metadata: { credentialId: credential.credential_id },
    },
    adminDb
  );

  return {
    verified: true,
    credentialId: credential.credential_id,
  };
}

/**
 * 5. Lists active and revoked WebAuthn credentials for an authenticated student.
 */
export async function listStudentWebAuthnCredentials(
  userId: string,
  client?: SupabaseClient,
  adminClient?: SupabaseClient
) {
  const supabase = client || adminClient || (await createServerSupabaseClient());

  const { data: credentials, error } = await supabase
    .from('webauthn_credentials')
    .select('id, credential_id, device_type, backed_up, created_at, last_used_at, revoked_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list credentials: ${error.message}`);
  }

  return (credentials || []).map((c: any) => ({
    id: c.id,
    credentialId: c.credential_id,
    deviceType: c.device_type || 'platform',
    backedUp: Boolean(c.backed_up),
    createdAt: c.created_at,
    lastUsedAt: c.last_used_at,
    isRevoked: Boolean(c.revoked_at),
    revokedAt: c.revoked_at,
  }));
}

/**
 * 6. Revokes an active WebAuthn credential owned by an authenticated student.
 */
export async function revokeStudentWebAuthnCredential(params: {
  userId?: string;
  studentId?: string;
  credentialId: string;
  ipAddress?: string | null;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
}) {
  const userId = params.userId || params.studentId;
  if (!userId) {
    throw new UnauthorizedError('Student ID is required to revoke credential');
  }
  const { credentialId, ipAddress } = params;
  const adminDb = params.adminClient || params.client || createAdminClient();

  // Verify ownership before revoking
  const { data: targetCred, error: lookupError } = await adminDb
    .from('webauthn_credentials')
    .select('id, user_id, revoked_at')
    .or(`id.eq.${credentialId},credential_id.eq.${credentialId}`)
    .maybeSingle();

  if (lookupError || !targetCred) {
    throw new NotFoundError('WebAuthn credential not found.');
  }

  if (targetCred.user_id !== userId) {
    throw new ForbiddenError('You are not authorized to revoke a credential belonging to another user.');
  }

  if (targetCred.revoked_at) {
    return { success: true, credentialId, alreadyRevoked: true };
  }

  const now = new Date().toISOString();
  const { error: revokeError } = await adminDb
    .from('webauthn_credentials')
    .update({ revoked_at: now })
    .eq('id', targetCred.id);

  if (revokeError) {
    throw new Error(`Failed to revoke credential: ${revokeError.message}`);
  }

  await logSecurityEvent(
    {
      eventType: 'WEBAUTHN_CREDENTIAL_REVOKED',
      studentId: userId,
      verificationStatus: 'success',
      reason: 'Student revoked WebAuthn authenticator credential',
      ipAddress,
      metadata: { credentialId },
    },
    adminDb
  );

  await logAuditEvent(
    {
      actorId: userId,
      action: 'WEBAUTHN_CREDENTIAL_REVOKED',
      entityType: 'webauthn_credentials',
      entityId: targetCred.id,
      details: { credentialId },
      ipAddress: ipAddress || null,
    },
    adminDb
  );

  return { success: true, credentialId };
}
