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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Subject-Wise Breakdown</h2>
          <p className="text-xs text-slate-400">Course attendance, margin math, and leave simulation</p>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {classes.length} Enrolled Courses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {classes.map((course) => {
          const isSafe = course.percentage >= 75;
          const isCritical = course.percentage < 65;

          const progressColor = isSafe
            ? "bg-emerald-500"
            : isCritical
            ? "bg-rose-500"
            : "bg-amber-500";

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
              <TiltCard glowColor={isSafe ? "emerald" : "amber"} maxTilt={5} scale={1.02} className="h-full">
                <Card className="h-full border-slate-800 bg-slate-900/70 backdrop-blur-md group-hover:border-slate-700/90 transition-all p-5 flex flex-col justify-between shadow-xl shadow-slate-950/50">
                  <div>
                    {/* Header: Course Code & Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div style={{ transform: "translateZ(14px)" }}>
                        <span className="text-xs font-mono font-bold text-slate-400 block mb-0.5 group-hover:text-teal-400 transition-colors">
                          {course.code}
                        </span>
                        <h3 className="text-base font-bold text-white leading-snug group-hover:text-emerald-400 transition-colors">
                          {course.className}
                        </h3>
                      </div>
                      <Badge variant={badgeVariant} className="text-[11px] font-bold shrink-0" style={{ transform: "translateZ(12px)" }}>
                        {course.percentage.toFixed(1)}%
                      </Badge>
                    </div>

                    {/* Counter & Progress Bar */}
                    <div className="space-y-2 my-3" style={{ transform: "translateZ(8px)" }}>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          Attended <strong className="text-slate-200">{course.attended}</strong> of{" "}
                          <strong className="text-slate-200">{course.totalHeld}</strong> lectures
                        </span>
                        <span className="font-semibold text-slate-300">
                          {course.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${Math.min(100, Math.max(0, course.percentage))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attendance Math Callout Pill */}
                  <div className="pt-2 border-t border-slate-800/60 mt-2 space-y-2" style={{ transform: "translateZ(16px)" }}>
                    {isSafe ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400/90 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>
                          Safe margin: Can miss up to{" "}
                          <strong className="text-emerald-300 font-bold">{course.canMissNext}</strong>{" "}
                          lecture{course.canMissNext === 1 ? "" : "s"}.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-300 font-medium bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span>
                          At Risk: Must attend next{" "}
                          <strong className="text-white font-bold">{course.classesNeededFor75}</strong>{" "}
                          consecutive lecture{course.classesNeededFor75 === 1 ? "" : "s"}.
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-end text-[11px] text-slate-500 group-hover:text-emerald-400 transition-colors">
                      <span>View Analytics & Leave Simulator</span>
                      <ChevronRight className="h-3 w-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
