"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, RefreshCw, Key, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const TOTAL_CYCLE_SECONDS = 15;

const MOCK_SEEDS = [
  { seed: "AG-HMAC-84f9b2d8e31248ca901e74f6", hash: "84f9b2d8...74f6" },
  { seed: "AG-HMAC-19e34c99a81f3b72c918ee04", hash: "19e34c99...ee04" },
  { seed: "AG-HMAC-66d418bc23851499fe71a280", hash: "66d418bc...a280" },
];

export function AttendanceToken() {
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
  const strokeRadius = 88;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference * (1 - progressFraction);
  const formattedSeconds = timeLeft < 10 ? `0${timeLeft}s` : `${timeLeft}s`;

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
      {/* Outer Cyan/Blue Rim Underglow */}
      <div
        aria-hidden="true"
        className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/15 to-indigo-500/20 rounded-[32px] blur-xl opacity-60 pointer-events-none"
      />

      {/* Futuristic Token Chassis */}
      <div className="relative rounded-[28px] bg-[#070b14]/90 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85),0_0_35px_rgba(37,99,235,0.12)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold">
                Live Attendance Token
              </p>
              <p className="text-[9.5px] font-mono text-zinc-400">
                HMAC-SHA256 • EPOCH ROTATION
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-[9.5px] font-mono font-semibold text-blue-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            <span>LIVE</span>
          </div>
        </div>

        {/* Center Circular Countdown Ring with Dynamic QR Code */}
        <div className="my-5 relative flex flex-col items-center justify-center">
          <div className="relative w-[190px] h-[190px] flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg
              className="w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r={strokeRadius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r={strokeRadius}
                stroke="url(#token-arc-grad)"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-[stroke-dashoffset] duration-700 ease-linear"
              />
              <defs>
                <linearGradient id="token-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="60%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered QR Presentation Box */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={isRotating ? { rotate: [0, -5, 5, 0], scale: [1, 0.95, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="relative p-2.5 bg-white rounded-xl shadow-lg flex items-center justify-center"
              >
                <QRCodeSVG
                  value={`https://attendguard.edu/token?s=${currentSeed.seed}&t=${timeLeft}`}
                  size={116}
                  level="M"
                  fgColor="#030712"
                  bgColor="#ffffff"
                />

                <AnimatePresence>
                  {isRotating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#070b14]/90 rounded-xl flex items-center justify-center backdrop-blur-sm"
                    >
                      <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Ephemeral Hash and Countdown Bar */}
          <div className="mt-3 flex items-center justify-between w-full px-2 text-[10px] font-mono text-zinc-400">
            <span className="text-zinc-500">HASH: <span className="text-blue-400 font-semibold">{currentSeed.hash}</span></span>
            <span className="text-zinc-300 font-semibold">EXPIRATION: <span className="text-cyan-400 font-bold">{formattedSeconds}</span></span>
          </div>
        </div>

        {/* Cryptographic Telemetry Badges (TOKEN ACTIVE, DEVICE BOUND, PERIMETER VERIFIED) */}
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
            <span className="text-[9px] font-mono font-medium tracking-tight text-zinc-300">PERIMETER VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
