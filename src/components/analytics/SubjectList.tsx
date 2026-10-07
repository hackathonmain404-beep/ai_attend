/**
 * AttendGuard UI - Subject List Grid Container
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type { SubjectInsight } from '../../lib/analytics/types';
import { SubjectCard } from './SubjectCard';

interface SubjectListProps {
  subjects: SubjectInsight[];
}

export function SubjectList({ subjects }: SubjectListProps): React.JSX.Element {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <p className="text-sm font-medium">No course attendance records found.</p>
        <p className="mt-1 text-xs text-slate-400">
          Once your professor finalizes attendance sessions, your course breakdown will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Enrolled Courses ({subjects.length})
        </h3>
        <span className="text-xs text-slate-400">Ordered by urgency</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {subjects.map((item) => (
          <SubjectCard key={item.subjectId} insight={item} />
        ))}
      </div>
    </div>
  );
}
