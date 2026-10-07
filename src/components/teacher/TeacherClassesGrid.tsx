import * as React from "react";
import Link from "next/link";
import { Users, Calendar, ArrowRight, PlayCircle, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/ui/tilt-card";
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
          <TiltCard key={c.id} glowColor="teal" maxTilt={6} scale={1.02} className="h-full">
            <Card className="h-full border-slate-800 bg-slate-900/70 backdrop-blur-md hover:border-teal-500/50 transition-all p-5 flex flex-col justify-between shadow-xl shadow-slate-950/50">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div style={{ transform: "translateZ(15px)" }}>
                    <span className="text-xs font-mono font-bold text-teal-400 block mb-0.5">
                      {c.code}
                    </span>
                    <h3 className="text-base font-bold text-white leading-snug">{c.name}</h3>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs" style={{ transform: "translateZ(12px)" }}>
                    {c.semester}
                  </Badge>
                </div>

                <div className="space-y-1.5 my-3 text-xs text-slate-400" style={{ transform: "translateZ(8px)" }}>
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

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 mt-2" style={{ transform: "translateZ(18px)" }}>
                <Button
                  onClick={() => onStartSessionForClass(c.id)}
                  variant="emerald"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs font-semibold shadow-md shadow-emerald-950/40 hover:shadow-emerald-900/50"
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
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
