import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TeacherDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-11 w-52 rounded-xl" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 border-slate-800 bg-slate-900/40 space-y-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </div>

      {/* Active Session Skeleton */}
      <Card className="p-6 border-slate-800 bg-slate-900/40 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </Card>

      {/* Assigned Classes Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-5 border-slate-800 bg-slate-900/40 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
