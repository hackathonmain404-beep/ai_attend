import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubjectAttendance } from "@/types/student";

interface LowAttendanceWarningBannerProps {
  atRiskClasses: SubjectAttendance[];
}

export function LowAttendanceWarningBanner({ atRiskClasses }: LowAttendanceWarningBannerProps) {
  if (!atRiskClasses || atRiskClasses.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Attendance Deficit Warning
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                {atRiskClasses.length} Course{atRiskClasses.length > 1 ? "s" : ""} Below 75%
              </span>
            </div>
            <p className="text-sm text-slate-200 font-medium">
              You are currently below the required 75% threshold in:{" "}
              <span className="font-bold text-amber-300">
                {atRiskClasses.map((c) => `${c.code} (${c.percentage.toFixed(1)}%)`).join(", ")}
              </span>
              .
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {atRiskClasses.map((c) => (
                <div
                  key={c.classId}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300"
                >
                  <span className="font-bold text-amber-400">{c.code}:</span>
                  <span>Must attend next <strong className="text-white">{c.classesNeededFor75}</strong> classes to recover</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button asChild variant="amber" size="sm" className="gap-2 shrink-0 self-end sm:self-center font-bold">
          <Link href="/student/advisor">
            <Sparkles className="h-4 w-4" />
            Ask AI Advisor
          </Link>
        </Button>
      </div>
    </div>
  );
}
