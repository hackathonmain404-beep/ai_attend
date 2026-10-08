"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SecurityToken } from "@/components/landing/SecurityToken";
import { fadeUpVariants } from "@/lib/motion";

interface HeroProps {
  destinationHref: string;
}

export function Hero({ destinationHref }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-28 pb-16 px-6 overflow-hidden">
      {/* Very Subtle Ambient Radial Electric Blue Glow (Extremely Restrained) */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[360px] sm:h-[480px] bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.09),_transparent_72%)] pointer-events-none select-none blur-2xl"
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Security Badge Pill */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-mono tracking-wide mb-8 shadow-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>ZERO-TRUST ATTENDANCE ARCHITECTURE</span>
        </motion.div>

        {/* Enormous Geometric Sans Headline */}
        <motion.h1
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-white leading-[1.06] mb-6"
        >
          <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Zero-Proxy Attendance.
          </span>
        </motion.h1>

        {/* Narrow, Highly Readable Supporting Copy */}
        <motion.p
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-10"
        >
          Secure your campus perimeter with cryptographic QR challenges and hardware-bound device verification.
        </motion.p>

        {/* Single Primary CTA + Subtle Secondary Action */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 mb-16"
        >
          <MagneticButton
            href={destinationHref}
            variant="primary"
            maxOffset={7}
            className="px-7 py-3.5 text-sm font-semibold tracking-wide"
            ariaLabel="Launch Command Center"
          >
            <span>Launch Command Center</span>
          </MagneticButton>

          <a
            href="#security"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 group py-2"
          >
            <span>Explore Security Pillars</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all duration-200" />
          </a>
        </motion.div>

        {/* Section 2: Interactive Security Visual Beneath Hero */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="w-full pt-4"
        >
          <SecurityToken />
        </motion.div>
      </div>
    </section>
  );
}
