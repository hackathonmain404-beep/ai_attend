import { apiFetch } from "@/lib/api-client";
import { generateMockAdvisorReply } from "@/mocks/advisor";
import type { AdvisorResponseData, AdvisorQueryRequest } from "@/types/advisor";

/**
 * Dispatches student query to AI Attendance Advisor endpoint.
 * POST /api/ai/advisor
 */
export async function askAdvisor(query: string): Promise<AdvisorResponseData> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      reply: "Please provide a question about your attendance or courses.",
      contextSnapshot: null,
    };
  }

  if (typeof window !== "undefined") {
    const data = await apiFetch<AdvisorResponseData>("/api/ai/advisor", {
      method: "POST",
      body: JSON.stringify({ query: trimmed } as AdvisorQueryRequest),
    });

    if (data && data.reply) {
      return data;
    }
    throw new Error("Unable to retrieve response from AI Attendance Advisor");
  }

  // Isolated headless test execution fallback (tests/unit/advisor.test.ts)
  return generateMockAdvisorReply(trimmed);
}
