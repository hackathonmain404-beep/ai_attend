/**
 * AttendGuard Student Portal - Attendance Advisor & Analytics Page
 * Route: /student/advisor
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

'use client';

import React, { useState } from 'react';
import type { DemoScenarioId } from '../../../lib/analytics/demo-scenarios.ts';
import { getDemoScenario } from '../../../lib/analytics/demo-scenarios.ts';
import { AttendanceOverviewCard } from '../../../components/analytics/AttendanceOverviewCard.tsx';
import { SubjectList } from '../../../components/analytics/SubjectList.tsx';
import { AttendanceAdvisorChat } from '../../../components/ai/AttendanceAdvisorChat.tsx';

const SCENARIOS: { id: DemoScenarioId; name: string; tag: string; badgeColor: string; description: string }[] = [
  {
    id: 'healthy',
    name: 'Alex',
    tag: 'Healthy (90.3%)',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    description: 'All courses >= 88%. Ample safe misses in all subjects.',
  },
  {
    id: 'at-risk',
    name: 'Maya',
    tag: 'At-Risk (80.0%)',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    description: 'Mathematics slipping to 74.0%. Immediate recovery needed.',
  },
  {
    id: 'critical',
    name: 'Jordan',
    tag: 'Critical (81.1%)',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    description: 'C Programming at 68.0%. Requires 7 consecutive classes.',
  },
];

export default function StudentAdvisorPage(): React.JSX.Element {
  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>('critical');

  // Authoritative deterministic context dynamically derived from selected demo profile
  const { profile, context } = getDemoScenario(activeScenarioId);

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                AttendGuard Student Intelligence & Analytics
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Attendance Advisor & Risk Analytics
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Deterministic verified class calculations, recovery projections, and AI-powered attendance guidance.
            </p>
          </div>

          {/* Verification Badge */}
          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Verification Engine</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Anti-Hallucination Active</p>
            </div>
          </div>
        </header>

        {/* Hackathon Demo Persona Switcher */}
        <section aria-labelledby="demo-persona-heading" className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50/80 p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-slate-900/40">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  Hackathon Live Demo
                </span>
                <h2 id="demo-persona-heading" className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Student Persona to Inspect
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Switch between real attendance scenarios to evaluate risk classification, safe misses, and advisor guidance.
              </p>
            </div>

            {/* Persona Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((scenario) => {
                const isSelected = activeScenarioId === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveScenarioId(scenario.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20 dark:border-blue-500 dark:bg-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{scenario.name}</span>
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                        isSelected
                          ? 'border-white/30 bg-white/20 text-white'
                          : scenario.badgeColor
                      }`}
                    >
                      {scenario.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 border-t border-blue-200/50 pt-2.5 text-xs text-slate-600 dark:border-blue-900/30 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Active Profile:</span> {profile.studentName} — {profile.description}
          </div>
        </section>

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
          <AttendanceAdvisorChat
            key={activeScenarioId}
            studentName={profile.studentName}
            scenarioId={activeScenarioId}
            fallbackContext={context}
          />
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
