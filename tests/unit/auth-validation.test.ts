import { describe, it, expect, beforeEach } from "vitest";
import { loginSchema } from "@/lib/validations/auth";
import { signIn, signOut, getCurrentUserProfile } from "@/lib/auth/auth-client";
import { ApiError } from "@/lib/api-client";

describe("Login Zod Validation Schema", () => {
  it("passes validation with valid institutional email and password", () => {
    const validData = {
      email: "jane.doe@university.edu",
      password: "securepassword123",
    };
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane.doe@university.edu");
    }
  });

  it("normalizes and lowercases email input", () => {
    const data = {
      email: "  JANE.DOE@UNIVERSITY.EDU  ",
      password: "securepassword123",
    };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane.doe@university.edu");
    }
  });

  it("fails validation when email is missing or empty", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "securepassword123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("Email is required");
    }
  });

  it("fails validation when email has invalid format", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "securepassword123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("valid academic email");
    }
  });

  it("fails validation when password is shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "jane.doe@university.edu",
      password: "123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("at least 6 characters");
    }
  });
});

describe("Client Authentication Service & Contract Handling", () => {
  it("authenticates valid student demo credentials and returns student profile", async () => {
    const result = await signIn("jane.doe@university.edu", "student123");
    expect(result.role).toBe("student");
    expect(result.profile.fullName).toBe("Jane Doe");
    expect(result.profile.identifier).toBe("STU-2026-001");
    expect(result.profile.device?.isRegistered).toBe(true);
  });

  it("authenticates valid faculty demo credentials and returns teacher profile", async () => {
    const result = await signIn("prof.turing@university.edu", "teacher123");
    expect(result.role).toBe("teacher");
    expect(result.profile.fullName).toBe("Prof. Alan Turing");
    expect(result.profile.identifier).toBe("FAC-2026-001");
  });

  it("throws ApiError with INVALID_CREDENTIALS code on wrong password", async () => {
    await expect(
      signIn("jane.doe@university.edu", "wrongpassword")
    ).rejects.toThrow("Invalid academic email or password");

    try {
      await signIn("jane.doe@university.edu", "wrongpassword");
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("INVALID_CREDENTIALS");
      expect(err.status).toBe(401);
    }
  });

  it("throws ApiError on non-existent account", async () => {
    await expect(
      signIn("unknown.user@university.edu", "somepassword")
    ).rejects.toThrow();
  });

  it("signs out and clears active profile", async () => {
    await signIn("jane.doe@university.edu", "student123");
    await signOut();
    // After sign out, current user is null
    const user = getCurrentUserProfile();
    expect(user).toBeNull();
  });
});
