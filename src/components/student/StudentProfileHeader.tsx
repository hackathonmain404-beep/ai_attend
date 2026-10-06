import * as React from "react";
import { Smartphone, ShieldCheck, GraduationCap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StudentProfileSummary } from "@/types/student";

interface StudentProfileHeaderProps {
  student: StudentProfileSummary;
}

export function StudentProfileHeader({ student }: StudentProfileHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 p-5 sm:p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0 font-bold text-xl">
          {student.fullName.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {student.fullName}
            </h1>
            <Badge variant="outline" className="border-slate-700 bg-slate-800/80 text-slate-300 font-mono text-[11px]">
              {student.identifier}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {student.cohort} • <span className="text-slate-300">{student.semester}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 w-full md:w-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium">
          <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
          <span>{student.device.deviceName || "Primary Device"}</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 ml-0.5" />
        </div>
        <Badge variant="emerald" className="text-[11px]">
          Bound & Verified
        </Badge>
      </div>
    </div>
  );
}
