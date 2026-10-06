/**
 * AttendGuard Analytics - Attendance Insight Engine
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type {
  RiskLevel,
  AttendanceTrend,
  PriorityLevel,
  SubjectInsightInput,
  SubjectInsight,
  OverallInsights,
  AttendanceContextPayload,
  AnalyticsPolicyConfig,
} from './types.ts';
import { DEFAULT_ANALYTICS_POLICY } from './types.ts';
import { calculateAttendance } from './attendance.ts';
import { calculateRequiredClasses, calculateSafeMisses } from './projections.ts';
import { calculateRiskLevel, calculateAttendanceTrend } from './risk.ts';

/**
 * Computes an explainable, deterministic urgency score for a subject.
 * Higher score = higher urgency to attend upcoming classes.
 * 
 * - CRITICAL tier base: 1000
 * - AT_RISK tier base: 500
 * - SAFE tier base: 0
 * - Shortfall/margin weight & recovery burden
 * - Declining trend penalty (+50) / Improving trajectory reward (-25)
 */
export function calculatePriorityScore(
  riskLevel: RiskLevel,
  percentage: number,
  requiredPercentage: number,
  classesNeeded: number,
  trend: AttendanceTrend
): number {
  let score = 0;

  switch (riskLevel) {
    case 'CRITICAL':
      // Base + distance from requirement + recovery burden
      score = 1000 + (requiredPercentage - percentage) * 10 + classesNeeded * 5;
      break;
    case 'AT_RISK':
      // Base + proximity to the critical drop line
      score = 500 + (80 - percentage) * 5;
      break;
    case 'SAFE':
      // Base + inverted safety margin (lower cushion within safe = slightly higher priority)
      score = Math.max(0, 100 - percentage);
      break;
  }

  // Directional momentum adjustments
  if (trend === 'declining') {
    score += 50;
  } else if (trend === 'improving') {
    score -= 25;
  }

  return Math.round((score + Number.EPSILON) * 10) / 10;
}

/**
 * Maps numeric priority score into categorical priority tiers.
 */
export function getPriorityLevel(priorityScore: number): PriorityLevel {
  if (priorityScore >= 1000) {
    return 'HIGH';
  }
  if (priorityScore >= 500) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Generates an insight profile for an individual subject by composing Phase 2 calculations.
 */
export function generateSubjectInsight(
  input: SubjectInsightInput,
  policy: AnalyticsPolicyConfig = DEFAULT_ANALYTICS_POLICY
): SubjectInsight {
  const requiredPercentage = input.requiredPercentage ?? policy.defaultRequiredPercentage;
  const percentage = calculateAttendance(input.attended, input.total);
  const riskLevel = calculateRiskLevel(percentage, requiredPercentage, policy);

  // Evaluate trend if previous snapshot is available; otherwise default to stable
  const trend: AttendanceTrend =
    input.previousPercentage !== undefined
      ? calculateAttendanceTrend(percentage, input.previousPercentage, policy.trendTolerancePercentage)
      : 'stable';

  const classesNeeded = calculateRequiredClasses(input.attended, input.total, requiredPercentage);
  const safeMisses = calculateSafeMisses(input.attended, input.total, requiredPercentage);

  const priorityScore = calculatePriorityScore(
    riskLevel,
    percentage,
    requiredPercentage,
    classesNeeded,
    trend
  );
  const priorityLevel = getPriorityLevel(priorityScore);

  // Formulate deterministic summary text
  let summary = '';
  if (riskLevel === 'CRITICAL') {
    summary = `Immediate attention required: attend next ${classesNeeded} consecutive class(es) to reach ${requiredPercentage}%.`;
  } else if (riskLevel === 'AT_RISK') {
    summary = `Near minimum threshold: maintain attendance (can miss at most ${safeMisses} class(es)).`;
  } else {
    summary = `Attendance is healthy: can safely miss up to ${safeMisses} class(es).`;
  }

  if (trend === 'declining') {
    summary += ' Trajectory is declining.';
  } else if (trend === 'improving') {
    summary += ' Trajectory is improving.';
  }

  return {
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    attended: input.attended,
    total: input.total,
    percentage,
    requiredPercentage,
    riskLevel,
    trend,
    classesNeeded,
    safeMisses,
    priorityScore,
    priorityLevel,
    summary,
  };
}

/**
 * Sorts subject insights by priority score descending (highest urgency first).
 */
export function rankSubjectsByUrgency(insights: SubjectInsight[]): SubjectInsight[] {
  return [...insights].sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Aggregates all subject data into holistic overall attendance intelligence.
 */
export function generateOverallInsights(
  subjects: SubjectInsightInput[],
  customPolicy?: Partial<AnalyticsPolicyConfig>
): OverallInsights {
  const policy: AnalyticsPolicyConfig = {
    ...DEFAULT_ANALYTICS_POLICY,
    ...customPolicy,
  };

  // Safe handling for empty subject set
  if (subjects.length === 0) {
    return {
      totalAttended: 0,
      totalClasses: 0,
      overallPercentage: 0,
      overallRisk: 'SAFE',
      criticalSubjectsCount: 0,
      atRiskSubjectsCount: 0,
      safeSubjectsCount: 0,
      highestRiskSubject: null,
      overallTrend: 'stable',
    };
  }

  const subjectInsights = subjects.map((s) => generateSubjectInsight(s, policy));
  const ranked = rankSubjectsByUrgency(subjectInsights);

  let totalAttended = 0;
  let totalClasses = 0;
  let improvingCount = 0;
  let decliningCount = 0;

  for (const s of subjects) {
    totalAttended += s.attended;
    totalClasses += s.total;
  }

  let criticalCount = 0;
  let atRiskCount = 0;
  let safeCount = 0;

  for (const item of subjectInsights) {
    if (item.riskLevel === 'CRITICAL') criticalCount++;
    else if (item.riskLevel === 'AT_RISK') atRiskCount++;
    else safeCount++;

    if (item.trend === 'improving') improvingCount++;
    else if (item.trend === 'declining') decliningCount++;
  }

  const overallPercentage = calculateAttendance(totalAttended, totalClasses);
  const overallRisk = calculateRiskLevel(overallPercentage, policy.defaultRequiredPercentage, policy);

  // Overall trajectory evaluation
  let overallTrend: AttendanceTrend = 'stable';
  if (decliningCount > improvingCount) {
    overallTrend = 'declining';
  } else if (improvingCount > decliningCount) {
    overallTrend = 'improving';
  }

  const highestRisk = ranked.length > 0 ? ranked[0] : null;

  return {
    totalAttended,
    totalClasses,
    overallPercentage,
    overallRisk,
    criticalSubjectsCount: criticalCount,
    atRiskSubjectsCount: atRiskCount,
    safeSubjectsCount: safeCount,
    highestRiskSubject: highestRisk,
    overallTrend,
  };
}

/**
 * Generates deterministic, actionable recommendation statements based on structured insights.
 */
export function generateActionableRecommendations(
  overall: OverallInsights,
  rankedSubjects: SubjectInsight[]
): string[] {
  const recommendations: string[] = [];

  if (rankedSubjects.length === 0) {
    return ['No course enrollment data found. Please register for subjects to track attendance.'];
  }

  // 1. Critical Course Guidance
  if (overall.criticalSubjectsCount > 0 && overall.highestRiskSubject) {
    recommendations.push(
      `${overall.highestRiskSubject.subjectName} requires immediate focus: attend the next ${overall.highestRiskSubject.classesNeeded} class(es) to regain the ${overall.highestRiskSubject.requiredPercentage}% requirement.`
    );
  }

  // 2. Declining warning
  const decliningSubjects = rankedSubjects.filter((s) => s.trend === 'declining');
  if (decliningSubjects.length > 0) {
    const names = decliningSubjects.map((s) => s.subjectName).join(', ');
    recommendations.push(
      `Attendance trajectory is slipping in: ${names}. Avoid unexcused absences in these courses.`
    );
  }

  // 3. Borderline courses
  const atRiskSubjects = rankedSubjects.filter((s) => s.riskLevel === 'AT_RISK');
  if (atRiskSubjects.length > 0 && overall.criticalSubjectsCount === 0) {
    recommendations.push(
      `Attendance is near the minimum threshold in ${atRiskSubjects.length} course(s). You have minimal absence allowance remaining.`
    );
  }

  // 4. Positive affirmation if everything is safe
  if (overall.criticalSubjectsCount === 0 && overall.atRiskSubjectsCount === 0) {
    recommendations.push(
      'All enrolled courses currently meet or exceed attendance targets. Keep up the consistent attendance.'
    );
  }

  return recommendations;
}

/**
 * Packages all calculated intelligence into a complete, structured context payload.
 * Ready for consumption by frontend dashboards and the AI Attendance Advisor.
 */
export function generateAttendanceContext(
  subjects: SubjectInsightInput[],
  customPolicy?: Partial<AnalyticsPolicyConfig>
): AttendanceContextPayload {
  const policy: AnalyticsPolicyConfig = {
    ...DEFAULT_ANALYTICS_POLICY,
    ...customPolicy,
  };

  const subjectInsights = subjects.map((s) => generateSubjectInsight(s, policy));
  const rankedSubjects = rankSubjectsByUrgency(subjectInsights);
  const overall = generateOverallInsights(subjects, policy);
  const recommendations = generateActionableRecommendations(overall, rankedSubjects);

  return {
    overall,
    rankedSubjects,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
