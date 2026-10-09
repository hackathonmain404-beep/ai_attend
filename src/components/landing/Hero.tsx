"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { SecurityToken } from "@/components/landing/SecurityToken";

interface HeroProps {
  destinationHref: string;
  isLoaded?: boolean;
}

export function Hero({ destinationHref, isLoaded = true }: HeroProps) {
  const heroRef = React.useRef<HTMLElement>(null);
  const statusBadgeRef = React.useRef<HTMLDivElement>(null);
  const headlineRef = React.useRef<HTMLHeadingElement>(null);
  const copyRef = React.useRef<HTMLParagraphElement>(null);
  const ctaPrimaryRef = React.useRef<HTMLAnchorElement>(null);
  const ctaSecondaryRef = React.useRef<HTMLAnchorElement>(null);
  const tokenWrapperRef = React.useRef<HTMLDivElement>(null);
  const contentWrapperRef = React.useRef<HTMLDivElement>(null);

  // Parallax Atmosphere Background Elements
  const dotGridRef = React.useRef<HTMLDivElement>(null);
  const blueGlowRef = React.useRef<HTMLDivElement>(null);
  const violetGlowRef = React.useRef<HTMLDivElement>(null);
  const cyanGlowRef = React.useRef<HTMLDivElement>(null);

  // 1. GSAP Hero Entrance Animation (Order: Status Badge -> Headline -> Description -> CTAs -> Token)
  React.useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(
          [
            statusBadgeRef.current,
            headlineRef.current,
            copyRef.current,
            ctaPrimaryRef.current,
            ctaSecondaryRef.current,
            tokenWrapperRef.current,
          ],
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scale: 1,
          }
        );
        return;
      }

      // Initial hidden states with shorter distances for mobile fluidity
      gsap.set(statusBadgeRef.current, { opacity: 0, y: -12 });
      gsap.set(headlineRef.current, { opacity: 0, y: 35, filter: "blur(8px)" });
      gsap.set(copyRef.current, { opacity: 0, y: 20, filter: "blur(4px)" });
      gsap.set(ctaPrimaryRef.current, { opacity: 0, y: 16 });
      gsap.set(ctaSecondaryRef.current, { opacity: 0, y: 16 });
      gsap.set(tokenWrapperRef.current, { opacity: 0, y: 28, scale: 0.96 });

      // Entrance timeline
      const tl = gsap.timeline({ delay: 0.15 });

      tl.to(statusBadgeRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      })
        .to(
          headlineRef.current,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.3"
        )
        .to(
          copyRef.current,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.65,
            ease: "power3.out",
          },
          "-=0.5"
        )
        .to(
          ctaPrimaryRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .to(
          ctaSecondaryRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .to(
          tokenWrapperRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.3"
        );
    }, heroRef);

    return () => ctx.revert();
  }, [isLoaded]);

  // 2. GSAP ScrollTrigger Hero Transformation & Parallax Atmosphere (Desktop & Mobile via matchMedia)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    // Desktop Parallax and Scrub
    mm.add("(min-width: 1024px)", () => {
      if (contentWrapperRef.current) {
        gsap.to(contentWrapperRef.current, {
          y: -80,
          scale: 0.95,
          opacity: 0.45,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      if (dotGridRef.current) {
        gsap.to(dotGridRef.current, {
          y: -70,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      if (blueGlowRef.current) {
        gsap.to(blueGlowRef.current, {
          y: -140,
          scale: 1.2,
          opacity: 0.5,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }
    });

    // Mobile / Tablet: subtle scroll fade without excessive travel distances
    mm.add("(max-width: 1023px)", () => {
      if (contentWrapperRef.current) {
        gsap.to(contentWrapperRef.current, {
          opacity: 0.7,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "center top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    });

    return () => mm.revert();
  }, []);

  // Micro-interaction: Primary CTA magnetic pull (only on fine pointer / desktop)
  const isFinePointer = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  };

  const handlePrimaryMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    gsap.to(e.currentTarget, { scale: 1.03, duration: 0.25, ease: "power2.out" });
  };

  const handlePrimaryMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    gsap.to(e.currentTarget, { x, y, duration: 0.2, ease: "power2.out" });
  };

  const handlePrimaryMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    gsap.to(e.currentTarget, { scale: 1, x: 0, y: 0, duration: 0.35, ease: "power2.out" });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-start pt-24 sm:pt-32 lg:pt-36 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-[#02040a] via-[#030712] to-zinc-950"
    >
      {/* 1. Parallax Atmosphere: Continuous Technical Dot Grid */}
      <div
        ref={dotGridRef}
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:24px_24px] sm:[background-size:28px_28px] pointer-events-none will-change-transform z-0"
      />

      {/* 2. Parallax Atmosphere: Multi-Speed Blur Light Fields (carefully bounded) */}
      <div
        ref={cyanGlowRef}
        aria-hidden="true"
        className="absolute -bottom-16 -left-24 sm:-left-36 w-[320px] sm:w-[680px] h-[300px] sm:h-[460px] rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-indigo-600/10 blur-[80px] sm:blur-[120px] pointer-events-none opacity-30 sm:opacity-40 mix-blend-screen will-change-transform z-0"
      />
      <div
        ref={violetGlowRef}
        aria-hidden="true"
        className="absolute -bottom-20 -right-24 sm:-right-36 w-[300px] sm:w-[660px] h-[280px] sm:h-[440px] rounded-full bg-gradient-to-tl from-violet-600/20 via-indigo-600/15 to-blue-600/10 blur-[80px] sm:blur-[130px] pointer-events-none opacity-25 sm:opacity-35 mix-blend-screen will-change-transform z-0"
      />
      <div
        ref={blueGlowRef}
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[640px] h-[260px] sm:h-[400px] rounded-full bg-blue-600/15 blur-[90px] sm:blur-[130px] pointer-events-none opacity-35 sm:opacity-40 will-change-transform z-0"
      />

      {/* 4. Seamless Bottom Gradient Dissolve */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-36 sm:h-64 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-[5]"
      />

      {/* 5. Main Hero Content Wrapper */}
      <div
        ref={contentWrapperRef}
        className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center w-full will-change-transform"
      >
        {/* Step 2: Small Security/Product Status Label */}
        <div
          ref={statusBadgeRef}
          className="inline-flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 mb-5 sm:mb-6 shadow-sm will-change-transform"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase">
            LIVE ZERO-TRUST PROTOCOL // ACTIVE PERIMETER
          </span>
        </div>

        {/* Step 3: Large Headline: "Zero-Proxy Attendance." (Fluid clamp, no hard breaks) */}
        <h1
          ref={headlineRef}
          className="text-[clamp(2.7rem,10.5vw,4.5rem)] sm:text-7xl md:text-8xl lg:text-[6.8rem] font-medium tracking-tight text-white leading-[0.98] mb-5 sm:mb-6 max-w-4xl will-change-transform"
        >
          <span className="bg-gradient-to-b from-white via-white to-zinc-300 bg-clip-text text-transparent">
            Zero-Proxy Attendance.
          </span>
        </h1>

        {/* Step 4: Supporting Description */}
        <p
          ref={copyRef}
          className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-8 sm:mb-9 px-2 will-change-transform"
        >
          Secure your campus perimeter with cryptographic QR challenges and hardware-bound device verification.
        </p>

        {/* Steps 5 & 6: Action CTAs (Vertical on narrow mobile, horizontal on wider screens) */}
        <div className="w-full max-w-md sm:max-w-none flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 mb-10 sm:mb-12 px-2">
          {/* Primary CTA */}
          <a
            ref={ctaPrimaryRef}
            href={destinationHref}
            onMouseEnter={handlePrimaryMouseEnter}
            onMouseMove={handlePrimaryMouseMove}
            onMouseLeave={handlePrimaryMouseLeave}
            className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] active:bg-blue-700 text-white text-sm font-semibold tracking-wide shadow-[0_0_28px_rgba(37,99,235,0.4)] transition-all inline-flex items-center justify-center will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <span>Launch Command Center</span>
          </a>

          {/* Secondary Action */}
          <a
            ref={ctaSecondaryRef}
            href="#security"
            className="w-full sm:w-auto min-h-[48px] sm:min-h-0 px-6 py-3 sm:py-2 rounded-full sm:rounded-none border border-white/[0.08] sm:border-transparent bg-white/[0.02] sm:bg-transparent text-sm font-medium text-zinc-400 hover:text-white transition-colors inline-flex items-center justify-center gap-2 group will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span>Explore Security Pillars</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all duration-200" />
          </a>
        </div>

        {/* Step 7: Interactive Security Token Visualization */}
        <div
          ref={tokenWrapperRef}
          className="w-full flex justify-center mt-2 px-2 will-change-transform"
        >
          <SecurityToken isHero={true} />
        </div>
      </div>
    </section>
  );
}

export { Hero as HeroSection };
