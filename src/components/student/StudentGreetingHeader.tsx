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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5 pb-0.5 animate-fade-slide-up">
      <div>
        {/* Small muted text */}
        <span className="text-[11px] font-mono font-semibold tracking-wider text-teal-400/90 uppercase block mb-0.5">
          {greeting.period}
        </span>

        {/* Large heading */}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>
            {greeting.salutation}, {firstName}
          </span>
          <span
            className="inline-block hover:rotate-12 transition-transform duration-200 cursor-default select-none"
            role="img"
            aria-label="wave"
          >
            👋
          </span>
        </h1>

        {/* Supporting text */}
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Here&apos;s your attendance overview for today.
        </p>
      </div>

      {/* Optional primary action */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <Button
          asChild
          variant="emerald"
          size="sm"
          className="h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-sm hover:-translate-y-0.5 transition-all"
        >
          <Link href="/student/scanner">
            <Scan className="h-3.5 w-3.5" />
            Scan QR
          </Link>
        </Button>
      </div>
    </div>
  );
}
