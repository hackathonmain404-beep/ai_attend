import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SubjectAttendance } from "@/types/student";

interface SubjectAttendanceListProps {
  classes: SubjectAttendance[];
}

export function SubjectAttendanceCard({ classes }: SubjectAttendanceListProps) {
  if (!classes || classes.length === 0) {
    return (
      <section id="courses" className="scroll-mt-24 rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-8 text-center">
        <p className="text-sm font-mono text-zinc-400">No enrolled courses registered for this term.</p>
      </section>
    );
  }

  return (
    <section id="courses" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              COURSE TELEMETRY
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              ENROLLED CURRICULUM
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Verified attendance state across enrolled courses.
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider self-start sm:self-auto shrink-0">
          {String(classes.length).padStart(2, "0")} COURSES ENROLLED
        </span>
      </div>

      {/* Course Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((course) => {
          const isSafe = (course.percentage ?? 0) >= 75;

          return (
            <Link
              key={course.classId}
              href={`/student/subjects/${course.classId}`}
              className="group block focus:outline-none"
            >
              <div className="h-full rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-5 sm:p-6 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/30 hover:-translate-y-1 hover:bg-[#0E1117] flex flex-col justify-between">
                <div>
                  {/* Top Row: Course Code & Attendance % */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-mono font-semibold text-blue-400 group-hover:text-blue-300 uppercase tracking-wider block mb-1 transition-colors">
                        {course.code}
                      </span>
                      <h3 className="text-base font-semibold text-white tracking-tight leading-snug group-hover:text-blue-100 transition-colors">
                        {course.className}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight leading-none transition-transform duration-200 group-hover:scale-105 ${
                          isSafe ? "text-white" : "text-amber-400"
                        }`}
                      >
                        {(course.percentage ?? 0).toFixed(1)}%
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 mt-1.5 block">
                        {course.attended} / {course.totalHeld} lectures
                      </span>
                    </div>
                  </div>

                  {/* Thin Progress Line */}
                  <div className="w-full bg-zinc-850 h-[2px] rounded-full overflow-hidden my-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 group-hover:brightness-125 ${
                        isSafe ? "bg-blue-500" : "bg-amber-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, course.percentage ?? 0))}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Row: Margin/Recovery on left, Analytics link on right */}
                <div className="pt-3 border-t border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    {isSafe ? (
                      <div className="text-xs font-mono text-zinc-300">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">
                          SAFE MARGIN
                        </span>
                        <span>
                          Can miss <strong className="text-white font-semibold">{course.canMissNext}</strong> lecture{course.canMissNext === 1 ? "" : "s"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-amber-400">
                        <span className="text-amber-500/80 text-[10px] uppercase tracking-wider block">
                          RECOVERY REQUIRED
                        </span>
                        <span>
                          Attend next <strong className="text-white font-semibold">{course.classesNeededFor75}</strong> lecture{course.classesNeededFor75 === 1 ? "" : "s"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono text-zinc-400 group-hover:text-blue-400 transition-colors shrink-0 self-end sm:self-auto">
                    <span>ANALYTICS & SIMULATOR</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1.5 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

