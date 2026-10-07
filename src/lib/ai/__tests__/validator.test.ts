import { describe, it, expect } from 'vitest';
import { validateAdvisorResponse } from '../validator';
import { getDemoScenarioContext } from '@/lib/analytics/demo-scenarios';

describe('Hardened Response Validator & Anti-Hallucination Guard', () => {
  const jordanContext = getDemoScenarioContext('critical');

  it('rejects empty or whitespace-only response', () => {
    const resEmpty = validateAdvisorResponse('', jordanContext);
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.issues[0]).toContain('EMPTY_RESPONSE');

    const resWhitespace = validateAdvisorResponse('   \n  \t ', jordanContext);
    expect(resWhitespace.isValid).toBe(false);
  });

  it('allows standard policy thresholds (75% and 80%) without triggering contradictions', () => {
    const text =
      'You need to maintain at least 75% attendance according to university policy. A safe margin is 80%.';
    const res = validateAdvisorResponse(text, jordanContext);
    expect(res.isValid).toBe(true);
    expect(res.issues.length).toBe(0);
  });

  it('flags numerical contradiction for overall attendance when divergence exceeds 1.0%', () => {
    // Verified overall is 78.5%
    const contradictory =
      'Your overall attendance is currently 92.0%, which is well above the requirement.';
    const res = validateAdvisorResponse(contradictory, jordanContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('CONTRADICTION') && i.includes('Overall attendance'))).toBe(
      true
    );
  });

  it('accepts overall attendance within 1.0% tolerance', () => {
    // 78.5% -> 78.5% or 79%
    const text = 'Your overall attendance standing is currently 78.5%.';
    const res = validateAdvisorResponse(text, jordanContext);
    expect(res.isValid).toBe(true);
  });

  it('flags numerical contradiction for enrolled course when divergence exceeds 1.0%', () => {
    // C Programming verified is 68.0%
    const contradictory =
      'In C Programming, your current attendance is 85.0%, so you do not need to worry.';
    const res = validateAdvisorResponse(contradictory, jordanContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('CONTRADICTION') && i.includes('C Programming'))).toBe(
      true
    );
  });

  it('flags hallucinated unlisted ghost courses with token distance attribution', () => {
    // Jordan is enrolled in C Programming, Computer Architecture, Math, Physics. Biology is NOT enrolled.
    const hallucination =
      'In Biology, your attendance is currently 65%, which puts you at critical risk.';
    const res = validateAdvisorResponse(hallucination, jordanContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('HALLUCINATION') && i.includes('biology'))).toBe(
      true
    );
  });

  it('passes completely valid factual response', () => {
    const valid =
      'In C Programming, your attendance is currently 68.0%. You need to attend 7 consecutive classes to reach the 75% minimum threshold.';
    const res = validateAdvisorResponse(valid, jordanContext);
    expect(res.isValid).toBe(true);
    expect(res.issues.length).toBe(0);
  });
});
