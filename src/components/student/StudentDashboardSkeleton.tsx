import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-pulse">
      {/* Top Greeting Skeleton */}
      <div className="pt-1 pb-1 space-y-2">
        <Skeleton className="h-3 w-28 bg-slate-800/60" />
        <Skeleton className="h-7 w-64 bg-slate-800/80" />
        <Skeleton className="h-4 w-72 bg-slate-800/60" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 border-slate-800 bg-slate-900/40 space-y-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-2 w-full rounded-full" />
          </Card>
        ))}
      </div>

      {/* Schedule Skeleton */}
      <Card className="p-6 border-slate-800 bg-slate-900/40 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </Card>

      {/* Subject Breakdown Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 border-slate-800 bg-slate-900/40 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
