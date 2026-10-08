import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-zinc-950 text-zinc-100 p-4 sm:p-6 overflow-hidden">
      {/* Subtle Ambient Radial Electric Blue Glow (Matching Landing Page) */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.08),_transparent_70%)] pointer-events-none select-none blur-3xl"
      />

      {/* Subtle Dark Grid Texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#27272a06_1px,transparent_1px),linear-gradient(to_bottom,#27272a06_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"
      />

      {/* Top Navigation Bar */}
      <div className="relative z-10 max-w-md mx-auto w-full pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portal Overview</span>
        </Link>
      </div>

      {/* Main Login Card with Suspense for useSearchParams */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-4">
              <Skeleton className="h-12 w-12 rounded-2xl mx-auto bg-zinc-800" />
              <Skeleton className="h-6 w-3/4 mx-auto bg-zinc-800" />
              <Skeleton className="h-4 w-1/2 mx-auto bg-zinc-800" />
              <Skeleton className="h-11 w-full rounded-xl bg-zinc-800" />
              <Skeleton className="h-11 w-full rounded-xl bg-zinc-800" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-4 text-xs text-zinc-500 font-mono">
        AttendGuard Verification Infrastructure • Hackathon Production Build
      </footer>
    </main>
  );
}
