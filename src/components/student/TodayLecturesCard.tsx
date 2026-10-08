import * as React from "react";
import Link from "next/link";
import { QrCode, Clock, MapPin, Calendar, ArrowRight } from "lucide-react";
import type { TodayLecture } from "@/types/student";

interface TodayLecturesCardProps {
  lectures: TodayLecture[];
}

export function TodayLecturesCard({ lectures }: TodayLecturesCardProps) {
  return (
    <section id="sessions" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            LIVE ACADEMIC SESSIONS
          </h2>
          <span className="text-zinc-600 font-mono text-xs">/</span>
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            OPERATIONAL TIMELINE
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
          {lectures?.length ?? 0} SESSIONS TODAY
        </span>
      </div>

      {/* Sessions Container */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] divide-y divide-zinc-800/70 overflow-hidden">
        {!lectures || lectures.length === 0 ? (
          <div className="py-12 px-6 text-center text-zinc-500 space-y-2 font-mono">
            <Calendar className="h-6 w-6 mx-auto text-zinc-650 opacity-60" />
            <p className="text-xs">No active academic sessions scheduled for today.</p>
          </div>
        ) : (
          lectures.map((lecture) => {
            const isActive = lecture.status === "active";
            const isCompleted = lecture.status === "completed";

            return (
              <div
                key={lecture.classId}
                className={`p-4 sm:p-5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? "bg-zinc-900/60 shadow-[inset_0_1px_0_0_rgba(59,130,246,0.2)]"
                    : "hover:bg-zinc-950/50"
                }`}
              >
                {/* Left: Code, Title, Time, Room */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-blue-400">
                      {lecture.code}
                    </span>
                    <span className="text-zinc-600 font-mono text-xs">/</span>
                    <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                      {lecture.className}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{lecture.time}</span>
                    </div>
                    <span className="text-zinc-700">·</span>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{lecture.room}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Operational Status & Primary Scan Action */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-semibold text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>ACTIVE SESSION</span>
                    </span>
                  )}

                  {isCompleted && (
                    <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/60">
                      COMPLETED
                    </span>
                  )}

                  {!isActive && !isCompleted && (
                    <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded border border-zinc-800/80 bg-zinc-900/40">
                      SCHEDULED
                    </span>
                  )}

                  {isActive && (
                    <Link
                      href={`/student/scanner${lecture.sessionId ? `?session=${lecture.sessionId}` : ""}`}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold shadow-sm hover:shadow-blue-500/20 transition-all"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>SCAN ATTENDANCE →</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

