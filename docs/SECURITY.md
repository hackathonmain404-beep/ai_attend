# AttendGuard Security Model & Threat Assessment

> **Comprehensive Threat Model, Attack Vectors, Mitigations, and Limitations**  
> *Detailed defense-in-depth engineering analysis for academic attendance integrity.*

---

## Table of Contents

- [Core Security Philosophy](#core-security-philosophy)
- [Trust Boundaries & Attack Surfaces](#trust-boundaries--attack-surfaces)
- [Comprehensive Threat Model](#comprehensive-threat-model)
  - [1. QR Code Threats](#1-qr-code-threats)
  - [2. Identity & Credential Threats](#2-identity--credential-threats)
  - [3. API & Protocol Threats](#3-api--protocol-threats)
  - [4. Timing & Temporal Threats](#4-timing--temporal-threats)
  - [5. Physical Attendance Threats](#5-physical-attendance-threats)
  - [6. Teacher-Side & Administrative Threats](#6-teacher-side--administrative-threats)
- [Summary Security Matrix](#summary-security-matrix)
- [Defense-in-Depth Implementation Details](#defense-in-depth-implementation-details)
- [Critical Real-World Limitations](#critical-real-world-limitations)

---

## Core Security Philosophy

AttendGuard approaches attendance verification using a multi-layered **Defense-in-Depth** model. Rather than relying on any single mechanism—such as a static QR code, a GPS ping, or client assertion—the system forces an attacker to simultaneously compromise multiple independent controls:

1. **Cryptographic Time-Bound Challenges**: Challenges expire faster than typical human distribution channels.
2. **Device Hardware Association**: Stolen credentials cannot mark attendance from unauthorized hardware.
3. **Server-Side Authority**: The backend alone commits attendance state; client assertions are completely untrusted.
4. **Relational Schema Constraints**: The database itself guarantees uniqueness and referential integrity.
5. **Continuous Unannounced Verification**: Randomized in-class micro-prompts penalize check-in-and-leave behavior.

> [!CAUTION]
> **Fundamental Reality**: No software-only method can guarantee continuous physical presence with 100% certainty. AttendGuard is designed to eliminate low-effort, mass-scale proxy attendance and introduce significant friction and risk to sophisticated fraud.

---

## Trust Boundaries & Attack Surfaces

```text
               ┌────────────────────────────────────────────────────────┐
               │                    ATTACK SURFACE                      │
               │  • WhatsApp / Telegram photo sharing                   │
               │  • Lent credentials / multi-tab logins                 │
               │  • Browser DevTools / curl API script injection        │
               │  • Manipulated OS system clocks                        │
               └───────────────────────────┬────────────────────────────┘
                                           │
═══════════════════════════════════════════╪═════════════════════════════════════════════
 TRUST BOUNDARY                            │ HTTPS TLS 1.3
═══════════════════════════════════════════╪═════════════════════════════════════════════
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                   SECURE SINK (Backend)                │
               │  • Next.js Edge Auth & Route Guards                    │
               │  • HMAC-SHA256 Token Validation Engine                 │
               │  • Single Active Device Validator                      │
               │  • PostgreSQL Serialized Constraints & RLS             │
               │  • Tamper-Evident Security Audit Logs                  │
               └────────────────────────────────────────────────────────┘
```

---

## Comprehensive Threat Model

---

### 1. QR Code Threats

#### Threat 1.1: Real-Time QR Sharing via Messaging Apps
- **Attack Scenario**: A student present in class snaps a photo of the projected QR code and sends it to an absent roommate via WhatsApp or Telegram.
- **Risk Level**: **High** (The primary attack vector in modern universities).
- **Mitigation**: **Dynamic Rotating Challenges with Short TTL**. The teacher's screen refreshes the QR code every 15–20 seconds with a newly signed HMAC token. By the time the image is photographed, uploaded, received, opened on a secondary screen, and scanned, the 20-second TTL has expired. The backend rejects the expired token with `QR_EXPIRED`.
- **Remaining Limitation**: If two students coordinate with near-zero latency (e.g., live video stream with low latency screen-share), a scan within 15 seconds is theoretically possible. This is mitigated by Device Binding (Threat 2.1) and Random Re-Verification (Threat 5.1).

#### Threat 1.2: Replay of Previously Captured QR Codes
- **Attack Scenario**: A student captures a QR code from a previous lecture or earlier in the same lecture and attempts to resubmit it.
- **Risk Level**: **Critical**.
- **Mitigation**: **Monotonically Increasing Sequence + Server Salt + Expiry**. Each token embeds a sequence number and server timestamp signed by `QR_HMAC_SECRET`. The backend validates that `timestamp >= (now - TTL)` and that the session ID matches an open session.
- **Remaining Limitation**: None within the software domain; replay outside the TTL window is mathematically impossible under SHA-256 HMAC.

---

### 2. Identity & Credential Threats

#### Threat 2.1: Account Sharing / Credential Lending
- **Attack Scenario**: An absent student shares their username and password with an attending friend. The attending friend logs into the absent student's account on their phone or laptop.
- **Risk Level**: **High**.
- **Mitigation**: **Single Registered Device Binding**. Each student account is bound to a single verified device fingerprint. If the attending friend tries to log in on their personal device, the system detects a device mismatch and blocks attendance check-in (`DEVICE_MISMATCH`). The attending friend cannot simply unbind the device; device resets require teacher or administrator authorization.
- **Remaining Limitation**: If the absent student physically lends their actual smartphone to their friend, software cannot detect that a different human is holding the phone. Physical in-class teacher spot-checks or roll confirmation resolve this edge case.

#### Threat 2.2: Device Registration Forgery
- **Attack Scenario**: A student tries to register multiple devices simultaneously or forge an unregistered device ID via developer tools.
- **Risk Level**: **Medium**.
- **Mitigation**: **PostgreSQL Partial Unique Index**. A partial index `WHERE is_active = true` rejects any attempt to insert a second active device. Furthermore, device resets must originate from a verified teacher account.

---

### 3. API & Protocol Threats

#### Threat 3.1: Forged / Direct API Submissions via `curl`
- **Attack Scenario**: A student extracts their auth token and crafts a direct `POST /api/attendance/check-in` curl command, bypassing the frontend camera scanner entirely.
- **Risk Level**: **High**.
- **Mitigation**: The API requires a valid, current dynamic challenge token. Even if an attacker calls the API directly, they cannot generate a valid `challengeToken` without knowing the server's private `QR_HMAC_SECRET`.
- **Remaining Limitation**: The attacker still needs the currently projected token payload. Direct API calls do not grant access to tokens that haven't been displayed.

#### Threat 3.2: Duplicate / Rapid-Fire Concurrent Submissions
- **Attack Scenario**: An attacker scripts automated concurrent requests to claim attendance multiple times or exploit a race condition.
- **Risk Level**: **Medium**.
- **Mitigation**: **Composite Unique Constraint**. PostgreSQL enforces `UNIQUE(session_id, student_id)` on `attendance_records`. Concurrent requests for the same student in the same session fail with SQLSTATE `23505`.

#### Threat 3.3: Unauthorized Role Escalation
- **Attack Scenario**: A student submits a request to `/api/sessions/start` or `/api/auth/device/reset` to grant themselves privileges or reset their device.
- **Risk Level**: **Critical**.
- **Mitigation**: **Server-Side RBAC Guard**. Route handlers query the `profiles` table using the authenticated user's verified Supabase UID. If `profile.role !== 'teacher'`, the request terminates with `403 FORBIDDEN`.

---

### 4. Timing & Temporal Threats

#### Threat 4.1: Client Operating System Clock Manipulation
- **Attack Scenario**: A student sets their mobile phone's clock backward by 10 minutes to make an expired QR code appear fresh.
- **Risk Level**: **Medium**.
- **Mitigation**: **Server Clock Authority**. The backend completely ignores the client operating system's clock. All validity checks compare the token's embedded timestamp directly against `NOW()` on the Supabase PostgreSQL database server.
- **Remaining Limitation**: Requires NTP synchronization between the Next.js serverless host and Supabase database (standard on Vercel and AWS).

#### Threat 4.2: Late Check-In After Session End
- **Attack Scenario**: A student attempts to check in minutes after class has concluded.
- **Risk Level**: **Medium**.
- **Mitigation**: The session record has `status = 'ended'`. The backend checks `status == 'active'` before processing check-ins; any attempt after session closure is rejected with `SESSION_INACTIVE`.

---

### 5. Physical Attendance Threats

#### Threat 5.1: "Check-In and Leave" Abuse
- **Attack Scenario**: A student enters class, scans the QR code at minute 2, and leaves the classroom for the remainder of the 90-minute lecture.
- **Risk Level**: **High**.
- **Mitigation**: **Random In-Class Re-Verification**. Teachers can initiate an unannounced 60-second micro-challenge mid-lecture via Supabase Realtime. Students must acknowledge the prompt on their registered device. If the student has departed the lecture hall, their registered phone is either with them (cannot scan blackboard/screen) or if absent, fails to respond within the 60-second window. A missed re-verification marks the attendance record as `re_verify_failed`.
- **Remaining Limitation**: If the student leaves their registered phone with a friend who remains in class, the friend could acknowledge the prompt.

---

### 6. Teacher-Side & Administrative Threats

#### Threat 6.1: Unauthorized Attendance Record Manipulation
- **Attack Scenario**: A malicious user or rogue client script attempts to directly edit historical attendance percentages.
- **Risk Level**: **Critical**.
- **Mitigation**: **Row Level Security (RLS) + Append-Only Audit Logs**. Students have zero write access to `attendance_records`. All teacher manual overrides or device resets generate an immutable record in `audit_logs` storing `actor_id`, `action`, `details`, and `ip_address`.

---

## Summary Security Matrix

| Vector | Attack Vector | Risk | System Defense | Residual Limitation |
| :--- | :--- | :--- | :--- | :--- |
| **QR Sharing** | Photo forwarded to chat app | High | 15–20s Rotating Dynamic Token with HMAC | Ultra-low latency video stream (<15s) |
| **QR Replay** | Resending old QR screenshots | Critical | Server timestamp + sequence check | None |
| **Credential Lending** | Friend logs in on second phone | High | Single registered device fingerprint | Attender physically carries 2 phones |
| **Clock Spoofing** | Student rewinds phone time | Medium | Authoritative server clock (`NOW()`) | None |
| **Check-in & Leave**| Leaves 5 min into lecture | High | Random in-class 60s re-verification | Attender leaves phone with peer |
| **API Scripting** | Submitting via curl | High | Signed challenge payload required | Still requires physical sight of QR |
| **Race Conditions** | Concurrent requests | Medium | PostgreSQL `UNIQUE(session_id, student_id)`| None |
| **Privilege Abuse** | Student calling teacher APIs | Critical | Supabase Auth RBAC guard | None |

---

## Defense-in-Depth Implementation Details

### Cryptographic QR Token Structure
The dynamic QR token generated by the server adheres to the following cryptographic specification:

```typescript
// Token Generation (Server Only)
const payload = {
  sessionId: session.id,
  sequence: session.currentSequence,
  timestamp: Math.floor(Date.now() / 1000),
  nonce: crypto.randomBytes(4).toString('hex')
};

const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signature = crypto
  .createHmac('sha256', process.env.QR_HMAC_SECRET!)
  .update(encodedPayload)
  .digest('base64url');

const challengeToken = `${encodedPayload}.${signature}`;
```

### Verification Logic:
1. Split token into `encodedPayload` and `signature`.
2. Compute expected HMAC on `encodedPayload` with server secret.
3. Use timing-safe comparison (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.
4. Decode JSON payload and verify `timestamp >= (serverNow - TTL)` and `timestamp <= (serverNow + 5)` (clock drift allowance).

---

## Critical Real-World Limitations

1. **Hardware-Free Constraint**: AttendGuard is designed to operate on standard web browsers and smartphones without requiring proprietary biometrics, turnstiles, or Bluetooth beacons. Consequently, physical co-location cannot be guaranteed with 100% certainty if a student physically gives their unlocked phone to an accomplice.
2. **Classroom Layout & Windows**: If a lecture hall has ground-floor glass windows, a student outside could theoretically zoom in and scan the projector screen. In-class re-verifications help detect if the student leaves campus immediately after.
3. **Browser Fingerprint Stability**: Browser updates or private browsing sessions can sometimes alter browser fingerprints. The teacher device-reset workflow accommodates legitimate student hardware changes while recording audit entries.
4. **No Absolute Physical Proof**: No software-only system can prove continuous, physical in-seat classroom presence with 100% mathematical certainty. Rotating QR challenges and registered device binding raise the barrier against casual proxy check-ins, but cannot replace observant human proctoring.
5. **AI Is Not the Legal Record**: The AI Attendance Advisor is an educational decision-support layer. The PostgreSQL database maintained by the backend remains the sole legal source of attendance records.

---

## AI & Intelligence Engine Security Model

### 1. Credential Exposure
- Strict exclusion in `.gitignore` for all `.env*` local files.
- Prohibition of `NEXT_PUBLIC_` prefixes on secret variables.
- All AI invocations are mediated strictly through server-side route handlers (`/api/student/advisor` and `/api/ai/advisor`).

### 2. Prompt Injection & Jailbreaking Defense
- Context is treated as immutable, read-only system truth.
- The system prompt enforces strict refusal of instructions asking to override verified calculations.
- Client-side input length is clamped to $\le 1000$ characters to prevent buffer-flooding attacks.

### 3. PII & Privacy Minimization
- Only course names, attendance fractions, and threshold metrics are serialized into AI context.
- Student emails, passwords, auth tokens, session IDs, Supabase service keys, and biometric data are strictly forbidden from AI payloads.

### 4. Denial of Service & Quota Exhaustion
- Client interface disables input and submit triggers while a request is in flight.
- HTTP 429 (`RATE_LIMIT_EXCEEDED`) errors are intercepted and translated to localized fallbacks without crashing the application.

