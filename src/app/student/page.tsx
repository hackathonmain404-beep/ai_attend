import Link from "next/link";
import {
  QrCode,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Ready for Check-In</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily lectures, scan classroom QR tokens, and maintain verified attendance.
          </p>
        </div>
        <Button asChild variant="emerald" className="gap-2 shrink-0">
          <Link href="/student/scanner">
            <QrCode className="h-4 w-4" />
            Scan Attendance
          </Link>
        </Button>
      </div>

      {/* Attendance Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Overall Attendance</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">82.4%</span>
            <Badge variant="emerald" className="text-[10px]">Safe</Badge>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Goal: $\ge 75\%$ required</span>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Total Lectures</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-white">42 / 51</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Attended this term</span>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Current Streak</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-400">7 Days</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Continuous attendance</span>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Subjects at Risk</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-300">1</span>
            <Badge variant="amber" className="text-[10px]">Warning</Badge>
          </div>
          <span className="text-[11px] text-amber-400/80 mt-1 block">C Programming (68%)</span>
        </Card>
      </div>

      {/* Today's Schedule Placeholder */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Today&apos;s Lectures</CardTitle>
            <CardDescription className="text-xs">Upcoming and active attendance sessions</CardDescription>
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
            Wednesday Timetable
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                CS
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Computer Systems & Architecture</h4>
                <p className="text-xs text-slate-400">10:00 AM – 11:30 AM • Hall B2</p>
              </div>
            </div>
            <Badge variant="emerald" className="text-xs">Active Session</Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/60 bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm">
                MA
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-300">Linear Algebra & Probability</h4>
                <p className="text-xs text-slate-500">02:00 PM – 03:30 PM • Hall A1</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">Upcoming</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
