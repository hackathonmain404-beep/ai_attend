import type { AdvisorResponseData } from "@/types/advisor";

/**
 * Contract-Compatible Rule-Based AI Attendance Advisor Engine
 * Strictly adheres to docs/API.md section 6 examples and verified student records.
 */
export function generateMockAdvisorReply(query: string): AdvisorResponseData {
  const q = query.toLowerCase();

  // 1. Inquiries about MATH202 / Linear Algebra
  if (q.includes("linear algebra") || q.includes("math202") || q.includes("math")) {
    return {
      reply:
        "In MATH202 (Linear Algebra), your attendance is currently at 68.2% (15 out of 22 classes attended), which is below the required 75% threshold. You cannot afford to miss any upcoming classes. You must attend the next 3 consecutive classes without absence to restore your attendance back to 75.0%.",
      contextSnapshot: {
        classCode: "MATH202",
        currentPercentage: 68.2,
        attended: 15,
        totalHeld: 22,
        targetPercentage: 75.0,
        classesNeeded: 3,
        canMiss: 0,
      },
    };
  }

  // 2. Inquiries about CS301 / Distributed Systems
  if (
    q.includes("distributed") ||
    q.includes("cs301") ||
    q.includes("miss tomorrow") ||
    q.includes("can i miss")
  ) {
    return {
      reply:
        "In CS301 (Distributed Systems & Cloud), your attendance is in safe standing at 85.0% (17 out of 20 classes attended). You currently have a safety buffer of 2 allowable absences before dropping below the mandated 75.0% threshold. If you miss tomorrow's lecture, your attendance will stand at 81.0%, which remains safely compliant.",
      contextSnapshot: {
        classCode: "CS301",
        currentPercentage: 85.0,
        attended: 17,
        totalHeld: 20,
        targetPercentage: 75.0,
        classesNeeded: 0,
        canMiss: 2,
      },
    };
  }

  // 3. Inquiries about CS205 / Operating Systems
  if (q.includes("operating systems") || q.includes("cs205") || q.includes("os")) {
    return {
      reply:
        "In CS205 (Operating Systems), your attendance is currently at 71.4% (10 out of 14 classes attended). You are slightly below the required 75% mark. Attending the next 2 consecutive lectures without absence will elevate your attendance back to 75.0%.",
      contextSnapshot: {
        classCode: "CS205",
        currentPercentage: 71.4,
        attended: 10,
        totalHeld: 14,
        targetPercentage: 75.0,
        classesNeeded: 2,
        canMiss: 0,
      },
    };
  }

  // 4. Inquiries about At-Risk / Defaulter status
  if (
    q.includes("risk") ||
    q.includes("defaulter") ||
    q.includes("below 75") ||
    q.includes("warning") ||
    q.includes("which class")
  ) {
    return {
      reply:
        "According to your verified ledger, 2 out of your 5 enrolled courses are currently under the 75% regulatory requirement: 1) MATH202 (Linear Algebra) at 68.2% (requires 3 consecutive classes), and 2) CS205 (Operating Systems) at 71.4% (requires 2 consecutive classes). Your overall cumulative attendance is 82.5% across 51 total lectures.",
      contextSnapshot: {
        classCode: "MATH202",
        currentPercentage: 68.2,
        attended: 15,
        totalHeld: 22,
        targetPercentage: 75.0,
        classesNeeded: 3,
        canMiss: 0,
      },
    };
  }

  // 5. Default General Response
  return {
    reply:
      "I am your AttendGuard AI Attendance Advisor. I evaluate official university attendance records and calculate your regulatory 75% margins. You can ask me specific questions such as: 'Am I safe in Linear Algebra?', 'Can I miss Distributed Systems tomorrow?', or 'How many consecutive classes do I need to attend to restore 75%?'",
    contextSnapshot: null,
  };
}
