import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatPercentage, getAttendanceStatus } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api-client";

describe("Frontend Foundation Utilities", () => {
  it("cn correctly merges and resolves Tailwind class conflicts", () => {
    const result = cn("p-4 bg-red-500", "p-2", { "text-white": true, "hidden": false });
    expect(result).toContain("p-2");
    expect(result).not.toContain("p-4");
    expect(result).toContain("text-white");
    expect(result).not.toContain("hidden");
  });

  it("formatPercentage formats numbers to one decimal place", () => {
    expect(formatPercentage(75)).toBe("75.0%");
    expect(formatPercentage(82.345)).toBe("82.3%");
    expect(formatPercentage(66.99)).toBe("67.0%");
  });

  it("getAttendanceStatus categorizes percentage thresholds correctly", () => {
    const safe = getAttendanceStatus(78.5);
    expect(safe.label).toBe("Safe");
    expect(safe.variant).toBe("emerald");

    const atRisk = getAttendanceStatus(70.0);
    expect(atRisk.label).toBe("At Risk");
    expect(atRisk.variant).toBe("amber");

    const critical = getAttendanceStatus(58.0);
    expect(critical.label).toBe("Critical");
    expect(critical.variant).toBe("crimson");
  });
});

describe("apiFetch client envelope handler", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("unwraps successful API response payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        success: true,
        data: { role: "student", identifier: "STU-001" },
        error: null,
      }),
    });

    const data = await apiFetch<{ role: string; identifier: string }>("/api/auth/me");
    expect(data.role).toBe("student");
    expect(data.identifier).toBe("STU-001");
  });

  it("throws ApiError when response contains error envelope", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      json: async () => ({
        success: false,
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        },
      }),
    });

    await expect(apiFetch("/api/auth/me")).rejects.toThrow("User must be authenticated");

    try {
      await apiFetch("/api/auth/me");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("UNAUTHORIZED");
    }
  });
});
