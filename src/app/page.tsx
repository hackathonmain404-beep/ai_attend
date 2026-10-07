"use client";

import * as React from "react";
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
  Compass,
  Scan,
  Activity,
  History,
  FileSpreadsheet,
  Layers,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoTourGuideModal } from "@/components/presentation/DemoTourGuideModal";

export default function HomePage() {
  const [isTourOpen, setIsTourOpen] = React.useState<boolean>(false);
  const [tourInitialStep, setTourInitialStep] = React.useState<number>(1);

  const openTourAtStep = (stepNumber: number) => {
    setTourInitialStep(stepNumber);
    setIsTourOpen(true);
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#070b12] via-[#0b1322] to-[#070b12] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
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
                v1.0 Production Ready
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openTourAtStep(1)}
              className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30 hover:text-emerald-300 text-xs font-semibold"
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hackathon</span> Tour Guide
            </Button>
            <Button asChild size="sm" variant="emerald" className="text-xs font-semibold">
              <Link href="/login">Demo Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-10 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Verified Attendance & Proxy Prevention System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Next-Gen Attendance. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Zero Proxies. Complete Trust.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            Short-lived HMAC QR challenges, hardware-bound device fingerprints, and real-time random
            re-verification eliminate proxy attendance and classroom ditching.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              variant="emerald"
              onClick={() => openTourAtStep(1)}
              className="gap-2 font-semibold shadow-lg shadow-emerald-950/50"
            >
              <Compass className="h-4 w-4" />
              Start Interactive Demo Tour
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-white gap-2 font-medium">
              <Link href="/login">
                <KeyRound className="h-4 w-4 text-emerald-400" />
                Select Demo Persona
              </Link>
            </Button>
          </div>
        </div>

        {/* 1-Click Demo Persona Fast-Track */}
        <div className="max-w-5xl mx-auto w-full mb-12">
          <div className="text-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Instant Hackathon Persona Access
            </h2>
            <p className="text-xs text-slate-500">
              Jump straight into any role with pre-configured cryptographic state
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Persona Card */}
            <Card className="border-emerald-500/30 bg-slate-900/70 hover:border-emerald-500/60 transition-all duration-300 shadow-xl shadow-emerald-950/20">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">Jane Doe</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Roll: 2024-CS-0042 • Overall 85.0% Attendance
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="emerald">Student Role</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <p className="text-xs text-slate-300">
                  Access mobile viewfinder scanner, inspect 75% margin buffers, query the AI advisor, and view bound device status.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button asChild size="sm" variant="emerald" className="text-xs">
                    <Link href="/student">Dashboard Overview</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                    <Link href="/student/scanner">
                      <Scan className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                      QR Scanner
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                    <Link href="/student/advisor">
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-teal-400" />
                      AI Advisor
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                    <Link href="/student/device">
                      <Smartphone className="h-3.5 w-3.5 mr-1 text-amber-400" />
                      Hardware Lock
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Persona Card */}
            <Card className="border-teal-500/30 bg-slate-900/70 hover:border-teal-500/60 transition-all duration-300 shadow-xl shadow-teal-950/20">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                      <Presentation className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">Prof. Alan Turing</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Staff: FAC-CS-01 • Dept. of Computer Science
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-teal-500/30 text-teal-300">
                    Teacher Role
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <p className="text-xs text-slate-300">
                  Broadcast rotating dynamic QR codes, monitor live attendee headcounts, fire random re-verifications, and manage device perimeters.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button asChild size="sm" variant="outline" className="text-xs border-teal-500/40 bg-teal-950/30 text-teal-200 hover:bg-teal-900/40">
                    <Link href="/teacher">Teacher Console</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                    <Link href="/teacher/sessions">
                      <QrCode className="h-3.5 w-3.5 mr-1 text-teal-400" />
                      Projector Display
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                    <Link href="/teacher/devices">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1 text-amber-400" />
                      Device Perimeter
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                    <Link href="/teacher/reports">
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                      CSV Reports
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* The 4 Anti-Proxy Defense Pillars */}
        <div className="max-w-5xl mx-auto w-full mb-12">
          <div className="text-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              4 Cryptographic Pillars Against Attendance Fraud
            </h2>
            <p className="text-xs text-slate-500">
              Multi-layered defense perimeter preventing screenshots, shared logins, and ditching
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center mb-3">
                  <QrCode className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">1. Dynamic HMAC QR</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Tokens rotate every 15–20s with SVG circular countdown. Photo sharing across messaging apps expires before scanning.
                </p>
              </div>
              <button
                onClick={() => openTourAtStep(2)}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start"
              >
                Inspect Pillar 2 <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center mb-3">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">2. Hardware Fingerprint</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Student accounts bind 1:1 to a SHA-256 device fingerprint (WebGL/Canvas/Audio). Logging in on a friend's phone triggers 403 Forbidden.
                </p>
              </div>
              <button
                onClick={() => openTourAtStep(3)}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start"
              >
                Inspect Pillar 3 <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between hover:border-rose-500/40 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center mb-3">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">3. Random Re-Verify</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Mid-lecture 60-second surprise prompts challenge students to re-confirm physical presence, defeating "scan & ditch" fraud.
                </p>
              </div>
              <button
                onClick={() => openTourAtStep(5)}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start"
              >
                Inspect Pillar 5 <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between hover:border-teal-500/40 transition-colors">
              <div>
                <div className="h-10 w-10 rounded-xl bg-slate-800 text-teal-400 flex items-center justify-center mb-3">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">4. Grounded AI Advisor</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Zero hallucination policy calculator that provides mathematically deterministic 75% margin formulas before generating recommendations.
                </p>
              </div>
              <button
                onClick={() => openTourAtStep(6)}
                className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 self-start"
              >
                Inspect Pillar 6 <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Navigation Teleport Hub */}
        <div className="max-w-5xl mx-auto w-full p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Complete Portal Sitemap Teleport
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              All 10 Phase Deliverables Connected & Testable
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Link
              href="/student"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 flex items-center justify-between"
            >
              <span>Student Overview</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href="/student/scanner"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 flex items-center justify-between"
            >
              <span>Viewfinder Scanner</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href="/student/history"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 flex items-center justify-between"
            >
              <span>Attendance Ledger</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href="/student/advisor"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 flex items-center justify-between"
            >
              <span>AI Policy Advisor</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href="/student/device"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 flex items-center justify-between"
            >
              <span>Device Binding</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href="/teacher"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-teal-500/40 hover:text-teal-300 text-slate-300 flex items-center justify-between"
            >
              <span>Teacher Console</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href="/teacher/sessions"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-teal-500/40 hover:text-teal-300 text-slate-300 flex items-center justify-between"
            >
              <span>Projector Dynamic QR</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href="/teacher/reports"
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-teal-500/40 hover:text-teal-300 text-slate-300 flex items-center justify-between"
            >
              <span>RFC-4180 Reports</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-400 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Cryptographic Trust Perimeter Enforced • Next.js 14 App Router</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>AttendGuard Hackathon Edition</span>
            <span>•</span>
            <button
              onClick={() => openTourAtStep(1)}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Launch Tour (Shift+D)
            </button>
          </div>
        </div>
      </footer>

      {/* Tour Modal */}
      <DemoTourGuideModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        initialStep={tourInitialStep}
      />
    </main>
  );
}
