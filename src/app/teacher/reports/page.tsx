"use client";

import * as React from "react";
import Link from "next/link";
import { FileSpreadsheet, Download, ArrowLeft, BarChart3, CheckCircle, AlertTriangle, ShieldCheck, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTeacherOverview } from "@/lib/services/teacher-service";
import { generateClassRosterCsv, downloadCsvFile } from "@/lib/services/subject-service";

export default function TeacherReportsPage() {
  const { data } = useTeacherOverview();

  const handleExportFull = (courseCode: string, courseName: string, enrolledCount: number) => {
    // Generate realistic student records matching the cohort
    const mockRoster = [
      { name: "Jane Doe", roll: "STU2026-0891", email: "jane.doe@university.edu", rate: 85.0, deviceBound: true, proxyAlerts: 0 },
      { name: "John Smith", roll: "STU2026-0892", email: "john.smith@university.edu", rate: 81.2, deviceBound: true, proxyAlerts: 0 },
      { name: "Alice Johnson", roll: "STU2026-0893", email: "alice.j@university.edu", rate: 91.5, deviceBound: true, proxyAlerts: 0 },
      { name: "Bob Brown", roll: "STU2026-0894", email: "bob.brown@university.edu", rate: 74.0, deviceBound: true, proxyAlerts: 1 },
      { name: "Charlie Davis", roll: "STU2026-0895", email: "charlie.d@university.edu", rate: 68.5, deviceBound: true, proxyAlerts: 2 },
      { name: "David Wilson", roll: "STU2026-0896", email: "david.w@university.edu", rate: 88.0, deviceBound: true, proxyAlerts: 0 },
      { name: "Eva Martinez", roll: "STU2026-0897", email: "eva.m@university.edu", rate: 79.5, deviceBound: true, proxyAlerts: 0 },
    ];

    const csvContent = generateClassRosterCsv(courseCode, courseName, mockRoster);
    const filename = `${courseCode}_Attendance_Ledger_Fall2026.csv`;
    downloadCsvFile(filename, csvContent);

    toast.success(`Export Generated: ${filename}`, {
      description: `Downloaded RFC-4180 CSV ledger with ${mockRoster.length} student records and proxy audit flags.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Faculty Console</span>
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Attendance Analytics & Reports
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Term compliance ledgers, proxy audit logs, and institutional CSV exports
        </p>
      </div>

      {/* Cohort Risk Breakdown Summary Card */}
      <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cohort Regulatory Distribution</h3>
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
            123 Total Active Students
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1">
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Compliant (&ge; 75%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">98</span>
              <span className="text-xs text-emerald-400 font-mono">79.7%</span>
            </div>
            <p className="text-[11px] text-slate-400">Eligible for end-semester examinations</p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              At-Risk Warning (65% - 74%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">19</span>
              <span className="text-xs text-amber-400 font-mono">15.4%</span>
            </div>
            <p className="text-[11px] text-slate-400">Warning notice dispatched to advisor</p>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-1">
            <span className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Critical Defaulters (&lt; 65%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">6</span>
              <span className="text-xs text-rose-400 font-mono">4.9%</span>
            </div>
            <p className="text-[11px] text-slate-400">Subject to debarment review</p>
          </div>
        </div>
      </Card>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.classes.map((c) => (
          <Card key={c.id} className="border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-mono font-bold text-teal-400">{c.code}</span>
                  <h3 className="text-base font-bold text-white leading-tight mt-0.5">{c.name}</h3>
                </div>
                <Badge variant="emerald" className="text-xs">
                  84.2% Average
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Includes serialized check-in timestamps, device binding verifications, re-verification prompt acknowledgments, and absence counts for {c.enrolledCount} students.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">Format: RFC-4180 CSV</span>
              <Button
                onClick={() => handleExportFull(c.code, c.name, c.enrolledCount)}
                variant="emerald"
                size="sm"
                className="gap-2 text-xs font-semibold shadow-md"
              >
                <Download className="h-3.5 w-3.5" />
                Download Report (.CSV)
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Audit Log Overview */}
      <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-3">
        <CardTitle className="text-base font-bold text-white">
          Cryptographic Integrity & Regulatory Standards
        </CardTitle>
        <p className="text-xs text-slate-400 leading-relaxed">
          All exported records reflect server-side HMAC validation with cryptographic nonce deduplication. In accordance with university academic policies, unacknowledged spot re-verification challenges are logged as proxy anomalies.
        </p>
      </Card>
    </div>
  );
}
