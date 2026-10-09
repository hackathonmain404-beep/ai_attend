# AttendGuard Root-Cause Analysis & Remediation Report

**Date**: October 2026  
**Document**: Authoritative Root Cause Investigation (Phase 0)  
**Scope**: Problems A through K  

---

## Problem A — First Login Causes “User Profile Not Found”

### 1. Actual Evidence
- In `src/lib/auth/guards.ts` (lines 37–53), `requireAuth()` executes:
  ```ts
  const profileQuery = supabase.from('profiles').select('*').eq('id', user.id);
  ```
  If `profileQuery` yields an error (`fetchError` / connection timeout / Postgres error), `profile` remains `null`.
- In `src/lib/auth/guards.ts` (lines 55–77), it attempts fallback provisioning via `ensureUserProfile(user)`. If `ensureUserProfile` throws an error (e.g. database connection down, admin key misconfigured, or RLS error), the catch block logs the error and proceeds to line 76:
  ```ts
  throw new UnauthorizedError('User profile not found. Contact administrator.');
  ```
  Actual database outages or query rejections are incorrectly reported to the user as a missing profile (`401 UnauthorizedError`).
- In `supabase/migrations/004_auth_profile_provisioning.sql`, `handle_new_user()` contains:
  ```sql
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user]: Failed to provision profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  ```
  If an exception occurs during the database trigger execution on `auth.users`, it logs a warning but allows the user creation to proceed with zero rows created in `public.profiles`.

### 2. Confirmed Root Cause
1. **Error Masking**: Database query errors are swallowed and converted into a generic "Profile not found" error.
2. **Trigger Exception Suppression**: Uncaught SQL errors in the trigger fail silently without retrying or provisioning through an authoritative fallback.

### 3. Affected Files / Migrations
- `src/lib/auth/guards.ts`
- `src/lib/auth/profile-provisioning.ts`
- `supabase/migrations/004_auth_profile_provisioning.sql`

### 4. Potential Impact
Authenticated users see "User profile not found" on their first login or during transient database spikes, forcing them to reload or contact an administrator.

### 5. Proposed Correction
1. In `requireAuth()`, distinguish between `data === null` (row truly missing) and `error !== null` (database query failed). If `error` is present, throw a `500 InternalServerError('Database error while retrieving profile.')`.
2. Ensure idempotent auto-provisioning is invoked only when the row genuinely does not exist, and surface any provisioning errors with clear diagnostic codes rather than masking as missing profile.

### 6. Required Tests
- Valid first-time OAuth login creates profile and succeeds without second login.
- Simulated database query error throws 500 Database Error, not 401 Missing Profile.
- Returning user logs in with existing profile intact.

---

## Problem B — Insecure Role Assignment

### 1. Actual Evidence
- `supabase/migrations/004_auth_profile_provisioning.sql` (line 18):
  ```sql
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  ```
- `src/lib/auth/profile-provisioning.ts` (lines 90–94):
  ```ts
  let role: UserRole = 'student';
  if (options?.explicitRole === 'teacher' || metadata.role === 'teacher') {
    role = 'teacher';
  }
  ```
- `src/app/api/auth/signup/route.ts` (lines 29, 55):
  Accepts `role` from the client request body and writes it directly to `raw_user_meta_data`.
- `src/app/api/auth/role/route.ts` (lines 13–35):
  Allows any authenticated client to send `{ "role": "teacher" }` and updates `public.profiles` using `createAdminClient()`.
- `supabase/migrations/002_rls_policies.sql` (lines 48–53):
  Allows users to update their own profile with `auth.uid() = id` without restricting column updates.

### 2. Confirmed Root Cause
The system trusts user-controlled client input (`raw_user_meta_data`, signup payload, and `/api/auth/role`) to assign privileged roles. The database also lacks column-level protections on `profiles.role`.

### 3. Affected Files / Migrations
- `supabase/migrations/004_auth_profile_provisioning.sql`
- `src/lib/auth/profile-provisioning.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/role/route.ts`
- `supabase/migrations/002_rls_policies.sql`

### 4. Potential Impact
Any malicious actor can register or issue an API request to grant themselves `teacher` privileges, gaining access to class management, student rosters, session creation, and device reset capabilities.

### 5. Proposed Correction
1. Enforce that new self-service accounts (OAuth or email/password) are always provisioned as `student` by default.
2. Restrict `teacher` role assignment to an authorized faculty provisioning mechanism (e.g. admin-approved invitation table or controlled seed script).
3. Secure or remove the public `/api/auth/role` switching route in production.
4. Add a `BEFORE UPDATE` trigger on `profiles` preventing users from modifying `role` or `identifier`.

### 6. Required Tests
- Signup with `{ "role": "teacher" }` payload results in a `student` profile.
- Direct update to `profiles.role` via Supabase client is rejected by PostgreSQL.
- Call to `/api/auth/role` by a non-admin is rejected.
- Existing legitimate teacher accounts (`prof.turing@university.edu`) retain their role.

---

## Problem C — Automatic Enrollment in Demo Courses

### 1. Actual Evidence
- `database.txt` (lines 415–420) documented:
  `If the new user is a student, automatically enrolls them into active demo courses.`
- `supabase/migrations/004_auth_profile_provisioning.sql` had a draft inserting into `class_enrollments` with `LIMIT 10`.
- In `src/lib/auth/guards.ts` previous code auto-enrolled students into courses on first login.

### 2. Confirmed Root Cause
Demo shortcuts intended for quick evaluation were embedded into production authentication code paths.

### 3. Affected Files / Migrations
- `supabase/migrations/004_auth_profile_provisioning.sql`
- `src/lib/auth/profile-provisioning.ts`
- `src/lib/auth/guards.ts`
- `database.txt`

### 4. Potential Impact
Clean production environments have course rosters polluted with fictional student enrollments.

### 5. Proposed Correction
Completely remove automatic course enrollment from all triggers, auth guards, and provisioning helpers. Ensure empty databases produce genuine empty states.

### 6. Required Tests
- Newly provisioned student has 0 class enrollments in an empty or fresh database.
- Roster counts accurately reflect only explicitly enrolled students.

---

## Problem D — Attendance Records Lost Through Cascading Deletes

### 1. Actual Evidence
- `supabase/migrations/001_initial_schema.sql`:
  ```sql
  classes: teacher_id REFERENCES profiles(id) ON DELETE CASCADE
  attendance_sessions: class_id REFERENCES classes(id) ON DELETE CASCADE
  attendance_sessions: teacher_id REFERENCES profiles(id) ON DELETE CASCADE
  attendance_records: session_id REFERENCES attendance_sessions(id) ON DELETE CASCADE
  attendance_records: student_id REFERENCES profiles(id) ON DELETE CASCADE
  attendance_verifications: session_id REFERENCES attendance_sessions(id) ON DELETE CASCADE
  attendance_verifications: student_id REFERENCES profiles(id) ON DELETE CASCADE
  ```

### 2. Confirmed Root Cause
Unconditional `ON DELETE CASCADE` foreign keys cause deletions of faculty, courses, sessions, or students to purge attendance records and audit logs.

### 3. Affected Files / Migrations
- `supabase/migrations/001_initial_schema.sql`
- Forward migration required (`005_data_retention_and_integrity.sql`)

### 4. Potential Impact
Accidental deletion of a class or teacher permanently erases historical attendance data, violating institutional audit standards.

### 5. Proposed Correction
1. Change foreign keys on `attendance_records` and `attendance_sessions` to `ON DELETE RESTRICT`.
2. Introduce soft-deletion flags (`is_archived BOOLEAN DEFAULT false`, `deleted_at TIMESTAMPTZ`) on `classes` and `profiles`.
3. Disallow hard deletion of classes or sessions that possess attendance records.

### 6. Required Tests
- Attempting to delete a class with active or past attendance records is blocked by PostgreSQL (`RESTRICT`).
- Attempting to delete an attendance session with records is blocked.

---

## Problem E — Profile Columns May Be User-Modifiable

### 1. Actual Evidence
- `supabase/migrations/002_rls_policies.sql` (lines 48–53):
  ```sql
  CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  ```
  PostgreSQL RLS applies to row access, not column restrictions. Any user can execute an SQL update altering `role` or `identifier`.

### 2. Confirmed Root Cause
Missing column-level restrictions or protective triggers on `public.profiles`.

### 3. Affected Files / Migrations
- `supabase/migrations/002_rls_policies.sql`
- Forward migration required.

### 4. Potential Impact
Students can alter their institutional Roll Number (`identifier`) or elevate their `role` to `teacher`.

### 5. Proposed Correction
Add a `BEFORE UPDATE` trigger on `profiles` that enforces:
```sql
IF NEW.role <> OLD.role OR NEW.identifier <> OLD.identifier OR NEW.id <> OLD.id THEN
  RAISE EXCEPTION 'Modification of protected profile fields (id, role, identifier) is forbidden.';
END IF;
```

### 6. Required Tests
- Authenticated student attempting to update `role` from 'student' to 'teacher' throws an error.
- Authenticated student attempting to change `identifier` throws an error.
- Legitimate update to `full_name` succeeds.

---

## Problem F — Device Ownership and Reset Authorization

### 1. Actual Evidence
- In `001_initial_schema.sql`, `attendance_records` has:
  ```sql
  student_id UUID REFERENCES profiles(id),
  device_id UUID REFERENCES registered_devices(id)
  ```
  There is no constraint asserting `registered_devices.student_id = attendance_records.student_id`.
- In `src/lib/device/service.ts`, `resetStudentDevice` does not verify if the requesting teacher teaches any class that the student is enrolled in.
- In `002_rls_policies.sql`, RLS allows any teacher (`auth_is_teacher()`) to update `registered_devices`.
- In `002_rls_policies.sql`, `audit_logs` has no `INSERT` policy for `authenticated`, causing `resetStudentDevice` audit logging to fail silently.

### 2. Confirmed Root Cause
1. Missing relational integrity constraint connecting attendance records, students, and devices.
2. Inadequate scoping of teacher device-reset authorization.
3. Defective RLS insert policy on `audit_logs`.

### 3. Affected Files / Migrations
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `src/lib/device/service.ts`
- `src/app/api/auth/device/reset/route.ts`

### 4. Potential Impact
A teacher can reset the device of students they do not teach. A student could theoretically present another student's device ID.

### 5. Proposed Correction
1. Add a composite foreign key or database trigger ensuring `device_id` on `attendance_records` belongs to `student_id`.
2. Restrict device resets so teachers can only reset devices for students enrolled in their classes.
3. Fix `audit_logs` insertion using the service-role admin client or dedicated security-definer function.

### 6. Required Tests
- Check-in with Student A and Student B's device ID is rejected.
- Teacher A cannot reset device for Student B who is not enrolled in Teacher A's classes.
- Device reset by authorized teacher emits an audit log in `audit_logs`.

---

## Problem G — QR Validation and Replay Protection

### 1. Actual Evidence
- `src/lib/attendance/reverify-service.ts` uses an in-memory `Map` (`activeChallenges = new Map()`) to track active re-verification challenges.
- In a serverless deployment (Vercel), requests hit different instances, causing false "window expired" rejections.

### 2. Confirmed Root Cause
State stored in server process memory rather than PostgreSQL or distributed cache.

### 3. Affected Files / Migrations
- `src/lib/attendance/reverify-service.ts`
- `supabase/migrations/001_initial_schema.sql` (missing challenge persistence columns)

### 4. Potential Impact
Legitimate student re-verification acknowledgments fail in production when routed across multi-instance serverless functions.

### 5. Proposed Correction
Persist active re-verification challenge metadata (`reverify_challenge_id`, `reverify_expires_at`) directly in `attendance_sessions` or a dedicated challenges table.

### 6. Required Tests
- Challenge created in one instance can be validated across another instance using the database state.
- Expired challenges are rejected.

---

## Problem H — Teacher / Class / Session Ownership

### 1. Actual Evidence
- `attendance_sessions` stores `class_id` and `teacher_id`, but lacks a composite foreign key `(class_id, teacher_id) REFERENCES classes(id, teacher_id)`.
- If an API or query inserts a session with mismatched IDs, PostgreSQL accepts it.

### 2. Confirmed Root Cause
Denormalized foreign keys without composite integrity constraint.

### 3. Affected Files / Migrations
- `supabase/migrations/001_initial_schema.sql`
- `src/lib/attendance/session-service.ts`

### 4. Potential Impact
A session could be assigned to a class owned by a different instructor.

### 5. Proposed Correction
Add a composite unique constraint on `classes(id, teacher_id)` and enforce foreign key reference on `attendance_sessions(class_id, teacher_id)`.

### 6. Required Tests
- Attempting to insert an attendance session with `class_id` belonging to Teacher A and `teacher_id` of Teacher B is rejected by PostgreSQL.

---

## Problem I — Attendance Status & Re-Verification Lifecycle

### 1. Actual Evidence
- `attendance_records` has `status IN ('present', 'absent', 're_verify_failed')` and `re_verified BOOLEAN`.
- A record can have `status = 'present'` while `re_verified = false` after a re-verification window has expired, leading to ambiguity in reports.

### 2. Confirmed Root Cause
Dual representation of attendance outcome without explicit transition validation.

### 3. Affected Files / Migrations
- `supabase/migrations/001_initial_schema.sql`
- `src/lib/attendance/reverify-service.ts`
- `src/lib/attendance/session-service.ts`

### 4. Potential Impact
Attendance analytics may compute conflicting percentages depending on whether they query `status` or `re_verified`.

### 5. Proposed Correction
Define explicit lifecycle state machine:
- Initial check-in: `status = 'present'`, `re_verified = false`.
- If challenge acknowledged: `re_verified = true`, `re_verified_at = NOW()`.
- If session ends and challenge was triggered but missed: `status = 're_verify_failed'`.
Add check constraint or trigger enforcing valid state combinations.

### 6. Required Tests
- Student who attends but fails random challenge ends with `status = 're_verify_failed'`.
- Student who attends and acknowledges challenge ends with `status = 'present'` and `re_verified = true`.

---

## Problem J — Audit-Log Integrity

### 1. Actual Evidence
- `audit_logs` has RLS enabled with NO `INSERT` policy for `authenticated`.
- `resetStudentDevice` calls `logAuditEvent(..., supabase)` with the teacher's client, failing silently.
- Claims of "tamper-evident immutable" logs lack explicit `REVOKE UPDATE, DELETE` permissions.

### 2. Confirmed Root Cause
Missing RLS insert permission and lack of explicit table-level write locks for non-service roles.

### 3. Affected Files / Migrations
- `supabase/migrations/002_rls_policies.sql`
- `src/lib/audit/logger.ts`

### 4. Potential Impact
High-privilege actions (device resets) go unlogged. Users could update or delete audit logs if RLS was ever bypassed.

### 5. Proposed Correction
1. Perform all `audit_logs` inserts via `createAdminClient()`.
2. Add a `BEFORE UPDATE OR DELETE` trigger on `audit_logs` that unconditionally raises an exception.
3. Explicitly `REVOKE UPDATE, DELETE ON audit_logs FROM authenticated, anon`.

### 6. Required Tests
- Device reset generates an audit record in `audit_logs`.
- Attempt to `DELETE` or `UPDATE` a row in `audit_logs` is rejected by PostgreSQL.

---

## Problem K — Schema and Documentation Inconsistencies

### 1. Actual Evidence
- `database.txt` / `dtabase.txt` (line 431) claims "Instant Geolocation".
- `StudentSidebar.tsx` and `StudentTopHeader.tsx` claim "Device Biometric Binding".
- `attendance_records` and `attendance_verifications` have zero location or biometric columns.

### 2. Confirmed Root Cause
Marketing language and legacy demo copy diverged from the actual technical implementation (browser fingerprinting + dynamic QR tokens + one-touch challenge acknowledgments).

### 3. Affected Files / Migrations
- `database.txt`
- `dtabase.txt`
- `docs/DATABASE.md`
- Frontend UI components (`ScrollDefenseProtocolFlow.tsx`, `StudentSidebar.tsx`, `StudentTopHeader.tsx`)

### 4. Potential Impact
Misleads evaluators, security reviewers, and institutional compliance officers regarding system capabilities.

### 5. Proposed Correction
Align documentation and UI text with actual capabilities: "Hardware-bound Device Binding" (via fingerprinting) and "One-Touch Random Presence Challenge" (without claiming native biometric authentication or GPS tracking).

### 6. Required Tests
- All documentation files pass audit verification against actual database schema.
