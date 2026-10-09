"use client";

import * as React from "react";
import { ShieldAlert, Calculator, Sparkles, FileSpreadsheet } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface Feature {
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FEATURES: Feature[] = [
  {
    title: "Random In-Class Re-Verification",
    tagline: "Defeats 'Scan & Ditch' Fraud",
    description:
      "Faculty can trigger an unannounced 60-second presence challenge mid-lecture. Absent students who scanned and left are flagged automatically.",
    icon: ShieldAlert,
  },
  {
    title: "Deterministic 75% Margin Engine",
    tagline: "Zero Hallucination Buffer",
    description:
      "Precise mathematical margin tracking computes exactly how many classes students can safely miss or must attend to meet academic regulations.",
    icon: Calculator,
  },
  {
    title: "Grounded AI Attendance Advisor",
    tagline: "Academic Policy Intelligence",
    description:
      "Deterministic calculations ground our Gemini AI advisor, providing certified policy explanations without risk of computational hallucination.",
    icon: Sparkles,
  },
  {
    title: "RFC-4180 Audit-Ready Exports",
    tagline: "Administrative Compliance",
    description:
      "Generate timestamped, tamper-evident attendance ledger exports ready for university registrars and academic accreditation bodies.",
    icon: FileSpreadsheet,
  },
];

export function FeaturesSection() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Section Header Reveal
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

      // 2. Choreographed Stagger for Feature Cards
      cardRefs.current.forEach((card, idx) => {
        if (!card) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: true,
          },
        });

        tl.fromTo(
          card,
          { opacity: 0, y: 28, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: (idx % 2) * 0.12,
            ease: "power2.out",
          }
        );

        const icon = card.querySelector(".feature-icon-box");
        if (icon) {
          tl.fromTo(
            icon,
            { scale: 0.82, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" },
            "-=0.35"
          );
        }

        const title = card.querySelector(".feature-title");
        const desc = card.querySelector(".feature-desc");
        if (title && desc) {
          tl.fromTo(
            [title, desc],
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" },
            "-=0.25"
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20 sm:scroll-mt-24 z-10"
    >
      {/* Section Header */}
      <div ref={headerRef} className="max-w-3xl mb-12 sm:mb-16 text-left">
        <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">
          CAMPUS PLATFORM CAPABILITIES
        </p>
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-4 leading-[1.1]">
          Engineered for Academic Integrity.
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
          Built to scale effortlessly across lecture halls, laboratory sections, and multi-department university faculties.
        </p>
      </div>

      {/* Grid of 4 Minimalist Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {FEATURES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-[#050811]/75 border border-white/[0.08] hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/20 hover:-translate-y-1 transition-all duration-300 group text-left backdrop-blur-xl will-change-transform"
            >
              <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
                <div className="feature-icon-box h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 group-hover:text-cyan-300 transition-colors shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75]" />
                </div>
                <span className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-400 border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 rounded-full truncate">
                  {item.tagline}
                </span>
              </div>

              <h3 className="feature-title text-lg sm:text-xl font-medium text-white tracking-tight mb-2 group-hover:text-cyan-200 transition-colors">
                {item.title}
              </h3>
              <p className="feature-desc text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
