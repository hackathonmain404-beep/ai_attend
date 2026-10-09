# AttendGuard API Integration Specification

> **Official Integration Contract Between Frontend and Backend**  
> *All client requests and server responses must strictly adhere to this specification. Frontend developers must never invent or assume an undocumented response structure.*

---

## Table of Contents

- [Global Standards & Conventions](#global-standards--conventions)
  - [HTTP Status Codes](#http-status-codes)
  - [Standard Envelope Format](#standard-envelope-format)
  - [Standard Error Codes](#standard-error-codes)
  - [Data Types & Formats](#data-types--formats)
  - [Authentication & Headers](#authentication--headers)
- [Endpoints](#endpoints)
  - [1. Authentication & Device Identity](#1-authentication--device-identity)
    - [GET /api/auth/me](#get-apiauthme)
    - [POST /api/auth/device/register](#post-apiauthdeviceregister)
    - [POST /api/auth/device/reset](#post-apiauthdevicereset)
  - [2. Attendance Session Management (Teacher)](#2-attendance-session-management-teacher)
    - [POST /api/sessions/start](#post-apisessionsstart)
    - [GET /api/sessions/:id](#get-apisessionsid)
    - [POST /api/sessions/:id/end](#post-apisessionsidend)
    - [POST /api/sessions/:id/re-verify](#post-apisessionsidre-verify)
  - [3. Dynamic QR Challenge](#3-dynamic-qr-challenge)
    - [GET /api/sessions/:id/qr-challenge](#get-apisessionsidqr-challenge)
  - [4. Student Attendance Verification](#4-student-attendance-verification)
    - [POST /api/attendance/check-in](#post-apiattendancecheck-in)
    - [POST /api/attendance/re-verify](#post-apiattendancere-verify)
    - [GET /api/student/attendance/history](#get-apistudentattendancehistory)
    - [GET /api/student/attendance/summary](#get-apistudentattendancesummary)
  - [5. Teacher Attendance Analytics & Reporting](#5-teacher-attendance-analytics--reporting)
    - [GET /api/sessions/:id/attendance](#get-apisessionsidattendance)
    - [GET /api/teacher/classes/:id/attendance](#get-apiteacherclassesidattendance)
    - [GET /api/teacher/classes/:id/report](#get-apiteacherclassesidreport)
  - [6. AI Attendance Advisor](#6-ai-attendance-advisor)
    - [POST /api/ai/advisor](#post-apiaiadvisor)
- [Contract Change Policy](#contract-change-policy)

---

## Global Standards & Conventions

### HTTP Status Codes

| Status Code | Meaning | Usage |
| :--- | :--- | :--- |
| `200 OK` | Success | Request succeeded and data is returned in standard envelope. |
| `201 Created` | Created | Resource successfully created (e.g., session started, attendance recorded). |
| `400 Bad Request` | Client Error | Malformed JSON, missing required fields, or validation failures. |
| `401 Unauthorized` | Auth Required | Missing, invalid, or expired Supabase authentication token. |
| `403 Forbidden` | Access Denied | Authenticated user lacks permission (e.g., student calling teacher endpoint). |
| `404 Not Found` | Not Found | Requested entity (session, class, student) does not exist. |
| `409 Conflict` | Conflict | Business logic violation (e.g., duplicate attendance, device mismatch). |
| `429 Too Many Requests` | Rate Limited | Exceeded rate limits (e.g., rapid re-scans, brute force attempts). |
| `500 Internal Error` | Server Error | Unhandled server or database exception. |

### Standard Envelope Format

Every response returned by the backend uses a unified JSON envelope:

#### Successful Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

#### Error Response (`4xx` / `5xx`)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable explanation for debugging or display."
  }
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | User must be logged in. |
| `FORBIDDEN` | 403 | User role does not have permission. |
| `SESSION_NOT_FOUND` | 404 | Attendance session does not exist. |
| `SESSION_INACTIVE` | 409 | Session is already ended or not yet open. |
| `QR_EXPIRED` | 409 | Dynamic QR challenge token exceeded its TTL. |
| `QR_INVALID` | 400 | Token signature mismatch or corrupted payload. |
| `ALREADY_CHECKED_IN` | 409 | Student has already logged attendance for this session. |
| `DEVICE_NOT_REGISTERED`| 403 | Device fingerprint is not registered to this student account. |
| `DEVICE_MISMATCH` | 403 | Request device fingerprint does not match registered device. |
| `NOT_ENROLLED` | 403 | Student is not enrolled in the class. |
| `REVERIFY_WINDOW_CLOSED`| 409 | Re-verification 60-second response window has expired. |
| `RATE_LIMITED` | 429 | Too many requests in short duration. |
| `INTERNAL_SERVER_ERROR`| 500 | Unexpected failure. |

### Data Types & Formats
- **Identifiers**: Standard UUID v4 strings (e.g., `"f47ac10b-58cc-4372-a567-0e02b2c3d479"`).
- **Timestamps**: ISO-8601 UTC strings with 'Z' suffix (e.g., `"2026-10-06T14:30:00.000Z"`).
- **Percentages**: Floating point numbers between `0.0` and `100.0` rounded to one decimal place (e.g., `85.5`).

### Authentication & Headers
All requests must include standard headers:
```http
Content-Type: application/json
Authorization: Bearer <supabase_access_token>
```
*(In Next.js browser sessions, Supabase cookies are passed automatically).*

---

## Endpoints

---

### 1. Authentication & Device Identity

#### `GET /api/auth/me`
Retrieves currently authenticated user profile, assigned role, and device registration status.

- **Authentication**: Required
- **Authorization**: Any authenticated role (`student`, `teacher`)
- **Request Body**: None

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "c1f28b49-74d3-4a0b-8d5a-1bcf32e58421",
    "email": "student101@university.edu",
    "fullName": "Jane Doe",
    "role": "student",
    "identifier": "STU2026-0891",
    "device": {
      "isRegistered": true,
      "deviceName": "iPhone 15 Pro",
      "registeredAt": "2026-09-15T09:12:00.000Z"
    }
  },
  "error": null
}
```

---

#### `POST /api/auth/device/register`
Binds the student's account to a unique physical/browser device fingerprint. Allowed only if the student has no active device registered.

- **Authentication**: Required
- **Authorization**: `student`
- **Request Body**:
  - `deviceFingerprint` *(string, required)*: SHA-256 hash of stable client browser/hardware attributes.
  - `deviceName` *(string, required)*: User-friendly name (e.g., "Jane's Pixel 8").
  - `userAgent` *(string, optional)*: Client user agent string.

**Example Request**:
```json
{
  "deviceFingerprint": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "deviceName": "Jane's Pixel 8",
  "userAgent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36"
}
```

**Example Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "deviceId": "e812d4a1-893c-411a-bc01-9a74c653ff90",
    "registeredAt": "2026-10-06T14:00:00.000Z"
  },
  "error": null
}
```

**Error Example (`409 Conflict`)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DEVICE_ALREADY_REGISTERED",
    "message": "An active device is already registered for this account. Request a reset from your instructor."
  }
}
```

---

#### `POST /api/auth/device/reset`
Allows a teacher or administrator to revoke a student's active device registration (e.g., if a student changed phones).

- **Authentication**: Required
- **Authorization**: `teacher`
- **Request Body**:
  - `studentId` *(UUID string, required)*: Target student's profile ID.
  - `reason` *(string, required)*: Justification for audit logs (e.g., "Student verified phone replacement").

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "studentId": "c1f28b49-74d3-4a0b-8d5a-1bcf32e58421",
    "deviceReset": true,
    "resetAt": "2026-10-06T14:05:00.000Z"
  },
  "error": null
}
```

---

### 2. Attendance Session Management (Teacher)

#### `POST /api/sessions/start`
Creates and opens a live attendance session for a specific class.

- **Authentication**: Required
- **Authorization**: `teacher` (must be assigned teacher of the class)
- **Request Body**:
  - `classId` *(UUID string, required)*: The class to take attendance for.
  - `qrRotationIntervalSec` *(integer, optional)*: Rotation duration in seconds (default: 20, min: 10, max: 60).

**Example Request**:
```json
{
  "classId": "3b295982-3e28-494b-9728-66238b693ba2",
  "qrRotationIntervalSec": 20
}
```

**Example Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "a908d172-83b4-4b51-9c88-12c8a91448fa",
    "classId": "3b295982-3e28-494b-9728-66238b693ba2",
    "className": "CS301: Distributed Systems",
    "status": "active",
    "startedAt": "2026-10-06T14:15:00.000Z",
    "qrRotationIntervalSec": 20
  },
  "error": null
}
```

---

#### `GET /api/sessions/:id`
Retrieves current session state, active status, and attendee counts.

- **Authentication**: Required
- **Authorization**: `teacher` (owner) or enrolled `student`

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "a908d172-83b4-4b51-9c88-12c8a91448fa",
    "classId": "3b295982-3e28-494b-9728-66238b693ba2",
    "className": "CS301: Distributed Systems",
    "teacherName": "Prof. Alan Turing",
    "status": "active",
    "totalEnrolled": 65,
    "presentCount": 48,
    "startedAt": "2026-10-06T14:15:00.000Z",
    "endedAt": null
  },
  "error": null
}
```

---

#### `POST /api/sessions/:id/end`
Closes an active attendance session. Once ended, no further check-ins or re-verifications can be logged.

- **Authentication**: Required
- **Authorization**: `teacher` (session owner)
- **Request Body**: None

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "a908d172-83b4-4b51-9c88-12c8a91448fa",
    "status": "ended",
    "totalPresent": 52,
    "totalAbsent": 13,
    "endedAt": "2026-10-06T15:05:00.000Z"
  },
  "error": null
}
```

---

#### `POST /api/sessions/:id/re-verify`
Triggers an unannounced 60-second re-verification challenge across the classroom.

- **Authentication**: Required
- **Authorization**: `teacher` (session owner)
- **Request Body**: None

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "a908d172-83b4-4b51-9c88-12c8a91448fa",
    "reverifyChallengeId": "7c19a930-4e31-4a11-b129-9e80c8e11a2f",
    "expiresAt": "2026-10-06T14:46:00.000Z",
    "promptType": "one_touch_ack"
  },
  "error": null
}
```

---

### 3. Dynamic QR Challenge

#### `GET /api/sessions/:id/qr-challenge`
Called by the teacher's display component to fetch the next signed dynamic QR payload.

- **Authentication**: Required
- **Authorization**: `teacher` (session owner)
- **Request Body**: None

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "challengeToken": "eyJzZXNzaW9uSWQiOiJhOTA4ZDE3Mi04M2I0LTRiNTEtOWM4OC0xMmM4YTkxNDQ4ZmEiLCJzZXEiOjI4LCJ0cyI6MTcyODI4OTYwMCwibm9uY2UiOiI1ODFlOWJjNCJ9.3b19b7a4f938d28a3f81e3a478",
    "sequence": 28,
    "expiresAt": "2026-10-06T14:15:20.000Z",
    "ttlSeconds": 20
  },
  "error": null
}
```

---

### 4. Student Attendance Verification

#### `POST /api/attendance/check-in`
The primary check-in endpoint called when a student scans the dynamic QR code.

- **Authentication**: Required
- **Authorization**: `student`
- **Request Body**:
  - `challengeToken` *(string, required)*: The raw string decoded from the QR scanner.
  - `deviceFingerprint` *(string, required)*: Client's registered device hash.

**Example Request**:
```json
{
  "challengeToken": "eyJzZXNzaW9uSWQiOiJhOTA4ZDE3Mi04M2I0LTRiNTEtOWM4OC0xMmM4YTkxNDQ4ZmEiLCJzZXEiOjI4LCJ0cyI6MTcyODI4OTYwMCwibm9uY2UiOiI1ODFlOWJjNCJ9.3b19b7a4f938d28a3f81e3a478",
  "deviceFingerprint": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
}
```

**Example Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "recordId": "48b61c8a-782a-45c1-bd93-6c84b1239aa1",
    "sessionId": "a908d172-83b4-4b51-9c88-12c8a91448fa",
    "className": "CS301: Distributed Systems",
    "status": "present",
    "checkInTime": "2026-10-06T14:15:12.000Z",
    "reVerified": false,
    "ipVerificationStatus": "matched",
    "verificationReason": "MATCHED",
    "attendanceRecorded": true
  },
  "error": null
}
```

*Note on Network Mismatches under Default Review Policy*:
When `IP_MISMATCH_POLICY=review`, students outside the campus subnet still record attendance (`attendanceRecorded: true`), but their records are flagged for instructor review with `"ipVerificationStatus": "review_required"` and `"verificationReason": "NETWORK_MISMATCH"`.

**Common Error Responses**:
```json
// Campus Network Mismatch under Strict Reject Policy (403 Forbidden)
{
  "success": false,
  "data": null,
  "error": {
    "code": "CAMPUS_NETWORK_MISMATCH",
    "message": "Your network connection is not authorized for campus attendance check-in."
  }
}

// QR Expired (409 Conflict)
{
  "success": false,
  "data": null,
  "error": {
    "code": "QR_EXPIRED",
    "message": "The attendance QR code has expired. Please scan the current code on the screen."
  }
}

// Unregistered Device (403 Forbidden)
{
  "success": false,
  "data": null,
  "error": {
    "code": "DEVICE_MISMATCH",
    "message": "Attendance must be submitted from your registered device. Switch devices or request a reset."
  }
}

// Already Checked In (409 Conflict)
{
  "success": false,
  "data": null,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "Attendance has already been recorded for this session."
  }
}
```

---

#### `POST /api/attendance/re-verify`
Student acknowledges the surprise in-class re-verification alert.

- **Authentication**: Required
- **Authorization**: `student`
- **Request Body**:
  - `sessionId` *(UUID string, required)*: Active session ID.
  - `challengeId` *(UUID string, required)*: The challenge ID received over Realtime.
  - `deviceFingerprint` *(string, required)*: Validated against registered device.

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "recordId": "48b61c8a-782a-45c1-bd93-6c84b1239aa1",
    "reVerified": true,
    "reVerifiedAt": "2026-10-06T14:45:22.000Z"
  },
  "error": null
}
```

---

#### `GET /api/student/attendance/history`
Retrieves past session attendance records for the requesting student.

- **Authentication**: Required
- **Authorization**: `student`
- **Query Parameters**:
  - `classId` *(UUID string, optional)*: Filter by specific class.
  - `limit` *(integer, optional)*: Max records (default: 50).

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "recordId": "48b61c8a-782a-45c1-bd93-6c84b1239aa1",
        "classId": "3b295982-3e28-494b-9728-66238b693ba2",
        "className": "CS301: Distributed Systems",
        "sessionDate": "2026-10-06T14:15:00.000Z",
        "status": "present",
        "reVerified": true
      },
      {
        "recordId": "1198c763-91b4-4b55-a0c1-3d28b1239ff2",
        "classId": "3b295982-3e28-494b-9728-66238b693ba2",
        "sessionDate": "2026-10-04T14:15:00.000Z",
        "status": "present",
        "reVerified": false
      }
    ]
  },
  "error": null
}
```

---

#### `GET /api/student/attendance/summary`
Calculates authoritative attendance percentages across all enrolled courses for the student.

- **Authentication**: Required
- **Authorization**: `student`

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "overallPercentage": 82.5,
    "classes": [
      {
        "classId": "3b295982-3e28-494b-9728-66238b693ba2",
        "className": "CS301: Distributed Systems",
        "totalHeld": 20,
        "attended": 17,
        "percentage": 85.0,
        "status": "safe",
        "classesNeededFor75": 0,
        "canMissNext": 2
      },
      {
        "classId": "8f129841-11a2-4bb3-901c-7728b1239aa4",
        "className": "MATH202: Linear Algebra",
        "totalHeld": 22,
        "attended": 15,
        "percentage": 68.2,
        "status": "at_risk",
        "classesNeededFor75": 3,
        "canMissNext": 0
      }
    ]
  },
  "error": null
}
```

---

### 5. Teacher Attendance Analytics & Reporting

#### `GET /api/sessions/:id/attendance`
Retrieves live attendee roster for an ongoing or completed session.

- **Authentication**: Required
- **Authorization**: `teacher` (session owner)

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "a908d172-83b4-4b51-9c88-12c8a91448fa",
    "totalEnrolled": 65,
    "presentCount": 52,
    "attendees": [
      {
        "studentId": "c1f28b49-74d3-4a0b-8d5a-1bcf32e58421",
        "fullName": "Jane Doe",
        "rollNumber": "STU2026-0891",
        "checkInTime": "2026-10-06T14:15:12.000Z",
        "status": "present",
        "reVerified": true
      }
    ]
  },
  "error": null
}
```

---

#### `GET /api/teacher/classes/:id/attendance`
Retrieves cumulative historical class attendance records.

- **Authentication**: Required
- **Authorization**: `teacher` (class owner)

---

#### `GET /api/teacher/classes/:id/report`
Generates aggregate student performance reports, identifying chronic proxy suspects or attendance deficits.

- **Authentication**: Required
- **Authorization**: `teacher` (class owner)

---

### 6. AI Attendance Advisor

#### `POST /api/ai/advisor`
Answers natural language queries using backend-calculated metrics.

- **Authentication**: Required
- **Authorization**: `student`
- **Request Body**:
  - `query` *(string, required)*: The student's question (e.g., "Which class is at risk?", "How many classes do I need to attend in Linear Algebra?").

**Example Request**:
```json
{
  "query": "Am I safe in Linear Algebra, or do I need to attend the next classes?"
}
```

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "reply": "In MATH202 (Linear Algebra), your attendance is currently at 68.2% (15 out of 22 classes attended), which is below the required 75% threshold. You cannot afford to miss any upcoming classes. You must attend the next 3 consecutive classes without absence to restore your attendance back to 75.0%.",
    "contextSnapshot": {
      "classCode": "MATH202",
      "currentPercentage": 68.2,
      "attended": 15,
      "totalHeld": 22,
      "targetPercentage": 75.0,
      "classesNeeded": 3,
      "canMiss": 0
    }
  },
  "error": null
}
```

---

## Contract Change Policy

1. **Strict Frozen Schema**: This document is the single source of truth for all API requests and responses.
2. **No Frontend Divergence**: Frontend engineers (Members 2 and 3) must **never** modify requested payload names or mock alternative response wrappers.
3. **Change Process**: If a new endpoint or property is necessary:
   - File a ticket or discuss in team sync.
   - Member 1 (Team Lead) edits `docs/API.md`.
   - Both frontend and backend engineers confirm the updated contract before merging code.
