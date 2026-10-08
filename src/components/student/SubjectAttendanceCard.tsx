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
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              COURSE ATTENDANCE TELEMETRY
            </h2>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            Verified attendance state across enrolled courses.
          </p>
        </div>

        <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/60 self-start sm:self-auto shrink-0">
          {classes.length} Enrolled Courses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {classes.map((course) => {
          const isSafe = course.percentage >= 75;

          return (
            <Link
              key={course.classId}
              href={`/student/subjects/${course.classId}`}
              className="block group focus:outline-none h-full"
            >
              <div className="h-full rounded-xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 transition-all duration-200 group-hover:border-blue-500/40 group-hover:shadow-lg group-hover:shadow-blue-950/20 group-hover:-translate-y-0.5 flex flex-col justify-between">
                <div>
                  {/* Top: Course Code + Name on left, Attendance % + Count on right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                        {course.code}
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-snug group-hover:text-zinc-100 transition-colors">
                        {course.className}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight leading-none ${
                          isSafe ? "text-zinc-100" : "text-amber-400"
                        }`}
                      >
                        {course.percentage.toFixed(1)}%
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 mt-1 block">
                        {course.attended} / {course.totalHeld} lectures
                      </span>
                    </div>
                  </div>

                  {/* Thin Progress Line */}
                  <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden my-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSafe ? "bg-blue-500" : "bg-amber-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, course.percentage))}%` }}
                    />
                  </div>
                </div>

                {/* Bottom: Attendance State on left, Analytics Link on right */}
                <div className="pt-2.5 border-t border-zinc-800/70 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                      ATTENDANCE STATE
                    </span>
                    {isSafe ? (
                      <span className="text-xs font-mono text-zinc-300 truncate block">
                        SAFE MARGIN // Can miss{" "}
                        <strong className="text-zinc-100 font-semibold">{course.canMissNext}</strong>{" "}
                        lecture{course.canMissNext === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-amber-400 truncate block">
                        RECOVERY REQUIRED // Attend next{" "}
                        <strong className="text-white font-semibold">{course.classesNeededFor75}</strong>{" "}
                        lecture{course.classesNeededFor75 === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center text-xs font-mono text-zinc-400 group-hover:text-blue-400 transition-colors shrink-0 self-end sm:self-auto">
                    <span>ANALYTICS & SIMULATOR</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
