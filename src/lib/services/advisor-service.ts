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

  try {
    const data = await apiFetch<AdvisorResponseData>("/api/ai/advisor", {
      method: "POST",
      body: JSON.stringify({ query: trimmed } as AdvisorQueryRequest),
    });

    if (data && data.reply) {
      return data;
    }
  } catch {
    // Contract-compatible fallback during backend staging
  }

  // Grounded rule-based response adhering to docs/API.md
  return generateMockAdvisorReply(trimmed);
}
