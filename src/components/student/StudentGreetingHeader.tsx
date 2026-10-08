"use client";

import * as React from "react";
import Link from "next/link";
import { Scan } from "lucide-react";
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
    // If name is in all-caps (e.g. "ABHIJIT" -> "Abhijit")
    if (first.length > 1 && first === first.toUpperCase()) {
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }
    return first;
  }, [student?.fullName]);

  // Dynamic greeting based on current local time:
  // 05:00 AM – 11:59 AM: "Good Morning"
  // 12:00 PM – 04:59 PM: "Good Afternoon"
  // 05:00 PM – 04:59 AM: "Good Evening"
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

  React.useEffect(() => {
    setGreeting(getGreeting());
  }, [getGreeting]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 sm:pb-10 border-b border-zinc-800/60">
      <div className="space-y-3 max-w-2xl">
        {/* Editorial Eyebrow */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            ATTENDANCE COMMAND CENTER
          </span>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            // {greeting.period}
          </span>
        </div>

        {/* Large Editorial Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08] flex items-center gap-3">
          <span>
            {greeting.salutation}, {firstName}
          </span>
          <span
            className="inline-block hover:rotate-12 transition-transform duration-200 cursor-default select-none text-3xl sm:text-4xl lg:text-5xl"
            role="img"
            aria-label="wave"
          >
            👋
          </span>
        </h1>

        {/* Muted supporting copy matching exact specification */}
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
          Your verified attendance, academic standing, and campus presence at a glance.
        </p>
      </div>

      {/* Right Column: System Operational Pill + Primary & Secondary CTAs */}
      <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
        {/* System Operational Indicator */}
        <div className="px-3.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left font-mono">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">
            SYSTEM
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-200 tracking-wide">
              OPERATIONAL
            </span>
          </div>
        </div>

        {/* Action Buttons: Primary + Secondary */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="h-10 px-5 text-xs font-mono font-semibold tracking-wide bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm hover:shadow-blue-950/40 transition-all gap-2"
          >
            <Link href="/student/scanner">
              <Scan className="h-4 w-4" />
              <span>SCAN ATTENDANCE →</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-10 px-4 text-xs font-mono font-medium tracking-wide bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all"
          >
            <a href="#sessions">
              <span>VIEW SCHEDULE →</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
