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
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-4 shadow-md shadow-slate-950/40">
      <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-teal-500/10 border border-teal-500/25 text-teal-400 flex items-center justify-center shrink-0">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-bold text-white tracking-tight">
                Today&apos;s Lectures
              </CardTitle>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Live Timetable
              </span>
            </div>
            <CardDescription className="text-[11px] text-slate-400 mt-0.5">
              Classroom sessions & attendance check-in availability
            </CardDescription>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 px-2.5 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold gap-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0"
        >
          <Link href="/student/advisor">
            <Bot className="h-3 w-3 text-teal-400" />
            <span className="hidden sm:inline">Ask AI Advisor</span>
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-2">
        {(!lectures || lectures.length === 0) ? (
          <div className="text-center py-5 text-slate-400 space-y-1">
            <Calendar className="h-6 w-6 mx-auto text-slate-600" />
            <p className="text-xs">No active lectures scheduled for today.</p>
          </div>
        ) : (
          (lectures || []).map((lecture) => {
            const isActive = lecture.status === "active";
            const isCompleted = lecture.status === "completed";

            return (
              <div
                key={lecture.classId}
                className={`p-2.5 sm:p-3 rounded-lg border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                  isActive
                    ? "border-teal-500/40 bg-gradient-to-r from-teal-950/30 to-slate-900/90 shadow-md shadow-teal-950/20"
                    : "border-slate-800/60 bg-slate-950/30 text-slate-400"
                }`}
              >
                <div className="space-y-1">
                  {/* Code + Course Name */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {lecture.code}
                    </span>
                    <h4 className={`text-xs sm:text-sm font-bold ${isActive ? "text-white" : "text-slate-300"}`}>
                      {lecture.className}
                    </h4>
                    {isActive && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full bg-teal-500/15 border border-teal-500/30 text-[9px] font-semibold text-teal-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                        <span>Active Session</span>
                      </span>
                    )}
                    {isCompleted && (
                      <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-700 py-0">
                        Completed
                      </Badge>
                    )}
                  </div>

                  {/* Time + Location */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{lecture.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3 text-teal-400" />
                      <span>{lecture.room}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button for active lecture */}
                {isActive && (
                  <Button asChild variant="emerald" size="sm" className="h-7 px-3 gap-1.5 shrink-0 font-semibold text-xs shadow-sm hover:-translate-y-0.5 transition-all">
                    <Link href={`/student/scanner${lecture.sessionId ? `?session=${lecture.sessionId}` : ""}`}>
                      <QrCode className="h-3 w-3" />
                      Scan Attendance
                    </Link>
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
