import * as React from "react";
import Link from "next/link";
import { Users, Calendar, ArrowRight, PlayCircle, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TeacherClass } from "@/types/teacher";

interface TeacherClassesGridProps {
  classes: TeacherClass[];
  onStartSessionForClass: (classId: string) => void;
}

export function TeacherClassesGrid({
  classes,
  onStartSessionForClass,
}: TeacherClassesGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Your Assigned Courses</h2>
          <p className="text-xs text-slate-400">Class rosters, timetable schedules, and records</p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-slate-700 text-xs text-slate-300">
          <Link href="/teacher/classes">Manage All Rosters</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((c) => (
          <Card
            key={c.id}
            className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-mono font-bold text-teal-400 block mb-0.5">
                    {c.code}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">{c.name}</h3>
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                  {c.semester}
                </Badge>
              </div>

              <div className="space-y-1.5 my-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>{c.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    <strong className="text-slate-200">{c.enrolledCount}</strong> Enrolled Students
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 mt-2">
              <Button
                onClick={() => onStartSessionForClass(c.id)}
                variant="emerald"
                size="sm"
                className="flex-1 gap-1.5 text-xs font-semibold"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Start Session
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:text-white text-xs gap-1"
              >
                <Link href={`/teacher/classes?classId=${c.id}`}>
                  <span>Roster</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
