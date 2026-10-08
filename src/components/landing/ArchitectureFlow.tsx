"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { KeyRound, ScanLine, Fingerprint, Database, Check, ArrowRight } from "lucide-react";
import { fadeUpVariants } from "@/lib/motion";

interface FlowNode {
  step: string;
  name: string;
  telemetry: string;
  headline: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  latency: string;
}

const ARCHITECTURE_NODES: FlowNode[] = [
  {
    step: "01",
    name: "GENERATE",
    telemetry: "CHALLENGE GENERATED",
    headline: "Cryptographic challenge created",
    detail: "Faculty terminal initializes ephemeral rotating HMAC-SHA256 tokens signed by enclave keys.",
    icon: KeyRound,
    latency: "12ms",
  },
  {
    step: "02",
    name: "VERIFY",
    telemetry: "TOKEN VALIDATED",
    headline: "QR + device + perimeter validated",
    detail: "Optical scan performs sub-second cryptographic integrity and spatial geofence cross-check.",
    icon: ScanLine,
    latency: "85ms",
  },
  {
    step: "03",
    name: "BIND",
    telemetry: "DEVICE VERIFIED",
    headline: "Associated with trusted device",
    detail: "Student identity is matched against verified 1:1 hardware enclave seed. Unbound hardware rejected.",
    icon: Fingerprint,
    latency: "140ms",
  },
  {
    step: "04",
    name: "RECORD",
    telemetry: "ATTENDANCE COMMITTED",
    headline: "Validated attendance stored",
    detail: "Atomic entry commits to immutable ledger, recomputing academic 75% margin threshold.",
    icon: Database,
    latency: "210ms",
  },
];

export function ArchitectureFlow() {
  return (
    <section id="architecture" className="relative py-32 px-6 max-w-6xl mx-auto scroll-mt-24 z-10">
      {/* Section Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-3xl mb-20 text-left"
      >
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold mb-4">
          SYSTEM ARCHITECTURE // INFRASTRUCTURE PIPELINE
        </p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-5 leading-[1.08]">
          GENERATE → VERIFY → BIND → RECORD
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
          An end-to-end zero-trust validation pipeline built like mission-critical security infrastructure.
        </p>
      </motion.div>

      {/* Futuristic Infrastructure Diagram Container */}
      <div className="relative rounded-3xl bg-[#050811]/70 border border-white/[0.08] p-6 sm:p-10 backdrop-blur-2xl overflow-hidden">
        {/* Animated Connecting Data Bus Line (Desktop) */}
        <div className="hidden lg:block absolute top-[90px] left-[10%] right-[10%] h-px bg-white/[0.08] pointer-events-none" />
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="hidden lg:block absolute top-[90px] left-[10%] right-[10%] h-px origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 pointer-events-none opacity-80"
        />

        {/* 4 Connected Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
          {ARCHITECTURE_NODES.map((node, idx) => {
            const Icon = node.icon;
            return (
              <motion.div
                key={node.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 + idx * 0.1 }}
                className="flex flex-col text-left group"
              >
                {/* Node Header & Icon Port */}
                <div className="flex items-center justify-between mb-5">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-blue-400 shadow-md group-hover:border-blue-500/50 group-hover:text-cyan-300 transition-all duration-300">
                      <Icon className="h-6 w-6 stroke-[1.75]" />
                    </div>
                    {/* Node Port Pin */}
                    <span className="hidden lg:block absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500/30 border border-blue-400" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                    Δ {node.latency}
                  </span>
                </div>

                {/* Stage Tag */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono font-semibold text-blue-400">
                    STAGE {node.step}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs font-mono font-medium text-white tracking-wider">
                    {node.name}
                  </span>
                </div>

                {/* System Telemetry Label */}
                <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9.5px] font-mono text-blue-300 font-medium w-fit">
                  <span className="h-1 w-1 rounded-full bg-blue-400" />
                  <span>{node.telemetry}</span>
                </div>

                {/* Headline & Detail */}
                <h3 className="text-base font-medium text-white tracking-tight mb-2 group-hover:text-cyan-200 transition-colors">
                  {node.headline}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {node.detail}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Signal Summary Status */}
        <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300">END-TO-END VERIFICATION LATENCY: &lt; 250MS</span>
          </div>
          <span className="text-zinc-500">NON-REPUDIABLE CRYPTOGRAPHIC LEDGER</span>
        </div>
      </div>
    </section>
  );
}
