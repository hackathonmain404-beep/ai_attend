# AttendGuard Project Delivery Roadmap

> **5-Phase Engineering Roadmap for Hackathon Execution**  
> *Clear milestones, module owners, dependencies, and Definition of Done (DoD).*

---

## Roadmap Overview

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     PHASE 1     │───►│     PHASE 2     │───►│     PHASE 3     │───►│     PHASE 4     │───►│     PHASE 5     │
│   Foundation    │    │ Core Attendance │    │   Anti-Abuse    │    │  Analytics & AI │    │    Hardening    │
│  (DB, Auth, UI) │    │  (QR & Check-in)│    │(Devices, Verify)│    │(Insights, Chat) │    │  (Tests & Demo) │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Phase 1 — Foundation & Infrastructure

### Goal
Establish the working Next.js skeleton, database schema with Supabase, authentication with role-based routing, and shared UI primitives.

### Deliverables & Ownership
| Feature | Owner | Dependencies |
| :--- | :--- | :--- |
| Next.js App Router setup with Tailwind & shadcn/ui primitives | Member 1 & 3 | Node.js environment |
| Supabase PostgreSQL migrations (`profiles`, `classes`, `sessions`, `records`) | Member 1 | Supabase Project |
| Supabase Auth setup (Email/Password) & Edge Middleware RBAC | Member 1 | Supabase Auth |
| Base layout shells: `/student` (mobile) and `/teacher` (desktop) | Member 2 & 3 | shadcn/ui components |
| Shared API response envelope & types in `src/types/index.ts` | Member 1 | [docs/API.md](API.md) |

### Definition of Done (DoD)
- [ ] Student can log in and land on `/student/dashboard`.
- [ ] Teacher can log in and land on `/teacher/dashboard`.
- [ ] Unauthorized URL cross-access is redirected by middleware.
- [ ] Supabase database migrations apply with zero errors on a clean instance.

---

## Phase 2 — Core Attendance Loop

### Goal
Implement the core end-to-end loop: Teacher creates a session $\to$ Screen displays rotating QR $\to$ Student scans $\to$ Backend verifies and marks Present.

### Deliverables & Ownership
| Feature | Owner | Dependencies |
| :--- | :--- | :--- |
| `POST /api/sessions/start` and `GET /api/sessions/:id/qr-challenge` | Member 1 | Phase 1 DB schema |
| Dynamic QR challenge token generator (HMAC-SHA256 signer) | Member 1 | `QR_HMAC_SECRET` |
| Dynamic QR Display component with 20s auto-refresh on screen | Member 3 | Phase 2 API endpoint |
| Mobile HTML5 Camera Scanner component (`/student/scanner`) | Member 2 | Mobile browser camera |
| `POST /api/attendance/check-in` route handler | Member 1 | QR validator engine |
| Realtime Live Headcount counter card on teacher session view | Member 3 | Supabase Realtime |

### Definition of Done (DoD)
- [ ] Teacher starts a session on projector view and sees rotating QR code with countdown timer.
- [ ] Student opens camera scanner on phone, scans code, and receives green "Verified Present" badge.
- [ ] Teacher screen live counter increments in real time without refreshing the browser.
- [ ] Record appears in Supabase `attendance_records` table.

---

## Phase 3 — Anti-Abuse & Verification Layers

### Goal
Close the critical fraud vectors: single device binding, short-lived token expiry enforcement, replay prevention, duplicate blocks, and random re-verification.

### Deliverables & Ownership
| Feature | Owner | Dependencies |
| :--- | :--- | :--- |
| Student device registration flow & fingerprint generator | Member 2 & 1 | `registered_devices` |
| Single active device validation guard during check-in | Member 1 | Device fingerprinting |
| Teacher device reset endpoint (`POST /api/auth/device/reset`) | Member 1 & 3 | Audit logging |
| PostgreSQL composite unique index on `(session_id, student_id)` | Member 1 | Database migration |
| In-class random re-verification trigger & broadcast modal | Member 3 & 2 | Supabase Realtime |
| Security event logging in `attendance_verifications` | Member 1 | Core check-in loop |

### Definition of Done (DoD)
- [ ] Scanning a QR code older than 20 seconds fails with `QR_EXPIRED`.
- [ ] Submitting attendance from an unregistered phone fails with `DEVICE_MISMATCH`.
- [ ] Concurrent or double-scanning for the same class rejects with `ALREADY_CHECKED_IN`.
- [ ] Teacher can trigger a surprise 60-second in-class presence challenge to students.

---

## Phase 4 — Analytics & AI Attendance Advisor

### Goal
Provide students and teachers with visual analytics and enable the AI Attendance Advisor powered by trusted backend mathematics and an open-weight LLM.

### Deliverables & Ownership
| Feature | Owner | Dependencies |
| :--- | :--- | :--- |
| Student attendance percentage & history ledger (`/student/history`) | Member 2 | Attendance records |
| Deterministic math engine (exact % and classes needed for 75%) | Member 1 & 4 | `src/lib/attendance/` |
| AI Attendance Advisor chat interface (`/student/advisor`) | Member 4 & 2 | shadcn/ui Chat card |
| Open-weight LLM inference integration (Llama 3.1 via Groq/Ollama) | Member 4 | Inference API key |
| Fallback offline advisor engine (Zero-LLM rule based) | Member 4 | Deterministic math |
| Teacher class attendance charts (Recharts) & CSV export | Member 3 | Historical sessions |

### Definition of Done (DoD)
- [ ] Student dashboard displays color-coded attendance cards ($\ge 75\%$ green, $< 75\%$ amber).
- [ ] Student asks AI Advisor: *"Can I miss tomorrow's class?"* and receives an accurate answer citing exact backend numbers.
- [ ] Disconnecting the LLM API triggers seamless rule-based fallback without crashing the UI.

---

## Phase 5 — Hardening, Deployment & Demo Prep

### Goal
Perform cross-role end-to-end testing, security attack simulations, UI polish, production deployment on Vercel, and presentation rehearsals.

### Deliverables & Ownership
| Feature | Owner | Dependencies |
| :--- | :--- | :--- |
| Automated unit and integration test suite execution | All Members | Vitest setup |
| Security attack simulation tests (Replay, clock drift, role bypass) | Member 1 | [docs/TESTING.md](TESTING.md) |
| Mobile viewport & projector contrast polish | Member 2 & 3 | UI components |
| Vercel production deployment & environment variable check | Member 1 | GitHub repository |
| Pitch slide deck & 3-minute live demonstration script | All Members | Working deployment |

### Definition of Done (DoD)
- [ ] All tests in test matrix pass without regressions.
- [ ] Production build succeeds (`npm run build`) with zero TypeScript errors.
- [ ] App is fully accessible on live Vercel URL.
- [ ] Live demo scenario rehearsed: Teacher creates session on laptop $\to$ Student scans from phone $\to$ Live count updates $\to$ Surprise re-verification succeeds $\to$ Student queries AI Advisor.
