"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface FinalCTAProps {
  destinationHref: string;
}

export function FinalCTA({ destinationHref }: FinalCTAProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const headlineRef = React.useRef<HTMLHeadingElement>(null);
  const copyRef = React.useRef<HTMLParagraphElement>(null);
  const ctaBtnRef = React.useRef<HTMLAnchorElement>(null);
  const glowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Glow intensifies as user scrolls toward CTA
      if (glowRef.current) {
        gsap.fromTo(
          glowRef.current,
          { opacity: 0.2, scale: 0.8 },
          {
            opacity: 0.65,
            scale: 1.15,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              end: "bottom 80%",
              scrub: 1,
            },
          }
        );
      }

      // Headline fades from blur -> sharp & moves upward
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current,
          { opacity: 0, y: 35, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headlineRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Copy reveals
      if (copyRef.current) {
        gsap.fromTo(
          copyRef.current,
          { opacity: 0, y: 20, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.7,
            delay: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headlineRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // CTA button reveals
      if (ctaBtnRef.current) {
        gsap.fromTo(
          ctaBtnRef.current,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headlineRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Micro-interaction: Magnetic hover (fine pointer only)
  const isFinePointer = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    gsap.to(e.currentTarget, { scale: 1.03, duration: 0.25, ease: "power2.out" });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.16;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.16;
    gsap.to(e.currentTarget, { x, y, duration: 0.2, ease: "power2.out" });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    gsap.to(e.currentTarget, { scale: 1, x: 0, y: 0, duration: 0.35, ease: "power2.out" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-24 sm:py-32 lg:py-36 px-4 sm:px-6 overflow-hidden flex flex-col items-center justify-center text-center z-10"
    >
      {/* Soft Center Atmospheric Light - bounded */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[220px] sm:h-[380px] bg-gradient-to-r from-blue-600/25 via-indigo-500/20 to-cyan-500/25 rounded-full pointer-events-none blur-2xl sm:blur-3xl opacity-40 will-change-transform"
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full px-2">
        {/* Large Statement Headline */}
        <h2
          ref={headlineRef}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.08] mb-5 sm:mb-6 will-change-transform"
        >
          <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Attendance should be verified, not assumed.
          </span>
        </h2>

        {/* Supporting Text */}
        <p
          ref={copyRef}
          className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-8 sm:mb-10 will-change-transform"
        >
          Build a campus attendance system that is fast for students and difficult to exploit.
        </p>

        {/* Primary CTA (Full-width on mobile, comfortable touch target) */}
        <div className="w-full max-w-sm sm:max-w-none flex justify-center">
          <a
            ref={ctaBtnRef}
            href={destinationHref}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] active:bg-blue-700 text-white text-sm font-semibold tracking-wide shadow-[0_0_32px_rgba(37,99,235,0.4)] transition-all inline-flex items-center justify-center gap-2 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
