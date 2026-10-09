"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AtmosphericBackground() {
  const shouldReduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number } | null>(null);
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Only enable interactive cursor on pointer devices
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia("(pointer: fine)").matches);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);

    if (shouldReduceMotion) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setMousePos({ x: targetX, y: targetY });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", checkDesktop);
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafId);
    };
  }, [shouldReduceMotion]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden bg-[#02040a]"
    >
      {/* 1. Lower-Left Atmospheric Aurora Light Wave (Cyan -> Electric Blue -> Indigo) */}
      <div
        className={`absolute -bottom-24 -left-36 w-[560px] sm:w-[780px] lg:w-[940px] h-[520px] sm:h-[680px] lg:h-[820px] rounded-[48%] pointer-events-none opacity-45 sm:opacity-55 blur-[90px] sm:blur-[130px] mix-blend-screen ${
          shouldReduceMotion ? "" : "animate-aurora-left"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at 35% 65%, rgba(6,182,212,0.85) 0%, rgba(37,99,235,0.75) 42%, rgba(99,102,241,0.55) 70%, transparent 85%)",
        }}
      />

      {/* 2. Lower-Right Atmospheric Aurora Light Wave (Violet -> Electric Blue -> Sky) */}
      <div
        className={`absolute -bottom-32 -right-32 w-[520px] sm:w-[720px] lg:w-[880px] h-[500px] sm:h-[660px] lg:h-[800px] rounded-[52%] pointer-events-none opacity-40 sm:opacity-50 blur-[95px] sm:blur-[140px] mix-blend-screen ${
          shouldReduceMotion ? "" : "animate-aurora-right"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at 65% 60%, rgba(139,92,246,0.85) 0%, rgba(99,102,241,0.72) 40%, rgba(37,99,235,0.5) 68%, transparent 85%)",
        }}
      />

      {/* 3. Deep Center Horizon Ambience */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] lg:w-[1100px] h-[480px] rounded-full pointer-events-none opacity-30 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.35) 0%, rgba(99,102,241,0.18) 45%, transparent 75%)",
        }}
      />

      {/* 4. Stitch-Inspired Technical Dot Matrix Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.28] sm:opacity-[0.38] mix-blend-lighten"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.42) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 95% 90% at 50% 50%, black 35%, rgba(0, 0, 0, 0.4) 75%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 95% 90% at 50% 50%, black 35%, rgba(0, 0, 0, 0.4) 75%, transparent 100%)",
        }}
      />

      {/* 5. Subtle Interactive Cursor Spotlight (Brightens nearby dots on desktop) */}
      {isDesktop && mousePos && !shouldReduceMotion && (
        <motion.div
          className="absolute rounded-full pointer-events-none mix-blend-screen blur-xl"
          animate={{
            x: mousePos.x - 220,
            y: mousePos.y - 220,
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 220,
            mass: 0.1,
          }}
          style={{
            width: 440,
            height: 440,
            background:
              "radial-gradient(circle, rgba(56,189,248,0.16) 0%, rgba(99,102,241,0.08) 40%, transparent 70%)",
          }}
        />
      )}

      {/* 6. Subtle Vignette Edge Framing */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 60%, rgba(2,4,10,0.7) 100%)",
        }}
      />
    </div>
  );
}
