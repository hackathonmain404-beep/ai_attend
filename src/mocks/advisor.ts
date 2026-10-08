import type { AdvisorResponseData } from "@/types/advisor";

/**
 * Contract-Compatible Rule-Based AI Attendance Advisor Engine
 * Strictly adheres to docs/API.md section 6 examples and verified student records.
 */
export function generateMockAdvisorReply(query: string): AdvisorResponseData {
  const q = query.toLowerCase();

  // 0. Greetings
  if (
    /^(?:hi|hello|hey|hiya|howdy|greetings|good\s+(?:morning|afternoon|evening|day))(?:\s+(?:there|attendguard|advisor|ai|bot|team|assistant|everyone))?[!.,\s]*$/i.test(
      query.trim()
    )
  ) {
    return {
      reply:
        "Hello! I am your AttendGuard AI Academic Advisor. How can I help you with your attendance, course requirements, or absence planning today?",
      contextSnapshot: null,
    };
  }

  // 0b. Inquiries about unlisted courses (e.g. Physics)
  if (/\bphysics\b/i.test(q)) {
    return {
      reply:
        "No attendance records found for Physics. You are not currently enrolled in Physics. I can only provide guidance for your active courses.",
      contextSnapshot: null,
    };
  }

  // 1. Inquiries about MATH202 / Linear Algebra
  if (q.includes("linear algebra") || /\bmath202\b/i.test(q) || /\bmath\b/i.test(q)) {
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
  if (/\bdistributed\b/i.test(q) || /\bcs301\b/i.test(q)) {
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
  if (/\boperating\s+systems?\b/i.test(q) || /\bcs205\b/i.test(q) || /\bos\b/i.test(q)) {
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

  // 4. Safe Misses general inquiry (e.g. "Can I safely miss any upcoming classes?")
  if (
    /safely\s+(?:miss|skip)/i.test(q) ||
    /can\s+i\s+(?:safely\s+)?(?:miss|skip)/i.test(q) ||
    /safe\s+miss/i.test(q) ||
    /afford\s+to\s+(?:miss|skip)/i.test(q)
  ) {
    return {
      reply:
        "Upcoming timetable data is unavailable, so please specify which course you are asking about to evaluate a specific upcoming class session. Across your active courses, your safe miss allowances are: CS301 (2 safe misses), MATH202 (0 safe misses - at risk), CS205 (0 safe misses - at risk). Minimum requirement is 75.0%.",
      contextSnapshot: null,
    };
  }

  // 5. Recovery general inquiry (e.g. "How many classes do I need to attend to reach 75%?")
  if (
    /how\s+many\s+classes/i.test(q) ||
    /reach\s+75/i.test(q) ||
    /classes\s+needed/i.test(q) ||
    /consecutive/i.test(q) ||
    /recover/i.test(q)
  ) {
    return {
      reply:
        "To reach the 75.0% threshold, you currently have 2 courses requiring recovery: MATH202 requires attending the next 3 consecutive classes, and CS205 requires attending the next 2 consecutive classes.",
      contextSnapshot: null,
    };
  }

  // 6. Subject-risk / Attention inquiry (e.g. "Which subject needs the most attention?")
  if (
    /attention|focus\s+on|weakest|lowest|worst/i.test(q) ||
    /which\s+subject/i.test(q)
  ) {
    return {
      reply:
        "The subject that needs the most attention is MATH202 (Linear Algebra) at 68.2% attendance (15 out of 22 classes attended). It is below the 75% threshold and requires attending the next 3 consecutive classes without absence.",
      contextSnapshot: null,
    };
  }

  // 7. General Risk / Below 75 inquiry (e.g. "Which of my classes are currently at risk or below 75%?")
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
      contextSnapshot: null,
    };
  }

  // 7. General advice inquiry (e.g. "How can I improve my attendance?")
  if (/improve/i.test(q) || /advice|strategy|action\s+plan|tips/i.test(q)) {
    return {
      reply:
        "To improve your overall attendance, prioritize attending all upcoming sessions in MATH202 (currently 68.2%, needs 3 consecutive classes) and CS205 (currently 71.4%, needs 2 consecutive classes). Avoid any absences until your attendance in both subjects rises above 75.0%.",
      contextSnapshot: null,
    };
  }

  // 8. Summary inquiry (e.g. "Summarize my attendance status.")
  if (/summar|status|standing|overview/i.test(q)) {
    return {
      reply:
        "Your overall attendance is currently at 82.5% across 5 enrolled courses. You have 3 courses in safe standing and 2 courses (MATH202 at 68.2%, CS205 at 71.4%) currently below the 75.0% regulatory threshold.",
      contextSnapshot: null,
    };
  }

  // 9. Default General Response
  return {
    reply:
      "I am your AttendGuard AI Attendance Advisor. I evaluate official university attendance records and calculate your regulatory 75% margins. You can ask me specific questions such as: 'Am I safe in Linear Algebra?', 'Can I miss Distributed Systems tomorrow?', or 'How many consecutive classes do I need to attend to restore 75%?'",
    contextSnapshot: null,
  };
}
