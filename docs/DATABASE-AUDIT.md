# AttendGuard Comprehensive Database & Backend Audit (Phase 0)

**Date**: October 2026  
**Status**: Authoritative Forensic Audit Completed  
**Auditor**: Senior Backend Architect, PostgreSQL Architect & Supabase Security Engineer  

---

## 1. Executive Summary

This audit assesses the discrepancy between AttendGuard's documented database specification (`docs/DATABASE.md`, `database.txt`) and the actual implementation across migrations (`supabase/migrations/001_initial_schema.sql` through `004_auth_profile_provisioning.sql`), backend Route Handlers (`src/app/api/`), authorization guards (`src/lib/auth/guards.ts`), and client-side code.

### Summary of Critical Findings
1. **Unchecked Error Masking in Profile Lookups (Problem A)**: Database errors during profile queries in `requireAuth()` fall through to auto-provisioning and are reported as `401 UnauthorizedError('User profile not found. Contact administrator.')`.
2. **Privilege Escalation via User Metadata & Open Role Route (Problem B)**: New user signups, `ensureUserProfile`, and the migration trigger read `raw_user_meta_data->>'role'`, enabling any user to self-declare as `teacher`. Furthermore, `POST /api/auth/role` allows any authenticated user to switch their role to `teacher` using the service-role client.
3. **Pervasive Cascading Deletes (Problem D)**: Deleting a teacher, class, session, or student triggers `ON DELETE CASCADE` across `classes`, `attendance_sessions`, `attendance_records`, and `attendance_verifications`, wiping out academic attendance history.
4. **Unrestricted Profile Updates (Problem E)**: `profiles` RLS permits `UPDATE` for `auth.uid() = id` without column restrictions, allowing users to modify `role` or `identifier`.
5. **Unauthorized Device Resets (Problem F)**: Any teacher can reset any student's device across the institution. Attendance records lack a foreign key/constraint ensuring the device belongs to the student.
6. **In-Memory Challenge Map in Serverless (Problems G & I)**: In-class re-verification challenges are stored in a Node.js in-memory `Map` (`activeChallenges`), breaking multi-instance serverless deployments on Vercel.
7. **Broken Audit Logging on Device Reset (Problem J)**: `audit_logs` has RLS enabled with no `INSERT` policy for `authenticated`, causing teacher-initiated device reset audit logs to fail silently.
8. **Documentation Divergence (Problem K)**: Unsubstantiated claims regarding "geolocation" and "biometric binding" exist in documentation and UI copy without corresponding database models or APIs.

---

## 2. Table-by-Table Forensic Audit

### 2.1. `profiles`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 13–21)
* **Columns**: `id UUID PK REFERENCES auth.users(id) ON DELETE CASCADE`, `email TEXT NOT NULL UNIQUE`, `full_name TEXT NOT NULL`, `role TEXT CHECK (role IN ('student', 'teacher'))`, `identifier TEXT NOT NULL UNIQUE`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
* **Triggers**:
  - `on_auth_user_created` (`supabase/migrations/004_auth_profile_provisioning.sql`): Executes `handle_new_user()`.
* **Identified Vulnerabilities**:
  1. `ON DELETE CASCADE` from `auth.users`: Deleting an auth user cascades to their profile, which in turn cascades to all their classes, sessions, and attendance history.
  2. RLS policy `"Users can update own profile"` allows updating any column (`role`, `identifier`, `email`).
  3. Trigger `handle_new_user()` trusts `NEW.raw_user_meta_data->>'role'`.

### 2.2. `classes`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 27–35)
* **Columns**: `id UUID PK`, `code TEXT NOT NULL`, `name TEXT NOT NULL`, `teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`, `schedule TEXT NOT NULL`, `semester TEXT NOT NULL`, `created_at TIMESTAMPTZ`.
* **Identified Vulnerabilities**:
  1. `teacher_id REFERENCES profiles(id) ON DELETE CASCADE`: Deleting a faculty profile wipes all their classes and historical attendance.
  2. No `is_archived` or soft-deletion flag.

### 2.3. `class_enrollments`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 41–47)
* **Columns**: `id UUID PK`, `class_id UUID REFERENCES classes(id) ON DELETE CASCADE`, `student_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `enrolled_at TIMESTAMPTZ`.
* **Constraints**: `CONSTRAINT unique_class_student_enrollment UNIQUE (class_id, student_id)`.
* **Identified Vulnerabilities**:
  1. No soft deletion or enrollment status (`enrolled`, `dropped`, `completed`).
  2. Previous trigger/helper code auto-enrolled students into arbitrary active classes upon registration.

### 2.4. `attendance_sessions`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 53–63)
* **Columns**: `id UUID PK`, `class_id UUID REFERENCES classes(id) ON DELETE CASCADE`, `teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `status TEXT CHECK (status IN ('active', 're_verifying', 'ended'))`, `qr_rotation_interval_sec INT`, `active_token_hash TEXT`, `token_expires_at TIMESTAMPTZ`, `started_at TIMESTAMPTZ`, `ended_at TIMESTAMPTZ`.
* **Identified Vulnerabilities**:
  1. `class_id` and `teacher_id` have independent foreign keys, but no composite check or constraint guarantees that `classes.teacher_id = attendance_sessions.teacher_id`.
  2. `re_verify` challenges are not persisted on the session row; backend uses an in-memory `Map`.

### 2.5. `registered_devices`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 69–83)
* **Columns**: `id UUID PK`, `student_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `device_fingerprint TEXT NOT NULL`, `device_name TEXT NOT NULL`, `user_agent TEXT`, `is_active BOOLEAN DEFAULT true`, `registered_at TIMESTAMPTZ`, `last_used_at TIMESTAMPTZ`.
* **Indexes**: `UNIQUE INDEX idx_single_active_device_per_student ON registered_devices (student_id) WHERE is_active = true`.
* **Identified Vulnerabilities**:
  1. Device reset RLS allows *any* authenticated teacher to update `is_active` for *any* student in the database.
  2. Ordinary browser fingerprinting is labeled as "biometric hardware binding" in frontend strings.

### 2.6. `attendance_records`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 89–101)
* **Columns**: `id UUID PK`, `session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE`, `student_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `device_id UUID REFERENCES registered_devices(id)`, `status TEXT CHECK (status IN ('present', 'absent', 're_verify_failed'))`, `check_in_time TIMESTAMPTZ`, `re_verified BOOLEAN DEFAULT false`, `re_verified_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`.
* **Constraints**: `CONSTRAINT unique_session_student_attendance UNIQUE (session_id, student_id)`.
* **Identified Vulnerabilities**:
  1. Missing constraint verifying `device_id` belongs to `student_id`.
  2. Deleting a session or student immediately cascades and deletes attendance records.
  3. Contradictory states exist between `status` and `re_verified` (e.g., status is `present` while `re_verified = false` after challenge ended).

### 2.7. `attendance_verifications`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 107–117)
* **Columns**: `id UUID PK`, `session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE`, `student_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `verification_type TEXT`, `status TEXT`, `token_used TEXT`, `ip_address TEXT`, `user_agent TEXT`, `created_at TIMESTAMPTZ`.
* **Identified Vulnerabilities**:
  1. Deletion cascades wipe forensic logs.
  2. No geolocation columns exist, contrary to documentation claims.

### 2.8. `audit_logs`
* **Schema Definition**: `supabase/migrations/001_initial_schema.sql` (lines 123–132)
* **Columns**: `id UUID PK`, `actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL`, `action TEXT NOT NULL`, `entity_type TEXT NOT NULL`, `entity_id UUID`, `details JSONB DEFAULT '{}'`, `ip_address TEXT`, `created_at TIMESTAMPTZ`.
* **Identified Vulnerabilities**:
  1. `002_rls_policies.sql` has no `INSERT` policy for `authenticated`. When `resetStudentDevice` calls `logAuditEvent` using the teacher's client, PostgreSQL rejects the insert.
  2. No explicit `REVOKE UPDATE, DELETE` to enforce immutability at the SQL permission level.

---

## 3. Row-Level Security (RLS) Policy Audit

| Table | Policy Name | Command | Target Role | Audit Assessment |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Users can read own profile | SELECT | authenticated | Safe (`auth.uid() = id`) |
| `profiles` | Teachers can read student profiles in their classes | SELECT | authenticated | Safe (`auth_is_teacher()` + enrollment check) |
| `profiles` | Users can update own profile | UPDATE | authenticated | **CRITICAL FLAW**: Allows mutating `role` and `identifier` |
| `classes` | Teachers can read own classes | SELECT | authenticated | Safe (`teacher_id = auth.uid()`) |
| `classes` | Students can read enrolled classes | SELECT | authenticated | Safe (joins `class_enrollments`) |
| `classes` | Teachers can insert classes | INSERT | authenticated | Safe (`teacher_id = auth.uid()` + `auth_is_teacher()`) |
| `classes` | Teachers can update own classes | UPDATE | authenticated | Safe (`teacher_id = auth.uid()` + `auth_is_teacher()`) |
| `class_enrollments` | Students can read own enrollments | SELECT | authenticated | Safe (`student_id = auth.uid()`) |
| `class_enrollments` | Teachers can read enrollments for their classes | SELECT | authenticated | Safe |
| `class_enrollments` | Teachers can manage enrollments for their classes | ALL | authenticated | Safe |
| `attendance_sessions` | Teachers can manage sessions for own classes | ALL | authenticated | Safe |
| `attendance_sessions` | Enrolled students can read active sessions | SELECT | authenticated | Safe |
| `registered_devices` | Students can view own registered devices | SELECT | authenticated | Safe |
| `registered_devices` | Teachers can view devices of students in their classes | SELECT | authenticated | Safe |
| `registered_devices` | Students can register initial device | INSERT | authenticated | Safe (prevents 2nd active device) |
| `registered_devices` | Teachers can reset student devices | UPDATE | authenticated | **DEFECT**: Any teacher can reset any student's device |
| `attendance_records` | Direct client writes blocked | N/A | authenticated | Safe (writes restricted to server-side admin) |
| `attendance_records` | Students read own records | SELECT | authenticated | Safe |
| `attendance_records` | Teachers read class records | SELECT | authenticated | Safe |
| `attendance_verifications` | Teachers read session logs | SELECT | authenticated | Safe |
| `attendance_verifications` | Students read own logs | SELECT | authenticated | Safe |
| `audit_logs` | Teachers can read audit logs | SELECT | authenticated | Safe |
| `audit_logs` | Direct client writes | INSERT | authenticated | **DEFECT**: No INSERT policy exists; client audit writes fail |

---

## 4. Deployed Database Environment Assessment
* **Project Reference**: Remote Supabase Project configured via `.env.local`
* **Local CLI**: Supabase CLI `2.120.0` verified operational.
* **Environment Configuration**: Secrets and credentials remain strictly isolated in `.env.local` and server-only modules (`src/lib/supabase/admin.ts`).
