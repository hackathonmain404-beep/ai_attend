"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Radio, RefreshCw, Cpu, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";

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

export function SecurityToken({
  mode = "crypto",
  className = "",
  isHero = false,
}: SecurityTokenProps) {
  const [timeLeft, setTimeLeft] = React.useState<number>(12);
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
  const strokeRadius = 76;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference * (1 - progressFraction);
  const formattedSeconds = timeLeft < 10 ? `0${timeLeft}s` : `${timeLeft}s`;

  return (
    <div
      className={`relative w-full max-w-[320px] sm:max-w-[340px] md:max-w-sm mx-auto select-none overflow-hidden ${className}`}
    >
      {/* Outer Cyan/Blue Rim Ambient Glow - bounded inside frame */}
      <div
        aria-hidden="true"
        className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-indigo-600/30 rounded-[28px] blur-md opacity-60 pointer-events-none"
      />

      {/* Futuristic Token Chassis */}
      <div className="relative rounded-[26px] bg-[#070b14]/95 border border-white/[0.12] backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85),0_0_25px_rgba(37,99,235,0.18)] overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 shrink-0 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              {mode === "crypto" && <Radio className="h-3.5 w-3.5 animate-pulse" />}
              {mode === "device" && <Cpu className="h-3.5 w-3.5 text-indigo-400" />}
              {mode === "perimeter" && <MapPin className="h-3.5 w-3.5 text-cyan-400" />}
              {mode === "validation" && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold truncate">
                {mode === "crypto" && "Live Challenge"}
                {mode === "device" && "Hardware Enclave"}
                {mode === "perimeter" && "Perimeter Radar"}
                {mode === "validation" && "Validation Ledger"}
              </p>
              <p className="text-[9px] font-mono text-zinc-400 truncate">
                {mode === "crypto" && "HMAC-SHA256 • ROTATION"}
                {mode === "device" && "1:1 HARDWARE SEED"}
                {mode === "perimeter" && "GEO-BOUND RADIUS 42M"}
                {mode === "validation" && "ATOMIC AUDIT LEDGER"}
              </p>
            </div>
          </div>

          {/* LIVE status indicator */}
          <div className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[9.5px] font-mono font-semibold text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>LIVE</span>
          </div>
        </div>

        {/* Center Presentation Stage */}
        <div className="my-3.5 relative flex flex-col items-center justify-center min-h-[175px]">
          {/* Mode 1: Dynamic Challenges (Rotating QR Token) */}
          {mode === "crypto" && (
            <div className="relative w-[170px] h-[170px] flex items-center justify-center">
              {/* Circular Countdown Progress Ring */}
              <svg
                className="w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 190 190"
                aria-hidden="true"
              >
                <circle
                  cx="95"
                  cy="95"
                  r={strokeRadius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="95"
                  cy="95"
                  r={strokeRadius}
                  stroke="url(#token-arc-grad)"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-700 ease-linear"
                />
                <defs>
                  <linearGradient id="token-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* QR Code Presentation Box with contrast frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`p-2.5 bg-white rounded-xl shadow-lg flex items-center justify-center transition-transform duration-300 relative ${
                    isRotating ? "scale-95" : "scale-100"
                  }`}
                >
                  <QRCodeSVG
                    value={`https://attendguard.edu/token?s=${currentSeed.seed}&t=${timeLeft}`}
                    size={102}
                    level="M"
                    fgColor="#030712"
                    bgColor="#ffffff"
                  />
                  {isRotating && (
                    <div className="absolute inset-0 bg-[#070b14]/90 rounded-xl flex items-center justify-center backdrop-blur-xs">
                      <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Device Binding (Hardware Enclave Fingerprint) */}
          {mode === "device" && (
            <div className="relative w-full h-[170px] flex flex-col items-center justify-center gap-2.5">
              <div className="relative w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                <Cpu className="h-8 w-8 text-indigo-400" />
                <div className="absolute -inset-1.5 border border-indigo-500/20 rounded-3xl animate-pulse pointer-events-none" />
              </div>
              <div className="w-full max-w-[240px] space-y-1 font-mono text-[9.5px] text-zinc-400 text-center">
                <p className="text-zinc-300">
                  GPU: <span className="text-indigo-400 font-semibold">Apple M3 / WebGL 2.0</span>
                </p>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full w-[94%]" />
                </div>
                <p className="text-[9px] text-zinc-400">
                  TRUST SCORE: <span className="text-emerald-400 font-semibold">99.8% BOUND</span>
                </p>
              </div>
            </div>
          )}

          {/* Mode 3: Perimeter Verification (Campus Radar) */}
          {mode === "perimeter" && (
            <div className="relative w-[170px] h-[170px] flex items-center justify-center">
              <div className="absolute inset-4 rounded-full border border-cyan-500/20 flex items-center justify-center animate-ping opacity-25" />
              <div className="absolute inset-8 rounded-full border border-cyan-500/30 flex items-center justify-center" />
              <div className="relative w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="absolute bottom-1 font-mono text-[9px] text-cyan-400 font-semibold">
                CAMPUS RADIUS: 42M (LOCKED)
              </div>
            </div>
          )}

          {/* Mode 4: Real-Time Validation (Ledger State) */}
          {mode === "validation" && (
            <div className="relative w-full h-[170px] flex flex-col items-center justify-center gap-2.5">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-7 w-7 stroke-[1.8]" />
              </div>
              <div className="space-y-1 font-mono text-center">
                <p className="text-[11px] font-semibold text-emerald-300">SESSION COMMITTED</p>
                <p className="text-[9px] text-zinc-400">
                  TX: <span className="text-zinc-300">0x9f1a...480c</span> • 240ms
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[8.5px] text-emerald-400 font-semibold">
                  <span>+1 SESSION • 75% MARGIN SAFE</span>
                </div>
              </div>
            </div>
          )}

          {/* Ephemeral Hash and Countdown Bar for Crypto mode */}
          {mode === "crypto" && (
            <div className="mt-1 flex items-center justify-between w-full px-1 text-[9.5px] font-mono text-zinc-400">
              <span className="text-zinc-500 truncate max-w-[130px]">
                HASH: <span className="text-blue-400 font-semibold">{currentSeed.hash}</span>
              </span>
              <span className="text-zinc-400 font-medium shrink-0">
                EXPIRES: <span className="text-cyan-400 font-bold">{formattedSeconds}</span>
              </span>
            </div>
          )}
        </div>

        {/* Supporting Metadata Badges: TOKEN VALID, DEVICE BOUND, CHALLENGE ACTIVE */}
        <div className="grid grid-cols-3 gap-1 pt-3 border-t border-white/[0.08] text-center">
          <div className="px-1.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[8.5px] sm:text-[9px] font-mono font-medium tracking-tight text-zinc-300 truncate">
              TOKEN VALID
            </span>
          </div>
          <div className="px-1.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-blue-400 shrink-0" />
            <span className="text-[8.5px] sm:text-[9px] font-mono font-medium tracking-tight text-zinc-300 truncate">
              DEVICE BOUND
            </span>
          </div>
          <div className="px-1.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
            <span className="text-[8.5px] sm:text-[9px] font-mono font-medium tracking-tight text-zinc-300 truncate">
              CHALLENGE ACTIVE
            </span>
          </div>
        </div>

        {/* Demo Disclaimer Banner */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.04] text-center">
          <p className="text-[8px] font-mono text-zinc-400 tracking-wider uppercase">
            SIMULATED LIVE CREDENTIAL • DEMO PURPOSES ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
