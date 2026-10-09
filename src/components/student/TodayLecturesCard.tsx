"use client";

import * as React from "react";
import Link from "next/link";
import { QrCode, Clock, MapPin, Calendar, ArrowRight, CheckCircle2, Radio } from "lucide-react";
import type { TodayLecture } from "@/types/student";

interface TodayLecturesCardProps {
  lectures: TodayLecture[];
}

export function TodayLecturesCard({ lectures }: TodayLecturesCardProps) {
  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "scheduled">("all");

  const filteredLectures = React.useMemo(() => {
    if (!lectures) return [];
    if (activeFilter === "active") return lectures.filter((l) => l.status === "active");
    if (activeFilter === "scheduled") return lectures.filter((l) => l.status !== "active");
    return lectures;
  }, [lectures, activeFilter]);

  const activeCount = (lectures || []).filter((l) => l.status === "active").length;

  return (
    <section id="sessions" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            LIVE ACADEMIC SESSIONS
          </h2>
          <span className="text-zinc-600 font-mono text-xs">/</span>
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            OPERATIONAL TIMELINE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeCount} SESSION LIVE NOW</span>
            </span>
          )}
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            {lectures?.length ?? 0} SESSIONS TODAY
          </span>
        </div>
      </div>

      {/* Sessions Container */}
      <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c101d]/90 via-[#080b13]/90 to-[#05070c]/95 divide-y divide-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-300 hover:border-blue-500/30">
        {!lectures || lectures.length === 0 ? (
          <div className="py-14 px-6 text-center text-zinc-400 space-y-3 font-mono">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">No Academic Sessions Scheduled Today</p>
            <p className="text-xs text-zinc-500">All lectures for today have concluded or no timetable is active.</p>
          </div>
        ) : (
          filteredLectures.map((lecture, idx) => {
            const isActive = lecture.status === "active";
            const isCompleted = lecture.status === "completed";

            // Subject badge color code
            const isCS = lecture.code.startsWith("CS");
            const isMath = lecture.code.startsWith("MATH");

            return (
              <div
                key={lecture.classId}
                className={`group p-5 sm:p-6 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5 relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/[0.12] via-blue-500/[0.04] to-transparent shadow-[inset_0_1px_0_0_rgba(59,130,246,0.3)]"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Active Session Left Glow Line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_10px_#3b82f6]" />
                )}

                {/* Left: Code, Title, Time, Room */}
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                        isCS
                          ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                          : isMath
                          ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                          : "bg-white/[0.06] text-zinc-300 border-white/[0.1]"
                      }`}
                    >
                      {lecture.code}
                    </span>
                    <span className="text-zinc-600 font-mono text-xs">/</span>
                    <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight group-hover:text-blue-200 transition-colors">
                      {lecture.className}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span>{lecture.time}</span>
                    </div>

                    <span className="text-zinc-700">·</span>

                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{lecture.room}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Operational Status & Primary Scan Action */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                  {isActive && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-[11px] font-mono font-semibold text-blue-300 shadow-sm shadow-blue-500/20">
                        <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        <span>ACTIVE SESSION</span>
                      </span>

                      <Link
                        href={`/student/scanner${lecture.sessionId ? `?session=${lecture.sessionId}` : ""}`}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all duration-150 border border-blue-400/30"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>SCAN NOW →</span>
                      </Link>
                    </div>
                  )}

                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>ATTENDANCE VERIFIED</span>
                    </span>
                  )}

                  {!isActive && !isCompleted && (
                    <span className="text-[11px] font-mono text-zinc-400 px-3 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                      SCHEDULED
                    </span>
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
