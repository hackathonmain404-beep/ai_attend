"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Smartphone, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentScanner } from "@/components/student/StudentScanner";

export default function StudentScannerPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Student Portal
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <span className="text-xs font-semibold text-slate-300">
            Attendance Check-In
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AttendGuard Proxy Shield</span>
          </div>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <StudentScanner />
      </main>

      {/* Bottom Advice Strip */}
      <footer className="border-t border-slate-900 bg-slate-950 p-3 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1">
          <Smartphone className="h-3.5 w-3.5 text-slate-400 inline" />
          Device bound to student profile. Ensure your phone is connected to campus Wi-Fi or cellular network.
        </p>
      </footer>
    </div>
  );
}
