"use client";

import * as React from "react";
import { Search, Filter, ShieldCheck, CheckCircle2, Clock, XCircle, AlertTriangle, Smartphone, ChevronRight, FileCheck, Sparkles, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AttendanceRecord } from "@/types/verification";

interface AttendanceHistoryListProps {
  initialRecords: AttendanceRecord[];
}

export function AttendanceHistoryList({ initialRecords }: AttendanceHistoryListProps) {
  const [records, setRecords] = React.useState<AttendanceRecord[]>(initialRecords);
  const [selectedClass, setSelectedClass] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeAuditRecord, setActiveAuditRecord] = React.useState<AttendanceRecord | null>(null);

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  // Extract unique classes for filter pills
  const uniqueClasses = React.useMemo(() => {
    const map = new Map<string, string>();
    initialRecords.forEach((r) => {
      const code = r.className.split(":")[0]?.trim() || r.className;
      map.set(code, r.className);
    });
    return Array.from(map.entries());
  }, [initialRecords]);

  // Filtered records
  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      const matchesClass =
        selectedClass === "all" ||
        r.className.toLowerCase().includes(selectedClass.toLowerCase());
      const matchesQuery =
        !searchQuery.trim() ||
        r.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.recordId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesQuery;
    });
  }, [records, selectedClass, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-5 sm:p-6 space-y-4 transition-all duration-300 hover:border-blue-500/40">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course, verification state, or record ID..."
              className="pl-10 bg-zinc-950/80 border-zinc-800 focus:border-blue-500/50 text-white placeholder:text-zinc-500 font-mono text-xs h-10 rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Info */}
          <div className="text-xs text-zinc-400 font-mono flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span>FILTERED:</span>
            <span className="font-bold text-white">{filteredRecords.length} records</span>
          </div>
        </div>

        {/* Course Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedClass("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              selectedClass === "all"
                ? "bg-blue-600/15 border border-blue-500/40 text-blue-400 font-semibold shadow-sm shadow-blue-950/40"
                : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            All Courses
          </button>
          {uniqueClasses.map(([code, fullName]) => (
            <button
              key={code}
              onClick={() => setSelectedClass(code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
                selectedClass === code
                  ? "bg-blue-600/15 border border-blue-500/40 text-blue-400 font-semibold shadow-sm shadow-blue-950/40"
                  : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
              title={fullName}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Records List */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
            <FileCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">No attendance records found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono">
            No past sessions match your filter criteria. Try selecting another course or clearing your search query.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClass("all");
              setSearchQuery("");
            }}
            className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 hover:border-blue-500/40 text-xs font-mono text-zinc-300 hover:text-white mt-2"
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const dateObj = new Date(record.sessionDate);
            const dateFormatted = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeFormatted = dateObj.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={record.recordId}
                className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/20 hover:-translate-y-0.5 group"
              >
                {/* Left: Course details and Session Date */}
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight group-hover:text-blue-100 transition-colors truncate">
                    {record.className}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 flex-wrap">
                    <span>{dateFormatted} at {timeFormatted}</span>
                    <span className="text-zinc-650">·</span>
                    <span className="text-[11px] text-zinc-500">
                      SIG: {record.recordId.substring(0, 10)}...
                    </span>
                  </div>
                </div>

                {/* Right: Status Badges and Audit Trigger */}
                <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {record.status === "present" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-semibold text-blue-400 uppercase">
                        <CheckCircle2 className="h-3 w-3 text-blue-400" />
                        PRESENT
                      </span>
                    )}
                    {record.status === "late" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-semibold text-amber-400 uppercase">
                        <Clock className="h-3 w-3 text-amber-400" />
                        LATE
                      </span>
                    )}
                    {record.status === "absent" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono font-semibold text-rose-400 uppercase">
                        <XCircle className="h-3 w-3 text-rose-400" />
                        ABSENT
                      </span>
                    )}
                    {record.status === "flagged" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono font-semibold text-rose-400 uppercase">
                        <AlertTriangle className="h-3 w-3 text-rose-400" />
                        FLAGGED
                      </span>
                    )}

                    {/* Re-Verified Pill */}
                    {record.reVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-[9px] font-mono font-medium text-blue-300 uppercase">
                        <Sparkles className="h-2.5 w-2.5 text-blue-400" />
                        RE-VERIFIED
                      </span>
                    )}
                  </div>

                  {/* Audit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveAuditRecord(record)}
                    className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 hover:border-blue-500/40 text-xs font-mono text-zinc-300 hover:text-white h-8 px-3 transition-all"
                  >
                    <span>AUDIT</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cryptographic Audit Drawer / Modal */}
      {activeAuditRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800/90 bg-[#0B0D10] p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 uppercase tracking-wider mb-2">
                  Cryptographic Verification Record
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Attendance Audit Trail
                </h3>
                <p className="text-zinc-400 text-xs font-mono mt-0.5">
                  Immutable record verification for {activeAuditRecord.className}
                </p>
              </div>
              <button
                onClick={() => setActiveAuditRecord(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audit Details */}
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Record ID:</span>
                <span className="text-white font-bold">{activeAuditRecord.recordId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Session Timestamp:</span>
                <span className="text-zinc-300">
                  {new Date(activeAuditRecord.sessionDate).toISOString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Attendance Status:</span>
                <span className="text-blue-400 font-bold uppercase">
                  {activeAuditRecord.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">In-Class Re-Verification:</span>
                <span className={activeAuditRecord.reVerified ? "text-blue-400 font-bold" : "text-zinc-500"}>
                  {activeAuditRecord.reVerified ? "Verified (Yes)" : "Not Required"}
                </span>
              </div>
              {activeAuditRecord.reVerifiedAt && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Re-Verified At:</span>
                  <span className="text-blue-300">
                    {new Date(activeAuditRecord.reVerifiedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Hardware Device:</span>
                <span className="text-zinc-300">
                  {activeAuditRecord.deviceName || "Primary Hardware Device"}
                </span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-zinc-500 mb-1">Hardware Fingerprint Hash:</span>
                <span className="text-[10px] text-zinc-400 break-all bg-[#0B0D10] p-2.5 rounded-lg border border-zinc-800/80">
                  {activeAuditRecord.deviceFingerprintHash || "fp_hash_device_hardware_lock"}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setActiveAuditRecord(null)}
              variant="outline"
              className="w-full border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 hover:border-zinc-700 text-xs font-mono text-white h-9"
            >
              Close Audit Trail
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
