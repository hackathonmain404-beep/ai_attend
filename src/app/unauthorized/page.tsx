"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Home, ArrowRight, UserCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { toast } from "sonner";

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("required"); // 'student' | 'teacher'
  const [switching, setSwitching] = React.useState(false);

  const handleSwitchRole = async (targetRole: "student" | "teacher") => {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });

      if (res.ok) {
        toast.success(`Role switched to ${targetRole === "teacher" ? "Faculty" : "Student"}!`, {
          description: `Launching ${targetRole === "teacher" ? "Faculty Console" : "Student Command Center"}...`,
        });
        const dest = targetRole === "teacher" ? "/teacher" : "/student";
        router.push(dest);
        router.refresh();
      } else {
        toast.error("Could not switch role. Please sign in again.");
      }
    } catch {
      toast.error("Network error while updating role.");
    } finally {
      setSwitching(false);
    }
  };

  const isAccessingTeacher = requiredRole === "teacher";
  const isAccessingStudent = requiredRole === "student";

  return (
    <Card className="w-full max-w-md border-amber-500/30 bg-slate-900/90 backdrop-blur-xl p-8 text-center shadow-2xl">
      <CardHeader className="p-0 mb-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 shadow-lg shadow-amber-950/40">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="flex justify-center mb-2">
          <Badge variant="amber" className="text-xs font-mono">
            403 Role Forbidden
          </Badge>
        </div>
        <CardTitle className="text-2xl font-black text-white">Access Restricted</CardTitle>
        <CardDescription className="text-slate-400 text-xs mt-2 leading-relaxed">
          {isAccessingTeacher
            ? "You attempted to access Faculty Lecture Controls, but your active account persona is Student."
            : isAccessingStudent
            ? "You attempted to access Student Attendance Scanner, but your active account persona is Faculty."
            : "Your current account persona does not have authorization to view this institutional perimeter."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 text-xs text-slate-300 space-y-2 text-left">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            Institutional RBAC Perimeter Active
          </p>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {isAccessingTeacher
              ? "Faculty console is strictly reserved for course instructors to launch cryptographic QR attendance sessions."
              : isAccessingStudent
              ? "Student command center is reserved for student verified QR check-ins and academic margin telemetry."
              : "AttendGuard enforces strict separation between student attendance terminals and faculty controls."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {isAccessingTeacher ? (
            <>
              <Button asChild variant="emerald" className="w-full gap-2 font-bold shadow-md shadow-emerald-950/50">
                <Link href="/student">
                  <span>Go to Student Command Center</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                disabled={switching}
                onClick={() => handleSwitchRole("teacher")}
                className="w-full gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-950/30 hover:text-amber-200 text-xs font-medium"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${switching ? "animate-spin" : ""}`} />
                <span>Switch My Role to Faculty (Evaluation Mode)</span>
              </Button>
            </>
          ) : isAccessingStudent ? (
            <>
              <Button asChild variant="emerald" className="w-full gap-2 font-bold shadow-md shadow-emerald-950/50">
                <Link href="/teacher">
                  <span>Go to Faculty Console</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                disabled={switching}
                onClick={() => handleSwitchRole("student")}
                className="w-full gap-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30 hover:text-emerald-200 text-xs font-medium"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${switching ? "animate-spin" : ""}`} />
                <span>Switch My Role to Student (Evaluation Mode)</span>
              </Button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="emerald" size="sm" className="gap-1.5 text-xs font-semibold">
                <Link href="/student">Student Portal</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-semibold border-slate-700">
                <Link href="/teacher">Faculty Console</Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <Button asChild variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-slate-400 hover:text-white">
              <Link href="/">
                <Home className="h-3.5 w-3.5" />
                <span>Gateway</span>
              </Link>
            </Button>
            <LogoutButton
              variant="outline"
              size="sm"
              className="w-full border-slate-800 text-slate-400 hover:text-white text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-[#070b12] via-[#091120] to-[#070b12] text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading security perimeter...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </main>
  );
}
