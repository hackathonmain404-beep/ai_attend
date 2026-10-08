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
    <div className="rounded-xl border border-amber-500/25 bg-[#0B0D10] p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4" />
          </div>

          <div className="space-y-2 min-w-0">
            {/* Header: Title & Technical Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-amber-400">
                ATTENDANCE DEFICIT
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 font-medium">
                {String(atRiskClasses.length).padStart(2, "0")} COURSE{atRiskClasses.length > 1 ? "S" : ""} BELOW 75%
              </span>
            </div>

            {/* Context line */}
            <p className="text-xs text-zinc-300">
              You are currently below the required institutional minimum in:{" "}
              <span className="font-mono text-amber-300">
                {atRiskClasses.map((c) => `${c.code} (${(c.percentage ?? 0).toFixed(1)}%)`).join(", ")}
              </span>
            </p>

            {/* Recovery requirements */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-300 pt-0.5 font-mono">
              {atRiskClasses.map((c) => (
                <div key={c.classId} className="flex items-center gap-2">
                  <span className="font-semibold text-amber-400">{c.code}</span>
                  <span className="text-zinc-600">→</span>
                  <span>
                    Attend next <strong className="text-white font-semibold">{c.classesNeededFor75}</strong> lectures
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refined AI Advisor Action */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 hover:border-amber-500/40 text-zinc-200 hover:text-white font-mono text-xs h-9 px-4 shrink-0 transition-all gap-2"
        >
          <Link href="/student/advisor">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>ASK AI ADVISOR →</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
