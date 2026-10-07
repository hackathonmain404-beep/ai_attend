/**
 * AttendGuard Urgency Prioritization & High-Level Insight Generation
 */

import {
  CourseAttendance,
  CourseInsight,
  OverallAttendanceSummary,
  InstitutionalPolicy,
  DEFAULT_POLICY,
  RiskLevel,
  AttendanceTrend,
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
 * Where:
 * - CRITICAL base: 1000 + 10 * (R_% - P) + 5 * C
 * - AT_RISK base: 500 + 5 * (80 - P)
 * - SAFE base: max(0, 100 - P)
 * - Trend adjustment: +50 if declining, -25 if improving
 */
export function calculatePriorityScore(params: PriorityScoreParams): number {
  const { risk, percentage, requiredClasses, trend, targetPct = 75.0 } = params;

  let base = 0;
  if (risk === 'CRITICAL') {
    base = 1000 + 10 * Math.max(0, targetPct - percentage) + 5 * requiredClasses;
  } else if (risk === 'AT_RISK') {
    base = 500 + 5 * Math.max(0, 80.0 - percentage);
  } else {
    base = Math.max(0, 100.0 - percentage);
  }

  let trendAdj = 0;
  if (trend === 'declining') {
    trendAdj = 50;
  } else if (trend === 'improving') {
    trendAdj = -25;
  }

  return Math.round((base + trendAdj) * 10) / 10;
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

  // Sort descending by urgency score
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

  // Overall trajectory
  const decliningCount = courseInsights.filter((c) => c.trend === 'declining').length;
  const improvingCount = courseInsights.filter((c) => c.trend === 'improving').length;

  let trajectoryTrend: AttendanceTrend = 'stable';
  if (decliningCount > improvingCount) {
    trajectoryTrend = 'declining';
  } else if (improvingCount > decliningCount) {
    trajectoryTrend = 'improving';
  }

  const highestRiskCourse = courseInsights.length > 0 ? courseInsights[0].courseName : null;

  // Synthesize explainable recommendations
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
