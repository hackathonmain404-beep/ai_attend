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
    description: "Faculty can trigger an unannounced 60-second presence challenge mid-lecture. Absent students who scanned and left are flagged automatically.",
    icon: ShieldAlert,
  },
  {
    title: "Deterministic 75% Margin Engine",
    tagline: "Zero Hallucination Buffer",
    description: "Precise mathematical margin tracking computes exactly how many classes students can safely miss or must attend to meet academic regulations.",
    icon: Calculator,
  },
  {
    title: "Grounded AI Attendance Advisor",
    tagline: "Academic Policy Intelligence",
    description: "Deterministic calculations ground our Gemini AI advisor, providing certified policy explanations without risk of computational hallucination.",
    icon: Sparkles,
  },
  {
    title: "RFC-4180 Audit-Ready Exports",
    tagline: "Administrative Compliance",
    description: "Generate timestamped, tamper-evident attendance ledger exports ready for university registrars and academic accreditation bodies.",
    icon: FileSpreadsheet,
  },
];

export function FeaturesSection() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, idx) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 30, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.7,
            delay: idx * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-32 px-6 max-w-6xl mx-auto scroll-mt-24 z-10">
      {/* Section Header */}
      <div className="max-w-3xl mb-20 text-left">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold mb-4">
          CAMPUS PLATFORM CAPABILITIES
        </p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-5 leading-[1.08]">
          Engineered for Academic Integrity.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
          Built to scale effortlessly across lecture halls, laboratory sections, and multi-department university faculties.
        </p>
      </div>

      {/* Grid of 4 Minimalist Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="p-7 sm:p-8 rounded-3xl bg-[#050811]/75 border border-white/[0.08] hover:border-white/20 transition-all duration-300 group text-left backdrop-blur-xl will-change-transform"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="h-10 w-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 group-hover:text-cyan-300 transition-colors">
                  <Icon className="h-5 w-5 stroke-[1.75]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 rounded-full">
                  {item.tagline}
                </span>
              </div>

              <h3 className="text-xl font-medium text-white tracking-tight mb-2.5 group-hover:text-cyan-200 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
