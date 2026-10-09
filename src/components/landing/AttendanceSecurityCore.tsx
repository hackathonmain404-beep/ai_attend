"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RefreshCw, Cpu, Radio, Check, Lock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const TOTAL_CYCLE_SECONDS = 15;

const MOCK_CHALLENGES = [
  { seed: "AG-HMAC-84f9b2d8e31248ca901e74f6", hash: "84f9b2d8...74f6" },
  { seed: "AG-HMAC-19e34c99a81f3b72c918ee04", hash: "19e34c99...ee04" },
  { seed: "AG-HMAC-66d418bc23851499fe71a280", hash: "66d418bc...a280" },
];

export function AttendanceSecurityCore() {
  const [timeLeft, setTimeLeft] = React.useState<number>(8);
  const [challengeIdx, setChallengeIdx] = React.useState<number>(0);
  const [isRotating, setIsRotating] = React.useState<boolean>(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRotating(true);
          setTimeout(() => {
            setChallengeIdx((idx) => (idx + 1) % MOCK_CHALLENGES.length);
            setIsRotating(false);
          }, 400);
          return TOTAL_CYCLE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentChallenge = MOCK_CHALLENGES[challengeIdx];
  const progressFraction = timeLeft / TOTAL_CYCLE_SECONDS;
  const strokeRadius = 108;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference * (1 - progressFraction);
  const formattedSeconds = timeLeft < 10 ? `0${timeLeft}s` : `${timeLeft}s`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-3xl mx-auto"
    >
      {/* Outer Atmospheric Underglow */}
      <div
        aria-hidden="true"
        className="absolute -inset-1.5 bg-gradient-to-r from-blue-600/25 via-indigo-500/20 to-cyan-500/25 rounded-[36px] blur-2xl opacity-60 pointer-events-none"
      />

      {/* Futuristic Console Chassis */}
      <div className="relative rounded-[32px] bg-[#070b14]/85 border border-white/10 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85),0_0_50px_rgba(37,99,235,0.14)] overflow-hidden">
        {/* Subtle Top Gloss Reflection */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        />

        {/* Top Control & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold tracking-wider text-white uppercase">
                  Live Attendance Token
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-[9.5px] font-mono text-blue-300 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400">
                HMAC-SHA256 • EPOCH ROTATION
              </p>
            </div>
          </div>

          {/* Cryptographic Session Tag */}
          <div className="flex items-center gap-2 text-right">
            <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10.5px] font-mono text-zinc-300 flex items-center gap-2">
              <span className="text-zinc-500">HASH:</span>
              <span className="text-blue-400 font-medium">{currentChallenge.hash}</span>
            </div>
          </div>
        </div>

        {/* Center Futuristic Core Display */}
        <div className="py-8 flex flex-col lg:flex-row items-center justify-around gap-8">
          {/* Left Telemetry Column */}
          <div className="w-full lg:w-48 flex flex-row lg:flex-col justify-around gap-4 text-left">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>TOKEN ACTIVE</span>
              </div>
              <p className="text-xs font-medium text-zinc-200">
                Single-Use Nonce
              </p>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Screenshot immune
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-blue-400 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span>DEVICE BOUND</span>
              </div>
              <p className="text-xs font-medium text-zinc-200">
                1:1 Hardware Hash
              </p>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                WebGL & Canvas seed
              </p>
            </div>
          </div>

          {/* Center Circular Countdown Ring with QR Code */}
          <div className="relative flex items-center justify-center p-4">
            {/* SVG Circular Progress Ring */}
            <svg
              className="w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] -rotate-90 pointer-events-none"
              viewBox="0 0 250 250"
            >
              {/* Background Track Ring */}
              <circle
                cx="125"
                cy="125"
                r={strokeRadius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3.5"
                fill="none"
              />
              {/* Animated Blue Progress Arc */}
              <circle
                cx="125"
                cy="125"
                r={strokeRadius}
                stroke="url(#security-ring-gradient)"
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-[stroke-dashoffset] duration-700 ease-linear"
              />
              <defs>
                <linearGradient id="security-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner QR Container with Reticle Corners */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={isRotating ? { rotate: [0, -6, 6, 0], scale: [1, 0.94, 1] } : {}}
                transition={{ duration: 0.45 }}
                className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center"
              >
                {/* QR Code Presentation */}
                <QRCodeSVG
                  value={`https://attendguard.edu/token?c=${currentChallenge.seed}&t=${timeLeft}`}
                  size={144}
                  level="M"
                  fgColor="#030712"
                  bgColor="#ffffff"
                />

                {/* Rotating Transition Shield Overlay */}
                <AnimatePresence>
                  {isRotating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#070b14]/90 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                    >
                      <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Right Telemetry Column */}
          <div className="w-full lg:w-48 flex flex-row lg:flex-col justify-around gap-4 text-left">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-cyan-400 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>PERIMETER VERIFIED</span>
              </div>
              <p className="text-xs font-medium text-zinc-200">
                Lecture Perimeter
              </p>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Delta &lt; 2.4m bounds
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-semibold text-blue-400">
                  EXPIRATION
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {formattedSeconds}
                </span>
              </div>
              <p className="text-xs font-medium text-zinc-200">
                Atomic Validation
              </p>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Sub-300ms commit
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Stitch-Inspired Interactive Command Ribbon */}
        <div className="pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-zinc-300">CHALLENGE ACTIVE</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-zinc-400">RFC-4180 AUDIT LEDGER</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsRotating(true);
                setTimeout(() => {
                  setChallengeIdx((idx) => (idx + 1) % MOCK_CHALLENGES.length);
                  setTimeLeft(TOTAL_CYCLE_SECONDS);
                  setIsRotating(false);
                }, 300);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-[10.5px] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isRotating ? "animate-spin text-blue-400" : ""}`} />
              <span>Rotate Epoch</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
