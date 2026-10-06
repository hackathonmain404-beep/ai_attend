import { describe, it, expect } from "vitest";
import { generateMockAdvisorReply } from "@/mocks/advisor";
import { askAdvisor } from "@/lib/services/advisor-service";

describe("AI Attendance Advisor Query Engine & Contract Alignment", () => {
  it("evaluates at-risk course queries (MATH202 / Linear Algebra) conforming to docs/API.md", async () => {
    const res = await askAdvisor("Am I safe in Linear Algebra, or do I need to attend the next classes?");

    expect(res).toBeDefined();
    expect(res.reply).toContain("MATH202");
    expect(res.reply).toContain("68.2%");
    expect(res.reply).toContain("3 consecutive classes");

    expect(res.contextSnapshot).toBeDefined();
    expect(res.contextSnapshot?.classCode).toBe("MATH202");
    expect(res.contextSnapshot?.currentPercentage).toBe(68.2);
    expect(res.contextSnapshot?.targetPercentage).toBe(75.0);
    expect(res.contextSnapshot?.classesNeeded).toBe(3);
    expect(res.contextSnapshot?.canMiss).toBe(0);
  });

  it("evaluates safe course queries (CS301 / Distributed Systems) and allowable absence margins", async () => {
    const res = await askAdvisor("Can I miss tomorrow's Distributed Systems class?");

    expect(res).toBeDefined();
    expect(res.reply).toContain("CS301");
    expect(res.reply).toContain("85.0%");
    expect(res.reply).toContain("2");

    expect(res.contextSnapshot).toBeDefined();
    expect(res.contextSnapshot?.classCode).toBe("CS301");
    expect(res.contextSnapshot?.currentPercentage).toBe(85.0);
    expect(res.contextSnapshot?.classesNeeded).toBe(0);
    expect(res.contextSnapshot?.canMiss).toBe(2);
  });

  it("evaluates courses requiring recovery (CS205 / Operating Systems)", async () => {
    const res = await askAdvisor("How many classes do I need to attend in Operating Systems?");

    expect(res).toBeDefined();
    expect(res.reply).toContain("CS205");
    expect(res.contextSnapshot?.classCode).toBe("CS205");
    expect(res.contextSnapshot?.classesNeeded).toBe(2);
  });

  it("identifies all courses below the 75% threshold on risk inquiries", async () => {
    const res = await askAdvisor("Which of my classes are currently at risk or below 75%?");

    expect(res.reply).toContain("MATH202");
    expect(res.reply).toContain("CS205");
    expect(res.reply).toContain("82.5%");
  });

  it("handles empty or blank queries gracefully without throwing", async () => {
    const res = await askAdvisor("   ");
    expect(res).toBeDefined();
    expect(res.reply).toContain("Please provide a question");
  });

  it("provides helpful capabilities guide for open-ended queries", () => {
    const res = generateMockAdvisorReply("Hello, who are you?");
    expect(res.reply).toContain("AttendGuard AI");
    expect(res.contextSnapshot).toBeNull();
  });
});
