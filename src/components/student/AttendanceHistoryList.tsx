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
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <Card className="border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by class name, status, or record ID..."
              className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Info */}
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between sm:justify-end gap-2">
            <span>Showing:</span>
            <span className="font-bold text-white">{filteredRecords.length} records</span>
          </div>
        </div>

        {/* Course Filter Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
          <Button
            variant={selectedClass === "all" ? "emerald" : "outline"}
            size="sm"
            onClick={() => setSelectedClass("all")}
            className="text-xs shrink-0 rounded-full h-8"
          >
            All Subjects
          </Button>
          {uniqueClasses.map(([code, fullName]) => (
            <Button
              key={code}
              variant={selectedClass === code ? "emerald" : "outline"}
              size="sm"
              onClick={() => setSelectedClass(code)}
              className="text-xs shrink-0 rounded-full h-8 border-slate-800"
              title={fullName}
            >
              {code}
            </Button>
          ))}
        </div>
      </Card>

      {/* Attendance Records List */}
      {filteredRecords.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <FileCheck className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No attendance records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No past sessions match your filter criteria. Try selecting another course or clearing your search query.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClass("all");
              setSearchQuery("");
            }}
            className="border-slate-800 text-xs mt-2"
          >
            Clear All Filters
          </Button>
        </Card>
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
              <Card
                key={record.recordId}
                className="border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80 transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left: Course details and Session Date */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {record.className}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{dateFormatted} at {timeFormatted}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      ID: {record.recordId.substring(0, 8)}...
                    </span>
                  </div>
                </div>

                {/* Right: Status Badges and Audit Trigger */}
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {record.status === "present" && (
                      <Badge variant="emerald" className="text-xs flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Present
                      </Badge>
                    )}
                    {record.status === "late" && (
                      <Badge variant="amber" className="text-xs flex items-center gap-1 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        Late
                      </Badge>
                    )}
                    {record.status === "absent" && (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1 font-semibold">
                        <XCircle className="h-3.5 w-3.5" />
                        Absent
                      </Badge>
                    )}
                    {record.status === "flagged" && (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1 font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Proxy Blocked
                      </Badge>
                    )}

                    {/* Re-Verified Pill */}
                    {record.reVerified && (
                      <Badge variant="outline" className="border-teal-500/40 text-teal-300 bg-teal-500/10 text-xs flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-teal-400" />
                        Re-Verified
                      </Badge>
                    )}
                  </div>

                  {/* Audit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveAuditRecord(record)}
                    className="border-slate-800 text-xs text-slate-300 hover:text-white"
                  >
                    Audit Details
                    <ChevronRight className="h-3.5 w-3.5 ml-1 text-slate-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cryptographic Audit Drawer / Modal */}
      {activeAuditRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <Card className="w-full max-w-lg border-slate-800 bg-slate-950 p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs mb-1">
                  Cryptographic Verification Record
                </Badge>
                <CardTitle className="text-lg font-bold text-white">
                  Attendance Audit Trail
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Immutable record verification for {activeAuditRecord.className}
                </CardDescription>
              </div>
              <button
                onClick={() => setActiveAuditRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audit Details */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Record ID:</span>
                <span className="text-white font-bold">{activeAuditRecord.recordId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Session Timestamp:</span>
                <span className="text-slate-300">
                  {new Date(activeAuditRecord.sessionDate).toISOString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Attendance Status:</span>
                <span className="text-emerald-400 font-bold uppercase">
                  {activeAuditRecord.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">In-Class Re-Verification:</span>
                <span className={activeAuditRecord.reVerified ? "text-teal-300 font-bold" : "text-slate-500"}>
                  {activeAuditRecord.reVerified ? "Verified (Yes)" : "Not Required / None"}
                </span>
              </div>
              {activeAuditRecord.reVerifiedAt && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Re-Verified At:</span>
                  <span className="text-teal-300">
                    {new Date(activeAuditRecord.reVerifiedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Hardware Device:</span>
                <span className="text-slate-300">
                  {activeAuditRecord.deviceName || "Primary Hardware Device"}
                </span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-slate-500 mb-1">Hardware Fingerprint Hash:</span>
                <span className="text-[10px] text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
                  {activeAuditRecord.deviceFingerprintHash || "fp_hash_device_hardware_lock"}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setActiveAuditRecord(null)}
              variant="outline"
              className="w-full border-slate-800 text-xs"
            >
              Close Audit Trail
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
