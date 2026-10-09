"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface HeroProps {
  destinationHref: string;
  isLoaded?: boolean;
}

export function Hero({ destinationHref, isLoaded = true }: HeroProps) {
  const heroRef = React.useRef<HTMLElement>(null);
  const headlineRef = React.useRef<HTMLHeadingElement>(null);
  const copyRef = React.useRef<HTMLParagraphElement>(null);
  const ctaPrimaryRef = React.useRef<HTMLAnchorElement>(null);
  const ctaSecondaryRef = React.useRef<HTMLAnchorElement>(null);
  const contentWrapperRef = React.useRef<HTMLDivElement>(null);

  // Parallax Atmosphere Background Elements
  const blueGlowRef = React.useRef<HTMLDivElement>(null);
  const violetGlowRef = React.useRef<HTMLDivElement>(null);
  const cyanGlowRef = React.useRef<HTMLDivElement>(null);

  // 1. GSAP Hero Entrance Animation (Order: Headline Words -> Description -> CTAs)
  React.useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(
          [
            headlineRef.current,
            copyRef.current,
            ctaPrimaryRef.current,
            ctaSecondaryRef.current,
          ],
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scale: 1,
          }
        );
        const headlineWords = headlineRef.current?.querySelectorAll(".hero-headline-word");
        if (headlineWords) {
          gsap.set(headlineWords, { opacity: 1, y: 0, filter: "blur(0px)" });
        }
        return;
      }

      // Initial hidden states
      const headlineWords = headlineRef.current?.querySelectorAll(".hero-headline-word");
      if (headlineWords && headlineWords.length > 0) {
        gsap.set(headlineWords, { opacity: 0, y: 35, filter: "blur(8px)" });
      } else {
        gsap.set(headlineRef.current, { opacity: 0, y: 35, filter: "blur(8px)" });
      }
      gsap.set(copyRef.current, { opacity: 0, y: 22, filter: "blur(4px)" });
      gsap.set(ctaPrimaryRef.current, { opacity: 0, y: 16, scale: 0.95 });
      gsap.set(ctaSecondaryRef.current, { opacity: 0, y: 16 });

      // Entrance timeline
      const tl = gsap.timeline({ delay: 0.12 });

      if (headlineWords && headlineWords.length > 0) {
        tl.to(
          headlineWords,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.85,
            stagger: 0.15,
            ease: "power3.out",
          }
        );
      } else {
        tl.to(
          headlineRef.current,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
          }
        );
      }

      tl.to(
        copyRef.current,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "power3.out",
        },
        "-=0.45"
      )
        .to(
          ctaPrimaryRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
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
          "-=0.35"
        );

      // Subtle atmospheric light breathing drift on pointer devices
      if (blueGlowRef.current) {
        gsap.to(blueGlowRef.current, {
          y: "+=22",
          scale: 1.08,
          duration: 6.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (cyanGlowRef.current) {
        gsap.to(cyanGlowRef.current, {
          x: "+=18",
          y: "-=14",
          scale: 1.05,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (violetGlowRef.current) {
        gsap.to(violetGlowRef.current, {
          x: "-=18",
          y: "+=14",
          scale: 1.06,
          duration: 7.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
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

    // Desktop Parallax and Scrub: keep content opacity 1.0 so hero is never dimmed or lagged on return
    mm.add("(min-width: 1024px)", () => {
      if (contentWrapperRef.current) {
        gsap.to(contentWrapperRef.current, {
          y: -60,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }
    });

    // Mobile / Tablet: subtle translation without opacity reduction
    mm.add("(max-width: 1023px)", () => {
      if (contentWrapperRef.current) {
        gsap.to(contentWrapperRef.current, {
          y: -25,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }
    });

    return () => mm.revert();
  }, [isLoaded]);

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
      className="relative min-h-screen flex flex-col items-center justify-center pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 bg-transparent"
    >
      {/* Atmosphere: Continuous Multi-Speed Blur Light Fields without edge clipping */}
      <div
        ref={cyanGlowRef}
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[320px] sm:w-[680px] h-[300px] sm:h-[460px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-indigo-600/10 blur-[80px] sm:blur-[120px] pointer-events-none opacity-30 sm:opacity-40 mix-blend-screen will-change-transform z-0"
      />
      <div
        ref={violetGlowRef}
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-[300px] sm:w-[660px] h-[280px] sm:h-[440px] rounded-full bg-gradient-to-tl from-violet-600/15 via-indigo-600/10 to-blue-600/10 blur-[80px] sm:blur-[130px] pointer-events-none opacity-25 sm:opacity-35 mix-blend-screen will-change-transform z-0"
      />
      <div
        ref={blueGlowRef}
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[680px] h-[260px] sm:h-[420px] rounded-full bg-blue-600/15 blur-[90px] sm:blur-[130px] pointer-events-none opacity-35 sm:opacity-40 will-change-transform z-0"
      />

      {/* 5. Main Hero Content Wrapper - Centered */}
      <div
        ref={contentWrapperRef}
        className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center justify-center w-full will-change-transform my-auto"
      >
        {/* Large Headline: "Zero-Proxy Attendance." (Fluid clamp, no hard breaks) */}
        <h1
          ref={headlineRef}
          className="text-[clamp(2.7rem,10.5vw,4.5rem)] sm:text-7xl md:text-8xl lg:text-[6.8rem] font-medium tracking-tight text-white leading-[0.98] mb-5 sm:mb-6 max-w-4xl will-change-transform text-center mx-auto"
        >
          <span className="sr-only">Zero-Proxy Attendance.</span>
          <span
            aria-hidden="true"
            className="bg-gradient-to-b from-white via-white to-zinc-300 bg-clip-text text-transparent inline-flex flex-wrap justify-center items-center text-center gap-x-3 sm:gap-x-5"
          >
            <span className="hero-headline-word inline-block will-change-transform text-center">Zero-Proxy</span>
            <span className="hero-headline-word inline-block will-change-transform text-center">Attendance.</span>
          </span>
        </h1>

        {/* Step 4: Supporting Description */}
        <p
          ref={copyRef}
          className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto text-center leading-relaxed font-normal mb-8 sm:mb-10 px-2 will-change-transform"
        >
          Secure your campus perimeter with cryptographic QR challenges and hardware-bound device verification.
        </p>

        {/* Action CTAs - Centered */}
        <div className="w-full max-w-md sm:max-w-none flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 px-2 mx-auto">
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
      </div>
    </section>
  );
}

export { Hero as HeroSection };
