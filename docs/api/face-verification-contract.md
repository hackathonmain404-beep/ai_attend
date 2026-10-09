# AttendGuard Biometrics Module: Face Verification Service Contract

> **Document Version:** 1.0.0  
> **Author:** Member 1 (Biometrics & Security Team)  
> **Audience:** Member 2 (Attendance Integration Team) & Backend Engineers  
> **Target Branch:** `feature/face-enrollment`  
> **Status:** Ratified & Production Ready

---

## 1. Overview & Architectural Boundaries

AttendGuard employs a zero-knowledge, privacy-preserving face verification engine for authenticated classroom attendance. This document defines the formal internal TypeScript API contract and REST endpoints implemented by **Member 1** for consumption by **Member 2** during attendance check-in verification workflows.

### Division of Ownership
- **Member 1 (Biometrics Team):** Owns facial detection quality validation, multi-scale 128-dimensional embedding extraction, authenticated AES-256-GCM template encryption, tamper-evident storage in `student_face_biometrics`, consent lifecycle management, and the 1:1 face verification engine.
- **Member 2 (Attendance Integration Team):** Calls `faceVerificationService.verifyStudentFace()` during attendance check-in. Member 2 integrates verification outcomes (`match`, `no_match`, `inconclusive`) into session attendance policies, fraud scoring, and teacher alerts. Member 2 must NOT implement a custom facial comparison engine or parse raw vectors.

### Core Security & Privacy Invariants
1. **Zero Raw Photo Retention:** Image uploads (Base64 data URLs or binary buffers) are processed strictly in ephemeral memory and immediately discarded. No photographic captures are ever persisted to disk, object storage, or PostgreSQL.
2. **Authenticated AES-256-GCM Storage:** Biometric embeddings (128-d unit vectors) are encrypted using AES-256-GCM with a unique 96-bit random IV and 128-bit authentication tag. Plaintext vectors are never persisted in the database.
3. **No Embeddings in Client Responses:** Embeddings, vector dimensions, and internal similarity floats are stripped before responses leave the server.
4. **Explicit Consent Invariant:** No template can be stored without explicit student opt-in (`consentGiven === true`) and an affirmative consent statement.
5. **1:1 Verification Only:** The engine performs strictly 1:1 matching against the authenticated student's enrolled template. Database-wide 1:N facial search is prohibited by design.

---

## 2. TypeScript Module Interfaces

All biometric services and types are exported from `@/modules/biometrics`:

```typescript
import {
  faceVerificationService,
  faceEnrollmentService,
  VerifyFaceParams,
  FaceVerificationResult,
  BiometricEnrollmentParams,
  BiometricEnrollmentResult,
  BiometricStatusResponse,
  FaceVerificationStatus,
  ConfidenceTier,
} from '@/modules/biometrics';
```

### 2.1 Verification Types

```typescript
export type FaceVerificationStatus = 'match' | 'no_match' | 'inconclusive';
export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface VerifyFaceParams {
  /** UUID of the authenticated student to verify against */
  studentId: string;

  /** Base64 data URL (e.g. data:image/jpeg;base64,...), raw base64 string, or Buffer */
  image: string | Buffer;

  /** Optional active classroom session UUID for audit trail linkage */
  sessionId?: string;

  /** Optional authenticated Supabase client */
  client?: SupabaseClient;

  /** Optional authoritative client IP extracted by the server */
  ipAddress?: string;
}

export interface FaceVerificationResult {
  /** Verification decision classification */
  status: FaceVerificationStatus;

  /** Confidence classification tier */
  confidenceTier: ConfidenceTier;

  /** Authenticated student UUID */
  studentId: string;

  /** ISO-8601 timestamp of verification */
  verifiedAt: string;

  /** Verification model identifier (e.g. 'attendguard-face-v1-128d') */
  model: string;

  /** Descriptive rationale in case of mismatch or inconclusive result */
  reason?: string;

  /** Internal cosine similarity score (Stripped from public HTTP responses) */
  internalSimilarityScore?: number;
}
```

### 2.2 Enrollment Types

```typescript
export interface BiometricEnrollmentParams {
  studentId: string;
  image: string | Buffer;
  consentGiven: boolean;
  consentText: string;
  replaceExisting?: boolean;
  client?: SupabaseClient;
  userAgent?: string;
  ipAddress?: string;
}

export interface BiometricEnrollmentResult {
  id: string;
  studentId: string;
  status: 'enrolled' | 'revoked' | 'pending';
  templateVersion: string;
  enrolledAt: string;
  consentRecordedAt: string;
  qualityScore: number;
}

export interface BiometricStatusResponse {
  isEnrolled: boolean;
  status: 'enrolled' | 'revoked' | 'pending' | 'none';
  enrolledAt?: string;
  templateVersion?: string;
  consentGiven?: boolean;
  consentRecordedAt?: string;
}
```

---

## 3. Service API (Internal Integration)

### 3.1 Verify Live Capture: `faceVerificationService.verifyStudentFace`

Member 2 must call this service during student check-in:

```typescript
import { faceVerificationService } from '@/modules/biometrics';

const verification = await faceVerificationService.verifyStudentFace({
  studentId: user.id,
  image: reqBody.faceCapture,
  sessionId: reqBody.sessionId,
  client: supabase,
  ipAddress: clientIp,
});

if (verification.status === 'match') {
  // Biometric confirmed! Proceed with check-in confirmation
} else if (verification.status === 'inconclusive') {
  // Prompt student to retake capture under clear lighting, or flag for instructor review
} else {
  // 'no_match' -> Reject attendance or log suspicious proxy attendance attempt
}
```

#### Decision Boundaries & Thresholds
| Outcome | Cosine Similarity Range | Confidence Tier | Description |
| :--- | :--- | :--- | :--- |
| **`match`** | $\ge 0.88$ | `high` | Definite identity match |
| **`match`** | $0.80 \le s < 0.88$ | `medium` | Valid identity match |
| **`inconclusive`** | $0.65 \le s < 0.80$ | `medium` | Ambiguous capture (lighting, angle, occlusion); retake needed |
| **`no_match`** | $< 0.65$ | `low` | Mismatch; different individual |

### 3.2 Check Enrollment Status: `faceEnrollmentService.getStudentEnrollmentStatus`

```typescript
const status = await faceEnrollmentService.getStudentEnrollmentStatus(studentId, supabase);
if (!status.isEnrolled) {
  // Student must complete face enrollment before checking in
}
```

### 3.3 Enroll Face Template: `faceEnrollmentService.enrollStudentFace`

```typescript
const result = await faceEnrollmentService.enrollStudentFace({
  studentId,
  image,
  consentGiven: true,
  consentText: 'I explicitly consent to AttendGuard storing encrypted biometric templates...',
  replaceExisting: false,
});
```

### 3.4 Consent Revocation & Deletion:

```typescript
// Revoke consent (marks template revoked, renders it inactive)
await faceEnrollmentService.revokeStudentEnrollment(studentId, 'Student opted out');

// GDPR Right-to-Erasure (hard delete template record)
await faceEnrollmentService.deleteStudentBiometrics(studentId);
```

---

## 4. REST HTTP Endpoints

For mobile and web client interactions:

### 4.1 `POST /api/student/biometrics/enroll`
- **Auth:** Authenticated Student session (`requireStudent`).
- **Request Body:**
  ```json
  {
    "image": "data:image/jpeg;base64,...",
    "consentGiven": true,
    "consentText": "I consent to AttendGuard storing encrypted facial biometric templates for attendance verification.",
    "replaceExisting": false
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "e4b3341b-26df-4eb9-a78b-37dca9082ef6",
      "studentId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "status": "enrolled",
      "templateVersion": "v1-128d",
      "enrolledAt": "2026-10-09T14:30:00.000Z",
      "consentRecordedAt": "2026-10-09T14:30:00.000Z",
      "qualityScore": 92
    },
    "error": null
  }
  ```

### 4.2 `GET /api/student/biometrics/status`
- **Auth:** Authenticated Student session (`requireStudent`).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "isEnrolled": true,
      "status": "enrolled",
      "enrolledAt": "2026-10-09T14:30:00.000Z",
      "templateVersion": "v1-128d",
      "consentGiven": true,
      "consentRecordedAt": "2026-10-09T14:30:00.000Z"
    },
    "error": null
  }
  ```

### 4.3 `DELETE /api/student/biometrics/enroll`
- **Auth:** Authenticated Student session (`requireStudent`).
- **Request Body (optional):**
  ```json
  {
    "reason": "Student requested consent revocation"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "revoked": true,
      "studentId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    },
    "error": null
  }
  ```

### 4.4 `POST /api/student/biometrics/verify`
- **Auth:** Authenticated Student session (`requireStudent`).
- **Request Body:**
  ```json
  {
    "image": "data:image/jpeg;base64,...",
    "sessionId": "a0000000-0000-0000-0000-000000000001"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "status": "match",
      "confidenceTier": "high",
      "studentId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "verifiedAt": "2026-10-09T14:35:00.000Z",
      "model": "attendguard-face-v1-128d"
    },
    "error": null
  }
  ```

---

## 5. Standard Error Codes & Exceptions

| Exception Class | HTTP Status | Standard Code | Trigger Condition |
| :--- | :--- | :--- | :--- |
| `NotFoundError` | 404 | `NOT_ENROLLED` | Student attempts verification without an active enrolled template |
| `ConflictError` | 409 | `ALREADY_CHECKED_IN` | Student already has an active template and `replaceExisting` is false |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Missing consent, missing image, payload < 5KB or > 5MB, non-image magic bytes |
| `FaceNotDetectedError` | 400 | `VALIDATION_ERROR` | Lighting too dark/bright, flat color, or no usable facial features detected |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Missing or invalid authentication session |
| `ForbiddenError` | 403 | `FORBIDDEN` | Caller is not a registered student role |
| `DatabaseError` | 500 | `INTERNAL_SERVER_ERROR` | Storage failure or cryptographic authentication failure |

---

## 6. Environment Variables & Configuration

Configure these environment variables in `.env.local` or production settings:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `BIOMETRIC_ENCRYPTION_KEY` | *(Derived HMAC key)* | 256-bit AES master key (64 hex characters or passphrase) |
| `BIOMETRIC_MATCH_THRESHOLD` | `0.80` | Cosine similarity threshold required for `match` decision |
| `BIOMETRIC_HIGH_CONFIDENCE_THRESHOLD` | `0.88` | Similarity threshold for `high` confidence tier |
| `BIOMETRIC_INCONCLUSIVE_THRESHOLD` | `0.65` | Lower bound below which outcome is classified as `no_match` |

---

## 7. Migration Dependency

Member 1 created migration:
`supabase/migrations/011_face_biometrics_enrollment.sql`

This migration creates table `student_face_biometrics` with indexes, RLS, and security audit constraints. Member 2 can safely join or reference `student_face_biometrics` without breaking existing tables.
