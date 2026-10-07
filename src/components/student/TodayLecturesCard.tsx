import * as React from "react";
import Link from "next/link";
import { QrCode, Clock, MapPin, Radio, Calendar, CheckCircle, Bot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TodayLecture } from "@/types/student";

interface TodayLecturesCardProps {
  lectures: TodayLecture[];
}

export function TodayLecturesCard({ lectures }: TodayLecturesCardProps) {
  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-slate-950/50">
      <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-white tracking-tight">
              Today&apos;s Lectures
            </CardTitle>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              LIVE TIMETABLE
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Classroom sessions & attendance check-in availability
          </CardDescription>
        </div>

        <Button asChild variant="outline" size="sm" className="border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold gap-1.5 shadow-sm">
          <Link href="/student/advisor">
            <Bot className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">Ask AI Advisor</span>
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        {(!lectures || lectures.length === 0) ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-xs">No active lectures scheduled for today.</p>
          </div>
        ) : (
          (lectures || []).map((lecture) => {
            const isActive = lecture.status === "active";
            const isCompleted = lecture.status === "completed";

            return (
              <div
                key={lecture.classId}
                className={`p-4 rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover-lift-3d ${
                  isActive
                    ? "border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-slate-900/90 shadow-lg shadow-emerald-950/30 hover:border-emerald-500/60"
                    : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {lecture.code}
                    </span>
                    <h4 className="text-sm font-bold text-white">{lecture.className}</h4>
                    {isActive && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Active Session</span>
                      </span>
                    )}
                    {isCompleted && (
                      <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                        Completed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{lecture.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{lecture.room}</span>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <Button asChild variant="emerald" size="sm" className="gap-2 shrink-0 font-bold shadow-md shadow-emerald-950/50">
                    <Link href={`/student/scanner${lecture.sessionId ? `?session=${lecture.sessionId}` : ""}`}>
                      <QrCode className="h-4 w-4" />
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
