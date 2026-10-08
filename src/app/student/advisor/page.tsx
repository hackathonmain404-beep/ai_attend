/**
 * AttendGuard Student Portal - Attendance Advisor & Analytics Page
 * Route: /student/advisor
 * Comprehensive integration of Official Student Ledger and Interactive Scenario Intelligence.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Sparkles, ShieldCheck } from 'lucide-react';
import { AdvisorChatWindow } from '@/components/student/AdvisorChatWindow';
import type { DemoScenarioId } from '@/lib/analytics/demo-scenarios';
import { getDemoScenario } from '@/lib/analytics/demo-scenarios';
import { AttendanceOverviewCard } from '@/components/analytics/AttendanceOverviewCard';
import { SubjectList } from '@/components/analytics/SubjectList';
import { AttendanceAdvisorChat } from '@/components/ai/AttendanceAdvisorChat';
import { useStudentSummary } from '@/lib/services/student-service';

const SCENARIOS: { id: DemoScenarioId; name: string; tag: string; badgeColor: string; description: string }[] = [
  {
    id: 'healthy',
    name: 'Alex',
    tag: 'Healthy (90.3%)',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    description: 'All courses >= 88%. Ample safe misses in all subjects.',
  },
  {
    id: 'at-risk',
    name: 'Maya',
    tag: 'At-Risk (80.0%)',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    description: 'Mathematics slipping to 74.0%. Immediate recovery needed.',
  },
  {
    id: 'critical',
    name: 'Jordan',
    tag: 'Critical (81.1%)',
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    description: 'C Programming at 68.0%. Requires 7 consecutive classes.',
  },
];

export default function StudentAdvisorPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = React.useState<'live' | 'simulator'>('live');
  const [activeScenarioId, setActiveScenarioId] = React.useState<DemoScenarioId>('critical');

  const { data: liveSummary } = useStudentSummary();

  // Authoritative deterministic context dynamically derived from selected demo profile
  const { profile, context } = getDemoScenario(activeScenarioId);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Command Center Page Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-zinc-800/60">
        <div className="space-y-3 max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              AI INTELLIGENCE
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              ACADEMIC ADVISOR
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Conversational Academic Advisor
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Grounded mathematical assistance for course attendance, absence planning, and debarment prevention.
          </p>
        </div>

        {/* Right Controls: Back Link & Mode Tabs */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO COMMAND CENTER</span>
          </Link>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0B0D10] border border-zinc-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'live'
                  ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400 font-semibold shadow-sm shadow-blue-950/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              LIVE MISSION CHAT
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'simulator'
                  ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400 font-semibold shadow-sm shadow-blue-950/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              SCENARIO SIMULATOR
            </button>
          </div>

          <div className="px-3 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>STRICT 75% REGULATORY STANDARD</span>
          </div>
        </div>
      </div>

      {/* 2. Main Body Content */}
      <section className="space-y-6">
        {activeTab === 'live' ? (
          <AdvisorChatWindow studentName={liveSummary?.student?.fullName} />
        ) : (
          <div className="space-y-8">
            {/* Hackathon Demo Persona Switcher */}
            <section
              aria-labelledby="demo-persona-heading"
              className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 space-y-4 transition-all duration-300 hover:border-blue-500/30"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400">
                      Live Simulation
                    </span>
                    <h2 id="demo-persona-heading" className="text-sm font-semibold text-white tracking-tight">
                      Select Student Persona to Inspect
                    </h2>
                  </div>
                  <p className="mt-1 text-xs font-mono text-zinc-400">
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
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-mono transition-all ${
                          isSelected
                            ? 'border-blue-500/50 bg-blue-600/15 text-blue-300 font-semibold shadow-sm shadow-blue-950/40'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <span>{scenario.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-mono border ${scenario.badgeColor}`}
                        >
                          {scenario.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-zinc-800/60 pt-3 text-xs font-mono text-zinc-400">
                <span className="text-zinc-200 font-medium">Active Profile:</span> {profile.studentName} — {profile.description}
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
        )}
      </section>
    </div>
  );
}
