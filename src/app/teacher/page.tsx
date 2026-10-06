import Link from "next/link";
import {
  Users,
  Clock,
  PlayCircle,
  FileSpreadsheet,
  CheckCircle,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TeacherOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Session Quick Launch Banner */}
      <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-slate-900/80 to-slate-900/90 p-6 md:p-8 backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            <Radio className="h-3.5 w-3.5 animate-pulse text-teal-400" />
            <span>Classroom Session Ready</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Faculty Attendance Console</h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Generate 20-second dynamic rotating QR codes for your lecture hall projector screen, monitor real-time check-ins, and trigger presence spot-checks.
          </p>
        </div>
        <Button asChild variant="emerald" size="lg" className="gap-2 shrink-0 shadow-lg shadow-emerald-950/60 font-semibold">
          <Link href="/teacher/sessions">
            <PlayCircle className="h-5 w-5" />
            Launch Live QR Broadcast
          </Link>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Assigned Classes</span>
            <Users className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-white">3 Courses</p>
          <span className="text-xs text-slate-500 mt-1 block">186 Enrolled Students</span>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Average Attendance</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">84.2%</p>
          <span className="text-xs text-slate-500 mt-1 block">+2.1% from last semester</span>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Proxies Prevented</span>
            <Badge variant="emerald" className="text-[10px]">Active</Badge>
          </div>
          <p className="text-2xl font-black text-white">14 Attempts</p>
          <span className="text-xs text-slate-500 mt-1 block">Flagged & blocked by device check</span>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Next Lecture</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-200">10:00 AM</p>
          <span className="text-xs text-slate-500 mt-1 block">CS Architecture (Hall B2)</span>
        </Card>
      </div>

      {/* Class Schedule Grid */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Your Classes & Cohorts</CardTitle>
            <CardDescription className="text-xs">Quick access to initiate sessions or view records</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="border-slate-700 text-xs">
            <Link href="/teacher/classes">Manage Classes</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">CS201 — Computer Systems & Architecture</h3>
                <Badge variant="emerald" className="text-[10px]">Today 10:00 AM</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">65 Enrolled • Hall B2 (Projector Ready)</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="emerald" size="sm" className="text-xs">
                <Link href="/teacher/sessions">Start QR Session</Link>
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">CS304 — Advanced Algorithms</h3>
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">Tomorrow 02:00 PM</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">58 Enrolled • Hall A1</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="border-slate-700 text-xs">
                <Link href="/teacher/reports">View Past Reports</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
