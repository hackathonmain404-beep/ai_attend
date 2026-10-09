# AttendGuard Face Verification & QR Attendance API Specification

> **Official Integration Contract: Face Verification Check-In Endpoint**  
> **Endpoint:** `POST /api/attendance/check-in/face`  
> **Module Owner:** Member 2 (Attendance & QR Verification Integration)  
> **Consumes:** Member 1 Biometric Verification Shared Service

---

## Table of Contents
1. [Overview](#1-overview)
2. [Security & Privacy Principles](#2-security--privacy-principles)
3. [Authentication Requirements](#3-authentication-requirements)
4. [Request Specification](#4-request-specification)
5. [Response Specification](#5-response-specification)
   - [Success Response (201 Created)](#success-response-201-created)
   - [Biometric Enrollment Required (403 Forbidden)](#biometric-enrollment-required-403-forbidden)
   - [Face Biometric Mismatch (403 Forbidden)](#face-biometric-mismatch-403-forbidden)
   - [Inconclusive / Poor Lighting (422 Unprocessable Entity)](#inconclusive--poor-lighting-422-unprocessable-entity)
   - [No Face Detected (422 Unprocessable Entity)](#no-face-detected-422-unprocessable-entity)
   - [Replay & Token Expiry Conflicts (409 Conflict)](#replay--token-expiry-conflicts-409-conflict)
   - [Biometric Service Unavailable (503 Service Unavailable)](#biometric-service-unavailable-503-service-unavailable)
   - [Rate Limit Exceeded (429 Too Many Requests)](#rate-limit-exceeded-429-too-many-requests)
6. [Verification Pipeline & Replay Prevention](#6-verification-pipeline--replay-prevention)
7. [Frontend Scanner Integration Checklist](#7-frontend-scanner-integration-checklist)

---

## 1. Overview

The `POST /api/attendance/check-in/face` endpoint binds **Dynamic QR Code Scanning** with **Facial Biometric Verification**. It guarantees that a student physically present in the lecture hall verifies their identity with their own registered device and live facial capture before attendance is authoritatively committed.

### Key Capabilities
- **Server-Authoritative Identity:** The student identity is derived strictly from the authenticated Supabase session. Client-supplied student IDs or client-asserted verification results are ignored.
- **Dynamic QR Validation:** Validates the cryptographically signed, short-lived QR challenge token displayed on the instructor's screen (TTL 10–15s).
- **Anti-Replay & Concurrency Locking:** Enforces single-use token consumption, per-attempt UUID tracking, and database atomic locks to prevent race conditions or duplicate submissions.
- **Biometric Modality:** Calls Member 1's reusable facial recognition service to verify live face captures against enrolled biometric templates.
- **Graceful Failure Handling:** Mismatches, inconclusive captures (poor lighting), and service outages are handled distinctly without unjust fraud accusations.

---

## 2. Security & Privacy Principles

1. **Zero Raw Biometric Storage:** Captured facial images and vector embeddings are processed in-memory and immediately discarded. They are **never** persisted to database tables, logs, or backups.
2. **No Sensitive Leakage in API Responses:** Biometric templates, high-dimensional vector embeddings, distance metrics, and other students' attendance information are strictly excluded from all API responses.
3. **Institutional Consent Verification:** Verifies explicit biometric consent before invoking facial recognition.
4. **Hardware Device Binding:** Verifies that the check-in is performed from the student's authorized registered device.

---

## 3. Authentication Requirements

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | Header | Yes | `Bearer <supabase_access_token>` or Supabase Auth session cookie. |
| Role | User Context | Yes | The authenticated user must possess the `student` role. |

Unauthenticated requests immediately receive `401 Unauthorized`. Users with unauthorized roles (e.g. `teacher`) receive `403 Forbidden`.

---

## 4. Request Specification

### HTTP Request
`POST /api/attendance/check-in/face`

### Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Request Body Schema (JSON)
```json
{
  "challengeToken": "string",
  "deviceFingerprint": "string",
  "faceImageBase64": "string",
  "attemptId": "string (optional UUID)",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracyMeters": 10.5
  }
}
```

### Parameter Details
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `challengeToken` | `string` | **Yes** | The dynamic token decoded from the classroom projector QR code. |
| `deviceFingerprint` | `string` | **Yes** | Client device fingerprint matching student's active registered device. |
| `faceImageBase64` | `string` | **Yes** | Base64-encoded JPEG/PNG/WebP image (or data URI) containing the student's live face capture. Minimum length: 100 characters. Max size: 5MB. |
| `attemptId` | `string` | No | Optional client-generated UUID `v4` to uniquely bind the verification attempt and prevent replay. Generated by server if omitted. |
| `location` | `object` | No | Optional GPS coordinates for geofence validation. |
| `location.latitude` | `number` | No | Geodesic latitude (-90 to +90). |
| `location.longitude` | `number` | No | Geodesic longitude (-180 to +180). |
| `location.accuracyMeters` | `number` | No | GPS accuracy radius reported by device browser. |

> **Note:** Any client-supplied `studentId`, `status`, `isMatch`, or `verified` properties in the request body are **strictly ignored**. Identity is extracted solely from the validated session cookie/JWT.

---

## 5. Response Specification

All responses adhere to AttendGuard's unified response envelope:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}
```

### Success Response (`201 Created`)
Returned when all gates pass and attendance is authoritatively committed.

```json
{
  "success": true,
  "data": {
    "recordId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "sessionId": "a823d45e-9f1b-4b2a-a9e3-82b1c3d4e5f6",
    "className": "CS301: Distributed Systems",
    "status": "present",
    "checkInTime": "2026-10-09T14:30:00.000Z",
    "reVerified": false,
    "ipVerificationStatus": "matched",
    "verificationReason": "Face biometric verification confirmed with dynamic QR challenge",
    "attendanceRecorded": true,
    "attemptId": "e1234567-89ab-4cde-0123-456789abcdef"
  },
  "error": null
}
```

---

### Biometric Enrollment Required (`403 Forbidden`)
Returned when the student has not completed biometric enrollment or has not granted institutional consent.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "BIOMETRIC_ENROLLMENT_REQUIRED",
    "message": "Biometric enrollment required. Please complete face enrollment before checking in."
  }
}
```

---

### Face Biometric Mismatch (`403 Forbidden`)
Returned when the captured face does not match the enrolled biometric profile.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FACE_VERIFICATION_FAILED",
    "message": "Face verification failed. The captured face does not match the enrolled biometric profile."
  }
}
```

---

### Inconclusive / Poor Lighting (`422 Unprocessable Entity`)
Returned when the biometric model detected a face but could not establish high-confidence verification due to poor illumination, glare, or motion blur.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FACE_INCONCLUSIVE",
    "message": "Face verification inconclusive due to insufficient match confidence. Please retry in better lighting."
  }
}
```

---

### No Face Detected (`422 Unprocessable Entity`)
Returned when no human face is detected in the image capture.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NO_FACE_DETECTED",
    "message": "No human face detected in the captured image. Please ensure your face is clearly visible and well-lit."
  }
}
```

---

### Replay & Token Expiry Conflicts (`409 Conflict`)

#### Expired QR Code
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "QR_EXPIRED",
    "message": "Attendance QR code has expired. Please scan the current code on the screen."
  }
}
```

#### Replayed QR Token
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "QR_REPLAYED",
    "message": "This attendance QR token has already been consumed. Please scan the current code on the screen."
  }
}
```

#### Replayed Verification Attempt
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VERIFICATION_ATTEMPT_REPLAYED",
    "message": "This verification attempt has already been consumed or processed."
  }
}
```

#### Already Checked In
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "Attendance has already been recorded for this session."
  }
}
```

#### Session Ended / Inactive
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "SESSION_INACTIVE",
    "message": "This attendance session has ended or is not active."
  }
}
```

---

### Biometric Service Unavailable (`503 Service Unavailable`)
Returned when Member 1's facial recognition service is undergoing maintenance, timing out, or temporarily unreachable.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "BIOMETRIC_SERVICE_UNAVAILABLE",
    "message": "The biometric verification service is temporarily unavailable. Please try again shortly or inform your instructor."
  }
}
```

---

### Rate Limit Exceeded (`429 Too Many Requests`)
Returned when a client submits more than 5 attempts within a 10-second sliding window.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many check-in attempts. Please wait a few seconds before retrying."
  }
}
```

---

## 6. Verification Pipeline & Replay Prevention

```text
+-------------------+
| Student Request   |  (challengeToken, deviceFingerprint, faceImageBase64)
+---------+---------+
          |
          v
+-------------------+
|  Auth Guard & IP  |  Extracts studentId from JWT; extracts client IP
+---------+---------+
          |
          v
+-------------------+
| Rate Limit Check  |  Sliding-window: max 5 req / 10s per student & IP
+---------+---------+
          |
          v
+-------------------+
| Gate 1: QR Crypto |  Verifies HMAC signature, sequence & TTL (10-15s)
+---------+---------+
          |
          v
+-------------------+
| Attempt Ledger &  |  Asserts attemptId unique; acquires mutex lock
| Concurrency Mutex |  (studentId:sessionId)
+---------+---------+
          |
          v
+-------------------+
| Session & Device  |  Validates session active; validates device binding;
| Enrollment Checks |  validates course enrollment; checks duplicate record
+---------+---------+
          |
          v
+-------------------+
| Biometric Check   |  Verifies biometric enrollment & consent in DB
+---------+---------+
          |
          v
+-------------------+
| Member 1 Service  |  Executes verifyFace({ studentId, imageBase64 })
| Model Inference   |  Returns match / mismatch / inconclusive / unavailable
+---------+---------+
          |
   (If match == true)
          |
          v
+-------------------+
| Atomic Record DB  |  Inserts attendance_records; catches constraint 23505
+---------+---------+
          |
          v
+-------------------+
| Realtime Broadcast|  Broadcasts live headcount update to teacher session
+-------------------+
```

---

## 7. Frontend Scanner Integration Checklist

Frontend developers implementing the camera scanner should ensure:
1. **Camera Permission Handling:** Request camera permissions gracefully. If permission is denied, guide the student to browser site settings.
2. **Pre-Check Enrollment:** Check if the student is enrolled in biometrics (`GET /api/student/biometric-status` or profile) before prompting for face scan.
3. **Capture Quality:**
   - Capture a clear frontal frame with good ambient lighting.
   - Convert frame to JPEG/WebP base64 (`canvas.toDataURL('image/jpeg', 0.8)`).
4. **Error UX Guidance:**
   - `FACE_INCONCLUSIVE`: Prompt student to step into better lighting or remove glasses/masks and retry.
   - `NO_FACE_DETECTED`: Show overlay guide asking student to center their face in the viewport.
   - `BIOMETRIC_ENROLLMENT_REQUIRED`: Redirect student to `/student/profile/biometrics` to complete enrollment.
   - `QR_EXPIRED`: Automatically re-scan the latest QR code displayed on the screen.
5. **No Client Match Assertion:** Never compute face matching or claim verification on client-side JS. Always rely exclusively on the server response.
