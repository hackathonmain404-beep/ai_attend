"use client";

import * as React from "react";
import { Key, Cpu, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { SecurityToken, SecurityMode } from "@/components/landing/SecurityToken";

interface PillarItem {
  id: string;
  number: string;
  titleTop: string;
  titleBottom: string;
  benefit: string;
  protocol: string;
  technicalSpecs: string[];
  mode: SecurityMode;
  icon: React.ComponentType<{ className?: string }>;
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
    mode: "crypto",
    icon: Key,
  },
  {
    id: "pillar-02",
    number: "02",
    titleTop: "DEVICE",
    titleBottom: "BINDING",
    benefit: "Attendance attempts are associated with trusted device characteristics to eliminate proxy submissions.",
    protocol: "1:1 Hardware Integrity Signature",
    technicalSpecs: ["WEBGL CANVAS SIGNAL", "CPU ENCLAVE SEED", "DEVICE TRUST 1:1"],
    mode: "device",
    icon: Cpu,
  },
  {
    id: "pillar-03",
    number: "03",
    titleTop: "PERIMETER",
    titleBottom: "VERIFICATION",
    benefit: "Multi-layered geo-spatial validation verifies physical student presence within university lecture boundaries.",
    protocol: "Dynamic Geofence Radius Verification",
    technicalSpecs: ["GNSS CARRIER LOCK", "BLE BEACON PROXIMITY", "SATELLITE CONFIDENCE 99.4%"],
    mode: "perimeter",
    icon: MapPin,
  },
  {
    id: "pillar-04",
    number: "04",
    titleTop: "REAL-TIME",
    titleBottom: "VALIDATION",
    benefit: "Zero-latency academic ledger records validated check-ins with deterministic margin tracking.",
    protocol: "Atomic Verification & Policy Ledger",
    technicalSpecs: ["NON-REPUDIABLE LEDGER", "75% BUFFER CALCULATION", "240MS AUDIT LATENCY"],
    mode: "validation",
    icon: ShieldCheck,
  },
];

export function SecurityPillars() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const pinContainerRef = React.useRef<HTMLDivElement>(null);
  const tokenVisualRef = React.useRef<HTMLDivElement>(null);
  const progressTextRef = React.useRef<HTMLSpanElement>(null);

  const [activeIdx, setActiveIdx] = React.useState<number>(0);

  // GSAP Pinned ScrollTrigger for the 4 Pillars
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024;

      if (isDesktop && sectionRef.current && pinContainerRef.current) {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2200",
          pin: pinContainerRef.current,
          scrub: 1,
          onUpdate: (self) => {
            const p = self.progress;
            const newIndex = Math.min(Math.floor(p * 4), 3);
            setActiveIdx(newIndex);
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animate the progress counter and morph visualization whenever activeIdx changes
  React.useEffect(() => {
    if (progressTextRef.current) {
      gsap.fromTo(
        progressTextRef.current,
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }

    if (tokenVisualRef.current) {
      gsap.fromTo(
        tokenVisualRef.current,
        { scale: 0.96, opacity: 0.8, filter: "blur(4px)" },
        { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }
      );
    }
  }, [activeIdx]);

  const activePillar = PILLARS_DATA[activeIdx];

  return (
    <section
      id="security"
      ref={sectionRef}
      className="relative min-h-screen bg-zinc-950 py-24 sm:py-32 px-6 scroll-mt-24 z-10"
    >
      {/* Background Ambient Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/4 w-[500px] h-[400px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none"
      />

      <div ref={pinContainerRef} className="max-w-6xl mx-auto w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 text-left">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold">
              SECURITY PILLARS // ZERO-TRUST DEFENSE
            </span>
            <span className="text-zinc-600 font-mono text-xs">|</span>
            <span className="text-xs font-mono text-zinc-400">
              STAGE <span ref={progressTextRef} className="text-cyan-400 font-bold">{activePillar.number} / 04</span>
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-4 leading-[1.08]">
            Four Layers. One Trusted Presence.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
            An architectural security perimeter designed to make proxy attendance cryptographically infeasible.
          </p>
        </div>

        {/* Pinned Split Presentation Chassis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: 4 Pillar Navigation Cards */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {PILLARS_DATA.map((pillar, idx) => {
              const isCurrent = activeIdx === idx;
              const isPast = activeIdx > idx;
              const Icon = pillar.icon;

              return (
                <div
                  key={pillar.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`group relative rounded-2xl p-5 sm:p-6 border transition-all duration-300 cursor-pointer select-none overflow-hidden ${
                    isCurrent
                      ? "bg-[#070b14]/90 border-blue-500/50 shadow-2xl shadow-blue-950/40 opacity-100 scale-100 translate-x-0"
                      : isPast
                      ? "bg-[#04070e]/40 border-white/[0.04] opacity-35 hover:opacity-70 -translate-x-1"
                      : "bg-[#050811]/60 border-white/[0.06] opacity-50 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors ${
                          isCurrent
                            ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                            : "bg-white/[0.02] border-white/10 text-zinc-500"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-zinc-500">
                        {pillar.number}
                      </span>
                      <h3 className={`font-medium tracking-tight text-base sm:text-lg ${isCurrent ? "text-white" : "text-zinc-400"}`}>
                        {pillar.titleTop} {pillar.titleBottom}
                      </h3>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline-block">
                      {pillar.protocol}
                    </span>
                  </div>

                  {isCurrent && (
                    <div className="mt-3 pt-3 border-t border-white/[0.08] text-left">
                      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-3">
                        {pillar.benefit}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {pillar.technicalSpecs.map((spec) => (
                          <span
                            key={spec}
                            className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-300"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Center Morphing Security Visualization */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div ref={tokenVisualRef} className="w-full will-change-transform">
              <SecurityToken mode={activePillar.mode} />
            </div>

            {/* Stage Indicator Pill underneath */}
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>ACTIVE PERIMETER LAYER: <span className="text-white font-semibold">{activePillar.titleTop}</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
