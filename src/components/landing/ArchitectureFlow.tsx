"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { KeyRound, ScanLine, Fingerprint, Database, Check } from "lucide-react";
import { fadeUpVariants } from "@/lib/motion";

interface Step {
  step: string;
  name: string;
  headline: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FLOW_STEPS: Step[] = [
  {
    step: "01",
    name: "Generate",
    headline: "Cryptographic challenge created",
    detail: "Faculty session initializes rotating HMAC tokens signed by ephemeral private keys.",
    icon: KeyRound,
  },
  {
    step: "02",
    name: "Verify",
    headline: "QR + device + perimeter validated",
    detail: "Optical camera scan performs cryptographic hash checking and timestamp tolerance verification.",
    icon: ScanLine,
  },
  {
    step: "03",
    name: "Bind",
    headline: "Associated with trusted device",
    detail: "Student account matches verified 1:1 hardware seed. Unregistered devices are blocked (403).",
    icon: Fingerprint,
  },
  {
    step: "04",
    name: "Record",
    headline: "Validated attendance stored",
    detail: "Finalized check-in commits to non-repudiable audit ledger, recalculating real-time 75% margin.",
    icon: Database,
  },
];

export function ArchitectureFlow() {
  return (
    <section id="architecture" className="relative py-28 px-6 max-w-6xl mx-auto scroll-mt-20">
      {/* Section Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="max-w-2xl mb-20 text-left"
      >
        <p className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold mb-3">
          VERIFICATION LIFECYCLE
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
          Generate → Verify → Bind → Record
        </h2>
        <p className="text-zinc-400 text-base leading-relaxed font-normal">
          Every submission traverses an end-to-end zero-trust validation pipeline before entering the institutional audit ledger.
        </p>
      </motion.div>

      {/* Clean Visual Architecture Diagram */}
      <div className="relative">
        {/* Horizontal Desktop Animated Connecting Line */}
        <div className="hidden lg:block absolute top-[28px] left-[6%] right-[6%] h-[1px] bg-zinc-800 pointer-events-none" />
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="hidden lg:block absolute top-[28px] left-[6%] right-[6%] h-[1px] origin-left bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 pointer-events-none opacity-60"
        />

        {/* 4-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 relative z-10">
          {FLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 + idx * 0.12 }}
                className="flex flex-col text-left group"
              >
                {/* Node Icon Circle */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-md group-hover:border-blue-500/40 group-hover:bg-blue-950/20 transition-all duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="lg:hidden flex-1 h-[1px] bg-zinc-850" />
                </div>

                {/* Stage Label */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-mono font-semibold text-blue-400">
                    STEP {step.step}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                    {step.name}
                  </span>
                </div>

                {/* Headline & Detail */}
                <h3 className="text-base font-semibold text-white tracking-tight mb-2 group-hover:text-zinc-100 transition-colors">
                  {step.headline}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {step.detail}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
