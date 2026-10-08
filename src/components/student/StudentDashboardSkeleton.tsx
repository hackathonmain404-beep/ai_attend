import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-pulse">
      {/* Top Greeting Skeleton */}
      <div className="pt-2 pb-2 border-b border-zinc-800/60 pb-6 space-y-3">
        <Skeleton className="h-3 w-36 bg-zinc-800/70" />
        <Skeleton className="h-9 w-72 bg-zinc-800/90" />
        <Skeleton className="h-4 w-80 bg-zinc-800/70" />
      </div>

      {/* Metrics Console Skeleton */}
      <div className="p-5 rounded-xl border border-zinc-800/80 bg-[#0B0D10] space-y-4">
        <Skeleton className="h-3 w-40 bg-zinc-800/70" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 space-y-2">
              <Skeleton className="h-3 w-24 bg-zinc-800/70" />
              <Skeleton className="h-8 w-28 bg-zinc-800/90" />
              <Skeleton className="h-1.5 w-full bg-zinc-800/60 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Verification Status Skeleton */}
      <div className="p-5 rounded-xl border border-zinc-800/80 bg-[#0B0D10] space-y-4">
        <Skeleton className="h-4 w-44 bg-zinc-800/70" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg bg-zinc-900/80 border border-zinc-800" />
          ))}
        </div>
      </div>

      {/* Sessions Skeleton */}
      <div className="p-5 rounded-xl border border-zinc-800/80 bg-[#0B0D10] space-y-3">
        <Skeleton className="h-4 w-40 bg-zinc-800/70" />
        <Skeleton className="h-16 w-full rounded-lg bg-zinc-900/80 border border-zinc-800" />
        <Skeleton className="h-16 w-full rounded-lg bg-zinc-900/80 border border-zinc-800" />
      </div>
    </div>
  );
}
