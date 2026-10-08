import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ChevronRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SubjectAttendance } from "@/types/student";

interface SubjectAttendanceListProps {
  classes: SubjectAttendance[];
}

export function SubjectAttendanceCard({ classes }: SubjectAttendanceListProps) {
  if (!classes || classes.length === 0) {
    return (
      <Card className="p-8 text-center border-slate-800 bg-slate-900/40">
        <p className="text-sm text-slate-400">No enrolled subjects found for this semester.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Unified Section Header */}
      <div className="flex items-center justify-between gap-2.5 pb-0.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Subject-Wise Breakdown
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Course attendance telemetry, 75% margin formulas, and leave simulation
            </p>
          </div>
        </div>

        <span className="text-xs text-teal-400 font-mono font-semibold px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 shrink-0">
          {classes.length} Enrolled Courses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {classes.map((course) => {
          const isSafe = course.percentage >= 75;
          const isCritical = course.percentage < 65;
          const courseXp = Math.round(course.percentage * 10);

          const progressColor = isSafe
            ? "bg-gradient-to-r from-teal-400 to-emerald-400"
            : isCritical
            ? "bg-gradient-to-r from-rose-500 to-red-500"
            : "bg-gradient-to-r from-amber-500 to-orange-400";

          const pctTextColor = isSafe
            ? "text-emerald-400"
            : isCritical
            ? "text-rose-400"
            : "text-amber-400";

          return (
            <Link
              key={course.classId}
              href={`/student/subjects/${course.classId}`}
              className="block group focus:outline-none h-full"
            >
              <Card className="h-full border-slate-800 bg-slate-900/80 backdrop-blur-md group-hover:border-teal-500/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-950/50 transition-all duration-200 p-3 sm:p-3.5 flex flex-col justify-between">
                <div>
                  {/* Top: Course Code + Name on left, Attendance % + XP on right */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] font-mono font-bold text-teal-400 group-hover:text-teal-300 transition-colors uppercase">
                        {course.code}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-tight truncate group-hover:text-teal-300 transition-colors">
                        {course.className}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-lg sm:text-xl font-black font-mono tracking-tight leading-none ${pctTextColor}`}>
                        {course.percentage.toFixed(1)}%
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                        {courseXp} XP
                      </span>
                    </div>
                  </div>

                  {/* Attended / total */}
                  <div className="text-[11px] text-slate-400 my-1.5 flex items-center justify-between font-mono">
                    <span>
                      Attended <strong className="text-slate-200">{course.attended}</strong> /{" "}
                      <strong className="text-slate-200">{course.totalHeld}</strong> lectures
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Req: 75%
                    </span>
                  </div>

                  {/* Prominent Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, course.percentage))}%` }}
                    />
                  </div>
                </div>

                {/* Bottom: Status on left, Secondary Action Link on right */}
                <div className="pt-2 border-t border-slate-800/60 mt-1 flex items-center justify-between gap-2">
                  {isSafe ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium truncate">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span className="truncate">
                        Safe margin: Can miss{" "}
                        <strong className="text-emerald-300 font-bold">{course.canMissNext}</strong>{" "}
                        lecture{course.canMissNext === 1 ? "" : "s"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium truncate">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="truncate">
                        At Risk: Attend next{" "}
                        <strong className="text-amber-200 font-bold">{course.classesNeededFor75}</strong>{" "}
                        lecture{course.classesNeededFor75 === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-[10px] text-slate-400 group-hover:text-teal-300 transition-colors shrink-0 font-mono">
                    <span className="hidden sm:inline">Analytics & Simulator</span>
                    <span className="sm:hidden">Analytics</span>
                    <ChevronRight className="h-3 w-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
