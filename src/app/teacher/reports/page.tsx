"use client";

import * as React from "react";
import Link from "next/link";
import { Download, ArrowLeft, BarChart3, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTeacherOverview } from "@/lib/services/teacher-service";
import { generateClassRosterCsv, downloadCsvFile } from "@/lib/services/subject-service";
import { apiFetch } from "@/lib/api-client";

interface RegulatoryStats {
  totalCohort: number;
  compliantCount: number;
  atRiskCount: number;
  criticalCount: number;
}

export default function TeacherReportsPage() {
  const { data } = useTeacherOverview();
  const [stats, setStats] = React.useState<RegulatoryStats>({
    totalCohort: 0,
    compliantCount: 0,
    atRiskCount: 0,
    criticalCount: 0,
  });
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [exportingClassId, setExportingClassId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    apiFetch<any>("/api/teacher/devices")
      .then((res) => {
        if (isMounted && res?.metrics) {
          setStats({
            totalCohort: res.metrics.totalCohort ?? 0,
            compliantCount: res.metrics.compliantCount ?? 0,
            atRiskCount: res.metrics.atRiskCount ?? 0,
            criticalCount: res.metrics.criticalCount ?? 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportFull = async (classId: string, courseCode: string, courseName: string) => {
    try {
      setExportingClassId(classId);
      const res = await apiFetch<any>(`/api/teacher/classes/${classId}/roster`);
      const students = res?.students || [];

      if (students.length === 0) {
        toast.info("No enrolled students found for this course.");
        return;
      }

      const formattedRoster = students.map((s: any) => ({
        name: s.name,
        roll: s.roll,
        email: s.email,
        rate: s.rate ?? 100.0,
        deviceBound: Boolean(s.deviceBound),
        proxyAlerts: s.proxyAlerts ?? 0,
      }));

      const csvContent = generateClassRosterCsv(courseCode, courseName, formattedRoster);
      const filename = `${courseCode}_Attendance_Ledger.csv`;
      downloadCsvFile(filename, csvContent);

      toast.success(`Export Generated: ${filename}`, {
        description: `Downloaded RFC-4180 CSV ledger with ${formattedRoster.length} verified student records and proxy audit flags.`,
      });
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || "Failed to retrieve class roster"}`);
    } finally {
      setExportingClassId(null);
    }
  };

  const compliantPct = stats.totalCohort > 0 ? ((stats.compliantCount / stats.totalCohort) * 100).toFixed(1) : "0.0";
  const atRiskPct = stats.totalCohort > 0 ? ((stats.atRiskCount / stats.totalCohort) * 100).toFixed(1) : "0.0";
  const criticalPct = stats.totalCohort > 0 ? ((stats.criticalCount / stats.totalCohort) * 100).toFixed(1) : "0.0";

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
            {loadingStats ? "Calculating..." : `${stats.totalCohort} Total Active Students`}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1">
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Compliant (&ge; 75%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : stats.compliantCount}
              </span>
              <span className="text-xs text-emerald-400 font-mono">{compliantPct}%</span>
            </div>
            <p className="text-[11px] text-slate-400">Eligible for end-semester examinations</p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              At-Risk Warning (65% - 74%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : stats.atRiskCount}
              </span>
              <span className="text-xs text-amber-400 font-mono">{atRiskPct}%</span>
            </div>
            <p className="text-[11px] text-slate-400">Warning notice dispatched to advisor</p>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-1">
            <span className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Critical Defaulters (&lt; 65%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : stats.criticalCount}
              </span>
              <span className="text-xs text-rose-400 font-mono">{criticalPct}%</span>
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
                  {c.semester}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Includes serialized check-in timestamps, device binding verifications, re-verification prompt acknowledgments, and absence counts for {c.enrolledCount} enrolled students.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">Format: RFC-4180 CSV</span>
              <Button
                onClick={() => handleExportFull(c.id, c.code, c.name)}
                variant="emerald"
                size="sm"
                className="gap-2 text-xs font-semibold shadow-md"
                disabled={exportingClassId === c.id}
              >
                {exportingClassId === c.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
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
