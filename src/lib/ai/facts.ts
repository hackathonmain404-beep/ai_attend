/**
 * AttendGuard Authoritative Fact-Locking Engine
 * 
 * Extracts and immutably freezes verified attendance metrics from deterministic
 * analytics payloads. Provides a single authoritative source of truth for the
 * Question Classifier, Deterministic Answer Engine, Prompt Builder, and Validator.
 */

import { AttendanceContextPayload } from '@/lib/analytics/types';
import { calculateAttendance } from '@/lib/analytics/attendance';
import { calculateRequiredClasses, calculateSafeMisses } from '@/lib/analytics/projections';
import { calculateRiskLevel } from '@/lib/analytics/risk';
import { calculatePriorityScore } from '@/lib/analytics/insights';
import { LockedCourseFact, TrustedAttendanceFacts } from './types';

/**
 * Extracts, normalizes, and immutably locks attendance facts from an AttendanceContextPayload.
 */
export function extractTrustedAttendanceFacts(
  context: AttendanceContextPayload,
  studentName?: string
): TrustedAttendanceFacts {
  const minReq = context.policy?.minimumRequirement ?? 75;
  const safeReq = context.policy?.safeThreshold ?? 80;

  const coursesMap = new Map<string, LockedCourseFact>();

  // 1. Ingest from context.courses (Course Model)
  if (context.courses && Array.isArray(context.courses)) {
    for (const c of context.courses) {
      const code = c.courseCode || '';
      const name = c.courseName || code;
      const attended = Number(c.attended) || 0;
      const totalHeld = Number(c.totalHeld) || 0;
      const missed = Math.max(0, totalHeld - attended);
      const currentPercentage =
        typeof c.currentPercentage === 'number'
          ? c.currentPercentage
          : calculateAttendance(attended, totalHeld);
      const risk = c.risk || calculateRiskLevel(currentPercentage, minReq);
      const trend = c.trend || 'stable';
      const classesNeededForThreshold =
        typeof c.classesNeededForThreshold === 'number'
          ? c.classesNeededForThreshold
          : calculateRequiredClasses(attended, totalHeld, minReq);
      const safeMissesRemaining =
        typeof c.safeMissesRemaining === 'number'
          ? c.safeMissesRemaining
          : calculateSafeMisses(attended, totalHeld, minReq);
      const urgencyScore =
        typeof c.urgencyScore === 'number'
          ? c.urgencyScore
          : calculatePriorityScore(risk, currentPercentage, minReq, classesNeededForThreshold, trend);

      const lockedFact: LockedCourseFact = Object.freeze({
        courseCode: code,
        courseName: name,
        attended,
        totalHeld,
        missed,
        currentPercentage,
        risk,
        trend,
        classesNeededForThreshold,
        safeMissesRemaining,
        urgencyScore,
        isEnrolled: true,
      });

      coursesMap.set(name.toLowerCase(), lockedFact);
      if (code) {
        coursesMap.set(code.toLowerCase(), lockedFact);
      }
    }
  }

  // 2. Ingest from context.rankedSubjects (Subject Model)
  if (context.rankedSubjects && Array.isArray(context.rankedSubjects)) {
    for (const s of context.rankedSubjects) {
      const key = (s.subjectName || '').toLowerCase();
      if (!coursesMap.has(key)) {
        const code = s.subjectId || '';
        const name = s.subjectName || code;
        const attended = Number(s.attended) || 0;
        const totalHeld = Number(s.total) || 0;
        const missed = Math.max(0, totalHeld - attended);
        const currentPercentage =
          typeof s.percentage === 'number'
            ? Math.round(s.percentage * 10) / 10
            : calculateAttendance(attended, totalHeld);
        const risk = s.riskLevel || calculateRiskLevel(currentPercentage, minReq);
        const trend = s.trend || 'stable';
        const classesNeededForThreshold =
          typeof s.classesNeeded === 'number'
            ? s.classesNeeded
            : calculateRequiredClasses(attended, totalHeld, minReq);
        const safeMissesRemaining =
          typeof s.safeMisses === 'number'
            ? s.safeMisses
            : calculateSafeMisses(attended, totalHeld, minReq);
        const urgencyScore =
          typeof s.priorityScore === 'number'
            ? s.priorityScore
            : calculatePriorityScore(risk, currentPercentage, minReq, classesNeededForThreshold, trend);

        const lockedFact: LockedCourseFact = Object.freeze({
          courseCode: code,
          courseName: name,
          attended,
          totalHeld,
          missed,
          currentPercentage,
          risk,
          trend,
          classesNeededForThreshold,
          safeMissesRemaining,
          urgencyScore,
          isEnrolled: true,
        });

        coursesMap.set(name.toLowerCase(), lockedFact);
        if (code) {
          coursesMap.set(code.toLowerCase(), lockedFact);
        }
      }
    }
  }

  // Deduplicate courses list preserving original order
  const uniqueCoursesList: LockedCourseFact[] = [];
  const seenCodesOrNames = new Set<string>();

  for (const fact of coursesMap.values()) {
    const identifier = `${fact.courseCode}:${fact.courseName}`;
    if (!seenCodesOrNames.has(identifier)) {
      seenCodesOrNames.add(identifier);
      uniqueCoursesList.push(fact);
    }
  }

  // 3. Compute or resolve overall metrics
  let overallPercentage: number;
  let totalAttended: number;
  let totalClasses: number;
  let overallRisk = context.overall?.overallRisk ?? context.summary?.overallRisk ?? 'SAFE';
  let overallTrend =
    context.overall?.overallTrend ?? context.summary?.trajectoryTrend ?? 'stable';

  if (context.summary?.overallPercentage !== undefined) {
    overallPercentage = context.summary.overallPercentage;
    totalAttended = context.summary.totalAttended;
    totalClasses = context.summary.totalClasses;
  } else if (context.overall?.overallPercentage !== undefined) {
    overallPercentage = Math.round(context.overall.overallPercentage * 10) / 10;
    totalAttended = context.overall.totalAttended;
    totalClasses = context.overall.totalClasses;
  } else if (uniqueCoursesList.length > 0) {
    totalAttended = uniqueCoursesList.reduce((acc, c) => acc + c.attended, 0);
    totalClasses = uniqueCoursesList.reduce((acc, c) => acc + c.totalHeld, 0);
    overallPercentage = calculateAttendance(totalAttended, totalClasses);
    overallRisk = calculateRiskLevel(overallPercentage, minReq);
  } else {
    overallPercentage = 0.0;
    totalAttended = 0;
    totalClasses = 0;
    overallRisk = 'SAFE';
  }

  const totalMissed = Math.max(0, totalClasses - totalAttended);

  // Count risk tiers across courses
  const criticalCoursesCount = uniqueCoursesList.filter((c) => c.risk === 'CRITICAL').length;
  const atRiskCoursesCount = uniqueCoursesList.filter((c) => c.risk === 'AT_RISK').length;
  const safeCoursesCount = uniqueCoursesList.filter((c) => c.risk === 'SAFE').length;

  // Determine highest risk course
  let highestRiskCourse: LockedCourseFact | null = null;
  const highestRiskName =
    context.overall?.highestRiskSubject?.subjectName ||
    context.summary?.highestRiskCourse;

  if (highestRiskName) {
    highestRiskCourse =
      uniqueCoursesList.find(
        (c) =>
          c.courseName.toLowerCase() === highestRiskName.toLowerCase() ||
          c.courseCode.toLowerCase() === highestRiskName.toLowerCase()
      ) || null;
  }

  if (!highestRiskCourse && uniqueCoursesList.length > 0) {
    // Sort by urgencyScore desc, then percentage asc
    const sorted = [...uniqueCoursesList].sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return a.currentPercentage - b.currentPercentage;
    });
    highestRiskCourse = sorted[0];
  }

  const name =
    studentName ||
    context.studentName ||
    context.summary?.studentName ||
    'Student';

  const identifier =
    context.studentIdentifier ||
    context.summary?.studentIdentifier ||
    'STU-VERIFIED';

  const recommendations =
    context.summary?.recommendations ||
    context.recommendations ||
    [];

  const facts: TrustedAttendanceFacts = {
    studentName: name,
    studentIdentifier: identifier,
    overallPercentage,
    totalAttended,
    totalClasses,
    totalMissed,
    overallRisk,
    overallTrend,
    criticalCoursesCount,
    atRiskCoursesCount,
    safeCoursesCount,
    highestRiskCourse,
    courses: Object.freeze(uniqueCoursesList),
    policy: Object.freeze({
      minimumRequirement: minReq,
      safeThreshold: safeReq,
    }),
    recommendations: Object.freeze([...recommendations]),
  };

  return Object.freeze(facts);
}

/**
 * Searches locked facts for a course matching the student's query using robust whole-word matching.
 */
export function findCourseInFacts(
  query: string,
  facts: TrustedAttendanceFacts
): LockedCourseFact | null {
  const q = (query || '').toLowerCase();

  // 1. Check known subject alias patterns
  // C Programming
  if (/\b(?:c|c\s+programming|cs101)\b/i.test(q)) {
    const cCourse = facts.courses.find((c) =>
      /c\s+programming|\bcs101\b/i.test(c.courseName + ' ' + c.courseCode)
    );
    if (cCourse) return cCourse;
  }

  // Computer Architecture
  if (/\b(?:computer\s+architecture|architecture|cs102)\b/i.test(q)) {
    const archCourse = facts.courses.find((c) =>
      /architecture|\bcs102\b/i.test(c.courseName + ' ' + c.courseCode)
    );
    if (archCourse) return archCourse;
  }

  // Mathematics
  if (/\b(?:mathematics|math|maths|math101)\b/i.test(q)) {
    const mathCourse = facts.courses.find((c) =>
      /math|\bmath101\b/i.test(c.courseName + ' ' + c.courseCode)
    );
    if (mathCourse) return mathCourse;
  }

  // Physics
  if (/\b(?:physics|phys|phys101)\b/i.test(q)) {
    const physCourse = facts.courses.find((c) =>
      /phys|\bphys101\b/i.test(c.courseName + ' ' + c.courseCode)
    );
    if (physCourse) return physCourse;
  }

  // Chemistry
  if (/\b(?:chemistry|chem|chem101)\b/i.test(q)) {
    const chemCourse = facts.courses.find((c) =>
      /chem|\bchem101\b/i.test(c.courseName + ' ' + c.courseCode)
    );
    if (chemCourse) return chemCourse;
  }

  // 2. Exact full course name or code match using word boundaries
  for (const c of facts.courses) {
    const cName = c.courseName.toLowerCase();
    const cCode = c.courseCode.toLowerCase();
    if (cCode && new RegExp(`\\b${cCode}\\b`, 'i').test(q)) {
      return c;
    }
    if (cName && new RegExp(`\\b${cName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q)) {
      return c;
    }
  }

  // 3. Distinctive word match for custom/dynamic courses
  const stopWords = new Set([
    'class', 'classes', 'attendance', 'subject', 'subjects', 'course', 'courses',
    'session', 'sessions', 'zero', 'single', 'full', 'threshold', 'new', 'test',
    'demo', 'held', 'attended', 'missed', 'status', 'risk', 'high', 'highest',
    'safe', 'most', 'more', 'which', 'what', 'with', 'from', 'that', 'this',
    'have', 'need', 'reach', 'about', 'overall', 'percent', 'percentage',
  ]);

  for (const c of facts.courses) {
    const words = c.courseName.toLowerCase().split(/\s+/).filter((w) => w.length >= 4 && !stopWords.has(w));
    for (const word of words) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(q)) {
        return c;
      }
    }
  }

  return null;
}
