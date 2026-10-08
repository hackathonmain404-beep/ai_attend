import * as React from "react";
import Link from "next/link";
import { QrCode, Clock, MapPin, Calendar, Bot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TodayLecture } from "@/types/student";

interface TodayLecturesCardProps {
  lectures: TodayLecture[];
}

export function TodayLecturesCard({ lectures }: TodayLecturesCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              LIVE ACADEMIC SESSIONS
            </h2>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            Classroom verification sessions & real-time attendance check-in.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-blue-500/40 text-zinc-300 hover:text-white font-mono text-xs h-8 px-3 gap-2 shrink-0 self-start sm:self-auto transition-all"
        >
          <Link href="/student/advisor">
            <Bot className="h-3.5 w-3.5 text-blue-400" />
            <span>ASK AI ADVISOR →</span>
          </Link>
        </Button>
      </div>

      <div className="space-y-2.5">
        {!lectures || lectures.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 space-y-1 font-mono">
            <Calendar className="h-6 w-6 mx-auto text-zinc-700" />
            <p className="text-xs">No active lectures scheduled for today.</p>
          </div>
        ) : (
          lectures.map((lecture) => {
            const isActive = lecture.status === "active";
            const isCompleted = lecture.status === "completed";

            return (
              <div
                key={lecture.classId}
                className={`p-3.5 sm:p-4 rounded-lg border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                  isActive
                    ? "border-blue-500/40 bg-zinc-900/80 shadow-lg shadow-blue-950/20"
                    : "border-zinc-800/60 bg-zinc-950/40 text-zinc-400"
                }`}
              >
                <div className="space-y-1.5">
                  {/* Top Line: Course Code + Title */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-blue-400 border border-zinc-800">
                      {lecture.code}
                    </span>
                    <h4 className={`text-sm sm:text-base font-semibold tracking-tight ${isActive ? "text-white" : "text-zinc-300"}`}>
                      {lecture.className}
                    </h4>
                  </div>

                  {/* Time + Location */}
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{lecture.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      <span>{lecture.room}</span>
                    </div>
                  </div>
                </div>

                {/* Right: State & Action */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-semibold text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>ACTIVE SESSION</span>
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/60">
                      COMPLETED
                    </span>
                  )}

                  {isActive && (
                    <Button
                      asChild
                      className="h-8.5 px-3.5 gap-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold rounded-lg shadow-sm hover:shadow-blue-950/40 transition-all"
                    >
                      <Link href={`/student/scanner${lecture.sessionId ? `?session=${lecture.sessionId}` : ""}`}>
                        <QrCode className="h-3.5 w-3.5" />
                        <span>SCAN ATTENDANCE →</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
