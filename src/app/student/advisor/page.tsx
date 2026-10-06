/**
 * AttendGuard Student Portal - Attendance Advisor & Analytics Page
 * Route: /student/advisor
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

'use client';

import React from 'react';
import { getMockAttendanceContext } from '../../../lib/analytics/mock-data.ts';
import { AttendanceOverviewCard } from '../../../components/analytics/AttendanceOverviewCard.tsx';
import { SubjectList } from '../../../components/analytics/SubjectList.tsx';
import { AttendanceAdvisorChat } from '../../../components/ai/AttendanceAdvisorChat.tsx';

export default function StudentAdvisorPage(): React.JSX.Element {
  // Pre-computed authoritative context from trusted data
  const context = getMockAttendanceContext();

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <header>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AttendGuard Student Intelligence
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Attendance Advisor & Risk Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Real-time verified class calculations, recovery projections, and AI-powered attendance guidance.
          </p>
        </header>

        {/* Top Section: Overview Card */}
        <section aria-labelledby="overall-attendance-heading">
          <h2 id="overall-attendance-heading" className="sr-only">
            Overall Attendance
          </h2>
          <AttendanceOverviewCard overall={context.overall} />
        </section>

        {/* Middle Section: AI Attendance Advisor Interaction */}
        <section aria-labelledby="ai-advisor-heading">
          <h2 id="ai-advisor-heading" className="sr-only">
            AI Attendance Advisor
          </h2>
          <AttendanceAdvisorChat fallbackContext={context} studentName="Alex" />
        </section>

        {/* Bottom Section: Course Breakdown */}
        <section aria-labelledby="course-breakdown-heading">
          <h2 id="course-breakdown-heading" className="sr-only">
            Course Breakdown
          </h2>
          <SubjectList subjects={context.rankedSubjects} />
        </section>
      </div>
    </main>
  );
}
