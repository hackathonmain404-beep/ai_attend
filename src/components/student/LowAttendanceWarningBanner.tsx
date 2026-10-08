import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubjectAttendance } from "@/types/student";

interface LowAttendanceWarningBannerProps {
  atRiskClasses: SubjectAttendance[];
}

export function LowAttendanceWarningBanner({ atRiskClasses }: LowAttendanceWarningBannerProps) {
  if (!atRiskClasses || atRiskClasses.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/80 p-4 sm:p-5 backdrop-blur-md shadow-lg shadow-slate-950/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4" />
          </div>

          <div className="space-y-1.5 min-w-0">
            {/* 1. WARNING TITLE */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-400 tracking-wide uppercase font-mono">
                Attendance Deficit Warning
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold">
                {atRiskClasses.length} Course{atRiskClasses.length > 1 ? "s" : ""} Below 75%
              </span>
            </div>

            {/* 2. Important Sentence */}
            <p className="text-xs sm:text-sm text-slate-300">
              You are currently below the required institutional minimum in:{" "}
              <span className="font-semibold text-amber-300">
                {atRiskClasses.map((c) => `${c.code} (${(c.percentage ?? 0).toFixed(1)}%)`).join(", ")}
              </span>
            </p>

            {/* 3 & 4. Affected Courses & Recovery Requirement */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {atRiskClasses.map((c) => (
                <div
                  key={c.classId}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 font-mono"
                >
                  <span className="font-bold text-amber-400">{c.code}:</span>
                  <span className="text-[11px]">
                    Must attend next <strong className="text-white font-semibold">{c.classesNeededFor75}</strong> lectures
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. AI Advisor Action */}
        <Button asChild variant="amber" size="sm" className="gap-2 shrink-0 self-end sm:self-center font-semibold text-xs shadow-sm">
          <Link href="/student/advisor">
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI Advisor
          </Link>
        </Button>
      </div>
    </div>
  );
}
