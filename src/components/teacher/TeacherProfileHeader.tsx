import * as React from "react";
import Link from "next/link";
import { PlusCircle, ShieldCheck, GraduationCap, MapPin, Building2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TeacherProfile } from "@/types/teacher";

interface TeacherProfileHeaderProps {
  teacher: TeacherProfile;
  onStartSessionClick: () => void;
}

export function TeacherProfileHeader({
  teacher,
  onStartSessionClick,
}: TeacherProfileHeaderProps) {
  return (
    <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-slate-900/80 to-slate-900/90 p-6 md:p-8 backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
      <div className="flex items-start sm:items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-teal-950/60 font-black text-2xl shrink-0">
          {teacher.fullName.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {teacher.fullName}
            </h1>
            <Badge variant="outline" className="border-teal-500/40 bg-teal-500/10 text-teal-300 font-mono text-xs">
              {teacher.identifier}
            </Badge>
            <span className="hidden sm:inline-flex text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-teal-500/30 text-teal-300">
              FACULTY CONTROL ROOM // RADAR ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-teal-300">
              <Building2 className="h-3.5 w-3.5 text-teal-400" />
              {teacher.department}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {teacher.office}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <Button asChild variant="outline" size="lg" className="flex-1 lg:flex-none border-slate-700 text-xs font-semibold text-slate-300 hover:text-white">
          <Link href="/teacher/devices">
            <Smartphone className="h-4 w-4 mr-1.5 text-teal-400" />
            Device Perimeter
          </Link>
        </Button>

        <Button
          onClick={onStartSessionClick}
          variant="emerald"
          size="lg"
          className="flex-1 lg:flex-none gap-2 font-bold shadow-lg shadow-emerald-950/50"
        >
          <PlusCircle className="h-5 w-5" />
          Start Attendance Session
        </Button>
      </div>
    </div>
  );
}
