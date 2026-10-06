# AttendGuard Frontend Architecture & Conventions

> **Next.js App Router, Component Hierarchies, UI States & Client Responsibilities**  
> *Engineering standards for Member 2 (Student Experience) and Member 3 (Teacher Experience).*

---

## Table of Contents

- [Frontend Philosophy & Boundary Enforcement](#frontend-philosophy--boundary-enforcement)
- [Directory Structure & Ownership Breakdown](#directory-structure--ownership-breakdown)
- [Design System & Styling Standards](#design-system--styling-standards)
- [Responsive Layout & Viewport Targets](#responsive-layout--viewport-targets)
- [Standard UI States & UX Feedback](#standard-ui-states--ux-feedback)
  - [1. Loading States (Skeletons)](#1-loading-states-skeletons)
  - [2. Error States (Actionable Alerts)](#2-error-states-actionable-alerts)
  - [3. Empty States](#3-empty-states)
  - [4. Toast Notifications & Haptics](#4-toast-notifications--haptics)
- [Component Specifications](#component-specifications)
  - [Student Experience (Member 2)](#student-experience-member-2)
  - [Teacher Experience (Member 3)](#teacher-experience-member-3)
  - [Shared & UI Components](#shared--ui-components)
- [API Consumption Pattern & Envelope Handling](#api-consumption-pattern--envelope-handling)
- [Accessibility (a11y) & Visual Ergonomics](#accessibility-a11y--visual-ergonomics)

---

## Frontend Philosophy & Boundary Enforcement

The most critical principle of AttendGuard is:

> [!CRITICAL]
> **The Frontend Never Asserts Presence.**  
> The client interface is solely a presentation, scanning, and request-dispatching tool. No frontend component may ever set `status = 'present'` or calculate authoritative eligibility percentages. All presence decisions and mathematical formulas live strictly behind the backend API contract.

### Division of Responsibilities

| Frontend Domain (Members 2 & 3) | Backend Domain (Member 1) |
| :--- | :--- |
| Rendering screens, forms, tables, and charts | Verifying Supabase session authentication |
| Camera viewfinder & QR frame capture | Validating HMAC token signatures & expiration |
| Local device fingerprint hashing & submission | Enforcing single registered device association |
| Loading skeletons & real-time counter animations | Committing serialized attendance transactions |
| Handling error toasts and user guidance | Calculating attendance percentages & streak metrics |

---

## Directory Structure & Ownership Breakdown

```text
src/
├── app/
│   ├── (auth)/                 # Shared: Login & Auth layouts
│   │   ├── login/page.tsx
│   │   └── register-device/page.tsx
│   ├── student/                # OWNED BY MEMBER 2 (Student Frontend)
│   │   ├── layout.tsx          # Mobile navigation shell & header
│   │   ├── page.tsx            # Student dashboard (Today's classes)
│   │   ├── scanner/page.tsx    # Mobile camera QR scanner
│   │   ├── history/page.tsx    # Attendance history & percentages
│   │   ├── device/page.tsx     # Registered device status
│   │   └── advisor/page.tsx    # MEMBER 4: AI Attendance Advisor UI
│   └── teacher/                # OWNED BY MEMBER 3 (Teacher Frontend)
│       ├── layout.tsx          # Teacher dashboard sidebar & header
│       ├── page.tsx            # Teacher dashboard (Class overview)
│       ├── classes/page.tsx    # Class & enrollment management
│       ├── sessions/
│       │   └── [id]/page.tsx   # Projector display: Rotating QR & Live Headcount
│       └── reports/page.tsx    # Analytics, class roster & CSV export
├── components/
│   ├── ui/                     # SHARED: shadcn/ui primitives (Button, Dialog, Card)
│   ├── student/                # OWNED BY MEMBER 2: Student widgets & scanner
│   ├── teacher/                # OWNED BY MEMBER 3: Teacher widgets & tables
│   └── qr/                     # OWNED BY MEMBER 3: Dynamic QR renderer
├── lib/
│   ├── api-client.ts           # Standard fetch wrapper handling envelope
│   └── utils.ts                # Tailwind cn() helper & formatters
└── types/
    └── index.ts                # Shared TypeScript contracts matching docs/API.md
```

---

## Design System & Styling Standards

AttendGuard uses **Tailwind CSS** with design primitives built upon **shadcn/ui** and **Lucide React** icons.

### Color Tokens & Palette
- **Primary / Action**: Deep Slate Indigo (`#1e293b`, `bg-slate-900`, `text-slate-50`)
- **Success / Present**: Forest Emerald (`#059669`, `bg-emerald-600`, `text-emerald-50`)
- **Warning / At Risk**: Warm Amber (`#d97706`, `bg-amber-500`, `text-amber-50`)
- **Destructive / Error**: Crimson (`#dc2626`, `bg-rose-600`, `text-rose-50`)
- **Background**: Neutral Zinc (`#fafafa` light / `#09090b` dark)

### Component Naming Conventions
- Component files: **PascalCase** (e.g., `DynamicQrDisplay.tsx`, `StudentScheduleCard.tsx`).
- Utility hooks: **camelCase** (e.g., `useSessionRealtime.ts`, `useDeviceFingerprint.ts`).
- Types & Interfaces: **PascalCase** prefixed logically (e.g., `AttendanceRecord`, `ApiResponse<T>`).

---

## Responsive Layout & Viewport Targets

### 1. Student Viewports (Mobile-First Target: 360px – 480px)
- **Primary Device**: Mobile smartphones held in portrait orientation.
- **Scanner Viewport**: Full-bleed camera viewfinder centered with an overlay square targeting box.
- **Navigation**: Bottom mobile navigation bar (Home, Scan, History, Advisor).
- **Touch Targets**: Minimum 44x44 CSS pixels for all interactive buttons.

### 2. Teacher Viewports (Desktop & Projector Target: 1024px – 1920px+)
- **Primary Device**: Laptops, desktop monitors, and classroom projector screens.
- **Projector Mode**:
  - Fullscreen toggle (`F11` or on-screen button).
  - High-contrast, scalable QR code rendered at a minimum of `400x400px` (readable from 30+ feet away).
  - Prominent countdown progress circle showing the 20-second rotation.
  - Large live headcount numbers (e.g., `48 / 65`).

---

## Standard UI States & UX Feedback

Every view must explicitly implement the four UI state pillars:

### 1. Loading States (Skeletons)
Never show blank screens or generic unstyled spinners while fetching data. Use shadcn/ui `<Skeleton />`:
- Student Dashboard: Render skeleton cards for today's classes while `/api/student/attendance/summary` resolves.
- Teacher Session: Show placeholder pulse rings while the initial QR challenge token is fetched.

### 2. Error States (Actionable Alerts)
Never display raw error objects or uninformative messages like "Something went wrong". Errors must explain the situation and provide a concrete action:
- `QR_EXPIRED`: *"The QR code on screen has refreshed. Point your camera at the new code."*
- `DEVICE_MISMATCH`: *"This is not your registered device. Switch to your registered phone or ask your professor for a device reset."*

### 3. Empty States
When a dataset contains 0 items, render an engaging empty state with an icon and call to action:
- No classes today: Calendar icon with *"No active lectures scheduled for today. Check your semester timetable."*
- No attendance history: History icon with *"Your attendance ledger is empty. Complete your first QR check-in to see records here."*

### 4. Toast Notifications & Haptics
- **Success Check-In**: Trigger a gentle device vibration (`navigator.vibrate([100, 50, 100])`) and a green confirmation toast.
- **Re-Verification Alert**: Trigger a high-priority modal overlay that automatically dismisses when the 60-second window closes.

---

## Component Specifications

### Student Experience (Member 2)

#### `StudentScanner.tsx`
- Integrates `html5-qrcode`.
- Requests rear camera (`facingMode: "environment"`).
- Automatically halts stream immediately upon reading a code to prevent duplicate submissions.
- Extracts string payload and dispatches to `/api/attendance/check-in` alongside local device fingerprint.

#### `AttendanceSummaryCard.tsx`
- Renders overall attendance percentage with visual color coding:
  - $\ge 75\%$: Green badge ("Safe")
  - $< 75\%$: Amber badge ("At Risk — 3 classes needed")
- Displays streak count and total lectures attended.

---

### Teacher Experience (Member 3)

#### `DynamicQrDisplay.tsx`
- Periodically calls `/api/sessions/[id]/qr-challenge` every 15–20 seconds.
- Renders the challenge token via `qrcode.react` (SVG mode).
- Displays a visual SVG circular countdown ring showing seconds remaining before next rotation.
- Handles projector contrast mode (black QR on crisp white card).

#### `LiveHeadcountBadge.tsx`
- Subscribes to Supabase Realtime channel for `attendance_records` filtered by `session_id`.
- Smoothly increments attendee counter upon receiving `INSERT` events.
- Displays percentage of enrolled cohort present.

#### `ReverifyTriggerButton.tsx`
- Displays a prominent button: **"Trigger In-Class Re-Verification"**.
- Triggers confirmation modal: *"This will send a 60-second presence prompt to all 48 checked-in students."*
- Dispatches `POST /api/sessions/[id]/re-verify` and initiates on-screen countdown timer.

---

### Shared & UI Components
All button, input, dialog, card, badge, and skeleton components must be sourced from `src/components/ui/` (shadcn/ui). Do not write custom raw CSS button styles.

---

## API Consumption Pattern & Envelope Handling

All API calls must use the standard typed helper in `src/lib/api-client.ts`:

```typescript
// src/lib/api-client.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const payload: ApiResponse<T> = await response.json();

  if (!payload.success || payload.error) {
    const error = new Error(payload.error?.message || 'API Request Failed');
    (error as any).code = payload.error?.code || 'UNKNOWN_ERROR';
    throw error;
  }

  return payload.data as T;
}
```

### Usage Example in a Component:
```typescript
try {
  setIsLoading(true);
  const result = await apiFetch<CheckInResult>('/api/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ challengeToken, deviceFingerprint }),
  });
  toast.success(`Marked Present in ${result.className}`);
} catch (err: any) {
  if (err.code === 'QR_EXPIRED') {
    toast.warning('QR code refreshed. Please scan the current code.');
  } else {
    toast.error(err.message);
  }
} finally {
  setIsLoading(false);
}
```

---

## Accessibility (a11y) & Visual Ergonomics

1. **High Contrast Projection**: The dynamic QR code must maintain a minimum contrast ratio of 7:1 against its background.
2. **Keyboard Navigation**: Teacher dashboard modal triggers and session controls must be fully operable via `Tab`, `Enter`, and `Escape`.
3. **Screen Reader Labels**: Camera scanner viewfinders and QR display containers must include descriptive `aria-label` attributes (e.g., `aria-label="Classroom QR scanner camera stream"`).
4. **Motion Sensitivity**: Respect `prefers-reduced-motion` media queries when animating countdown timers and attendee counters.
