"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Smartphone, ShieldCheck, AlertTriangle, Search, History, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DeviceResetDialog } from "@/components/teacher/DeviceResetDialog";
import { fetchDeviceAuditLog } from "@/lib/services/device-client-service";
import type { DeviceAuditEntry } from "@/types/device-ui";
import type { SessionAttendee } from "@/types/teacher";

const MOCK_COHORT_DEVICES: Array<SessionAttendee & { isBound: boolean }> = [
  { studentId: "00000000-0000-0000-0000-000000000002", fullName: "Jane Doe", rollNumber: "STU2026-0891", checkInTime: "10:00 AM", status: "present", reVerified: true, deviceName: "Jane's iPhone 15 Pro", isBound: true },
  { studentId: "00000000-0000-0000-0000-000000000003", fullName: "John Smith", rollNumber: "STU2026-0892", checkInTime: "10:02 AM", status: "present", reVerified: false, deviceName: "John's Pixel 8", isBound: true },
  { studentId: "00000000-0000-0000-0000-000000000004", fullName: "Alice Johnson", rollNumber: "STU2026-0893", checkInTime: "10:05 AM", status: "present", reVerified: true, deviceName: "Alice's Galaxy S23", isBound: true },
  { studentId: "00000000-0000-0000-0000-000000000005", fullName: "Bob Brown", rollNumber: "STU2026-0894", checkInTime: "—", status: "flagged", reVerified: false, deviceName: "None (Pending Reset)", isBound: false },
  { studentId: "00000000-0000-0000-0000-000000000006", fullName: "Charlie Davis", rollNumber: "STU2026-0895", checkInTime: "10:01 AM", status: "present", reVerified: false, deviceName: "Charlie's iPhone 13", isBound: true },
];

export default function TeacherDevicesPage() {
  const [auditLog, setAuditLog] = React.useState<DeviceAuditEntry[]>([]);
  const [resetTarget, setResetTarget] = React.useState<SessionAttendee | null>(null);
  const [search, setSearch] = React.useState("");

  const refreshLog = () => {
    fetchDeviceAuditLog().then(setAuditLog);
  };

  React.useEffect(() => {
    refreshLog();
  }, []);

  const filteredCohort = MOCK_COHORT_DEVICES.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7">
      {/* Top Header */}
      <div>
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Faculty Console</span>
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Smartphone className="h-6 w-6 text-emerald-400" />
          Hardware Device Perimeter & Audit Log
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage hardware bindings, authorize emergency device resets, and inspect regulatory audit trails
        </p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Cohort Students</span>
          <div className="text-2xl font-black text-white mt-1">123</div>
          <span className="text-[11px] text-slate-500 mt-0.5">Total enrolled cohort</span>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Bound Devices</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">119</div>
          <span className="text-[11px] text-emerald-500/80 mt-0.5">96.7% hardware coupled</span>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Pending Binding</span>
          <div className="text-2xl font-black text-amber-400 mt-1">4</div>
          <span className="text-[11px] text-amber-500/80 mt-0.5">Awaiting initial phone</span>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-400 font-medium">Resets Authorized</span>
          <div className="text-2xl font-black text-teal-400 mt-1">{auditLog.length + 10}</div>
          <span className="text-[11px] text-teal-500/80 mt-0.5">Audit log entries</span>
        </Card>
      </div>

      {/* Cohort Hardware Roster */}
      <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold text-white tracking-tight">
              Student Hardware Binding Ledger
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Active bound phone models and administrative reset triggers
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input
              placeholder="Search student or roll number..."
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
                <th className="py-3 px-4">Bound Hardware Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCohort.map((student) => (
                <tr key={student.studentId} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {student.fullName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {student.rollNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {student.deviceName}
                  </td>
                  <td className="py-3 px-4">
                    {student.isBound ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                        <ShieldCheck className="h-3 w-3" />
                        Bound
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        Unbound
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      onClick={() => setResetTarget(student)}
                      variant="outline"
                      size="sm"
                      className="border-slate-800 text-xs text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10"
                    >
                      Authorize Reset
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Historical Audit Trail Table */}
      <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
        <div>
          <CardTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-teal-400" />
            Administrative Device Reset Audit Trail
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Immutable log of all revoked device bindings with regulatory justifications
          </CardDescription>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Revoked Hardware</th>
                <th className="py-3 px-4">Reason / Audit Justification</th>
                <th className="py-3 px-4">Authorized By</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {entry.studentName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {entry.rollNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {entry.previousDeviceName}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs">
                    {entry.reason}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {entry.resetBy}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                    {new Date(entry.resetAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Device Reset Dialog */}
      <DeviceResetDialog
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        attendee={resetTarget}
        onResetSuccess={refreshLog}
      />
    </div>
  );
}
