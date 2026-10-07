import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { CyberAmbient3D } from "@/components/ui/cyber-ambient-3d";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#070b12] via-[#091120] to-[#070b12] text-slate-100 p-4 sm:p-6 overflow-hidden">
      <CyberAmbient3D />
      {/* Top Navigation Bar */}
      <div className="relative z-10 max-w-md mx-auto w-full pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portal Overview</span>
        </Link>
      </div>

      {/* Main Login Card with Suspense for useSearchParams */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4">
              <Skeleton className="h-12 w-12 rounded-2xl mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-4 text-xs text-slate-500">
        AttendGuard Verification Infrastructure • Hackathon Production Build
      </footer>
    </main>
  );
}
