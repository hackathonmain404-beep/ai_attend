"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw, Radio, Users, ShieldCheck, Timer, Sparkles, Lock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchQrChallenge } from "@/lib/services/qr-service";
import type { QrChallengeResponse } from "@/types/qr";

interface DynamicQrDisplayProps {
  sessionId?: string;
  courseCode?: string;
  courseName?: string;
  totalEnrolled?: number;
  presentCount?: number;
  rotationIntervalSec?: number;
  viewerIdentifier?: string;
}

export function DynamicQrDisplay({
  sessionId = "44444444-4444-4444-4444-444444444441",
  courseCode = "CS301",
  courseName = "Distributed Systems & Cloud",
  totalEnrolled = 65,
  presentCount = 52,
  rotationIntervalSec = 15,
  viewerIdentifier,
}: DynamicQrDisplayProps) {
  const [challenge, setChallenge] = React.useState<QrChallengeResponse | null>(null);
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(rotationIntervalSec);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [currentTimestamp, setCurrentTimestamp] = React.useState<string>("");

  // Live ticking ISO / UTC timestamp for dynamic screenshot deterrence
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimestamp(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute masked session code (e.g. SES-••4441)
  const maskedSession = React.useMemo(() => {
    if (!sessionId) return "SES-••••";
    const clean = sessionId.replace(/-/g, "").toUpperCase();
    return `SES-••${clean.slice(-4)}`;
  }, [sessionId]);

  // Compute masked viewer / faculty identifier (e.g. FAC-•••-104)
  const maskedIdentifier = React.useMemo(() => {
    if (!viewerIdentifier) return `HOST-••${(courseCode || "SEC").toUpperCase()}`;
    const trimmed = viewerIdentifier.trim();
    if (trimmed.length <= 4) return `ID-••${trimmed}`;
    return `${trimmed.slice(0, 3)}-••••-${trimmed.slice(-3)}`;
  }, [viewerIdentifier, courseCode]);

  // Load new challenge from authoritative backend
  const loadChallenge = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchQrChallenge(sessionId);
      setChallenge(data);
      setSecondsRemaining(rotationIntervalSec);
    } catch {
      // Keep existing challenge on network stutter to prevent screen blanks
    } finally {
      setIsRefreshing(false);
    }
  }, [sessionId, rotationIntervalSec]);

  // Initial fetch
  React.useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  // Countdown timer & rotation interval
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          loadChallenge();
          return rotationIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadChallenge, rotationIntervalSec]);

  const percentage = (secondsRemaining / rotationIntervalSec) * 100;
  const strokeDashoffset = 100 - percentage;

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Session Header Card */}
      <div className="text-center space-y-2 w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Dynamic Classroom Broadcast Active</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {courseCode}: {courseName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Scan the rotating cryptographic QR code using your registered device
        </p>
      </div>

      {/* 3D High-Tech Holographic Projector QR Display Box */}
      <div
        className="relative group w-full flex justify-center py-2"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative p-6 sm:p-8 rounded-3xl bg-white text-black shadow-2xl border-4 border-slate-700/60 flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] group-hover:-translate-y-1 group-hover:shadow-[0_25px_60px_-15px_rgba(16,185,129,0.45)] group-hover:border-emerald-500/50"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(2deg)",
          }}
        >
          {/* Cyber HUD 3D Corner Brackets */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-500/80 rounded-tl-md pointer-events-none transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" style={{ transform: "translateZ(20px)" }} />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-500/80 rounded-tr-md pointer-events-none transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" style={{ transform: "translateZ(20px)" }} />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-500/80 rounded-bl-md pointer-events-none transition-transform duration-300 group-hover:-translate-x-1 group-hover:translate-y-1" style={{ transform: "translateZ(20px)" }} />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-500/80 rounded-br-md pointer-events-none transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" style={{ transform: "translateZ(20px)" }} />

          {/* QR Code Matrix Area with Dynamic Watermark */}
          {challenge ? (
            <div
              className="relative p-2 sm:p-4 bg-white rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ transform: "translateZ(10px)" }}
            >
              {/* Holographic Laser Sweep Beam Animation */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-laser-sweep pointer-events-none z-10" />

              {/* High-Contrast QR Code Matrix (Reed-Solomon Level H) */}
              <QRCodeSVG
                value={challenge.challengeToken}
                size={360}
                level="H"
                includeMargin={true}
                className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] max-w-full drop-shadow-sm relative z-0"
              />

              {/* =========================================================
                  SUBTLE DYNAMIC WATERMARK OVERLAY (SCREENSHOT DETERRENT)
                  Non-intrusive micro-telemetry pattern:
                  - Does NOT compromise optical scan readability (contrast > 85%)
                  - Imprints dynamic session & live timestamp proof into photos
                  ========================================================= */}
              <div
                className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3.5 z-20"
                aria-hidden="true"
              >
                {/* Top Micro-HUD Telemetry Line */}
                <div className="flex items-center justify-between text-[9px] font-mono tracking-wider font-semibold text-slate-900/20">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40 inline-block animate-pulse" />
                    {maskedSession}
                  </span>
                  <span>{maskedIdentifier}</span>
                </div>

                {/* Diagonal Repeating Micro-Watermark Texture */}
                <div className="absolute inset-0 flex flex-col justify-around items-center -rotate-12 pointer-events-none opacity-20 select-none">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-800 whitespace-nowrap">
                    {maskedIdentifier} • {maskedSession} • {currentTimestamp || "ACTIVE"}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-800 whitespace-nowrap">
                    ATTENDGUARD SEC-QR // SEQ#{challenge?.sequence || 1} // {rotationIntervalSec}S TTL
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-800 whitespace-nowrap">
                    {courseCode} • {maskedSession} • {currentTimestamp || "ACTIVE"}
                  </span>
                </div>

                {/* Bottom Micro-HUD Telemetry Line */}
                <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono tracking-wider font-semibold text-slate-900/20 z-10">
                  <span>LIVE ROTATION #{challenge?.sequence || 1}</span>
                  <span>{currentTimestamp ? currentTimestamp.slice(11, 19) + " UTC" : ""}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] flex items-center justify-center bg-slate-100 rounded-2xl">
              <RefreshCw className="h-10 w-10 text-slate-400 animate-spin" />
            </div>
          )}

          {/* 3D Floating Rotation Pill on QR */}
          <div
            className="absolute -bottom-4 bg-slate-950 text-white border border-slate-700/80 group-hover:border-emerald-500/60 px-4 py-1.5 rounded-full flex items-center gap-2.5 shadow-2xl text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            style={{ transform: "translateZ(30px)" }}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>Token Sequence #{challenge?.sequence || 28}</span>
            <span className="text-slate-500">•</span>
            <span className="text-teal-400 font-mono">{rotationIntervalSec}s TTL</span>
          </div>
        </div>
      </div>

      {/* Screenshot Deterrence Banner */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono text-zinc-300">
            Forensic Watermark Deterrent • 15s Server Expiration
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Cryptographic token expires server-side every {rotationIntervalSec}s
        </span>
      </div>

      {/* Countdown Ring & Live Headcount Row with 3D Hover Lift */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Countdown Ring Card */}
        <Card className="p-4 border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center gap-4 hover-lift-3d group cursor-pointer shadow-lg">
          <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-1000 ease-linear drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                strokeDasharray="100"
                strokeDashoffset={strokeDashoffset}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono font-black text-sm text-white group-hover:text-emerald-300 transition-colors">
              {secondsRemaining}s
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-300 block group-hover:text-white transition-colors">
              QR Rotation Countdown
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Token automatically refreshes every {rotationIntervalSec} seconds
            </p>
          </div>
        </Card>

        {/* Live Attendee Counter Card */}
        <Card className="p-4 border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center gap-4 hover-lift-3d group cursor-pointer shadow-lg">
          <div className="h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 group-hover:scale-105 transition-all duration-300">
            <Users className="h-6 w-6 group-hover:text-teal-300 transition-colors" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white group-hover:text-teal-200 transition-colors">
                {presentCount}
              </span>
              <span className="text-xs text-slate-400">/ {totalEnrolled} present</span>
            </div>
            <p className="text-[11px] text-teal-300 font-medium mt-0.5">
              {totalEnrolled > 0 ? ((presentCount / totalEnrolled) * 100).toFixed(1) : 0}% attendance rate
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
