"use client";

import * as React from "react";
import { KeyRound, ScanLine, Fingerprint, Database, Check } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

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
  const sectionRef = React.useRef<HTMLElement>(null);
  const lineProgressRef = React.useRef<HTMLDivElement>(null);
  const nodeRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Connecting Line Draw Timeline on Scroll
      if (lineProgressRef.current && sectionRef.current) {
        gsap.fromTo(
          lineProgressRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              end: "bottom 60%",
              scrub: 1,
            },
          }
        );
      }

      // Sequential Node Illumination on Scroll
      nodeRefs.current.forEach((node, idx) => {
        if (!node) return;
        gsap.fromTo(
          node,
          { opacity: 0.35, y: 24, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: node,
              start: "top 80%",
              end: "bottom 60%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="architecture" ref={sectionRef} className="relative py-32 px-6 max-w-6xl mx-auto scroll-mt-24 z-10">
      {/* Section Header */}
      <div className="max-w-3xl mb-20 text-left">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold mb-4">
          SYSTEM ARCHITECTURE // INFRASTRUCTURE PIPELINE
        </p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-5 leading-[1.08]">
          GENERATE → VERIFY → BIND → RECORD
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
          An end-to-end zero-trust validation pipeline built like mission-critical security infrastructure.
        </p>
      </div>

      {/* Futuristic Infrastructure Diagram Container */}
      <div className="relative rounded-3xl bg-[#050811]/70 border border-white/[0.08] p-6 sm:p-10 backdrop-blur-2xl overflow-hidden">
        {/* Animated Connecting Data Bus Line (Desktop) */}
        <div className="hidden lg:block absolute top-[90px] left-[10%] right-[10%] h-px bg-white/[0.08] pointer-events-none" />
        <div
          ref={lineProgressRef}
          aria-hidden="true"
          className="hidden lg:block absolute top-[90px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.7)] pointer-events-none will-change-transform"
        />

        {/* 4 Connected Architecture Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
          {ARCHITECTURE_NODES.map((node, idx) => {
            const Icon = node.icon;
            return (
              <div
                key={node.step}
                ref={(el) => {
                  nodeRefs.current[idx] = el;
                }}
                className="flex flex-col items-start text-left will-change-transform group p-4 rounded-2xl transition-colors hover:bg-white/[0.02]"
              >
                {/* Node Status Dot + Step Number */}
                <div className="flex items-center justify-between w-full mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-[#0a0f1d] border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.25)] group-hover:border-cyan-400/50 group-hover:text-cyan-300 transition-colors">
                    <Icon className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <span className="font-mono text-xs font-semibold text-zinc-500">
                    STEP {node.step}
                  </span>
                </div>

                {/* Node Name & Telemetry */}
                <span className="text-[10px] font-mono tracking-wider text-blue-400 uppercase font-semibold mb-1">
                  {node.name}
                </span>
                <h3 className="text-base font-medium text-white mb-2 tracking-tight group-hover:text-cyan-200 transition-colors">
                  {node.headline}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal mb-4">
                  {node.detail}
                </p>

                {/* Latency Telemetry Badge */}
                <div className="mt-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[9.5px] font-mono text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{node.latency} LATENCY</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
