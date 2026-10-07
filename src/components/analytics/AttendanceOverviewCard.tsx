/**
 * AttendGuard UI - Overall Attendance Overview Card
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type { OverallInsights, RiskLevel } from '../../lib/analytics/types';

interface AttendanceOverviewCardProps {
  overall: OverallInsights;
}

function getRiskBadgeStyle(risk: RiskLevel): { bg: string; text: string; label: string } {
  switch (risk) {
    case 'SAFE':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Safe' };
    case 'AT_RISK':
      return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'At Risk' };
    case 'CRITICAL':
      return { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', label: 'Critical' };
  }
}

export function AttendanceOverviewCard({ overall }: AttendanceOverviewCardProps): React.JSX.Element {
  const badge = getRiskBadgeStyle(overall.overallRisk);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Term Attendance
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {overall.overallPercentage.toFixed(1)}%
            </h2>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {overall.totalAttended} of {overall.totalClasses} total class sessions verified
          </p>
        </div>

        {/* Trajectory indicator */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <span>Trajectory:</span>
          <span className="capitalize font-semibold text-slate-900 dark:text-white">
            {overall.overallTrend}
          </span>
        </div>
      </div>

      {/* Course health breakdown */}
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">Safe</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{overall.safeSubjectsCount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">At Risk</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{overall.atRiskSubjectsCount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">Critical</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{overall.criticalSubjectsCount}</p>
        </div>
      </div>
    </div>
  );
}
