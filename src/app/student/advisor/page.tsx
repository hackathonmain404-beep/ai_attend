"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Sparkles, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdvisorChatWindow } from "@/components/student/AdvisorChatWindow";

export default function StudentAdvisorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Student Dashboard
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              AI Attendance Advisor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs font-mono">
            Jane Doe • B.Tech CSE
          </Badge>
        </div>
      </header>

      {/* Main Advisor Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-4">
        {/* Subtitle / Intro Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Conversational Academic Advisor
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Grounded mathematical assistance for course attendance, absence planning, and debarment prevention.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span>Strict 75% Regulatory Standard</span>
          </div>
        </div>

        {/* Chat Window Component */}
        <AdvisorChatWindow />
      </main>

      {/* Bottom Academic Disclaimer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3 text-center text-xs text-slate-500 font-mono">
        AttendGuard AI Advisor answers are derived authoritatively from server-side attendance ledgers.
      </footer>
    </div>
  );
}
