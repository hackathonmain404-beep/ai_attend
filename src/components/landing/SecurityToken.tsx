"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cpu, RefreshCw, Key, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const TOTAL_CYCLE_SECONDS = 15;

const MOCK_SEEDS = [
  "AG-HMAC-84f9b2d8e31248ca901e74f6",
  "AG-HMAC-19e34c99a81f3b72c918ee04",
  "AG-HMAC-66d418bc23851499fe71a280",
];

export function SecurityToken() {
  const [timeLeft, setTimeLeft] = React.useState<number>(8);
  const [cycleIndex, setCycleIndex] = React.useState<number>(0);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRefreshing(true);
          setTimeout(() => {
            setCycleIndex((c) => (c + 1) % MOCK_SEEDS.length);
            setIsRefreshing(false);
          }, 350);
          return TOTAL_CYCLE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progressFraction = timeLeft / TOTAL_CYCLE_SECONDS;
  const strokeRadius = 14;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference * (1 - progressFraction);
  const formattedSeconds = timeLeft < 10 ? `0${timeLeft}s` : `${timeLeft}s`;

  const currentSeed = MOCK_SEEDS[cycleIndex];
  const shortHash = `${currentSeed.slice(8, 16)}...${currentSeed.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-sm mx-auto"
    >
      {/* Subtle Electric Blue Backlight */}
      <div className="absolute -inset-1.5 bg-blue-600/15 rounded-[32px] blur-xl opacity-60 pointer-events-none" />

      {/* Security Token Frame (Apple/Linear minimal hardware phone chassis) */}
      <div className="relative bg-zinc-950/90 border border-zinc-800/80 rounded-[28px] p-5 sm:p-6 shadow-2xl shadow-black/80 backdrop-blur-xl">
        {/* Top Token Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Key className="h-3 w-3" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Attendance Token
              </p>
              <p className="text-[9.5px] font-mono text-zinc-500">
                HMAC-SHA256 • EPOCH ROTATION
              </p>
            </div>
          </div>

          {/* Live Status Indicator Pill */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-[10px] font-mono font-semibold text-blue-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            <span>LIVE</span>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="my-5 relative p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col items-center justify-center">
          {/* Subtle Corner Reticles */}
          <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-zinc-600" />
          <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-zinc-600" />
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-zinc-600" />
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-zinc-600" />

          {/* QR Container with Refresh Fade & Subtle Rotation */}
          <motion.div
            animate={isRefreshing ? { rotate: [0, -4, 4, 0], scale: [1, 0.96, 1] } : {}}
            transition={{ duration: 0.4 }}
            className="relative p-2.5 bg-white rounded-xl shadow-md transition-opacity duration-300"
          >
            <QRCodeSVG
              value={`https://attendguard.edu/verify?seed=${currentSeed}&t=${timeLeft}`}
              size={148}
              level="M"
              fgColor="#09090b"
              bgColor="#ffffff"
            />

            {/* Refresh overlay on expiration */}
            <AnimatePresence>
              {isRefreshing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/80 rounded-xl flex items-center justify-center backdrop-blur-[2px]"
                >
                  <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Cryptographic Ephemeral Hash Readout */}
          <div className="mt-3.5 flex items-center justify-between w-full px-1 text-[10px] font-mono text-zinc-400">
            <span className="text-zinc-500">HASH:</span>
            <span className="text-blue-400 font-semibold">{shortHash}</span>
          </div>
        </div>

        {/* Circular Countdown & Verification Row */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
          <div className="flex items-center gap-2.5">
            {/* SVG Smooth Circular Countdown */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r={strokeRadius}
                  stroke="rgba(63, 63, 70, 0.4)"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={strokeRadius}
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-700 ease-linear"
                />
              </svg>
              <span className="absolute text-[8.5px] font-mono font-bold text-zinc-200">
                {formattedSeconds}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-medium text-zinc-300">
                Single-Use Challenge
              </p>
              <p className="text-[9.5px] font-mono text-zinc-500">
                Invalidates on screenshot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-medium">
            <Check className="h-3 w-3 text-emerald-400" />
            <span>ENCRYPTED</span>
          </div>
        </div>

        {/* Subtle Cryptographic Metadata (TOKEN VALID, DEVICE BOUND, CHALLENGE ACTIVE) */}
        <div className="mt-4 grid grid-cols-3 gap-1.5 pt-3 border-t border-zinc-850/80 text-center">
          <div className="px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span className="text-[9.5px] font-mono font-medium tracking-tight text-zinc-300">TOKEN VALID</span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-blue-400" />
            <span className="text-[9.5px] font-mono font-medium tracking-tight text-zinc-300">DEVICE BOUND</span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9.5px] font-mono font-medium tracking-tight text-zinc-300">CHALLENGE ACTIVE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
