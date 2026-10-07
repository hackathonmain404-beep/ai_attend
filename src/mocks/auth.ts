/**
 * Contract-Compatible Authentication Mock Store
 * Strictly mirrors docs/API.md and supabase/seed.sql.
 * Used when Supabase cloud is in demo/mock mode or offline.
 */

export interface MockUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "student" | "teacher";
  identifier: string;
  device?: {
    isRegistered: boolean;
    deviceName: string | null;
    registeredAt: string | null;
  };
}

export interface MockUserRecord {
  profile: MockUserProfile;
  passwordHash: string; // In demo mode, plain match
}

export const MOCK_USERS: Record<string, MockUserRecord> = {
  "prof.turing@university.edu": {
    profile: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "prof.turing@university.edu",
      fullName: "Prof. Alan Turing",
      role: "teacher",
      identifier: "FAC-2026-001",
      device: {
        isRegistered: false,
        deviceName: null,
        registeredAt: null,
      },
    },
    passwordHash: "teacher123",
  },
  "jane.doe@university.edu": {
    profile: {
      id: "00000000-0000-0000-0000-000000000002",
      email: "jane.doe@university.edu",
      fullName: "Jane Doe",
      role: "student",
      identifier: "STU-2026-001",
      device: {
        isRegistered: true,
        deviceName: "Jane iPhone 15 Pro",
        registeredAt: "2026-09-15T09:12:00.000Z",
      },
    },
    passwordHash: "student123",
  },
  "john.smith@university.edu": {
    profile: {
      id: "00000000-0000-0000-0000-000000000003",
      email: "john.smith@university.edu",
      fullName: "John Smith",
      role: "student",
      identifier: "STU-2026-002",
      device: {
        isRegistered: true,
        deviceName: "John Pixel 8",
        registeredAt: "2026-09-16T11:00:00.000Z",
      },
    },
    passwordHash: "student123",
  },
};
