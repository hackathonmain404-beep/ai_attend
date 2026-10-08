"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Smartphone, MapPin, ShieldCheck, ChevronRight } from "lucide-react";
import { fadeUpVariants } from "@/lib/motion";

interface Pillar {
  number: string;
  title: string;
  benefit: string;
  icon: React.ComponentType<{ className?: string }>;
  technicalDetails: {
    protocol: string;
    description: string;
    specs: string[];
  };
}

const PILLARS: Pillar[] = [
  {
    number: "01",
    title: "Dynamic Challenges",
    benefit: "Every attendance session uses a continuously changing cryptographic QR challenge.",
    icon: QrCode,
    technicalDetails: {
      protocol: "HMAC-SHA256 Ephemeral Tokens",
      description: "Tokens rotate every 15–20 seconds with sub-second clock drift synchronization. Photo shares and screenshots expire before receipt.",
      specs: ["15s Expiration Cycle", "256-bit Key Entropy", "Replay Protection"],
    },
  },
  {
    number: "02",
    title: "Device Binding",
    benefit: "Attendance attempts are associated with trusted device characteristics to reduce proxy attendance.",
    icon: Smartphone,
    technicalDetails: {
      protocol: "1:1 Hardware Fingerprint Seed",
      description: "Accounts bind directly to multi-signal hardware signatures. Unauthorized check-in attempts from buddy devices trigger instant rejection.",
      specs: ["WebGL & Canvas Seed", "Strict 1:1 Enrollment", "Zero Multi-Login Proxy"],
    },
  },
  {
    number: "03",
    title: "Perimeter Verification",
    benefit: "Location and environmental signals help ensure attendance happens within the intended campus boundary.",
    icon: MapPin,
    technicalDetails: {
      protocol: "Geofence & Network Proximity",
      description: "Cryptographic presence checks cross-reference physical lecture halls, preventing off-campus proxy submissions via forwarded links.",
      specs: ["Lecture Hall Bounds", "Temporal Timestamp Delta", "Spoofing Detection"],
    },
  },
  {
    number: "04",
    title: "Real-Time Validation",
    benefit: "Each submission is validated immediately before attendance is recorded.",
    icon: ShieldCheck,
    technicalDetails: {
      protocol: "Atomic Sub-Second Finality",
      description: "Submissions undergo atomic cryptographic validation before commit to the immutable ledger, immediately calculating 75% regulatory compliance.",
      specs: ["Sub-300ms Verification", "RFC-4180 Audit Trail", "Deterministic 75% Buffer"],
    },
  },
];

export function SecurityPillars() {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [activeMobileIndex, setActiveMobileIndex] = React.useState<number | null>(0);

  const handlePillarClick = (idx: number) => {
    setActiveMobileIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="security" className="relative py-28 px-6 max-w-6xl mx-auto scroll-mt-20">
      {/* Section Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="max-w-2xl mb-16 text-left"
      >
        <p className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold mb-3">
          SECURITY PILLARS
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
          Four Layers. One Trusted Presence.
        </h2>
        <p className="text-zinc-400 text-base leading-relaxed font-normal">
          A multi-tiered zero-trust defense perimeter built to eliminate attendance spoofing, credential lending, and off-campus proxies.
        </p>
      </motion.div>

      {/* 4 Minimalist Feature Blocks with Progressive Disclosure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {PILLARS.map((pillar, idx) => {
          const Icon = pillar.icon;
          const isHovered = hoveredIndex === idx;
          const isSelectedMobile = activeMobileIndex === idx;
          const isExpanded = isHovered || isSelectedMobile;
          const isDimmed = hoveredIndex !== null && !isHovered;

          return (
            <motion.div
              key={pillar.number}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handlePillarClick(idx)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`group relative rounded-2xl p-6 sm:p-7 border cursor-pointer select-none transition-all duration-300 ${
                isExpanded
                  ? "bg-zinc-900/90 border-blue-500/40 shadow-xl shadow-blue-950/20"
                  : isDimmed
                  ? "bg-zinc-950/40 border-zinc-900/80 opacity-50"
                  : "bg-zinc-950/80 border-zinc-850 hover:border-zinc-700/80"
              }`}
            >
              {/* Header Row: Number & Icon */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-mono font-medium text-zinc-500 group-hover:text-blue-400 transition-colors">
                  {pillar.number}
                </span>
                <div
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors duration-200 ${
                    isExpanded
                      ? "bg-blue-600/15 border-blue-500/30 text-blue-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              {/* Title & High-Level Benefit */}
              <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2 group-hover:text-zinc-100">
                {pillar.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                {pillar.benefit}
              </p>

              {/* Progressive Disclosure: Technical Depth */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden pt-4 mt-4 border-t border-zinc-800/80 space-y-3"
                  >
                    <div>
                      <p className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider mb-1">
                        {pillar.technicalDetails.protocol}
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {pillar.technicalDetails.description}
                      </p>
                    </div>

                    {/* Spec Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pillar.technicalDetails.specs.map((spec) => (
                        <span
                          key={spec}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850/80 border border-zinc-800 text-zinc-400"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Tap Indicator */}
              <div className="md:hidden mt-3 flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                <span>{isSelectedMobile ? "Collapse details" : "Tap to inspect"}</span>
                <ChevronRight
                  className={`h-3 w-3 transition-transform duration-200 ${
                    isSelectedMobile ? "rotate-90 text-blue-400" : ""
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
