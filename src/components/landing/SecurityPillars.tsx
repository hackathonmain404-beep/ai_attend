"use client";

import * as React from "react";
import { Key, Cpu, MapPin, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { SecurityToken, SecurityMode } from "@/components/landing/SecurityToken";

interface PillarItem {
  id: string;
  number: string;
  title: string;
  protocol: string;
  shortDescription: string;
  technicalDetails: string[];
  mode: SecurityMode;
  icon: React.ComponentType<{ className?: string }>;
}

const PILLARS_DATA: PillarItem[] = [
  {
    id: "pillar-01",
    number: "01",
    title: "Dynamic Challenges",
    protocol: "HMAC-SHA256 Ephemeral Tokens",
    shortDescription:
      "Every attendance session generates a continuously rotating cryptographic QR challenge with sub-15-second epoch expiration.",
    technicalDetails: [
      "SHA-256 hash chain signed with ephemeral session secret",
      "Single-use token invalidates upon initial consumption",
      "15-second rotating cycle with 2-second drift tolerance",
    ],
    mode: "crypto",
    icon: Key,
  },
  {
    id: "pillar-02",
    number: "02",
    title: "Device Binding",
    protocol: "1:1 Hardware Integrity Signature",
    shortDescription:
      "Attendance attempts are matched against registered device fingerprints, preventing students from clocking in for absent peers.",
    technicalDetails: [
      "WebGL 2.0 GPU renderer & hardware entropy fingerprinting",
      "Enforced 1:1 student-to-device registration ratio",
      "Hardware resets require instructor authorization with audit trail",
    ],
    mode: "device",
    icon: Cpu,
  },
  {
    id: "pillar-03",
    number: "03",
    title: "Perimeter Verification",
    protocol: "Dynamic Geofence Radius Verification",
    shortDescription:
      "Multi-factor spatial validation verifies students are physically present within lecture halls or laboratory boundaries.",
    technicalDetails: [
      "42-meter locked radius around registered classroom coordinates",
      "Dual-band GNSS validation and spoof detection algorithms",
      "BLE beacon proximity fallback for indoor lecture halls",
    ],
    mode: "perimeter",
    icon: MapPin,
  },
  {
    id: "pillar-04",
    number: "04",
    title: "Real-Time Validation",
    protocol: "Atomic Verification & Policy Ledger",
    shortDescription:
      "Instantaneous check-in commits to an immutable ledger and recalculates academic 75% attendance thresholds in real time.",
    technicalDetails: [
      "Sub-250ms distributed ledger verification and commit",
      "Deterministic 75% margin engine computes safe absence limits",
      "RFC-4180 compliant export with cryptographic audit proofs",
    ],
    mode: "validation",
    icon: ShieldCheck,
  },
];

export function SecurityPillars() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const cardsContainerRef = React.useRef<HTMLDivElement>(null);
  const tokenVisualRef = React.useRef<HTMLDivElement>(null);

  // Active pillar for desktop interactive stage
  const [desktopActiveIdx, setDesktopActiveIdx] = React.useState<number>(0);

  // Mobile tap-to-expand state for each pillar (first one open by default)
  const [expandedPillars, setExpandedPillars] = React.useState<Record<string, boolean>>({
    "pillar-01": true,
    "pillar-02": false,
    "pillar-03": false,
    "pillar-04": false,
  });

  const togglePillarExpand = (id: string) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // GSAP Responsive Scroll Animations
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    // Desktop: Smooth reveal of split layout
    mm.add("(min-width: 1024px)", () => {
      if (cardsContainerRef.current) {
        gsap.fromTo(
          cardsContainerRef.current.children,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cardsContainerRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    });

    // Mobile: Sequential vertical card reveals without long scroll pinning trap
    mm.add("(max-width: 1023px)", () => {
      const cards = cardsContainerRef.current?.querySelectorAll(".pillar-card");
      if (cards && cards.length > 0) {
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
      }
    });

    return () => mm.revert();
  }, []);

  const currentDesktopPillar = PILLARS_DATA[desktopActiveIdx];

  return (
    <section
      id="security"
      ref={sectionRef}
      className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20 sm:scroll-mt-24 z-10"
    >
      {/* Background Ambient Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/4 w-[320px] sm:w-[500px] h-[300px] sm:h-[400px] rounded-full bg-blue-600/10 blur-[80px] sm:blur-[130px] pointer-events-none"
      />

      <div className="w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-left">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold">
              SECURITY PILLARS // ZERO-TRUST DEFENSE
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-4 leading-[1.1]">
            Four Layers. One Trusted Presence.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
            An architectural perimeter designed to make proxy attendance cryptographically infeasible.
          </p>
        </div>

        {/* ========================================================
            MOBILE VIEW (< 1024px): Clean Vertical Sequence
            Tap-to-expand details, no pinning trap, comfortable targets
           ======================================================== */}
        <div ref={cardsContainerRef} className="flex flex-col gap-4 lg:hidden">
          {PILLARS_DATA.map((pillar) => {
            const Icon = pillar.icon;
            const isExpanded = !!expandedPillars[pillar.id];

            return (
              <div
                key={pillar.id}
                className="pillar-card rounded-2xl bg-[#050811]/75 border border-white/[0.08] p-5 transition-colors overflow-hidden will-change-transform"
              >
                {/* Header row with visible number, icon, and title */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-400">
                          {pillar.number}
                        </span>
                        <span className="text-zinc-600 font-mono text-xs">•</span>
                        <h3 className="font-semibold text-base text-white tracking-tight">
                          {pillar.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 tracking-wide">
                        {pillar.protocol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Short readable description */}
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-2 mb-3">
                  {pillar.shortDescription}
                </p>

                {/* Tap-to-expand trigger for technical explanation */}
                <button
                  type="button"
                  onClick={() => togglePillarExpand(pillar.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`tech-details-${pillar.id}`}
                  className="w-full min-h-[44px] py-2 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.09] border border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="text-[11px] font-medium tracking-wide">
                    {isExpanded ? "Hide Technical Details" : "Expand Technical Specs"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                </button>

                {/* Expandable Technical Details Drawer */}
                {isExpanded && (
                  <div
                    id={`tech-details-${pillar.id}`}
                    className="mt-3 pt-3 border-t border-white/[0.08] flex flex-col gap-2 transition-all duration-300 animate-fade-slide-up"
                  >
                    <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                      CRYPTOGRAPHIC SPECIFICATIONS:
                    </span>
                    <ul className="flex flex-col gap-1.5 pl-1">
                      {pillar.technicalDetails.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 text-[11.5px] text-zinc-300 leading-relaxed"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ========================================================
            DESKTOP VIEW (>= 1024px): Interactive Split Presentation
            Cards on left with live active token preview on right
           ======================================================== */}
        <div className="hidden lg:grid grid-cols-12 gap-10 items-center">
          {/* Left Column: 4 Interactive Pillars */}
          <div className="col-span-7 flex flex-col gap-3.5">
            {PILLARS_DATA.map((pillar, idx) => {
              const isCurrent = desktopActiveIdx === idx;
              const Icon = pillar.icon;

              return (
                <div
                  key={pillar.id}
                  onClick={() => setDesktopActiveIdx(idx)}
                  className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer select-none overflow-hidden ${
                    isCurrent
                      ? "bg-[#070b14]/90 border-blue-500/50 shadow-xl shadow-blue-950/40 opacity-100"
                      : "bg-[#050811]/60 border-white/[0.06] opacity-60 hover:opacity-90 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
                          isCurrent
                            ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                            : "bg-white/[0.02] border-white/10 text-zinc-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-zinc-500">
                        {pillar.number}
                      </span>
                      <h3
                        className={`font-medium tracking-tight text-base ${
                          isCurrent ? "text-white" : "text-zinc-400"
                        }`}
                      >
                        {pillar.title}
                      </h3>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500">
                      {pillar.protocol}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-zinc-300 leading-relaxed">
                    {pillar.shortDescription}
                  </p>

                  {isCurrent && (
                    <div className="mt-3 pt-3 border-t border-white/[0.08] flex flex-wrap gap-1.5 animate-fade-slide-up">
                      {pillar.technicalDetails.map((detail) => (
                        <span
                          key={detail}
                          className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9.5px] font-mono text-blue-300"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Morphing Security Visualization */}
          <div className="col-span-5 flex flex-col items-center justify-center">
            <div ref={tokenVisualRef} className="w-full will-change-transform">
              <SecurityToken mode={currentDesktopPillar.mode} />
            </div>

            {/* Stage Indicator Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                ACTIVE LAYER: <span className="text-white font-semibold">{currentDesktopPillar.title}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
