"use client";

import * as React from "react";
import { KeyRound, ScanLine, Fingerprint, Database, ArrowDown } from "lucide-react";
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
    headline: "Token and perimeter validated",
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
    headline: "Validated attendance recorded",
    detail: "Atomic entry commits to immutable ledger, recomputing academic 75% margin threshold.",
    icon: Database,
    latency: "210ms",
  },
];

export function ArchitectureFlow() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const lineProgressRef = React.useRef<HTMLDivElement>(null);
  const mobileLineRef = React.useRef<HTMLDivElement>(null);
  const desktopNodesRef = React.useRef<(HTMLDivElement | null)[]>([]);
  const mobileNodesRef = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Header Reveal
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      const mm = gsap.matchMedia();

      // Desktop Architecture Animation
      mm.add("(min-width: 1024px)", () => {
        if (lineProgressRef.current && sectionRef.current) {
          gsap.fromTo(
            lineProgressRef.current,
            { scaleX: 0, transformOrigin: "left center" },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 68%",
                end: "bottom 65%",
                scrub: 0.8,
              },
            }
          );
        }

        desktopNodesRef.current.forEach((node, idx) => {
          if (!node) return;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 65%",
              once: true,
            },
          });

          tl.fromTo(
            node,
            { opacity: 0, y: 26, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              delay: idx * 0.12,
              ease: "power2.out",
            }
          );

          // Subtle electric-blue pulse on the node's icon box
          const iconBox = node.querySelector(".node-icon-box");
          if (iconBox) {
            tl.fromTo(
              iconBox,
              { borderColor: "rgba(59,130,246,0.3)", boxShadow: "0 0 0px rgba(56,189,248,0)" },
              {
                borderColor: "rgba(56,189,248,0.7)",
                boxShadow: "0 0 22px rgba(56,189,248,0.35)",
                duration: 0.45,
                yoyo: true,
                repeat: 1,
                ease: "power2.out",
              },
              "-=0.4"
            );
          }
        });
      });

      // Mobile Vertical Flow Animation
      mm.add("(max-width: 1023px)", () => {
        // Animate vertical progress line
        if (mobileLineRef.current && sectionRef.current) {
          gsap.fromTo(
            mobileLineRef.current,
            { scaleY: 0, transformOrigin: "top center" },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                end: "bottom 70%",
                scrub: 1,
              },
            }
          );
        }

        // Progressive reveal of each node
        mobileNodesRef.current.forEach((node) => {
          if (!node) return;
          gsap.fromTo(
            node,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: node,
                start: "top 85%",
                once: true,
              },
            }
          );
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="architecture"
      ref={sectionRef}
      className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20 sm:scroll-mt-24 z-10"
    >
      {/* Section Header */}
      <div ref={headerRef} className="max-w-3xl mb-12 sm:mb-16 text-left">
        <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">
          SYSTEM ARCHITECTURE // INFRASTRUCTURE PIPELINE
        </p>
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-4 leading-[1.1]">
          GENERATE → VERIFY → BIND → RECORD
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
          An end-to-end zero-trust validation pipeline built like mission-critical security infrastructure.
        </p>
      </div>

      {/* Futuristic Infrastructure Diagram Container */}
      <div className="relative rounded-3xl bg-[#050811]/75 border border-white/[0.08] p-5 sm:p-8 lg:p-10 backdrop-blur-xl overflow-hidden">
        {/* ========================================================
            MOBILE VIEW (< 1024px): Single Aligned Vertical Flow
            Subtle connector lines, compact badges, smooth progression
           ======================================================== */}
        <div className="block lg:hidden relative">
          {/* Subtle Vertical Connector Guide Line */}
          <div className="absolute top-6 bottom-6 left-5 w-[2px] bg-white/[0.08] pointer-events-none" />
          <div
            ref={mobileLineRef}
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-5 w-[2px] bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(56,189,248,0.7)] pointer-events-none will-change-transform"
          />

          <div className="flex flex-col gap-6 relative z-10">
            {ARCHITECTURE_NODES.map((node, idx) => {
              const Icon = node.icon;
              const isLast = idx === ARCHITECTURE_NODES.length - 1;

              return (
                <div
                  key={`mobile-${node.step}`}
                  ref={(el) => {
                    mobileNodesRef.current[idx] = el;
                  }}
                  className="flex items-start gap-4 p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] will-change-transform"
                >
                  {/* Left Column: Node Icon atop the vertical track */}
                  <div className="shrink-0 relative z-10">
                    <div className="h-10 w-10 rounded-xl bg-[#0a0f1d] border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_16px_rgba(37,99,235,0.3)]">
                      <Icon className="h-4 w-4 stroke-[2]" />
                    </div>
                  </div>

                  {/* Right Column: Node Details */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono tracking-wider text-blue-400 uppercase font-semibold">
                          {node.name}
                        </span>
                        <span className="text-zinc-600 font-mono text-[10px]">•</span>
                        <span className="font-mono text-[10px] font-semibold text-zinc-400">
                          STEP {node.step}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[9px] font-mono text-zinc-400">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        <span>{node.latency}</span>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-medium text-white mb-1 tracking-tight">
                      {node.headline}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      {node.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            DESKTOP VIEW (>= 1024px): 4 Connected Architecture Nodes
            Horizontal Data Bus Line with Scroll Scrub
           ======================================================== */}
        <div className="hidden lg:block relative">
          {/* Animated Connecting Data Bus Line (Desktop) */}
          <div className="absolute top-[38px] left-[8%] right-[8%] h-px bg-white/[0.08] pointer-events-none" />
          <div
            ref={lineProgressRef}
            aria-hidden="true"
            className="absolute top-[38px] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.7)] pointer-events-none will-change-transform"
          />

          <div className="grid grid-cols-4 gap-6 relative z-10">
            {ARCHITECTURE_NODES.map((node, idx) => {
              const Icon = node.icon;
              return (
                <div
                  key={`desktop-${node.step}`}
                  ref={(el) => {
                    desktopNodesRef.current[idx] = el;
                  }}
                  className="flex flex-col items-start text-left will-change-transform group p-3 rounded-2xl transition-colors hover:bg-white/[0.02]"
                >
                  {/* Node Status Dot + Step Number */}
                  <div className="flex items-center justify-between w-full mb-5">
                    <div className="node-icon-box h-10 w-10 rounded-2xl bg-[#0a0f1d] border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.25)] group-hover:border-cyan-400/50 group-hover:text-cyan-300 transition-colors">
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
      </div>
    </section>
  );
}
