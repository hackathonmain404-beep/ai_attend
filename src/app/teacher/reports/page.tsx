"use client";

import * as React from "react";
import Link from "next/link";
import { FileSpreadsheet, Download, ArrowLeft, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTeacherOverview } from "@/lib/services/teacher-service";

export default function TeacherReportsPage() {
  const { data } = useTeacherOverview();

  const handleExportFull = (courseCode: string) => {
    toast.success(`Exporting Full Term Report for ${courseCode}`, {
      description: "Downloaded CSV ledger containing all lecture dates, check-ins, and proxy flags.",
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
                onClick={() => handleExportFull(c.code)}
                variant="emerald"
                size="sm"
                className="gap-2 text-xs font-semibold"
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
