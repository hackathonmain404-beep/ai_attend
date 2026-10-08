"use client";

import * as React from "react";
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
    <div className="pt-1 pb-1 animate-fade-slide-up">
      {/* Small muted text */}
      <span className="text-[11px] font-mono font-semibold tracking-wider text-teal-400/90 uppercase block mb-1">
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
      <p className="text-xs sm:text-sm text-slate-400 mt-1">
        Here&apos;s your attendance overview for today.
      </p>
    </div>
  );
}
