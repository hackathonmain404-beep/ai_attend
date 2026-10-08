"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { AttendanceSecurityCore } from "@/components/landing/AttendanceSecurityCore";
import { fadeUpVariants } from "@/lib/motion";

interface HeroProps {
  destinationHref: string;
}

export function Hero({ destinationHref }: HeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 sm:pt-36 lg:pt-40 pb-24 px-6 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Oversized Stitch-Inspired Geometric Sans Headline */}
        <motion.h1
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[6.8rem] xl:text-[7.8rem] font-medium tracking-[-0.035em] text-white leading-[0.98] mb-7 max-w-5xl"
        >
          <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Zero-Proxy Attendance.
          </span>
        </motion.h1>

        {/* Narrow, Highly Readable Supporting Copy */}
        <motion.p
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-9"
        >
          Secure your campus perimeter with cryptographic QR challenges and hardware-bound device verification.
        </motion.p>

        {/* Primary CTA + Subtle Secondary Action */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.2}
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
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group py-2"
          >
            <span>Explore Security Pillars</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all duration-200" />
          </a>
        </motion.div>

        {/* Lower Composition: Attendance Security Core Visual */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.35}
          className="w-full pt-2"
        >
          <AttendanceSecurityCore />
        </motion.div>
      </div>
    </section>
  );
}
