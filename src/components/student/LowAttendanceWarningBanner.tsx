import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SubjectAttendance } from "@/types/student";

interface LowAttendanceWarningBannerProps {
  atRiskClasses: SubjectAttendance[];
}

export function LowAttendanceWarningBanner({ atRiskClasses }: LowAttendanceWarningBannerProps) {
  if (!atRiskClasses || atRiskClasses.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-[#0B0D10] p-4 sm:p-5 transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-950/20 hover:-translate-y-0.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          {/* Header with tiny amber indicator */}
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-amber-400">
              ATTENDANCE RECOVERY REQUIRED
            </h3>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              {String(atRiskClasses.length).padStart(2, "0")} COURSE{atRiskClasses.length > 1 ? "S" : ""} BELOW 75%
            </span>
          </div>

          {/* Course recovery rows */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-300">
            {atRiskClasses.map((c) => (
              <div key={c.classId} className="flex items-center gap-2 group/rec">
                <span className="font-semibold text-white group-hover/rec:text-amber-300 transition-colors">{c.code}</span>
                <span className="text-amber-400">({(c.percentage ?? 0).toFixed(1)}%)</span>
                <span className="text-zinc-600">—</span>
                <span className="text-zinc-400">
                  Attend next <strong className="text-zinc-100 font-semibold">{c.classesNeededFor75}</strong> lectures
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/student/advisor"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 hover:border-amber-500/40 text-xs font-mono text-zinc-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 self-start md:self-auto group/btn"
        >
          <span>ASK AI ADVISOR</span>
          <ArrowRight className="h-3 w-3 text-amber-400 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

