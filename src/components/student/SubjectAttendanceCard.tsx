import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/ui/tilt-card";
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Subject-Wise Breakdown</h2>
          <p className="text-xs text-slate-400">Course attendance telemetry, 75% margin formulas, and leave simulation</p>
        </div>
        <span className="text-xs text-teal-400 font-mono font-semibold px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
          {classes.length} Enrolled Courses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        {classes.map((course) => {
          const isSafe = course.percentage >= 75;
          const isCritical = course.percentage < 65;
          const courseXp = Math.round(course.percentage * 10);

          const progressColor = isSafe
            ? "bg-gradient-to-r from-teal-400 to-emerald-400"
            : isCritical
            ? "bg-gradient-to-r from-rose-500 to-red-500"
            : "bg-gradient-to-r from-amber-500 to-orange-400";

          const badgeVariant = isSafe
            ? "emerald"
            : isCritical
            ? "crimson"
            : "amber";

          return (
            <Link
              key={course.classId}
              href={`/student/subjects/${course.classId}`}
              className="block group focus:outline-none h-full"
            >
              <Card className="h-full border-slate-800 bg-slate-900/80 backdrop-blur-md group-hover:border-teal-500/40 hover:bg-slate-900/90 transition-all p-4 sm:p-4.5 flex flex-col justify-between shadow-lg shadow-slate-950/40">
                <div>
                  {/* Header: Course Code & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 inline-block mb-1 group-hover:text-teal-300 transition-colors">
                        {course.code}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-snug group-hover:text-teal-300 transition-colors">
                        {course.className}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge variant={badgeVariant} className="text-[10px] font-bold shrink-0 py-0 px-1.5">
                        {course.percentage.toFixed(1)}%
                      </Badge>
                      <span className="text-[10px] font-mono text-slate-400">
                        {courseXp} XP
                      </span>
                    </div>
                  </div>

                  {/* Counter & Progress Bar */}
                  <div className="space-y-1.5 my-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Attended <strong className="text-slate-200">{course.attended}</strong> /{" "}
                        <strong className="text-slate-200">{course.totalHeld}</strong> lectures
                      </span>
                      <span className="font-semibold text-slate-300 font-mono text-[11px]">
                        {course.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, course.percentage))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Attendance Math Callout Pill & Analytics Link */}
                <div className="pt-2 border-t border-slate-800/70 mt-2 space-y-2">
                  {isSafe ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span className="text-[11px]">
                        Safe margin: Can miss up to{" "}
                        <strong className="text-emerald-300 font-bold">{course.canMissNext}</strong>{" "}
                        lecture{course.canMissNext === 1 ? "" : "s"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="text-[11px]">
                        At Risk: Must attend next{" "}
                        <strong className="text-white font-bold">{course.classesNeededFor75}</strong>{" "}
                        lecture{course.classesNeededFor75 === 1 ? "" : "s"} to reach 75%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end text-[11px] text-slate-400 group-hover:text-teal-300 transition-colors">
                    <span>View Analytics & Leave Simulator</span>
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
