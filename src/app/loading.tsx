import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <div className="absolute w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>
      <div className="w-full max-w-sm space-y-3 text-center">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
      </div>
    </div>
  );
}
