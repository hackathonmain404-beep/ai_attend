/**
 * AttendGuard Urgency Prioritization & High-Level Insight Generation
 * Unified analytics service supporting both Course and Subject insight models.
 */

import {
  CourseAttendance,
  CourseInsight,
  OverallAttendanceSummary,
  InstitutionalPolicy,
  DEFAULT_POLICY,
  RiskLevel,
  AttendanceTrend,
  PriorityLevel,
  SubjectInsightInput,
  SubjectInsight,
  OverallInsights,
  AttendanceContextPayload,
  SubjectAttendanceContextPayload,
  AnalyticsPolicyConfig,
  DEFAULT_ANALYTICS_POLICY,
} from './types';
import { calculateAttendance } from './attendance';
import { calculateRequiredClasses, calculateSafeMisses } from './projections';
import { calculateRiskLevel, calculateAttendanceTrend } from './risk';

export interface PriorityScoreParams {
  risk: RiskLevel;
  percentage: number;
  requiredClasses: number;
  trend: AttendanceTrend;
  targetPct?: number; // default 75
}

/**
 * Computes an explainable multi-factor urgency score U:
 * U = U_base + Delta_deficit + Delta_trend
 * 
 * Supports both object params and positional arguments.
 */
export function calculatePriorityScore(
  riskOrParams: RiskLevel | PriorityScoreParams,
  percentage?: number,
  requiredPercentage?: number,
  classesNeeded?: number,
  trend?: AttendanceTrend
): number {
  let r: RiskLevel;
  let p: number;
  let req: number;
  let needed: number;
  let tr: AttendanceTrend;

  if (typeof riskOrParams === 'object') {
    r = riskOrParams.risk;
    p = riskOrParams.percentage;
    req = riskOrParams.targetPct ?? 75.0;
    needed = riskOrParams.requiredClasses;
    tr = riskOrParams.trend;
  } else {
    r = riskOrParams;
    p = percentage ?? 0;
    req = requiredPercentage ?? 75.0;
    needed = classesNeeded ?? 0;
    tr = trend ?? 'stable';
  }

  let score = 0;
  switch (r) {
    case 'CRITICAL':
      score = 1000 + Math.max(0, req - p) * 10 + needed * 5;
      break;
    case 'AT_RISK':
      score = 500 + Math.max(0, 80.0 - p) * 5;
      break;
    case 'SAFE':
      score = Math.max(0, 100.0 - p);
      break;
  }

  if (tr === 'declining') {
    score += 50;
  } else if (tr === 'improving') {
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
 * Computes detailed insights for all courses and sorts in descending urgency.
 */
export function generateCourseInsights(
  courses: CourseAttendance[],
  policy: InstitutionalPolicy = DEFAULT_POLICY
): CourseInsight[] {
  const insights: CourseInsight[] = courses.map((c) => {
    const currentPercentage = calculateAttendance(c.attended, c.totalHeld);
    const risk = calculateRiskLevel(currentPercentage, policy);
    const trend = calculateAttendanceTrend(currentPercentage, c.previousPercentage);
    const classesNeededForThreshold = calculateRequiredClasses(
      c.attended,
      c.totalHeld,
      policy.minimumThreshold
    );
    const safeMissesRemaining = calculateSafeMisses(
      c.attended,
      c.totalHeld,
      policy.minimumThreshold
    );
    const urgencyScore = calculatePriorityScore({
      risk,
      percentage: currentPercentage,
      requiredClasses: classesNeededForThreshold,
      trend,
      targetPct: policy.minimumThreshold * 100,
    });

    return {
      courseCode: c.courseCode,
      courseName: c.courseName,
      attended: c.attended,
      totalHeld: c.totalHeld,
      currentPercentage,
      risk,
      trend,
      classesNeededForThreshold,
      safeMissesRemaining,
      urgencyScore,
    };
  });

  return insights.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

/**
 * Aggregates all courses into an authoritative student attendance summary.
 */
export function generateAttendanceSummary(
  courses: CourseAttendance[],
  studentInfo?: { name?: string; identifier?: string },
  policy: InstitutionalPolicy = DEFAULT_POLICY
): OverallAttendanceSummary {
  const courseInsights = generateCourseInsights(courses, policy);

  let totalAttended = 0;
  let totalClasses = 0;

  for (const c of courses) {
    totalAttended += c.attended;
    totalClasses += c.totalHeld;
  }

  const overallPercentage = calculateAttendance(totalAttended, totalClasses);
  const overallRisk = calculateRiskLevel(overallPercentage, policy);

  const criticalCourses = courseInsights.filter((c) => c.risk === 'CRITICAL');
  const atRiskCourses = courseInsights.filter((c) => c.risk === 'AT_RISK');
  const safeCourses = courseInsights.filter((c) => c.risk === 'SAFE');

  const decliningCount = courseInsights.filter((c) => c.trend === 'declining').length;
  const improvingCount = courseInsights.filter((c) => c.trend === 'improving').length;

  let trajectoryTrend: AttendanceTrend = 'stable';
  if (decliningCount > improvingCount) {
    trajectoryTrend = 'declining';
  } else if (improvingCount > decliningCount) {
    trajectoryTrend = 'improving';
  }

  const highestRiskCourse = courseInsights.length > 0 ? courseInsights[0].courseName : null;

  const recommendations: string[] = [];
  const minPct = Math.round(policy.minimumThreshold * 100);

  for (const crit of criticalCourses) {
    recommendations.push(
      `${crit.courseName} requires immediate focus: attend the next ${crit.classesNeededForThreshold} class(es) to regain the ${minPct}% requirement.`
    );
  }

  const decliningCourses = courseInsights.filter((c) => c.trend === 'declining');
  if (decliningCourses.length > 0) {
    const names = decliningCourses.map((c) => c.courseName).join(', ');
    recommendations.push(
      `Attendance trajectory is slipping in: ${names}. Avoid unexcused absences in these courses.`
    );
  }

  if (criticalCourses.length === 0 && atRiskCourses.length === 0 && courses.length > 0) {
    recommendations.push(
      `Outstanding compliance! All courses are safely above the institutional target.`
    );
  }

  return {
    studentName: studentInfo?.name || 'Student',
    studentIdentifier: studentInfo?.identifier || 'N/A',
    overallPercentage,
    totalAttended,
    totalClasses,
    overallRisk,
    criticalCoursesCount: criticalCourses.length,
    atRiskCoursesCount: atRiskCourses.length,
    safeCoursesCount: safeCourses.length,
    trajectoryTrend,
    highestRiskCourse,
    courses: courseInsights,
    recommendations,
  };
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

  if (overall.criticalSubjectsCount > 0 && overall.highestRiskSubject) {
    recommendations.push(
      `${overall.highestRiskSubject.subjectName} requires immediate focus: attend the next ${overall.highestRiskSubject.classesNeeded} class(es) to regain the ${overall.highestRiskSubject.requiredPercentage}% requirement.`
    );
  }

  const decliningSubjects = rankedSubjects.filter((s) => s.trend === 'declining');
  if (decliningSubjects.length > 0) {
    const names = decliningSubjects.map((s) => s.subjectName).join(', ');
    recommendations.push(
      `Attendance trajectory is slipping in: ${names}. Avoid unexcused absences in these courses.`
    );
  }

  const atRiskSubjects = rankedSubjects.filter((s) => s.riskLevel === 'AT_RISK');
  if (atRiskSubjects.length > 0 && overall.criticalSubjectsCount === 0) {
    recommendations.push(
      `Attendance is near the minimum threshold in ${atRiskSubjects.length} course(s). You have minimal absence allowance remaining.`
    );
  }

  if (overall.criticalSubjectsCount === 0 && overall.atRiskSubjectsCount === 0) {
    recommendations.push(
      'All enrolled courses currently meet or exceed attendance targets. Keep up the consistent attendance.'
    );
  }

  return recommendations;
}

/**
 * Packages all calculated intelligence into a complete, structured context payload.
 */
export function generateAttendanceContext(
  subjects: SubjectInsightInput[],
  customPolicy?: Partial<AnalyticsPolicyConfig>
): SubjectAttendanceContextPayload {
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
