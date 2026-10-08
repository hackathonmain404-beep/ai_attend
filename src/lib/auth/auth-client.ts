import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "student" | "teacher";
  identifier?: string;
  device?: {
    isRegistered: boolean;
    deviceName: string | null;
    registeredAt: string | null;
  };
}

export type MockUserProfile = UserProfile;

export interface AuthSession {
  user: UserProfile | null;
  role: "student" | "teacher" | null;
  isAuthenticated: boolean;
}

const STORAGE_KEY = "attendguard-user";

let inMemoryProfile: UserProfile | null = null;

/**
 * Authenticates user credentials via backend API (/api/auth/login) backed by Supabase Auth and database.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ profile: UserProfile; role: "student" | "teacher" }> {
  const result = await apiFetch<{
    user: UserProfile;
    role: "student" | "teacher";
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  saveCurrentUserProfile(result.user);
  return { profile: result.user, role: result.role };
}

/**
 * Registers a new student or faculty user via the backend signup API backed by Supabase Auth and public.profiles.
 */
export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "teacher";
  identifier: string;
}): Promise<{ profile: UserProfile; role: "student" | "teacher" }> {
  const result = await apiFetch<{
    user: UserProfile;
    role: "student" | "teacher";
  }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(params),
  });

  saveCurrentUserProfile(result.user);
  return { profile: result.user, role: result.role };
}

/**
 * Signs out the current active session.
 */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}

  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}

  clearCurrentUserProfile();
}

/**
 * Saves user profile to local storage and in-memory cache, and notifies listeners.
 */
export function saveCurrentUserProfile(profile: UserProfile) {
  inMemoryProfile = profile;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
    window.dispatchEvent(new CustomEvent("attendguard-user-changed", { detail: profile }));
  }
}

/**
 * Clears all user session and credentials from local storage and in-memory cache.
 */
export function clearCurrentUserProfile() {
  inMemoryProfile = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("attendguard-oauth-role");
      localStorage.removeItem("attendguard-oauth-provider");
    } catch {}
    window.dispatchEvent(new CustomEvent("attendguard-user-changed", { detail: null }));
  }
}

/**
 * Retrieves the currently active user profile from client storage or memory.
 */
export function getCurrentUserProfile(): UserProfile | null {
  if (typeof window !== "undefined") {
    try {
      const rawStorage = localStorage.getItem(STORAGE_KEY);
      if (rawStorage) {
        return JSON.parse(rawStorage) as UserProfile;
      }
    } catch {}
  }

  return inMemoryProfile;
}

/**
 * Asynchronously resolves the authentic user profile:
 * 1. Checks synchronous cache first.
 * 2. Checks authoritative GET /api/auth/me endpoint.
 * 3. Checks browser Supabase client live session and database profiles.
 * Automatically synchronizes authentic profile to client storage.
 */
export async function resolveCurrentUserProfile(): Promise<UserProfile | null> {
  // 1. Check synchronous cache first
  const cached = getCurrentUserProfile();
  if (cached) return cached;

  if (typeof window === "undefined") return null;

  // 2. Try fetching from /api/auth/me to get the authoritative server profile
  try {
    const me = await apiFetch<{
      id: string;
      email: string;
      fullName: string;
      role: "student" | "teacher";
      identifier?: string;
      device?: {
        isRegistered: boolean;
        deviceName: string | null;
        registeredAt: string | null;
      };
    }>("/api/auth/me");

    if (me && me.id && me.role) {
      const liveProfile: UserProfile = {
        id: me.id,
        email: me.email,
        fullName: me.fullName || "Academic User",
        role: me.role,
        identifier: me.identifier,
        device: me.device
          ? {
              isRegistered: Boolean(me.device.isRegistered),
              deviceName: me.device.deviceName ?? null,
              registeredAt: me.device.registeredAt ?? null,
            }
          : undefined,
      };
      saveCurrentUserProfile(liveProfile);
      return liveProfile;
    }
  } catch {
    // Unauthenticated or network issue
  }

  // 3. Try checking Supabase client session in browser (e.g., OAuth return)
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      const email = session.user.email || "";
      const meta = session.user.user_metadata || {};
      const storedRole =
        (localStorage.getItem("attendguard-oauth-role") as "student" | "teacher") ||
        dbProfile?.role ||
        meta.role ||
        "student";

      const liveProfile: UserProfile = {
        id: session.user.id,
        email: dbProfile?.email || email,
        fullName: dbProfile?.full_name || meta.full_name || meta.name || email.split("@")[0] || "Academic User",
        role: storedRole,
        identifier: dbProfile?.identifier || meta.identifier || (storedRole === "teacher" ? `FAC-${session.user.id.slice(0, 4)}` : `STU-${session.user.id.slice(0, 4)}`),
      };
      saveCurrentUserProfile(liveProfile);
      return liveProfile;
    }
  } catch {}

  return null;
}
