"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ParticleField } from "@/components/hero/ParticleField";
import { SecurityToken } from "@/components/landing/SecurityToken";

interface HeroProps {
  destinationHref: string;
  isLoaded?: boolean;
}

export function Hero({ destinationHref, isLoaded = true }: HeroProps) {
  const heroRef = React.useRef<HTMLElement>(null);
  const headlineLine1Ref = React.useRef<HTMLSpanElement>(null);
  const headlineLine2Ref = React.useRef<HTMLSpanElement>(null);
  const copyRef = React.useRef<HTMLParagraphElement>(null);
  const ctaPrimaryRef = React.useRef<HTMLAnchorElement>(null);
  const ctaSecondaryRef = React.useRef<HTMLAnchorElement>(null);
  const tokenWrapRef = React.useRef<HTMLDivElement>(null);
  const contentWrapperRef = React.useRef<HTMLDivElement>(null);

  // Parallax Atmosphere Background Elements
  const dotGridRef = React.useRef<HTMLDivElement>(null);
  const blueGlowRef = React.useRef<HTMLDivElement>(null);
  const violetGlowRef = React.useRef<HTMLDivElement>(null);
  const cyanGlowRef = React.useRef<HTMLDivElement>(null);

  // 1. GSAP Hero Entrance Animation (Order: Headline -> Description -> CTAs -> Token)
  React.useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set([headlineLine1Ref.current, headlineLine2Ref.current, copyRef.current, ctaPrimaryRef.current, ctaSecondaryRef.current, tokenWrapRef.current], {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          scale: 1,
        });
        return;
      }

      // Initial hidden states
      gsap.set([headlineLine1Ref.current, headlineLine2Ref.current], {
        opacity: 0,
        y: 60,
        filter: "blur(12px)",
      });
      gsap.set(copyRef.current, { opacity: 0, y: 30, filter: "blur(6px)" });
      gsap.set(ctaPrimaryRef.current, { opacity: 0, y: 22 });
      gsap.set(ctaSecondaryRef.current, { opacity: 0, y: 22 });
      gsap.set(tokenWrapRef.current, { opacity: 0, y: 44, scale: 0.95 });

      // Entrance timeline
      const tl = gsap.timeline({ delay: 0.2 });

      tl.to(headlineLine1Ref.current, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power3.out",
      })
        .to(
          headlineLine2Ref.current,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.7"
        )
        .to(
          copyRef.current,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.75,
            ease: "power3.out",
          },
          "-=0.6"
        )
        .to(
          ctaPrimaryRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.5"
        )
        .to(
          ctaSecondaryRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.5"
        )
        .to(
          tokenWrapRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            ease: "power3.out",
          },
          "-=0.4"
        );
    }, heroRef);

    return () => ctx.revert();
  }, [isLoaded]);

  // 2. GSAP ScrollTrigger Hero Transformation & Parallax Atmosphere
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero Content Scroll Scrub (Headline y: 0 -> -100px, scale: 1 -> 0.92, opacity: 1 -> 0.35)
      if (contentWrapperRef.current) {
        gsap.to(contentWrapperRef.current, {
          y: -100,
          scale: 0.92,
          opacity: 0.35,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      // Security Token visualization scroll scrub (moves toward center, rotates slightly, scales)
      if (tokenWrapRef.current) {
        gsap.to(tokenWrapRef.current, {
          y: -60,
          scale: 1.05,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      // Parallax Atmosphere Background: Dot Grid (y: 0 -> -80px)
      if (dotGridRef.current) {
        gsap.to(dotGridRef.current, {
          y: -80,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      // Ambient Blue Glow (y: 0 -> -180px, expands scale)
      if (blueGlowRef.current) {
        gsap.to(blueGlowRef.current, {
          y: -180,
          scale: 1.25,
          opacity: 0.6,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      // Violet Glow (y: 0 -> -120px)
      if (violetGlowRef.current) {
        gsap.to(violetGlowRef.current, {
          y: -120,
          scale: 1.15,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      // Cyan Glow field
      if (cyanGlowRef.current) {
        gsap.to(cyanGlowRef.current, {
          y: -150,
          scale: 1.2,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Micro-interaction: Primary CTA magnetic pull & scale 1 -> 1.03
  const handlePrimaryMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { scale: 1.03, duration: 0.25, ease: "power2.out" });
  };

  const handlePrimaryMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15; // ~4-6px
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    gsap.to(e.currentTarget, { x, y, duration: 0.2, ease: "power2.out" });
  };

  const handlePrimaryMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { scale: 1, x: 0, y: 0, duration: 0.35, ease: "power2.out" });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-start pt-32 sm:pt-36 lg:pt-40 pb-32 sm:pb-44 px-6 overflow-hidden bg-gradient-to-b from-[#02040a] via-[#030712] to-zinc-950"
    >
      {/* 1. Parallax Atmosphere: Continuous Technical Dot Grid */}
      <div
        ref={dotGridRef}
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none will-change-transform z-0"
      />

      {/* 2. Parallax Atmosphere: Multi-Speed Blur Light Fields */}
      <div
        ref={cyanGlowRef}
        aria-hidden="true"
        className="absolute -bottom-20 -left-36 w-[560px] sm:w-[760px] h-[480px] rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/25 to-indigo-600/15 blur-[120px] pointer-events-none opacity-40 mix-blend-screen will-change-transform z-0"
      />
      <div
        ref={violetGlowRef}
        aria-hidden="true"
        className="absolute -bottom-24 -right-36 w-[540px] sm:w-[740px] h-[460px] rounded-full bg-gradient-to-tl from-violet-600/20 via-indigo-600/20 to-blue-600/15 blur-[130px] pointer-events-none opacity-35 mix-blend-screen will-change-transform z-0"
      />
      <div
        ref={blueGlowRef}
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[420px] rounded-full bg-blue-600/15 blur-[130px] pointer-events-none opacity-40 will-change-transform z-0"
      />

      {/* 3. Interactive Technical Particle Field Canvas */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <ParticleField heroRef={heroRef} />
      </div>

      {/* 4. Seamless Bottom Gradient Dissolve (Zero-seam blend into Security Pillars) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-48 sm:h-72 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent pointer-events-none z-[5]"
      />

      {/* 5. Main Hero Content Wrapper (Controlled by GSAP ScrollTrigger) */}
      <div
        ref={contentWrapperRef}
        className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center will-change-transform"
      >
        {/* Headline: "Zero-Proxy Attendance." (Split lines with GSAP blur + y entrance) */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[6.8rem] xl:text-[7.8rem] font-medium tracking-[-0.035em] text-white leading-[0.98] mb-7 max-w-5xl flex flex-col items-center">
          <span ref={headlineLine1Ref} className="block bg-gradient-to-b from-white via-white to-zinc-300 bg-clip-text text-transparent will-change-transform">
            Zero-Proxy
          </span>
          <span ref={headlineLine2Ref} className="block bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent will-change-transform">
            Attendance.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p
          ref={copyRef}
          className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-9 will-change-transform"
        >
          Secure your campus perimeter with cryptographic QR challenges and hardware-bound device verification.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 mb-12 sm:mb-14">
          <a
            ref={ctaPrimaryRef}
            href={destinationHref}
            onMouseEnter={handlePrimaryMouseEnter}
            onMouseMove={handlePrimaryMouseMove}
            onMouseLeave={handlePrimaryMouseLeave}
            className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold tracking-wide shadow-[0_0_28px_rgba(37,99,235,0.4)] transition-colors inline-flex items-center justify-center will-change-transform"
          >
            <span>Launch Command Center</span>
          </a>

          <a
            ref={ctaSecondaryRef}
            href="#security"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group py-2 will-change-transform"
          >
            <span>Explore Security Pillars</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all duration-200" />
          </a>
        </div>

        {/* Security Token Visualization (Anchor for Hero/Security transition) */}
        <div ref={tokenWrapRef} className="w-full pt-2 will-change-transform">
          <SecurityToken mode="crypto" isHero={true} />
        </div>
      </div>
    </section>
  );
}

export { Hero as HeroSection };
