"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Smartphone, MapPin, ShieldCheck, Cpu, Key, Radio, Check } from "lucide-react";
import { fadeUpVariants } from "@/lib/motion";

interface PillarItem {
  id: string;
  number: string;
  titleTop: string;
  titleBottom: string;
  benefit: string;
  protocol: string;
  technicalSpecs: string[];
  visualType: "crypto" | "device" | "perimeter" | "validation";
}

const PILLARS_DATA: PillarItem[] = [
  {
    id: "pillar-01",
    number: "01",
    titleTop: "DYNAMIC",
    titleBottom: "CHALLENGES",
    benefit: "Every attendance session uses a continuously changing cryptographic QR challenge.",
    protocol: "HMAC-SHA256 Ephemeral Tokens",
    technicalSpecs: ["SHA-256 HASH CHAIN", "15S EXPIRATION CYCLE", "REPLAY PROTECTION"],
    visualType: "crypto",
  },
  {
    id: "pillar-02",
    number: "02",
    titleTop: "DEVICE",
    titleBottom: "BINDING",
    benefit: "Attendance attempts are associated with trusted device characteristics to reduce proxy attendance.",
    protocol: "1:1 Hardware Integrity Signature",
    technicalSpecs: ["WEBGL CANVAS SIGNAL", "CPU ENCLAVE SEED", "DEVICE TRUST STATE 1:1"],
    visualType: "device",
  },
  {
    id: "pillar-03",
    number: "03",
    titleTop: "PERIMETER",
    titleBottom: "VERIFICATION",
    benefit: "Location and environmental signals help ensure attendance happens within the intended campus boundary.",
    protocol: "Spatial Proximity Bounds",
    technicalSpecs: ["LECTURE HALL GEOFENCE", "TEMPORAL CLOCK DRIFT", "SPOOFING SHIELD"],
    visualType: "perimeter",
  },
  {
    id: "pillar-04",
    number: "04",
    titleTop: "REAL-TIME",
    titleBottom: "VALIDATION",
    benefit: "Each submission is validated immediately before attendance is recorded.",
    protocol: "Atomic Ledger Commitment",
    technicalSpecs: ["SUB-300MS FINALITY", "RFC-4180 AUDIT LEDGER", "75% BUFFER RECOMPUTE"],
    visualType: "validation",
  },
];

function PillarVisual({ type, isHovered }: { type: PillarItem["visualType"]; isHovered: boolean }) {
  if (type === "crypto") {
    return (
      <div className="relative w-full h-36 rounded-2xl bg-black/40 border border-white/[0.08] p-4 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5 text-blue-400">
            <Key className="h-3 w-3" />
            TOKEN SEED
          </span>
          <span className="text-zinc-500">ROTATING</span>
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          <p className="text-zinc-300 truncate">
            0x84f9b2d8...{isHovered ? "e31248ca" : "••••••••"}
          </p>
          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              animate={{ width: ["10%", "90%", "20%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500">
          <span>HMAC-SHA256</span>
          <span className="text-emerald-400 font-semibold">VALID</span>
        </div>
      </div>
    );
  }

  if (type === "device") {
    return (
      <div className="relative w-full h-36 rounded-2xl bg-black/40 border border-white/[0.08] p-4 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Cpu className="h-3 w-3" />
            HARDWARE SEED
          </span>
          <span className="text-blue-400 font-semibold">1:1 LOCK</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
          <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-zinc-500 block text-[9px]">CANVAS</span>
            <span className="text-zinc-200">#4f81-a9</span>
          </div>
          <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-zinc-500 block text-[9px]">WEBGL</span>
            <span className="text-emerald-400">AUTHENTIC</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500">
          <span>DEVICE ENROLLMENT</span>
          <span className="text-emerald-400 font-semibold">MATCHED</span>
        </div>
      </div>
    );
  }

  if (type === "perimeter") {
    return (
      <div className="relative w-full h-36 rounded-2xl bg-black/40 border border-white/[0.08] p-4 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Radio className="h-3 w-3" />
            SPATIAL RADAR
          </span>
          <span className="text-zinc-500">&lt; 2.4m DELTA</span>
        </div>
        <div className="flex items-center justify-center relative py-1">
          <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center relative">
            <div className="w-10 h-10 rounded-full border border-blue-500/40 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            {/* Radar Sweep Line */}
            <motion.div
              className="absolute inset-0 rounded-full border-t border-cyan-400/80"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500">
          <span>CAMPUS BOUNDS</span>
          <span className="text-cyan-400 font-semibold">INSIDE HALL</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-36 rounded-2xl bg-black/40 border border-white/[0.08] p-4 flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="h-3 w-3" />
          ATOMIC RECORD
        </span>
        <span className="text-emerald-400 font-semibold">240MS</span>
      </div>
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] text-zinc-300">
          <span>NON-REPUDIABLE</span>
          <span className="text-zinc-400 font-mono">RFC-4180</span>
        </div>
        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center justify-between">
          <span>75% MARGIN BUFFER</span>
          <span className="font-bold">+1 SESSION SAFE</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500">
        <span>LEDGER STATE</span>
        <span className="text-emerald-400 font-semibold">COMMITTED</span>
      </div>
    </div>
  );
}

export function SecurityPillars() {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  return (
    <section id="security" className="relative py-32 px-6 max-w-6xl mx-auto scroll-mt-24 z-10">
      {/* Editorial Section Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="max-w-3xl mb-20 text-left"
      >
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold mb-4">
          SECURITY PILLARS // ZERO-TRUST DEFENSE
        </p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-5 leading-[1.08]">
          Four Layers. One Trusted Presence.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
          An architectural security perimeter designed to make proxy attendance cryptographically infeasible.
        </p>
      </motion.div>

      {/* Editorial 4-Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {PILLARS_DATA.map((pillar, idx) => {
          const isHovered = hoveredIdx === idx;
          const isDimmed = hoveredIdx !== null && !isHovered;

          return (
            <motion.div
              key={pillar.id}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative rounded-3xl p-7 sm:p-8 border transition-all duration-300 cursor-pointer select-none overflow-hidden ${
                isHovered
                  ? "bg-[#070b14]/90 border-blue-500/40 shadow-2xl shadow-blue-950/30"
                  : isDimmed
                  ? "bg-[#04070e]/50 border-white/[0.05] opacity-50"
                  : "bg-[#050811]/70 border-white/[0.08] hover:border-white/20"
              }`}
            >
              {/* Subtle Atmospheric Light Behind Active Card */}
              {isHovered && (
                <div
                  aria-hidden="true"
                  className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
                />
              )}

              {/* Top Row: Oversized Number */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-4xl sm:text-5xl font-light font-mono tracking-tight text-zinc-600 group-hover:text-blue-400 transition-colors duration-200">
                  {pillar.number}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
                  LAYER {pillar.number}
                </span>
              </div>

              {/* Oversized Editorial Title */}
              <div className="mb-4">
                <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white leading-tight group-hover:text-white transition-colors">
                  <span className="block">{pillar.titleTop}</span>
                  <span className="block text-zinc-300 group-hover:text-white transition-colors">{pillar.titleBottom}</span>
                </h3>
              </div>

              {/* Benefit Copy */}
              <p className="text-sm text-zinc-400 leading-relaxed font-normal mb-6">
                {pillar.benefit}
              </p>

              {/* Animated Visual Diagram Beside / Below */}
              <div className="mb-5">
                <PillarVisual type={pillar.visualType} isHovered={isHovered} />
              </div>

              {/* Progressive Disclosure: Technical Specs on Hover / Tap */}
              <div className="pt-4 border-t border-white/[0.08]">
                <p className="text-[10.5px] font-mono text-blue-400 font-semibold uppercase tracking-wider mb-2">
                  {pillar.protocol}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pillar.technicalSpecs.map((spec) => (
                    <span
                      key={spec}
                      className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-300"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
