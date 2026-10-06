import * as React from "react";
import { Users, CheckCircle2, ShieldAlert, Clock, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TeacherOverviewStatsProps {
  metrics: {
    totalStudents: number;
    assignedClassesCount: number;
    averageAttendancePercentage: number;
    proxiesBlockedCount: number;
    nextLecture: {
      courseCode: string;
      courseName: string;
      time: string;
      room: string;
    };
  };
}

export function TeacherOverviewStats({ metrics }: TeacherOverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Enrolled Students */}
      <Card className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Enrolled Cohort</span>
            <Users className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-3xl font-black text-white">{metrics.totalStudents}</p>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 font-medium">
          Across {metrics.assignedClassesCount} active assigned courses
        </p>
      </Card>

      {/* 2. Average Attendance */}
      <Card className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Cohort Average</span>
            <Badge variant="emerald" className="text-[10px] font-bold">
              Good Standing
            </Badge>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-emerald-400">
              {metrics.averageAttendancePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-[11px] text-emerald-400/90 mt-3 font-medium flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Above 75.0% institutional baseline</span>
        </p>
      </Card>

      {/* 3. Proxies Blocked */}
      <Card className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Proxies Prevented</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white">{metrics.proxiesBlockedCount}</span>
            <span className="text-xs text-rose-400 font-semibold">Attempts</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 font-medium">
          Flagged via hardware device fingerprint policy
        </p>
      </Card>

      {/* 4. Next Lecture */}
      <Card className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Next Lecture</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 truncate">
            {metrics.nextLecture.courseCode}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {metrics.nextLecture.time}
          </p>
        </div>
        <p className="text-[11px] text-teal-400 mt-2 font-medium">
          {metrics.nextLecture.room}
        </p>
      </Card>
    </div>
  );
}
