import { createClient } from "@/lib/supabase/client";
import { MOCK_USERS, type MockUserProfile } from "@/mocks/auth";
import { ApiError, apiFetch } from "@/lib/api-client";

export type { MockUserProfile };

export interface AuthSession {
  user: MockUserProfile | null;
  role: "student" | "teacher" | null;
  isAuthenticated: boolean;
}

const DEMO_COOKIE_NAME = "attendguard-demo-user";
const STORAGE_KEY = "attendguard-user";

/**
 * Sets a client-side document cookie so Next.js middleware and server routes can read it.
 */
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

/**
 * Removes a client-side document cookie.
 */
function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Retrieves cookie value in browser.
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Authenticates user credentials via Supabase Auth with offline mock fallback.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ profile: MockUserProfile; role: "student" | "teacher" }> {
  const normalizedEmail = email.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isMockEnvironment = supabaseUrl.includes("mock-project") || !supabaseUrl.startsWith("http");

  // Attempt live Supabase Auth if real endpoint is configured
  if (!isMockEnvironment) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data?.user) {
        // Query profile from database
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          const userProfile: MockUserProfile = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name || profile.fullName,
            role: profile.role,
            identifier: profile.identifier,
          };
          setCookie(DEMO_COOKIE_NAME, JSON.stringify(userProfile));
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
          }
          return { profile: userProfile, role: userProfile.role };
        }
      }
    } catch {
      // Fall through to mock contract handler if network fails
    }
  }

  // Contract-compatible offline / demo auth
  const userRecord = MOCK_USERS[normalizedEmail];
  if (!userRecord || userRecord.passwordHash !== password) {
    throw new ApiError(
      "Invalid academic email or password. Please verify credentials.",
      "INVALID_CREDENTIALS",
      401
    );
  }

  const profile = userRecord.profile;
  setCookie(DEMO_COOKIE_NAME, JSON.stringify(profile));
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  return { profile, role: profile.role };
}

/**
 * Registers a new student or faculty user via the backend signup API.
 */
export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "teacher";
  identifier: string;
}): Promise<{ profile: MockUserProfile; role: "student" | "teacher" }> {
  const result = await apiFetch<{
    user: MockUserProfile;
    role: "student" | "teacher";
  }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
  }

  return { profile: result.user, role: result.role };
}

/**
 * Signs out the current active session.
 */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isMockEnvironment = supabaseUrl.includes("mock-project") || !supabaseUrl.startsWith("http");

  if (!isMockEnvironment) {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
  }

  clearCurrentUserProfile();
}

let inMemoryProfile: MockUserProfile | null = null;

/**
 * Saves user profile to local storage and cookies, and notifies listeners.
 */
export function saveCurrentUserProfile(profile: MockUserProfile) {
  inMemoryProfile = profile;
  if (typeof window !== "undefined") {
    setCookie(DEMO_COOKIE_NAME, JSON.stringify(profile));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
    window.dispatchEvent(new CustomEvent("attendguard-user-changed", { detail: profile }));
  }
}

/**
 * Clears all user session and credentials from local storage and cookies.
 */
export function clearCurrentUserProfile() {
  inMemoryProfile = null;
  if (typeof window !== "undefined") {
    removeCookie(DEMO_COOKIE_NAME);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("attendguard-oauth-role");
      localStorage.removeItem("attendguard-oauth-provider");
    } catch {}
    window.dispatchEvent(new CustomEvent("attendguard-user-changed", { detail: null }));
  }
}

/**
 * Retrieves the currently active user profile from client storage or cookie.
 */
export function getCurrentUserProfile(): MockUserProfile | null {
  if (typeof window !== "undefined") {
    try {
      const rawStorage = localStorage.getItem(STORAGE_KEY);
      if (rawStorage) {
        return JSON.parse(rawStorage) as MockUserProfile;
      }
      const rawCookie = getCookie(DEMO_COOKIE_NAME);
      if (rawCookie) {
        return JSON.parse(rawCookie) as MockUserProfile;
      }
    } catch {}
  }

  return inMemoryProfile;
}

/**
 * Asynchronously resolves the authentic user profile:
 * 1. Checks synchronous storage/cookie.
 * 2. Checks authoritative GET /api/auth/me endpoint.
 * 3. Checks browser Supabase client live session.
 * Automatically synchronizes authentic profile to client storage.
 */
export async function resolveCurrentUserProfile(): Promise<MockUserProfile | null> {
  // 1. Check synchronous cache first
  const cached = getCurrentUserProfile();
  if (cached) return cached;

  if (typeof window === "undefined") return null;

  // 2. Try fetching from /api/auth/me to get the authoritative server profile
  try {
    const me = await apiFetch<any>("/api/auth/me");
    if (me && me.id && me.role) {
      const liveProfile: MockUserProfile = {
        id: me.id,
        email: me.email,
        fullName: me.fullName || me.full_name || me.email?.split("@")[0] || "Authenticated User",
        role: me.role,
        identifier: me.identifier,
        device: me.device,
      };
      saveCurrentUserProfile(liveProfile);
      return liveProfile;
    }
  } catch {
    // /api/auth/me might 401 or fail in mock/offline mode
  }

  // 3. Try checking Supabase client session in browser (e.g., OAuth return)
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const meta = session.user.user_metadata || {};
      const email = session.user.email || "";
      const storedRole =
        (localStorage.getItem("attendguard-oauth-role") as "student" | "teacher") ||
        meta.role ||
        "student";
      const fullName =
        meta.full_name || meta.name || (email ? email.split("@")[0] : "Academic User");
      const identifier =
        meta.identifier ||
        (storedRole === "teacher"
          ? `FAC-${session.user.id.slice(0, 4)}`
          : `STU-${session.user.id.slice(0, 4)}`);

      const liveProfile: MockUserProfile = {
        id: session.user.id,
        email,
        fullName,
        role: storedRole,
        identifier,
      };
      saveCurrentUserProfile(liveProfile);
      return liveProfile;
    }
  } catch {}

  // 4. Return cached if available
  if (cached) {
    return cached;
  }

  return null;
}
