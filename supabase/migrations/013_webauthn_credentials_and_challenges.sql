-- ==============================================================================
-- Migration 013: WebAuthn Biometric & Passkey Credential Ledger & Challenge Nonce
-- ==============================================================================
-- Implements FIDO2/WebAuthn public-key credential storage, anti-replay challenge nonces,
-- and tamper-evident audit logging for biometric attendance verification.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. WEBAUTHN_CREDENTIALS TABLE
-- Stores public key credentials registered by authenticated students.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_type TEXT NULL,
    backed_up BOOLEAN NOT NULL DEFAULT false,
    transports TEXT[] NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    -- Prevent credential cross-account reuse (credential-ownership invariant)
    CONSTRAINT uq_webauthn_credential_id UNIQUE (credential_id)
);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id 
ON public.webauthn_credentials (user_id);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_active 
ON public.webauthn_credentials (user_id) 
WHERE revoked_at IS NULL;

-- ------------------------------------------------------------------------------
-- 2. WEBAUTHN_CHALLENGES TABLE
-- Ephemeral, single-use, server-authoritative challenge nonce ledger.
-- Atomic update prevents concurrency and replay attacks.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    challenge TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('registration', 'attendance_authentication')),
    token_fingerprint TEXT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_lookup 
ON public.webauthn_challenges (id, user_id, purpose) 
WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at 
ON public.webauthn_challenges (expires_at);

-- ------------------------------------------------------------------------------
-- 3. EXPAND SECURITY_EVENTS EVENT TYPE CONSTRAINT
-- Allows recording tamper-evident WebAuthn audit events.
-- ------------------------------------------------------------------------------
ALTER TABLE public.security_events DROP CONSTRAINT IF EXISTS security_events_event_type_check;
ALTER TABLE public.security_events ADD CONSTRAINT security_events_event_type_check
CHECK (
  event_type IN (
    'EXPIRED_QR',
    'INVALID_QR',
    'DUPLICATE_ATTENDANCE',
    'NETWORK_MISMATCH',
    'UNAUTHORIZED_ACCESS',
    'DEVICE_MISMATCH',
    'LOCATION_MISMATCH',
    'ATTENDANCE_CORRECTION',
    'WEBAUTHN_REGISTER_SUCCESS',
    'WEBAUTHN_REGISTER_FAILED',
    'WEBAUTHN_AUTH_SUCCESS',
    'WEBAUTHN_AUTH_FAILED',
    'WEBAUTHN_CHALLENGE_EXPIRED',
    'WEBAUTHN_CHALLENGE_REPLAY',
    'WEBAUTHN_CREDENTIAL_REVOKED'
  )
);

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Students can view only their own registered credentials
DROP POLICY IF EXISTS "Students can view own webauthn credentials" ON public.webauthn_credentials;
CREATE POLICY "Students can view own webauthn credentials"
ON public.webauthn_credentials FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Direct client mutation blocks (INSERT, UPDATE, DELETE must flow via server-side Route Handlers with service_role key)
REVOKE INSERT, UPDATE, DELETE ON public.webauthn_credentials FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.webauthn_challenges FROM authenticated, anon;
REVOKE SELECT ON public.webauthn_challenges FROM authenticated, anon;
