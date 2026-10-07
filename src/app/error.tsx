"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for client monitoring
    console.error("AttendGuard Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/80 p-8 text-center backdrop-blur-md shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-6 border border-rose-500/20">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {error.message || "An unexpected error occurred while processing this view. Please try recovering."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            variant="default"
            className="bg-rose-600 hover:bg-rose-500 text-white gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="border-slate-700 gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
