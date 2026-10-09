"use client";

import * as React from "react";
import Link from "next/link";
import { Scan, Calendar, Smartphone, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentProfileSummary } from "@/types/student";

interface StudentGreetingHeaderProps {
  student?: StudentProfileSummary | null;
  overallPercentage?: number;
  streakDays?: number;
}

export function StudentGreetingHeader({
  student,
}: StudentGreetingHeaderProps) {
  // Extract student's first name, handling all-caps gracefully
  const firstName = React.useMemo(() => {
    if (!student?.fullName) return "Student";
    const trimmed = student.fullName.trim();
    const first = trimmed.split(/\s+/)[0];
    if (!first) return "Student";
    if (first.length > 1 && first === first.toUpperCase()) {
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }
    return first;
  }, [student?.fullName]);

  // Dynamic greeting based on current local time
  const getGreeting = React.useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        period: "GOOD MORNING",
        salutation: "Good Morning",
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        period: "GOOD AFTERNOON",
        salutation: "Good Afternoon",
      };
    }
    return {
      period: "GOOD EVENING",
      salutation: "Good Evening",
    };
  }, []);

  const [greeting, setGreeting] = React.useState(getGreeting);
  const [liveTime, setLiveTime] = React.useState<string>("");
  const [liveDate, setLiveDate] = React.useState<string>("");

  React.useEffect(() => {
    setGreeting(getGreeting());

    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setLiveDate(
        new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(now)
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000 * 30);
    return () => clearInterval(timer);
  }, [getGreeting]);

  const isDeviceBound = Boolean(student?.device?.isRegistered);

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#0e1424]/70 via-[#0a0d16]/80 to-[#070910]/90 border border-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-blue-950/20 overflow-hidden">
      {/* Subtle Ambient Radial Highlight */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          {/* Editorial Eyebrow with Live Clock HUD */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-blue-400 font-semibold">
                ATTENDANCE COMMAND CENTER
              </span>
            </div>
            <span className="text-zinc-600 font-mono text-xs">//</span>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              {greeting.period}
            </span>
            {liveDate && (
              <>
                <span className="text-zinc-700 font-mono text-xs">•</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  <span>{liveDate}</span>
                  {liveTime && <span className="text-zinc-200 font-medium">({liveTime})</span>}
                </span>
              </>
            )}
          </div>

          {/* Large Headline with Vibrant Name Gradient */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] flex items-center gap-3">
            <span>
              {greeting.salutation},{" "}
              <span className="bg-gradient-to-r from-white via-sky-100 to-blue-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </span>
            <span
              className="inline-block hover:rotate-12 transition-transform duration-200 cursor-default select-none text-3xl sm:text-4xl lg:text-5xl"
              role="img"
              aria-label="wave"
            >
              👋
            </span>
          </h1>

          {/* Muted Supporting Copy */}
          <p className="text-base sm:text-lg text-zinc-300/90 leading-relaxed font-normal">
            Your verified attendance, academic standing, and campus presence at a glance.
          </p>

          {/* Academic Profile Badges & Device Binding Indicator */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
            {student?.cohort && (
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                {student.cohort}
              </span>
            )}
            {student?.semester && (
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                {student.semester}
              </span>
            )}

            {isDeviceBound ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>HARDWARE BOUND</span>
              </span>
            ) : (
              <Link
                href="/student/device"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 transition-all group"
              >
                <Smartphone className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>BIND DEVICE HARDWARE →</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: System Telemetry Pill + High-Impact CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
          {/* System Operational Indicator */}
          <div className="px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-750/80 text-left font-mono transition-all duration-200 hover:border-blue-500/40 hover:bg-zinc-850/90 cursor-default shadow-lg shadow-black/40">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9.5px] uppercase tracking-wider text-zinc-400 font-semibold block">
                SYSTEM TELEMETRY
              </span>
              <span className="text-[9.5px] font-mono text-emerald-400">99.98%</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-zinc-100 tracking-wide">
                OPERATIONAL (24ms)
              </span>
            </div>
          </div>

          {/* Action Buttons: Primary + Secondary */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="h-11 px-6 text-xs font-mono font-semibold tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/30 hover:scale-105 active:scale-95 transition-all duration-200 gap-2.5"
            >
              <Link href="/student/scanner">
                <Scan className="h-4 w-4" />
                <span>SCAN ATTENDANCE →</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-11 px-5 text-xs font-mono font-medium tracking-wide bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700/80 text-zinc-200 hover:text-white rounded-xl hover:scale-105 active:scale-95 hover:border-zinc-500 transition-all duration-200 gap-2"
            >
              <a href="#sessions">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>VIEW SCHEDULE →</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
