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
    <div className="rounded-xl border border-amber-500/25 bg-slate-900/90 p-3.5 sm:p-4 backdrop-blur-md shadow-md shadow-slate-950/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4" />
          </div>

          <div className="space-y-1.5 min-w-0">
            {/* Title & Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-400 tracking-wide uppercase font-mono">
                Attendance Deficit Warning
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold">
                {atRiskClasses.length} Course{atRiskClasses.length > 1 ? "s" : ""} Below 75%
              </span>
            </div>

            {/* Context line */}
            <p className="text-xs text-slate-300">
              You are currently below the required institutional minimum in:{" "}
              <span className="font-semibold text-amber-300">
                {atRiskClasses.map((c) => `${c.code} (${(c.percentage ?? 0).toFixed(1)}%)`).join(", ")}
              </span>
            </p>

            {/* Recovery requirements: clean bullet lines without nested sub-boxes */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5 font-mono">
              {atRiskClasses.map((c) => (
                <div key={c.classId} className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-400">{c.code}</span>
                  <span className="text-slate-500">→</span>
                  <span>
                    Attend next <strong className="text-white font-semibold">{c.classesNeededFor75}</strong> lectures
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Action Button: Ask AI Advisor */}
        <Button
          asChild
          variant="amber"
          size="sm"
          className="gap-2 shrink-0 self-end sm:self-center font-bold text-xs h-8.5 px-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-950/40 shadow-sm"
        >
          <Link href="/student/advisor">
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI Advisor
          </Link>
        </Button>
      </div>
    </div>
  );
}
