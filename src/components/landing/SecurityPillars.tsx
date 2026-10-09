"use client";

import * as React from "react";
import { Key, Cpu, MapPin, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface PillarItem {
  id: string;
  number: string;
  title: string;
  protocol: string;
  shortDescription: string;
  technicalDetails: string[];
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
    icon: ShieldCheck,
  },
];

export function SecurityPillars() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const cardsContainerRef = React.useRef<HTMLDivElement>(null);
  const desktopCardsRef = React.useRef<HTMLDivElement>(null);

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

    const ctx = gsap.context(() => {
      // 1. Header Reveal (Eyebrow -> Heading -> Description)
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

      // Desktop: Staggered reveal of 2x2 grid with border glow emphasis
      mm.add("(min-width: 1024px)", () => {
        const cards = desktopCardsRef.current?.querySelectorAll(".desktop-pillar-card");
        if (cards && cards.length > 0) {
          cards.forEach((card, idx) => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: card,
                start: "top 82%",
                once: true,
              },
            });

            // Card entrance with subtle border glow flash
            tl.fromTo(
              card,
              {
                opacity: 0,
                y: 28,
                scale: 0.98,
                borderColor: "rgba(59,130,246,0.45)",
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                borderColor: "rgba(255,255,255,0.08)",
                duration: 0.65,
                delay: (idx % 2) * 0.1,
                ease: "power2.out",
              }
            );

            // Technical feature badges short stagger
            const badges = card.querySelectorAll(".pillar-badge");
            if (badges && badges.length > 0) {
              tl.fromTo(
                badges,
                { opacity: 0, y: 8 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.4,
                  stagger: 0.05,
                  ease: "power2.out",
                },
                "-=0.35"
              );
            }
          });
        }
      });

      // Mobile: Sequential vertical card reveals without layout shifts
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
                  once: true,
                },
              }
            );
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

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
        <div ref={headerRef} className="max-w-3xl mb-12 sm:mb-16 text-left">
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
            const isExpanded = expandedPillars[pillar.id];
            const Icon = pillar.icon;

            return (
              <div
                key={pillar.id}
                className="pillar-card rounded-2xl border border-white/[0.08] bg-[#070b14]/90 p-5 backdrop-blur-xl transition-all duration-300"
              >
                {/* Clickable Header for Mobile Drawer */}
                <button
                  type="button"
                  onClick={() => togglePillarExpand(pillar.id)}
                  className="w-full flex items-start justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg p-0.5"
                  aria-expanded={isExpanded}
                  aria-controls={`tech-details-${pillar.id}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-zinc-500">
                          {pillar.number}
                        </span>
                        <h3 className="font-semibold text-base text-white tracking-tight">
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-[11px] font-mono text-blue-400/90 tracking-wide mt-0.5 truncate">
                        {pillar.protocol}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 p-1.5 rounded-lg bg-white/[0.04] text-zinc-400">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Always visible description */}
                <p className="text-xs text-zinc-300 leading-relaxed font-normal mt-3 pl-12">
                  {pillar.shortDescription}
                </p>

                {/* Collapsible Technical Details for Mobile */}
                {isExpanded && (
                  <div
                    id={`tech-details-${pillar.id}`}
                    className="mt-3.5 pt-3 border-t border-white/[0.06] pl-12 space-y-1.5 animate-fade-slide-up"
                  >
                    <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                      CRYPTOGRAPHIC SPECIFICATIONS:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {pillar.technicalDetails.map((detail) => (
                        <div
                          key={detail}
                          className="flex items-start gap-2 text-xs text-zinc-300 font-mono"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ========================================================
            DESKTOP VIEW (>= 1024px): Balanced 2x2 Grid Layout
           ======================================================== */}
        <div ref={desktopCardsRef} className="hidden lg:grid grid-cols-2 gap-6 w-full">
          {PILLARS_DATA.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <div
                key={pillar.id}
                className="desktop-pillar-card will-change-transform group relative rounded-3xl p-6 border border-white/[0.08] bg-gradient-to-b from-[#0c101d]/90 to-[#06080d]/95 hover:border-blue-500/50 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-blue-950/30 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-semibold text-zinc-500 block">
                          LAYER {pillar.number}
                        </span>
                        <h3 className="font-semibold tracking-tight text-lg text-white group-hover:text-blue-200 transition-colors">
                          {pillar.title}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                      {pillar.protocol}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300/90 leading-relaxed font-normal mb-5">
                    {pillar.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
                  {pillar.technicalDetails.map((detail) => (
                    <span
                      key={detail}
                      className="pillar-badge will-change-transform px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
