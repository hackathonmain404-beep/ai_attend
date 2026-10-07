"use client";

import * as React from "react";
import Link from "next/link";
import { Users, BookOpen, Search, ArrowLeft, PlayCircle, ShieldCheck, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTeacherOverview } from "@/lib/services/teacher-service";

export default function TeacherClassesPage() {
  const { data } = useTeacherOverview();
  const [selectedClassId, setSelectedClassId] = React.useState<string>(
    data?.classes[0]?.id || ""
  );
  const [search, setSearch] = React.useState("");

  const currentClass =
    data?.classes.find((c) => c.id === selectedClassId) || data?.classes[0];

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
      <div className="flex gap-3 overflow-x-auto pb-2">
        {data?.classes.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClassId(c.id)}
            className={`px-4 py-3 rounded-xl border text-left transition-all shrink-0 ${
              selectedClassId === c.id
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
                  {currentClass.enrolledCount} Total Cohort
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
                {[
                  { name: "Jane Doe", roll: "STU2026-0891", email: "jane.doe@university.edu", rate: 85.0 },
                  { name: "John Smith", roll: "STU2026-0892", email: "john.smith@university.edu", rate: 81.2 },
                  { name: "Alice Johnson", roll: "STU2026-0893", email: "alice.j@university.edu", rate: 91.5 },
                  { name: "Bob Brown", roll: "STU2026-0894", email: "bob.brown@university.edu", rate: 74.0 },
                ]
                  .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.toLowerCase().includes(search.toLowerCase()))
                  .map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-800 text-teal-400 font-bold flex items-center justify-center text-xs">
                            {s.name[0]}
                          </div>
                          <span className="font-semibold text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{s.roll}</td>
                      <td className="py-3 px-4 text-slate-400">{s.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Bound</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono font-bold ${s.rate >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                          {s.rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
