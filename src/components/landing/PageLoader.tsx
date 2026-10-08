"use client";

import * as React from "react";
import { gsap } from "@/lib/gsap";
import { Shield } from "lucide-react";

interface PageLoaderProps {
  onComplete: () => void;
}

export function PageLoader({ onComplete }: PageLoaderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const logoRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const counterRef = React.useRef<HTMLSpanElement>(null);
  const progressLineRef = React.useRef<HTMLDivElement>(null);
  const dotsRef = React.useRef<HTMLDivElement>(null);
  const glowRef = React.useRef<HTMLDivElement>(null);
  const counterWrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const ctx = gsap.context(() => {
      const counterObj = { val: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        },
      });

      // Initial state
      gsap.set(logoRef.current, { scale: 0.96, opacity: 0 });
      gsap.set(textRef.current, { opacity: 0, y: 8 });
      gsap.set(counterWrapperRef.current, { opacity: 0 });
      gsap.set(progressLineRef.current, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.8 });
      gsap.set(dotsRef.current, { opacity: 0 });

      // Step 1: Ambient glow and background dots emerge
      tl.to(glowRef.current, { opacity: 0.45, scale: 1, duration: 1.2, ease: "power2.out" }, 0.1)
        .to(dotsRef.current, { opacity: 0.5, duration: 1.0, ease: "power2.out" }, 0.2)
        // Step 2: Logo and subtitle fade in with gentle scale 0.96 -> 1
        .to(logoRef.current, { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out" }, 0.2)
        .to(textRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0.35)
        .to(counterWrapperRef.current, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.4)
        // Step 3: Progress counter 00 -> 100 & progress line scaleX 0 -> 1
        .to(
          counterObj,
          {
            val: 100,
            duration: 1.6,
            ease: "power2.inOut",
            onUpdate: () => {
              if (counterRef.current) {
                const rounded = Math.round(counterObj.val);
                counterRef.current.textContent = rounded < 10 ? `0${rounded}` : `${rounded}`;
              }
            },
          },
          0.4
        )
        .to(
          progressLineRef.current,
          {
            scaleX: 1,
            duration: 1.6,
            ease: "power2.inOut",
          },
          0.4
        )
        // Step 4: Loading reaches 100 -> percentage fades out & progress line collapses
        .to(counterWrapperRef.current, { opacity: 0, y: -6, duration: 0.35, ease: "power2.in" }, "+=0.15")
        .to(progressLineRef.current, { scaleX: 0, transformOrigin: "right center", duration: 0.35, ease: "power2.in" }, "<")
        // Step 5: Logo moves slightly upward & loader layer dissolves
        .to(logoRef.current, { y: -24, opacity: 0, duration: 0.55, ease: "power3.inOut" }, "-=0.1")
        .to(textRef.current, { y: -18, opacity: 0, duration: 0.45, ease: "power3.inOut" }, "<")
        .to(containerRef.current, {
          opacity: 0,
          duration: 0.75,
          ease: "power2.inOut",
          pointerEvents: "none",
        }, "-=0.25");
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#02040a] text-zinc-100 select-none overflow-hidden"
    >
      {/* Ambient Blue/Cyan Glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute w-[440px] sm:w-[580px] h-[340px] rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-600/30 to-indigo-600/20 blur-[110px] pointer-events-none"
      />

      {/* Tiny Background Dots Grid */}
      <div
        ref={dotsRef}
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
      />

      {/* Center Initialization Chassis */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* AttendGuard Logo & Name */}
        <div ref={logoRef} className="flex items-center gap-3 mb-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Shield className="h-4.5 w-4.5 stroke-[1.8]" />
          </div>
          <span className="text-xl sm:text-2xl font-medium tracking-tight text-white font-sans">
            ATTENDGUARD
          </span>
        </div>

        {/* Subtitle */}
        <p
          ref={textRef}
          className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.28em] text-zinc-400 mb-8"
        >
          SECURE ATTENDANCE INFRASTRUCTURE
        </p>

        {/* Progress Bar Line */}
        <div className="w-56 sm:w-64 h-[2px] bg-white/[0.08] rounded-full overflow-hidden mb-4 relative">
          <div
            ref={progressLineRef}
            className="w-full h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
          />
        </div>

        {/* Percentage Counter */}
        <div ref={counterWrapperRef} className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
          <span className="text-zinc-500 text-[10px]">INITIALIZING</span>
          <span className="text-blue-400 font-semibold w-7 text-right">
            <span ref={counterRef}>00</span>%
          </span>
        </div>
      </div>
    </div>
  );
}
