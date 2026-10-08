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
import { TiltCard } from "@/components/ui/tilt-card";
import { CyberAmbient3D, HolographicHeroShield } from "@/components/ui/cyber-ambient-3d";
import { DemoTourGuideModal } from "@/components/presentation/DemoTourGuideModal";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserProfile, saveCurrentUserProfile } from "@/lib/auth/auth-client";

export default function HomePage() {
  const [isTourOpen, setIsTourOpen] = React.useState<boolean>(false);
  const [tourInitialStep, setTourInitialStep] = React.useState<number>(1);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  // Handle incoming OAuth redirect codes (e.g. from Google login) and session state
  React.useEffect(() => {
    async function checkAuthAndOAuthLanding() {
      if (typeof window === "undefined") return;

      const activeProfile = getCurrentUserProfile();
      if (activeProfile) {
        setCurrentUser(activeProfile);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const hasHashToken = window.location.hash.includes("access_token");

      if (code || hasHashToken) {
        try {
          const supabase = createClient();
          let resolvedProfile: any = null;

          if (code) {
            try {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (!error && data?.user) {
                const user = data.user;
                const meta = user.user_metadata || {};
                const storedRole =
                  (localStorage.getItem("attendguard-oauth-role") as "student" | "teacher") || "student";

                const { data: dbProfile } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", user.id)
                  .maybeSingle();

                resolvedProfile = {
                  id: user.id,
                  email: dbProfile?.email || user.email || "",
                  fullName: dbProfile?.full_name || meta.full_name || meta.name || user.email?.split("@")[0] || "Verified Academic",
                  role: dbProfile?.role || storedRole,
                  identifier: dbProfile?.identifier || (storedRole === "teacher" ? `FAC-${user.id.slice(0, 4)}` : `STU-${user.id.slice(0, 4)}`),
                };
              }
            } catch (exchangeErr) {
              console.warn("Client code exchange notice:", exchangeErr);
            }
          }

          if (!resolvedProfile) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                const user = session.user;
                const meta = user.user_metadata || {};
                const storedRole =
                  (localStorage.getItem("attendguard-oauth-role") as "student" | "teacher") || "student";

                const { data: dbProfile } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", user.id)
                  .maybeSingle();

                resolvedProfile = {
                  id: user.id,
                  email: dbProfile?.email || user.email || "",
                  fullName: dbProfile?.full_name || meta.full_name || meta.name || user.email?.split("@")[0] || "Verified Academic",
                  role: dbProfile?.role || storedRole,
                  identifier: dbProfile?.identifier || (storedRole === "teacher" ? `FAC-${user.id.slice(0, 4)}` : `STU-${user.id.slice(0, 4)}`),
                };
              }
            } catch {}
          }

          if (resolvedProfile) {
            saveCurrentUserProfile(resolvedProfile);
            localStorage.removeItem("attendguard-oauth-provider");
            localStorage.removeItem("attendguard-oauth-role");

            toast.success(`Authentication Successful!`, {
              description: `Welcome, ${resolvedProfile.fullName}! Launching your command center...`,
            });

            const target = resolvedProfile.role === "teacher" ? "/teacher" : "/student";
            window.location.href = target;
          }
        } catch (err) {
          console.error("OAuth processing failed:", err);
        }
      }
    }

    checkAuthAndOAuthLanding();
  }, []);

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
            {currentUser ? (
              <Button asChild size="sm" variant="emerald" className="text-xs font-semibold gap-1.5 shadow-md shadow-emerald-950/60">
                <Link href={currentUser.role === "student" ? "/student" : "/teacher"}>
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{currentUser.role === "student" ? "Command Center" : "Faculty Console"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="emerald" className="text-xs font-semibold">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 pt-8 pb-12 flex-1 flex flex-col justify-center overflow-hidden">
        {/* 3D Perspective Cyber Mesh Background */}
        <CyberAmbient3D />

        <div className="relative z-10 text-center max-w-3xl mx-auto mb-10 space-y-4">
          {/* Interactive 3D Holographic Shield */}
          <HolographicHeroShield />

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold tracking-wider shadow-lg shadow-emerald-950/40">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>B.TECH PROTOCOL // NEXT-GEN ATTENDANCE ENGINE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            NEXT-GEN ATTENDANCE. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              LEVEL UP YOUR CAMPUS EXPERIENCE.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            Zero-proxy cryptographic QR challenges, hardware-bound device biometrics, live 75% margin calculation, and academic progression tracking engineered for modern B.Tech engineering students.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              variant="emerald"
              className="gap-2 font-mono font-bold px-7 py-6 text-sm shadow-2xl shadow-emerald-950/80 hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all duration-300 tracking-wide"
            >
              <Link href="/student">
                ENTER COMMAND CENTER
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-900/70 hover:border-slate-500 hover:bg-slate-800 text-slate-200 gap-2 font-mono font-bold px-6 py-6 text-sm transition-all duration-300 tracking-wide"
            >
              <a href="#pillars">
                EXPLORE MISSIONS
                <Compass className="h-4 w-4 text-emerald-400" />
              </a>
            </Button>
          </div>

          {/* HUD Telemetry Status Strip */}
          <div className="pt-2 flex items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-emerald-300">SYS.STATUS:</strong> 100% ONLINE
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <strong className="text-cyan-300">SECURITY:</strong> SHA-256 HARDWARE LOCKED
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <strong className="text-teal-300">PROXY COUNT:</strong> 0 DETECTED
            </span>
          </div>
        </div>

        {/* Command Center Showcase: Student Command Center & Teacher Control Center */}
        <div className="relative z-10 max-w-5xl mx-auto w-full mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Command Center Card */}
            <TiltCard glowColor="emerald" maxTilt={6} scale={1.02} className="h-full">
              <Card className="h-full border-emerald-500/30 bg-slate-900/85 hover:border-emerald-500/60 transition-all duration-300 shadow-xl shadow-emerald-950/30 flex flex-col justify-between">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-950/50 font-black text-lg"
                        style={{ transform: "translateZ(25px)" }}
                      >
                        JD
                      </div>
                      <div style={{ transform: "translateZ(15px)" }}>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold text-white">Jane Doe</CardTitle>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            2024-CS-0042
                          </span>
                        </div>
                        <CardDescription className="text-xs text-slate-400 mt-0.5">
                          B.Tech Computer Science & Eng. • Sem VI
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="emerald" className="shadow-sm font-semibold shrink-0" style={{ transform: "translateZ(20px)" }}>
                      Student Command
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Subtle Academic XP Progression Bar */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2" style={{ transform: "translateZ(10px)" }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        Academic XP: 850 / 1000
                      </span>
                      <span className="text-emerald-400 font-bold">85.0% Overall</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: "85%" }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Level 4 Scholar • Safe Zone</span>
                      <span className="text-slate-400 font-medium">Next Milestone: 90% Distinction</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2" style={{ transform: "translateZ(20px)" }}>
                    <Button asChild size="sm" variant="emerald" className="text-xs font-semibold shadow-md">
                      <Link href="/student">Dashboard Overview</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                      <Link href="/student/scanner">
                        <Scan className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                        QR Scanner
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                      <Link href="/student/advisor">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
                        AI Policy Advisor
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                      <Link href="/student/device">
                        <Smartphone className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                        Hardware Lock
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TiltCard>

            {/* Teacher Control Center Card */}
            <TiltCard glowColor="teal" maxTilt={6} scale={1.02} className="h-full">
              <Card className="h-full border-teal-500/30 bg-slate-900/85 hover:border-teal-500/60 transition-all duration-300 shadow-xl shadow-teal-950/30 flex flex-col justify-between">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shadow-md shadow-teal-950/40"
                        style={{ transform: "translateZ(25px)" }}
                      >
                        <Presentation className="h-6 w-6" />
                      </div>
                      <div style={{ transform: "translateZ(15px)" }}>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold text-white">Prof. Alan Turing</CardTitle>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            FAC-CS-01
                          </span>
                        </div>
                        <CardDescription className="text-xs text-slate-400 mt-0.5">
                          Dept. of Computer Science & Engineering
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-teal-500/40 text-teal-300 font-semibold shrink-0" style={{ transform: "translateZ(20px)" }}>
                      Teacher Console
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Real-time Session Telemetry */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2" style={{ transform: "translateZ(10px)" }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-teal-400" />
                        Active Lecture: CS-301 (LH-302)
                      </span>
                      <span className="text-teal-300 font-bold">48 / 52 Present</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                        style={{ width: "92.3%" }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>HMAC Rotating Token: 15s Cycle</span>
                      <span className="text-emerald-400 font-medium">0 Proxies Detected</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2" style={{ transform: "translateZ(20px)" }}>
                    <Button asChild size="sm" variant="outline" className="text-xs border-teal-500/40 bg-teal-950/30 text-teal-200 hover:bg-teal-900/40 font-semibold">
                      <Link href="/teacher">Teacher Console</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                      <Link href="/teacher/sessions">
                        <QrCode className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
                        Projector Display
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                      <Link href="/teacher/devices">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                        Device Perimeter
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                      <Link href="/teacher/reports">
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                        CSV Reports
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TiltCard>
          </div>
        </div>

        {/* The 4 Anti-Proxy Defense Pillars with Number Badges */}
        <div id="pillars" className="relative z-10 max-w-5xl mx-auto w-full mb-12 scroll-mt-24">
          <div className="text-center mb-6 space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">
              4 Cryptographic Pillars Against Attendance Fraud
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Multi-layered zero-trust defense perimeter preventing screenshots, shared logins, and ditching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <TiltCard glowColor="emerald" maxTilt={8} scale={1.03} className="h-full">
              <div className="h-full p-5 rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-lg shadow-slate-950/40">
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ transform: "translateZ(20px)" }}>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-950/40">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      01
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5" style={{ transform: "translateZ(14px)" }}>
                    Dynamic HMAC QR
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3" style={{ transform: "translateZ(8px)" }}>
                    Tokens rotate every 15–20s with SVG circular countdown. Photo sharing across messaging apps expires before scanning.
                  </p>
                </div>
                <button
                  onClick={() => openTourAtStep(2)}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start transition-transform duration-200 hover:translate-x-1"
                  style={{ transform: "translateZ(18px)" }}
                >
                  Explore Mechanism <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </TiltCard>

            {/* Pillar 2 */}
            <TiltCard glowColor="amber" maxTilt={8} scale={1.03} className="h-full">
              <div className="h-full p-5 rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-lg shadow-slate-950/40">
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ transform: "translateZ(20px)" }}>
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md shadow-amber-950/40">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      02
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5" style={{ transform: "translateZ(14px)" }}>
                    Hardware Fingerprint
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3" style={{ transform: "translateZ(8px)" }}>
                    Student accounts bind 1:1 to a SHA-256 device fingerprint (WebGL/Canvas/Audio). Logging in on a friend's phone triggers 403 Forbidden.
                  </p>
                </div>
                <button
                  onClick={() => openTourAtStep(3)}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start transition-transform duration-200 hover:translate-x-1"
                  style={{ transform: "translateZ(18px)" }}
                >
                  Explore Mechanism <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </TiltCard>

            {/* Pillar 3 */}
            <TiltCard glowColor="rose" maxTilt={8} scale={1.03} className="h-full">
              <div className="h-full p-5 rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between hover:border-rose-500/40 transition-colors shadow-lg shadow-slate-950/40">
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ transform: "translateZ(20px)" }}>
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-md shadow-rose-950/40">
                      <Activity className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      03
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5" style={{ transform: "translateZ(14px)" }}>
                    Random Re-Verify
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3" style={{ transform: "translateZ(8px)" }}>
                    Mid-lecture 60-second surprise prompts challenge students to re-confirm physical presence, defeating "scan & ditch" fraud.
                  </p>
                </div>
                <button
                  onClick={() => openTourAtStep(5)}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start transition-transform duration-200 hover:translate-x-1"
                  style={{ transform: "translateZ(18px)" }}
                >
                  Explore Mechanism <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </TiltCard>

            {/* Pillar 4 */}
            <TiltCard glowColor="teal" maxTilt={8} scale={1.03} className="h-full">
              <div className="h-full p-5 rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between hover:border-teal-500/40 transition-colors shadow-lg shadow-slate-950/40">
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ transform: "translateZ(20px)" }}>
                    <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shadow-md shadow-teal-950/40">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      04
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5" style={{ transform: "translateZ(14px)" }}>
                    Grounded AI Advisor
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3" style={{ transform: "translateZ(8px)" }}>
                    Zero hallucination policy calculator providing mathematically deterministic 75% margin formulas before generating recommendations.
                  </p>
                </div>
                <button
                  onClick={() => openTourAtStep(6)}
                  className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 self-start transition-transform duration-200 hover:translate-x-1"
                  style={{ transform: "translateZ(18px)" }}
                >
                  Explore Mechanism <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Quick Navigation Teleport Hub / Portal Sitemap */}
        <div id="features" className="relative z-10 max-w-5xl mx-auto w-full p-6 sm:p-7 rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md shadow-xl scroll-mt-24">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Portal Navigation Hub
                </h3>
                <p className="text-xs text-slate-400">
                  Quick access to all student & faculty modules
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              8 Modules Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <Link
              href="/student"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white group-hover:text-emerald-300 transition-colors">Student Overview</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-emerald-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">View attendance and academic progress</p>
            </Link>

            <Link
              href="/student/scanner"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white group-hover:text-emerald-300 transition-colors">Viewfinder Scanner</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-emerald-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">Scan attendance QR with zero delay</p>
            </Link>

            <Link
              href="/student/history"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-teal-400" />
                  <span className="font-bold text-white group-hover:text-teal-300 transition-colors">Attendance Ledger</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-teal-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">Track timestamped attendance records</p>
            </Link>

            <Link
              href="/student/advisor"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-400" />
                  <span className="font-bold text-white group-hover:text-teal-300 transition-colors">AI Policy Advisor</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-teal-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">Get attendance-related guidance</p>
            </Link>

            <Link
              href="/student/device"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-white group-hover:text-amber-300 transition-colors">Device Binding</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-amber-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">Manage 1:1 hardware security lock</p>
            </Link>

            <Link
              href="/teacher"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Presentation className="h-4 w-4 text-teal-400" />
                  <span className="font-bold text-white group-hover:text-teal-300 transition-colors">Teacher Console</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-teal-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">Manage active sessions & student rosters</p>
            </Link>

            <Link
              href="/teacher/sessions"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-teal-400" />
                  <span className="font-bold text-white group-hover:text-teal-300 transition-colors">Projector Display</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-teal-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">Broadcast dynamic rotating HMAC QR</p>
            </Link>

            <Link
              href="/teacher/reports"
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 text-slate-300 flex flex-col justify-between hover-lift-3d group shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white group-hover:text-emerald-300 transition-colors">RFC-4180 Reports</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-emerald-400 transition-all duration-300" />
              </div>
              <p className="text-[11px] text-slate-400">Export audit-ready CSV attendance data</p>
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
