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
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 shadow-xl shadow-slate-950/50">
      <CardHeader className="p-0 pb-3.5 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
              Today&apos;s Lectures
            </CardTitle>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/25">
              Live Timetable
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Classroom sessions & attendance check-in availability
          </CardDescription>
        </div>

        <Button asChild variant="outline" size="sm" className="h-8 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold gap-1.5 shadow-sm">
          <Link href="/student/advisor">
            <Bot className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">Ask AI Advisor</span>
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-2.5">
        {(!lectures || lectures.length === 0) ? (
          <div className="text-center py-6 text-slate-400 space-y-1.5">
            <Calendar className="h-7 w-7 mx-auto text-slate-600" />
            <p className="text-xs">No active lectures scheduled for today.</p>
          </div>
        ) : (
          (lectures || []).map((lecture) => {
            const isActive = lecture.status === "active";
            const isCompleted = lecture.status === "completed";

            return (
              <div
                key={lecture.classId}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isActive
                    ? "border-teal-500/40 bg-gradient-to-r from-teal-950/30 to-slate-900/90 shadow-md shadow-teal-950/20"
                    : "border-slate-800/70 bg-slate-950/40 hover:border-slate-700/80"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {lecture.code}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{lecture.className}</h4>
                    {isActive && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full bg-teal-500/15 border border-teal-500/30 text-[10px] font-semibold text-teal-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                        <span>Active Session</span>
                      </span>
                    )}
                    {isCompleted && (
                      <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 py-0">
                        Completed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 text-xs text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{lecture.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-teal-400" />
                      <span>{lecture.room}</span>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <Button asChild variant="emerald" size="sm" className="h-8 gap-1.5 shrink-0 font-semibold text-xs shadow-sm">
                    <Link href={`/student/scanner${lecture.sessionId ? `?session=${lecture.sessionId}` : ""}`}>
                      <QrCode className="h-3.5 w-3.5" />
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
