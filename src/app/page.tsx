import Link from "next/link";
import {
  ShieldCheck,
  GraduationCap,
  Presentation,
  QrCode,
  Smartphone,
  Cpu,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#070b12] via-[#0b1322] to-[#070b12] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                AttendGuard
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                v1.0 Ready
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cryptographic Engine Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Verified Attendance & Proxy Prevention System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Next-Gen Attendance. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Zero Proxies. Complete Trust.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Short-lived HMAC QR challenges, hardware-bound device fingerprints, and real-time random verification eliminate attendance fraud in lecture halls.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full mb-16">
          {/* Student Experience */}
          <Card className="border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/20 group flex flex-col justify-between">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <Badge variant="emerald">Mobile-First</Badge>
              </div>
              <CardTitle className="text-2xl text-white group-hover:text-emerald-300 transition-colors">
                Student Portal
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-2">
                Scan rotating QR challenges, track subject-wise percentages, review attendance warnings, and query the AI Advisor.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Instant camera viewfinder scanner</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Hardware fingerprint device binding</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Attendance risk indicators & safe margins</span>
                </li>
              </ul>
              <Button asChild variant="emerald" className="w-full gap-2 mt-4 font-semibold">
                <Link href="/student">
                  Enter Student Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Teacher Experience */}
          <Card className="border-slate-800 bg-slate-900/60 hover:border-teal-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-950/20 group flex flex-col justify-between">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Presentation className="h-7 w-7" />
                </div>
                <Badge variant="outline" className="border-teal-500/30 text-teal-300">
                  Projector Ready
                </Badge>
              </div>
              <CardTitle className="text-2xl text-white group-hover:text-teal-300 transition-colors">
                Teacher Portal
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-2">
                Broadcast rotating 20-second cryptographic QR codes, monitor live attendee counts, trigger random re-verification, and export reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  <span>Dynamic QR code rotation with countdown ring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  <span>Real-time presence headcount & roster</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  <span>Mid-lecture proxy spot-check triggers</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full gap-2 mt-4 font-semibold border-slate-700 hover:bg-slate-800 text-white">
                <Link href="/teacher">
                  Enter Teacher Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full pt-4">
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-800 text-emerald-400 shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Rotating QR Tokens</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tokens expire every 15–20 seconds, preventing photo sharing across chat apps.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-800 text-amber-400 shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Single-Device Lock</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accounts bind to a single device fingerprint. Submitting from a friend's phone is blocked.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-800 text-teal-400 shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">AI Attendance Advisor</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic policy logic and AI advisory for attendance risk calculations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-400 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Cryptographic Trust Perimeter Enforced</span>
          </div>
          <div>AttendGuard Hackathon Edition • Developed with Next.js & Supabase</div>
        </div>
      </footer>
    </main>
  );
}
