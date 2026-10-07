import { createClient } from "@/lib/supabase/client";
import { MOCK_USERS, type MockUserProfile } from "@/mocks/auth";
import { ApiError, apiFetch } from "@/lib/api-client";

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

  removeCookie(DEMO_COOKIE_NAME);
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Retrieves the currently active user profile from client storage or cookie.
 */
export function getCurrentUserProfile(): MockUserProfile | null {
  if (typeof window === "undefined") return null;

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

  return null;
}
