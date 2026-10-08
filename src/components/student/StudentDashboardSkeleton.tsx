import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-10 sm:space-y-12 animate-pulse">
      {/* 1. Hero Skeleton */}
      <div className="pt-2 pb-6 border-b border-zinc-800/60 space-y-4">
        <Skeleton className="h-3 w-44 bg-zinc-850" />
        <Skeleton className="h-10 sm:h-12 w-80 bg-zinc-800/80" />
        <Skeleton className="h-4 w-96 max-w-full bg-zinc-850" />
      </div>

      {/* 2. Attendance Status Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-48 bg-zinc-850" />
        <div className="p-6 sm:p-8 rounded-2xl border border-zinc-800/80 bg-[#0B0D10]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <Skeleton className="h-3 w-32 bg-zinc-850" />
              <Skeleton className="h-16 w-44 bg-zinc-800/80" />
              <Skeleton className="h-1.5 w-full bg-zinc-850 rounded-full" />
            </div>
            <div className="hidden lg:block lg:col-span-1 h-28 w-px bg-zinc-800/70 justify-self-center" />
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24 bg-zinc-850" />
                  <Skeleton className="h-8 w-20 bg-zinc-800/80" />
                  <Skeleton className="h-3 w-28 bg-zinc-850" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Sessions Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-44 bg-zinc-850" />
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] divide-y divide-zinc-800/70 overflow-hidden">
          <Skeleton className="h-20 w-full bg-zinc-900/40" />
          <Skeleton className="h-20 w-full bg-zinc-900/40" />
        </div>
      </div>

      {/* 4. Course Telemetry Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-40 bg-zinc-850" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl bg-zinc-900/40 border border-zinc-800/80" />
          ))}
        </div>
      </div>
    </div>
  );
}

