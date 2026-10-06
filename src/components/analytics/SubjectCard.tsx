/**
 * AttendGuard UI - Subject Attendance Card
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import React from 'react';
import type { SubjectInsight, RiskLevel } from '../../lib/analytics/types.ts';

interface SubjectCardProps {
  insight: SubjectInsight;
}

function getBadgeStyle(risk: RiskLevel): { bg: string; text: string; label: string } {
  switch (risk) {
    case 'SAFE':
      return { bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', text: 'text-emerald-600', label: 'Safe' };
    case 'AT_RISK':
      return { bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', text: 'text-amber-600', label: 'At Risk' };
    case 'CRITICAL':
      return { bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', text: 'text-rose-600', label: 'Critical' };
  }
}

export function SubjectCard({ insight }: SubjectCardProps): React.JSX.Element {
  const badge = getBadgeStyle(insight.riskLevel);
  const progressPercent = Math.min(100, Math.max(0, insight.percentage));

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {insight.subjectName}
          </h3>
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {insight.percentage.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {insight.attended} / {insight.total} classes
          </span>
        </div>

        {/* Attendance Visual Bar */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              insight.riskLevel === 'SAFE'
                ? 'bg-emerald-500'
                : insight.riskLevel === 'AT_RISK'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Guidance snippet */}
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          {insight.summary}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        {insight.riskLevel === 'CRITICAL' ? (
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            Attend next {insight.classesNeeded} class(es) to recover
          </span>
        ) : (
          <span className="font-medium text-slate-600 dark:text-slate-400">
            {insight.safeMisses} safe skip(s) remaining
          </span>
        )}
        <span className="capitalize text-slate-400 dark:text-slate-500">
          {insight.trend}
        </span>
      </div>
    </div>
  );
}
