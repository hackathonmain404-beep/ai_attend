"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Code2, Binary, BookOpen, AlertTriangle, ShieldCheck } from "lucide-react";
import type { SubjectAttendance } from "@/types/student";

interface SubjectAttendanceListProps {
  classes: SubjectAttendance[];
}

export function SubjectAttendanceCard({ classes }: SubjectAttendanceListProps) {
  if (!classes || classes.length === 0) {
    return (
      <section id="courses" className="scroll-mt-24 rounded-3xl border border-white/[0.08] bg-black/40 p-8 text-center">
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
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
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
          const isCS = course.code.startsWith("CS");
          const isMath = course.code.startsWith("MATH");
          const CourseIcon = isCS ? Code2 : isMath ? Binary : BookOpen;

          return (
            <Link
              key={course.classId}
              href={`/student/subjects/${course.classId}`}
              className="group block focus:outline-none"
            >
              <div
                className={`h-full rounded-3xl border p-6 transition-all duration-300 flex flex-col justify-between backdrop-blur-2xl ${
                  isSafe
                    ? "bg-gradient-to-b from-[#0c101d]/90 to-[#06080d]/95 border-white/[0.08] hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/30 hover:-translate-y-1"
                    : "bg-gradient-to-b from-[#151010]/90 to-[#0a0707]/95 border-amber-500/30 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-950/30 hover:-translate-y-1"
                }`}
              >
                <div>
                  {/* Top Row: Subject Avatar, Code & Attendance % */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                          isSafe
                            ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                            : "bg-amber-500/15 border-amber-500/35 text-amber-400"
                        }`}
                      >
                        <CourseIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-mono font-bold uppercase tracking-wider block mb-0.5 ${
                            isSafe ? "text-blue-400" : "text-amber-400"
                          }`}
                        >
                          {course.code}
                        </span>
                        <h3 className="text-base font-semibold text-white tracking-tight leading-snug group-hover:text-blue-100 transition-colors truncate">
                          {course.className}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight leading-none ${
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

                  {/* Dual-Zone Segmented Progress Bar with 75% Notch */}
                  <div className="relative w-full bg-white/[0.06] h-2 rounded-full overflow-hidden my-5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isSafe ? "bg-gradient-to-r from-blue-500 to-emerald-400" : "bg-amber-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, course.percentage ?? 0))}%` }}
                    />
                    {/* Visual 75% Requirement Notch */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/70"
                      style={{ left: "75%" }}
                      title="75% Minimum Required"
                    />
                  </div>
                </div>

                {/* Bottom Row: Margin/Recovery and Action Link */}
                <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    {isSafe ? (
                      <div className="text-xs font-mono text-zinc-300 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">
                            SAFE MARGIN
                          </span>
                          <span>
                            Can miss <strong className="text-white font-semibold">{course.canMissNext}</strong> lecture{course.canMissNext === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-amber-500/80 text-[10px] uppercase tracking-wider block">
                            RECOVERY REQUIRED
                          </span>
                          <span>
                            Attend next <strong className="text-white font-semibold">{course.classesNeededFor75}</strong> lecture{course.classesNeededFor75 === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-blue-400 transition-colors shrink-0 self-end sm:self-auto">
                    <span>ANALYTICS & SIMULATOR</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform duration-200" />
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
