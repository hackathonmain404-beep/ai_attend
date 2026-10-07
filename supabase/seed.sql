-- ==============================================================================
-- AttendGuard Seed Data (supabase/seed.sql)
-- Development and test cohort: 1 Teacher, 4 Students, 2 Classes, Devices & Past Records.
-- ==============================================================================

-- 1. Deterministic UUID Constants
-- (Using deterministic UUIDs so foreign key relations match reliably across setups)
DO $$
DECLARE
  v_teacher_id UUID := '00000000-0000-0000-0000-000000000001';
  v_stu1_id    UUID := '00000000-0000-0000-0000-000000000002';
  v_stu2_id    UUID := '00000000-0000-0000-0000-000000000003';
  v_stu3_id    UUID := '00000000-0000-0000-0000-000000000004';
  v_stu4_id    UUID := '00000000-0000-0000-0000-000000000005';
  
  v_class_cs   UUID := '11111111-1111-1111-1111-111111111111';
  v_class_math UUID := '22222222-2222-2222-2222-222222222222';
  
  v_dev1_id    UUID := '33333333-3333-3333-3333-333333333331';
  v_dev2_id    UUID := '33333333-3333-3333-3333-333333333332';
  v_dev3_id    UUID := '33333333-3333-3333-3333-333333333333';
  v_dev4_id    UUID := '33333333-3333-3333-3333-333333333334';
  
  v_past_sess1 UUID := '44444444-4444-4444-4444-444444444441';
BEGIN

  -- 1. Insert Profiles (Normally created via Supabase Auth triggers)
  -- Note: If running with Supabase Auth, mock auth.users IDs would match these.
  INSERT INTO profiles (id, email, full_name, role, identifier)
  VALUES 
    (v_teacher_id, 'prof.turing@university.edu', 'Prof. Alan Turing', 'teacher', 'FAC-2026-001'),
    (v_stu1_id,    'jane.doe@university.edu',    'Jane Doe',           'student', 'STU-2026-001'),
    (v_stu2_id,    'john.smith@university.edu',  'John Smith',         'student', 'STU-2026-002'),
    (v_stu3_id,    'alice.j@university.edu',     'Alice Johnson',      'student', 'STU-2026-003'),
    (v_stu4_id,    'bob.brown@university.edu',   'Bob Brown',          'student', 'STU-2026-004')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Classes
  INSERT INTO classes (id, code, name, teacher_id, schedule, semester)
  VALUES 
    (v_class_cs,   'CS301',   'Distributed Systems', v_teacher_id, 'Mon/Wed 10:00 - 11:30', 'Fall 2026'),
    (v_class_math, 'MATH202', 'Linear Algebra',      v_teacher_id, 'Tue/Thu 14:00 - 15:30', 'Fall 2026')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Enroll Students in Courses
  INSERT INTO class_enrollments (class_id, student_id)
  VALUES 
    (v_class_cs, v_stu1_id),
    (v_class_cs, v_stu2_id),
    (v_class_cs, v_stu3_id),
    (v_class_cs, v_stu4_id),
    (v_class_math, v_stu1_id),
    (v_class_math, v_stu2_id)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  -- 4. Register Initial Devices for Students
  INSERT INTO registered_devices (id, student_id, device_fingerprint, device_name, is_active)
  VALUES 
    (v_dev1_id, v_stu1_id, 'fp_hash_jane_iphone_15_pro_abc123', 'Jane iPhone 15 Pro', true),
    (v_dev2_id, v_stu2_id, 'fp_hash_john_pixel_8_def456',       'John Pixel 8',       true),
    (v_dev3_id, v_stu3_id, 'fp_hash_alice_galaxy_s24_ghi789',   'Alice Galaxy S24',   true),
    (v_dev4_id, v_stu4_id, 'fp_hash_bob_oneplus_12_jkl012',     'Bob OnePlus 12',     true)
  ON CONFLICT (id) DO NOTHING;

  -- 5. Insert Completed Past Attendance Session (CS301 Lecture 1)
  INSERT INTO attendance_sessions (id, class_id, teacher_id, status, qr_rotation_interval_sec, started_at, ended_at)
  VALUES 
    (v_past_sess1, v_class_cs, v_teacher_id, 'ended', 20, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '90 minutes')
  ON CONFLICT (id) DO NOTHING;

  -- 6. Insert Attendance Records for Past Session
  -- 3 Present (Jane, John, Alice), 1 Absent (Bob)
  INSERT INTO attendance_records (session_id, student_id, device_id, status, check_in_time, re_verified)
  VALUES 
    (v_past_sess1, v_stu1_id, v_dev1_id, 'present', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', true),
    (v_past_sess1, v_stu2_id, v_dev2_id, 'present', NOW() - INTERVAL '2 days' + INTERVAL '6 minutes', true),
    (v_past_sess1, v_stu3_id, v_dev3_id, 'present', NOW() - INTERVAL '2 days' + INTERVAL '8 minutes', false)
  ON CONFLICT (session_id, student_id) DO NOTHING;

END $$;
