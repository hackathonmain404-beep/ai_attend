"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, MapPin, User, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, History, Bot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSubjectDetails, calculateAttendanceMargin } from "@/lib/services/subject-service";
import { useStudentSummary } from "@/lib/services/student-service";
import { fetchAttendanceHistory } from "@/lib/services/verification-service";
import { AttendanceSimulatorCard } from "@/components/student/AttendanceSimulatorCard";

interface SubjectPageProps {
  params: {
    id: string;
  };
}

export default function StudentSubjectDetailPage({ params }: SubjectPageProps) {
  const { data: summary, isLoading } = useStudentSummary();
  const [history, setHistory] = React.useState<any[]>([]);

  const matchedFromSummary = summary?.classes?.find(
    (c) =>
      c.classId.toLowerCase() === params.id.toLowerCase() ||
      c.code.toLowerCase() === params.id.toLowerCase()
  );

  const subject = React.useMemo(() => {
    if (matchedFromSummary) {
      const margin = calculateAttendanceMargin(
        matchedFromSummary.attended,
        matchedFromSummary.totalHeld
      );
      return {
        id: matchedFromSummary.classId,
        code: matchedFromSummary.code,
        name: matchedFromSummary.className,
        teacherName: matchedFromSummary.teacherName || "Course Instructor",
        schedule: matchedFromSummary.schedule || "Scheduled Lecture",
        semester: matchedFromSummary.semester || summary?.student?.semester || "Semester 5 (Fall 2026)",
        credits: 4,
        room: "Department Lecture Hall",
        margin,
        recentSessions: history,
      };
    }
    return null;
  }, [matchedFromSummary, summary, history]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      const classId = matchedFromSummary?.classId || params.id;
      if (classId) {
        try {
          const records = await fetchAttendanceHistory(classId);
          if (isMounted) setHistory(records);
        } catch {}
      }
    }
    loadSessions();
    return () => { isMounted = false; };
  }, [matchedFromSummary?.classId, params.id]);

  if (isLoading && !subject) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-xs text-slate-400">Loading course analytics...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <h2 className="text-xl font-bold text-white">Course Not Found</h2>
        <p className="text-xs text-slate-400">Unable to retrieve attendance details for the requested course ID.</p>
        <Button asChild variant="emerald">
          <Link href="/student">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const { margin, recentSessions } = subject;
  const isSafe = margin.status === "safe";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Student Portal
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <span className="text-xs font-semibold text-slate-300">
            {subject.code} Course Analytics
          </span>
        </div>

        <Badge
          variant={isSafe ? "emerald" : "destructive"}
          className="text-xs font-mono font-bold"
        >
          {margin.currentPercentage.toFixed(1)}% Official Attendance
        </Badge>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-7">
        {/* Course Banner Card */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {subject.code}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-medium">{subject.semester}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {subject.name}
              </h1>
            </div>

            <Badge
              variant={isSafe ? "emerald" : "destructive"}
              className="text-sm px-3 py-1 font-bold"
            >
              {isSafe ? "Safe Standing" : "At Risk (< 75%)"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-300 font-medium border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span>{subject.teacherName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>{subject.schedule}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span>{subject.room}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span>{subject.credits} Academic Credits</span>
            </div>
          </div>
        </div>

        {/* 75% Regulatory Margin Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Attended Classes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{margin.attended}</span>
              <span className="text-xs text-slate-400">/ {margin.totalHeld} held</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {margin.missed} absences recorded this semester
            </p>
          </Card>

          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Regulatory 75% Threshold</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">
                {margin.currentPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">target 75.0%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Minimum mandated institutional cutoff
            </p>
          </Card>

          <Card className={`p-5 border space-y-1 ${
            isSafe
              ? "border-emerald-500/30 bg-emerald-950/20"
              : "border-rose-500/30 bg-rose-950/20"
          }`}>
            <span className="text-xs text-slate-400 font-medium">Absence Margin / Recovery</span>
            <div className="flex items-baseline gap-2">
              {isSafe ? (
                <>
                  <span className="text-3xl font-black text-emerald-400">
                    {margin.canMissNext}
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold">
                    classes can be missed safely
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black text-rose-400">
                    +{margin.classesNeededFor75}
                  </span>
                  <span className="text-xs text-rose-300 font-semibold">
                    consecutive classes needed
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isSafe
                ? "Buffer before dropping below 75%"
                : "Required to restore 75% regulatory standing"}
            </p>
          </Card>
        </div>

        {/* Interactive Forecaster & Leave Simulator */}
        <AttendanceSimulatorCard
          attended={margin.attended}
          totalHeld={margin.totalHeld}
          courseCode={subject.code}
        />

        {/* Subject-Specific Session History */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-400" />
                {subject.code} Session Ledger
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Past recorded lecture attendances and verified spot checks
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-800 text-xs font-mono text-slate-400">
              {recentSessions.length} sessions
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lecture Date</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Spot Re-Verification</th>
                  <th className="py-3 px-4 text-right">Audit Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No past session logs found for this course.
                    </td>
                  </tr>
                ) : (
                  recentSessions.map((session) => {
                    const dateObj = new Date(session.sessionDate);
                    return (
                      <tr key={session.recordId} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              session.status === "present"
                                ? "emerald"
                                : session.status === "late"
                                ? "amber"
                                : "destructive"
                            }
                            className="text-[11px] capitalize"
                          >
                            {session.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {session.reVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-medium text-[10px]">
                              <Sparkles className="h-3 w-3 text-teal-400" />
                              Re-Verified
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                          {session.recordId.substring(0, 12)}...
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
