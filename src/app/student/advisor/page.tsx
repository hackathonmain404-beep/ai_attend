/**
 * AttendGuard Student Portal - Attendance Advisor & Analytics Page
 * Route: /student/advisor
 * Comprehensive integration of Official Student Ledger and Interactive Scenario Intelligence.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Sparkles, ShieldCheck, HelpCircle, Activity, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvisorChatWindow } from '@/components/student/AdvisorChatWindow';
import type { DemoScenarioId } from '@/lib/analytics/demo-scenarios';
import { getDemoScenario } from '@/lib/analytics/demo-scenarios';
import { AttendanceOverviewCard } from '@/components/analytics/AttendanceOverviewCard';
import { SubjectList } from '@/components/analytics/SubjectList';
import { AttendanceAdvisorChat } from '@/components/ai/AttendanceAdvisorChat';

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
  const [activeTab, setActiveTab] = React.useState<'live' | 'simulator'>('simulator');
  const [activeScenarioId, setActiveScenarioId] = React.useState<DemoScenarioId>('critical');

  // Authoritative deterministic context dynamically derived from selected demo profile
  const { profile, context } = getDemoScenario(activeScenarioId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Student Dashboard
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-mono font-bold text-white tracking-wide">
              AI ADVISOR // COMPANION HUD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Navigation */}
          <div className="hidden sm:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SCENARIO SIMULATOR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'live'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LIVE MISSION CHAT
            </button>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 shadow-sm text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold">SYSTEM ONLINE ✓</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Mobile View Toggle */}
        <div className="flex sm:hidden items-center justify-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-1.5 rounded-lg font-medium text-center transition-all ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Scenario Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-1.5 rounded-lg font-medium text-center transition-all ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Student Chat
          </button>
        </div>

        {activeTab === 'live' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Conversational Academic Advisor
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Grounded mathematical assistance for course attendance, absence planning, and debarment prevention.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>Strict 75% Regulatory Standard</span>
              </div>
            </div>

            <AdvisorChatWindow />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  AttendGuard Student Intelligence & Analytics
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Attendance Advisor & Risk Analytics
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Deterministic verified class calculations, recovery projections, and AI-powered attendance guidance.
              </p>
            </div>

            {/* Hackathon Demo Persona Switcher */}
            <section
              aria-labelledby="demo-persona-heading"
              className="rounded-2xl border border-blue-900/40 bg-gradient-to-r from-blue-950/20 via-indigo-950/20 to-slate-900/40 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      Hackathon Live Demo
                    </span>
                    <h2 id="demo-persona-heading" className="text-sm font-bold text-white">
                      Select Student Persona to Inspect
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
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
                            ? 'border-blue-500 bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
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

              <div className="mt-3 border-t border-blue-900/30 pt-2.5 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Active Profile:</span> {profile.studentName} — {profile.description}
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
      </main>

      {/* Bottom Academic Disclaimer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3 text-center text-xs text-slate-500 font-mono">
        AttendGuard AI Advisor answers are derived authoritatively from server-side attendance ledgers.
      </footer>
    </div>
  );
}
