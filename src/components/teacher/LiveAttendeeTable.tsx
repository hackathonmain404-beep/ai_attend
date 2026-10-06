"use client";

import * as React from "react";
import { Search, UserCheck, ShieldCheck, Smartphone, CheckCircle, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { filterAttendees } from "@/lib/services/teacher-service";
import { DeviceResetDialog } from "@/components/teacher/DeviceResetDialog";
import type { SessionAttendee } from "@/types/teacher";

interface LiveAttendeeTableProps {
  attendees: SessionAttendee[];
  totalEnrolled: number;
}

export function LiveAttendeeTable({
  attendees,
  totalEnrolled,
}: LiveAttendeeTableProps) {
  const [search, setSearch] = React.useState("");
  const [resetTarget, setResetTarget] = React.useState<SessionAttendee | null>(null);

  const filtered = React.useMemo(
    () => filterAttendees(attendees, search),
    [attendees, search]
  );

  return (
    <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-white tracking-tight">
              Live Verified Attendees
            </CardTitle>
            <Badge variant="emerald" className="text-xs font-mono font-bold">
              {attendees.length} Present / {totalEnrolled} Enrolled
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Real-time cryptographically checked-in student ledger
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

      {/* Attendees Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Roll Number</th>
              <th className="py-3 px-4">Check-In Time</th>
              <th className="py-3 px-4">Presence Status</th>
              <th className="py-3 px-4">Spot Re-Verification</th>
              <th className="py-3 px-4 text-right">Device Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  {search ? "No attendees match your search query." : "No attendees checked in yet."}
                </td>
              </tr>
            ) : (
              filtered.map((att) => {
                const checkInDate = new Date(att.checkInTime);
                const timeString = isNaN(checkInDate.getTime())
                  ? att.checkInTime
                  : checkInDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                return (
                  <tr key={att.studentId} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/80 text-teal-400 font-bold text-xs flex items-center justify-center">
                          {att.fullName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{att.fullName}</p>
                          <p className="text-[10px] text-slate-500">{att.deviceName || "Bound Phone"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {att.rollNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {timeString}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle className="h-3 w-3" />
                        <span>Present</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {att.reVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-medium text-[10px]">
                          <ShieldCheck className="h-3 w-3 text-teal-400" />
                          <span>Re-Verified</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => setResetTarget(att)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 text-xs gap-1"
                        title="Revoke device binding"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Reset Device</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Device Reset Dialog */}
      <DeviceResetDialog
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        attendee={resetTarget}
      />
    </Card>
  );
}
