"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Search, ArrowLeft, PlayCircle, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTeacherOverview } from "@/lib/services/teacher-service";
import { apiFetch } from "@/lib/api-client";

interface RosterStudent {
  studentId: string;
  name: string;
  roll: string;
  email: string;
  rate: number;
  deviceBound: boolean;
  deviceName: string | null;
  proxyAlerts: number;
  attendedCount: number;
  totalSessions: number;
}

interface ClassRosterResponse {
  classId: string;
  code: string;
  name: string;
  schedule: string;
  semester: string;
  totalEnrolled: number;
  students: RosterStudent[];
}

export default function TeacherClassesPage() {
  const { data } = useTeacherOverview();
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [roster, setRoster] = React.useState<RosterStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Sync selectedClassId with first available class once loaded
  React.useEffect(() => {
    if (!selectedClassId && data?.classes && data.classes.length > 0) {
      setSelectedClassId(data.classes[0].id);
    }
  }, [data?.classes, selectedClassId]);

  const currentClass =
    data?.classes.find((c) => c.id === selectedClassId) || data?.classes[0];

  React.useEffect(() => {
    if (!currentClass?.id) return;

    let isMounted = true;
    setLoadingRoster(true);

    apiFetch<ClassRosterResponse>(`/api/teacher/classes/${currentClass.id}/roster`)
      .then((res) => {
        if (isMounted && res) {
          setRoster(res.students || []);
        }
      })
      .catch(() => {
        if (isMounted) setRoster([]);
      })
      .finally(() => {
        if (isMounted) setLoadingRoster(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentClass?.id]);

  const filteredRoster = roster.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Faculty Console</span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Class Rosters & Cohorts</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View enrolled students, verified device status, and course timetables
          </p>
        </div>

        <Button asChild variant="emerald" size="sm" className="gap-2 font-bold shadow-md shadow-emerald-950">
          <Link href="/teacher">
            <PlayCircle className="h-4 w-4" />
            Start Session
          </Link>
        </Button>
      </div>

      {/* Course Selection Tabs */}
      {data?.classes && data.classes.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {data.classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-4 py-3 rounded-xl border text-left transition-all shrink-0 ${
                (currentClass?.id === c.id)
                  ? "border-teal-500 bg-teal-950/20 text-white shadow-lg"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="text-xs font-mono font-bold text-teal-400 block">{c.code}</span>
              <p className="text-sm font-bold text-white mt-0.5">{c.name}</p>
              <p className="text-[11px] text-slate-500 mt-1">{c.enrolledCount} Enrolled Students</p>
            </button>
          ))}
        </div>
      ) : (
        <Card className="p-6 border-slate-800 bg-slate-900/50 text-center">
          <p className="text-xs text-slate-400">No courses assigned to your faculty profile.</p>
        </Card>
      )}

      {/* Enrolled Students Table */}
      {currentClass && (
        <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-white tracking-tight">
                  {currentClass.code}: Student Roster
                </CardTitle>
                <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                  {roster.length} Enrolled Cohort
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                {currentClass.schedule} • {currentClass.semester}
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              <Input
                placeholder="Search roster..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Device Status</th>
                  <th className="py-3 px-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loadingRoster ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                        <span>Querying verified course roster...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      {search ? "No matching students found." : "No students currently enrolled in this course."}
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-800 text-teal-400 font-bold flex items-center justify-center text-xs uppercase">
                            {s.name ? s.name[0] : "S"}
                          </div>
                          <span className="font-semibold text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{s.roll}</td>
                      <td className="py-3 px-4 text-slate-400">{s.email}</td>
                      <td className="py-3 px-4">
                        {s.deviceBound ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Bound</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Unbound</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono font-bold ${s.rate >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                          {s.rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
