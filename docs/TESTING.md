# AttendGuard Comprehensive Testing Plan

> **Unit, Integration, Security & UI Verification Suite**  
> *Test suites, attack simulations, automation commands, and live verification matrix.*

---

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Frameworks & Environment](#test-frameworks--environment)
- [Test Suites Overview](#test-suites-overview)
  - [1. Unit Tests](#1-unit-tests)
  - [2. Integration Tests](#2-integration-tests)
  - [3. Security & Anti-Abuse Tests](#3-security--anti-abuse-tests)
  - [4. Frontend & UI Tests](#4-frontend--ui-tests)
- [Master Verification Matrix](#master-verification-matrix)
- [Executing Test Commands](#executing-test-commands)

---

## Testing Philosophy

Attendance verification requires strict test reliability:
1. **Mathematical Invariance**: Percentages and required class formulas must be verified with mathematical precision.
2. **Deterministic Cryptography**: HMAC signing and token expiration must be verified across multiple time deltas.
3. **Negative Path Coverage**: Every security barrier (expired tokens, unregistered hardware, role mismatches) must be actively attacked and proven to fail securely.
4. **No False Green Tests**: Tests that have not yet been implemented or executed are explicitly marked as `TODO`.

---

## Test Frameworks & Environment

- **Test Runner**: **Vitest** (fast TypeScript-native testing)
- **Assertion Library**: `@testing-library/react` for UI components
- **Mocking**: Native Vitest mocks (`vi.fn()`, `vi.useFakeTimers()`)
- **API Testing**: Node.js test harness for Next.js Route Handlers (`@edge-runtime/jest-environment` or Supertest)

---

## Test Suites Overview

---

### 1. Unit Tests

Located in `tests/unit/`:

#### `tests/unit/attendance-calc.test.ts`
- Verifies exact percentage computation: `(attended / total) * 100`.
- Verifies edge cases: `0/0` (returns `0.0`), `100/100` (returns `100.0`).
- Validates the required classes formula: $\lceil 3T - 4A \rceil$ for achieving 75%.
- Validates the safe absence formula: $\lfloor \frac{A}{0.75} - T \rfloor$.

#### `tests/unit/qr-crypto.test.ts`
- Verifies HMAC-SHA256 signature generation using `QR_HMAC_SECRET`.
- Asserts that tampering with a single character in the encoded payload invalidates the signature.
- Verifies expiration detection: rejects tokens older than `QR_TOKEN_TTL_SECONDS`.
- Verifies monotonic sequence verification.

#### `tests/unit/device-fingerprint.test.ts`
- Tests deterministic SHA-256 fingerprint generation given consistent browser hardware attributes.
- Verifies that two distinct browser profiles generate distinct fingerprints.

---

### 2. Integration Tests

Located in `tests/integration/`:

#### `tests/integration/session-lifecycle.test.ts`
- Authenticated teacher starts session (`POST /api/sessions/start`) -> session created with `status: 'active'`.
- Teacher ends session (`POST /api/sessions/:id/end`) -> session transitioned to `status: 'ended'`.
- Attempts to query `qr-challenge` on an ended session receive `409 Conflict`.

#### `tests/integration/attendance-submission.test.ts`
- Enrolled student submits valid token from registered device -> record created with `status: 'present'`.
- Verification entry logged in `attendance_verifications`.
- Live headcount query reflects updated count.

#### `tests/integration/reverification-flow.test.ts`
- Teacher triggers re-verification challenge on active session.
- Student submits acknowledgment within 60 seconds -> `re_verified` updated to `true`.

---

### 3. Security & Anti-Abuse Tests

Located in `tests/security/`:

#### `tests/security/qr-abuse.test.ts`
- **Expired Token Test**: Advances Vitest fake timers by 25 seconds. Verifies `/api/attendance/check-in` rejects with `QR_EXPIRED`.
- **Token Replay Test**: Attempts to submit the same `challengeToken` multiple times.
- **Foreign Token Test**: Submits a valid token from Session A against Session B.

#### `tests/security/identity-abuse.test.ts`
- **Device Mismatch Test**: Student logs in on an unregistered device fingerprint. Verifies rejection with `DEVICE_MISMATCH`.
- **Duplicate Check-in Test**: Fires concurrent check-in requests for the same student ID. Verifies database constraint prevents double attendance.
- **Unenrolled Student Test**: Student attempts check-in for a course they are not enrolled in. Rejects with `NOT_ENROLLED`.

#### `tests/security/authorization.test.ts`
- Student calls `POST /api/sessions/start` -> Rejects with `403 FORBIDDEN`.
- Unauthenticated user calls `/api/attendance/check-in` -> Rejects with `401 UNAUTHORIZED`.

---

### 4. Frontend & UI Tests

Located in `tests/ui/`:

- **Teacher Dynamic QR**: Asserts that the QR component renders SVG and rotates every 20 seconds.
- **Student Scanner**: Asserts that scanner initializes camera and halts on code acquisition.
- **Attendance Summary**: Verifies amber alert banner renders when attendance drops below 75%.
- **Responsive Viewport**: Verifies student UI is responsive on 375px mobile viewport.

---

## Master Verification Matrix

| Test ID | Category | Precondition / Input | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| `UT-01` | Unit | `attended: 15, total: 20` | Percentage is exactly `75.0%` | TODO |
| `UT-02` | Unit | `attended: 15, total: 22` | Formula calculates exactly `3` classes needed | TODO |
| `UT-03` | Unit | `attended: 17, total: 20` | Formula calculates exactly `2` safe absences | TODO |
| `UT-04` | Unit | Valid token with valid HMAC | Signature verification returns `true` | TODO |
| `UT-05` | Unit | Tampered payload byte | Signature verification returns `false` | TODO |
| `UT-06` | Unit | Token timestamp 25s in past | Expiry validator returns `false` | TODO |
| `IT-01` | Integration | Teacher credentials | Session starts, returns `sessionId` (HTTP 201) | TODO |
| `IT-02` | Integration | Active session, valid QR | Student check-in succeeds (HTTP 201) | TODO |
| `IT-03` | Integration | Active session check-in | Verification logged in `attendance_verifications` | TODO |
| `IT-04` | Integration | Teacher calls end session | Session marked `ended`, subsequent scans blocked | TODO |
| `IT-05` | Integration | Re-verification prompt | Valid response marks `re_verified = true` | TODO |
| `SEC-01`| Security | QR token older than 20s | Rejected with `QR_EXPIRED` (HTTP 409) | TODO |
| `SEC-02`| Security | Duplicate check-in submission | Rejected with `ALREADY_CHECKED_IN` (HTTP 409) | TODO |
| `SEC-03`| Security | Unregistered device fingerprint| Rejected with `DEVICE_MISMATCH` (HTTP 403) | TODO |
| `SEC-04`| Security | Student calling teacher API | Rejected with `FORBIDDEN` (HTTP 403) | TODO |
| `SEC-05`| Security | Unauthenticated API request | Rejected with `UNAUTHORIZED` (HTTP 401) | TODO |
| `SEC-06`| Security | Client OS clock rewound 10 min | Server validates against `NOW()`, rejects expired | TODO |
| `SEC-07`| Security | Student unenrolled in class | Rejected with `NOT_ENROLLED` (HTTP 403) | TODO |
| `UI-01` | UI | Dynamic QR timer reaches 0s | Fetches next token & re-renders QR SVG | TODO |
| `UI-02` | UI | Scanner camera detects QR code | Halts video feed & submits payload | TODO |
| `UI-03` | UI | Attendance below 75% | Renders amber warning badge & classes needed | TODO |
| `UI-04` | UI | Mobile 375px viewport | No horizontal overflow, buttons $\ge 44\text{px}$ | TODO |

---

## Executing Test Commands

Run the full test suite:
```bash
npm test
```

Run specific test categories:
```bash
# Run unit tests only
npm test -- tests/unit

# Run security & fraud tests only
npm test -- tests/security

# Run integration tests
npm test -- tests/integration

# Run tests in watch mode during development
npm test -- --watch
```
