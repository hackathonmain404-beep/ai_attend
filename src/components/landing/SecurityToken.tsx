"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Radio, RefreshCw, Key, Cpu, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";

export type SecurityMode = "crypto" | "device" | "perimeter" | "validation";

interface SecurityTokenProps {
  mode?: SecurityMode;
  className?: string;
  isHero?: boolean;
}

const TOTAL_CYCLE_SECONDS = 15;

const MOCK_SEEDS = [
  { seed: "AG-HMAC-84f9b2d8e31248ca901e74f6", hash: "84f9b2d8...74f6" },
  { seed: "AG-HMAC-19e34c99a81f3b72c918ee04", hash: "19e34c99...ee04" },
  { seed: "AG-HMAC-66d418bc23851499fe71a280", hash: "66d418bc...a280" },
];

export function SecurityToken({ mode = "crypto", className = "", isHero = false }: SecurityTokenProps) {
  const [timeLeft, setTimeLeft] = React.useState<number>(8);
  const [seedIdx, setSeedIdx] = React.useState<number>(0);
  const [isRotating, setIsRotating] = React.useState<boolean>(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRotating(true);
          setTimeout(() => {
            setSeedIdx((idx) => (idx + 1) % MOCK_SEEDS.length);
            setIsRotating(false);
          }, 350);
          return TOTAL_CYCLE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentSeed = MOCK_SEEDS[seedIdx];
  const progressFraction = timeLeft / TOTAL_CYCLE_SECONDS;
  const strokeRadius = 78;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference * (1 - progressFraction);
  const formattedSeconds = timeLeft < 10 ? `0${timeLeft}s` : `${timeLeft}s`;

  return (
    <div className={`relative w-full max-w-sm sm:max-w-md mx-auto select-none ${className}`}>
      {/* Outer Cyan/Blue Rim Underglow */}
      <div
        aria-hidden="true"
        className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/15 to-indigo-500/20 rounded-[32px] blur-xl opacity-60 pointer-events-none"
      />

      {/* Futuristic Token Chassis */}
      <div className="relative rounded-[28px] bg-[#070b14]/90 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85),0_0_35px_rgba(37,99,235,0.12)] overflow-hidden transition-all duration-500">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {mode === "crypto" && <Radio className="h-3.5 w-3.5 animate-pulse" />}
              {mode === "device" && <Cpu className="h-3.5 w-3.5 text-indigo-400" />}
              {mode === "perimeter" && <MapPin className="h-3.5 w-3.5 text-cyan-400" />}
              {mode === "validation" && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold">
                {mode === "crypto" && "Live Attendance Token"}
                {mode === "device" && "Hardware Enclave Seed"}
                {mode === "perimeter" && "Perimeter Radar Lock"}
                {mode === "validation" && "Atomic Validation Ledger"}
              </p>
              <p className="text-[9.5px] font-mono text-zinc-400">
                {mode === "crypto" && "HMAC-SHA256 • EPOCH ROTATION"}
                {mode === "device" && "1:1 HARDWARE SIGNATURE • WEBGL"}
                {mode === "perimeter" && "GEO-BOUND RADIUS • GNSS DUAL-SIG"}
                {mode === "validation" && "NON-REPUDIABLE LEDGER • 240MS"}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-[9.5px] font-mono font-semibold text-blue-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            <span>{mode === "validation" ? "COMMITTED" : "ACTIVE"}</span>
          </div>
        </div>

        {/* Center Presentation Stage */}
        <div className="my-5 relative flex flex-col items-center justify-center min-h-[190px]">
          {/* Mode 1: Dynamic Challenges (Rotating QR Token) */}
          {mode === "crypto" && (
            <div className="relative w-[180px] h-[180px] flex items-center justify-center">
              {/* SVG Circular Progress Ring */}
              <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={strokeRadius} stroke="rgba(255, 255, 255, 0.08)" strokeWidth="3" fill="none" />
                <circle
                  cx="100"
                  cy="100"
                  r={strokeRadius}
                  stroke="url(#token-arc-grad-lib)"
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-700 ease-linear"
                />
                <defs>
                  <linearGradient id="token-arc-grad-lib" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="60%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* QR Code Presentation Box */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`p-2.5 bg-white rounded-xl shadow-lg flex items-center justify-center transition-transform duration-300 ${isRotating ? "scale-95" : "scale-100"}`}>
                  <QRCodeSVG
                    value={`https://attendguard.edu/token?s=${currentSeed.seed}&t=${timeLeft}`}
                    size={105}
                    level="M"
                    fgColor="#030712"
                    bgColor="#ffffff"
                  />
                  {isRotating && (
                    <div className="absolute inset-0 bg-[#070b14]/90 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Device Binding (Hardware Enclave Fingerprint) */}
          {mode === "device" && (
            <div className="relative w-full h-[180px] flex flex-col items-center justify-center gap-3">
              <div className="relative w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.25)]">
                <Cpu className="h-10 w-10 text-indigo-400" />
                <div className="absolute -inset-2 border border-indigo-500/20 rounded-3xl animate-pulse pointer-events-none" />
              </div>
              <div className="w-full max-w-[260px] space-y-1.5 font-mono text-[10px] text-zinc-400 text-center">
                <p className="text-zinc-300">GPU: <span className="text-indigo-400 font-semibold">Apple M3 Pro / WebGL 2.0</span></p>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full w-[88%]" />
                </div>
                <p className="text-[9px] text-zinc-500">TRUST SCORE: <span className="text-emerald-400 font-semibold">99.8% HARDWARE BOUND</span></p>
              </div>
            </div>
          )}

          {/* Mode 3: Perimeter Verification (Campus Radar) */}
          {mode === "perimeter" && (
            <div className="relative w-[180px] h-[180px] flex items-center justify-center">
              <div className="absolute inset-2 rounded-full border border-cyan-500/20 flex items-center justify-center animate-ping opacity-25" />
              <div className="absolute inset-6 rounded-full border border-cyan-500/30 flex items-center justify-center" />
              <div className="absolute inset-12 rounded-full border border-cyan-500/40 flex items-center justify-center" />
              <div className="relative w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="absolute bottom-1 font-mono text-[9px] text-cyan-400 font-semibold">
                CAMPUS RADIUS: 42M (LOCKED)
              </div>
            </div>
          )}

          {/* Mode 4: Real-Time Validation (Ledger State) */}
          {mode === "validation" && (
            <div className="relative w-full h-[180px] flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-9 w-9 stroke-[1.8]" />
              </div>
              <div className="space-y-1 font-mono text-center">
                <p className="text-xs font-semibold text-emerald-300">SESSION COMMITTED TO LEDGER</p>
                <p className="text-[10px] text-zinc-400">TXID: <span className="text-zinc-300 font-mono">0x9f1a...480c</span> • 240ms latency</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] text-emerald-400 font-semibold">
                  <span>+1 SESSION SAFE • 75% MARGIN BUFFER OK</span>
                </div>
              </div>
            </div>
          )}

          {/* Ephemeral Hash and Countdown Bar (for Hero & Crypto modes) */}
          {mode === "crypto" && (
            <div className="mt-2 flex items-center justify-between w-full px-2 text-[10px] font-mono text-zinc-400">
              <span className="text-zinc-500">HASH: <span className="text-blue-400 font-semibold">{currentSeed.hash}</span></span>
              <span className="text-zinc-300 font-semibold">EXPIRATION: <span className="text-cyan-400 font-bold">{formattedSeconds}</span></span>
            </div>
          )}
        </div>

        {/* Cryptographic Telemetry Badges */}
        <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-white/[0.08] text-center">
          <div className="px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-mono font-medium tracking-tight text-zinc-300">TOKEN ACTIVE</span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-blue-400" />
            <span className="text-[9px] font-mono font-medium tracking-tight text-zinc-300">DEVICE BOUND</span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] font-mono font-medium tracking-tight text-zinc-300">PERIMETER OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
