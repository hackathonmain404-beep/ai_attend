import * as React from "react";
import Link from "next/link";
import { History, Download, FileSpreadsheet, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { SessionHistoryRecord } from "@/types/teacher";

interface SessionHistoryTableProps {
  sessions: SessionHistoryRecord[];
}

export function SessionHistoryTable({ sessions }: SessionHistoryTableProps) {
  const handleExportCsv = (session: SessionHistoryRecord) => {
    try {
      const headers = ["Session ID", "Course Code", "Course Name", "Date", "Present Count", "Total Enrolled", "Attendance Rate"];
      const row = [
        `"${session.sessionId}"`,
        `"${session.courseCode}"`,
        `"${session.className}"`,
        `"${session.date}"`,
        session.presentCount,
        session.totalEnrolled,
        `"${session.percentage}%"`,
      ];
      const csvString = [headers.join(","), row.join(",")].join("\r\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `session_${session.courseCode}_${session.sessionId.slice(0, 8)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported attendance report for ${session.courseCode}`, {
        description: `Downloaded CSV ledger (${session.presentCount} present / ${session.totalEnrolled} enrolled).`,
      });
    } catch {
      toast.error("Failed to generate CSV export file.");
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-white tracking-tight">
              Recent Attendance Sessions
            </CardTitle>
            <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs font-mono">
              Archived Logs
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Historical classroom attendance ledgers & audit trails
          </CardDescription>
        </div>

        <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 text-xs">
          <Link href="/teacher/reports">View Full Reports</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Course</th>
              <th className="py-3 px-4">Session Date</th>
              <th className="py-3 px-4">Attendance Rate</th>
              <th className="py-3 px-4">Present / Enrolled</th>
              <th className="py-3 px-4">Re-Verified</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sessions.map((sess) => {
              const date = new Date(sess.date);
              const formattedDate = isNaN(date.getTime())
                ? sess.date
                : date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

              return (
                <tr key={sess.sessionId} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-teal-400 block text-[11px]">
                      {sess.courseCode}
                    </span>
                    <span className="font-semibold text-white">{sess.className}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    {formattedDate}
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                      {sess.percentage.toFixed(1)}%
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300 font-medium">
                    {sess.presentCount} / {sess.totalEnrolled}
                  </td>

                  <td className="py-3 px-4 text-teal-300">
                    {sess.reverifyCount} students
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      onClick={() => handleExportCsv(sess)}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-800 text-xs gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
