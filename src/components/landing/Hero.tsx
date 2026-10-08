"use client";

import * as React from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ParticleField } from "@/components/hero/ParticleField";
import { AttendanceToken } from "@/components/hero/AttendanceToken";
import { fadeUpVariants } from "@/lib/motion";

interface HeroProps {
  destinationHref: string;
}

export function Hero({ destinationHref }: HeroProps) {
  const heroRef = React.useRef<HTMLElement>(null);

  // Subtle 1-3px soft parallax for hero content
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 120, mass: 0.1 };
  const parallaxX = useSpring(mouseX, springConfig);
  const parallaxY = useSpring(mouseY, springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(relX * 6); // Max ~3px offset
    mouseY.set(relY * 6);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={heroRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-screen flex flex-col items-center justify-start pt-32 sm:pt-36 lg:pt-40 pb-24 px-6 overflow-hidden bg-[#030712] border-b border-zinc-900/80"
    >
      {/* 1. Scoped Hero Atmospheric Light Waves (Clipped strictly inside Hero) */}
      <div
        aria-hidden="true"
        className="absolute -bottom-28 -left-36 w-[560px] sm:w-[760px] h-[520px] rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-600/30 to-indigo-600/20 blur-[110px] pointer-events-none opacity-50 mix-blend-screen"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-36 w-[540px] sm:w-[740px] h-[500px] rounded-full bg-gradient-to-tl from-violet-600/25 via-indigo-600/25 to-blue-600/20 blur-[120px] pointer-events-none opacity-45 mix-blend-screen"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none opacity-40"
      />

      {/* 2. Scoped Interactive Particle Field Canvas (Contains mouse tracking inside Hero only) */}
      <ParticleField heroRef={heroRef} />

      {/* 3. Hero Content Composition with Subtle Soft Parallax */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center"
      >
        {/* Step 3: Oversized Display Typography */}
        <motion.h1
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[6.8rem] xl:text-[7.8rem] font-medium tracking-[-0.035em] text-white leading-[0.98] mb-7 max-w-5xl"
        >
          <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Zero-Proxy Attendance.
          </span>
        </motion.h1>

        {/* Step 4: Supporting Copy */}
        <motion.p
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-9"
        >
          Secure your campus perimeter with cryptographic QR challenges and hardware-bound device verification.
        </motion.p>

        {/* Step 5: Primary CTA + Subtle Secondary Action */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 mb-14"
        >
          <MagneticButton
            href={destinationHref}
            variant="primary"
            maxOffset={7}
            className="px-7 py-3.5 text-sm font-semibold tracking-wide shadow-[0_0_28px_rgba(37,99,235,0.4)]"
            ariaLabel="Launch Command Center"
          >
            <span>Launch Command Center</span>
          </MagneticButton>

          <a
            href="#security"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group py-2"
          >
            <span>Explore Security Pillars</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all duration-200" />
          </a>
        </motion.div>

        {/* Step 6: Interactive Attendance Security Token */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.45}
          className="w-full pt-1"
        >
          <AttendanceToken />
        </motion.div>
      </motion.div>
    </section>
  );
}

export { Hero as HeroSection };
