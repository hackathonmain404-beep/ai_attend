"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { fadeUpVariants } from "@/lib/motion";

interface FinalCTAProps {
  destinationHref: string;
}

export function FinalCTA({ destinationHref }: FinalCTAProps) {
  return (
    <section className="relative py-36 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
      {/* Barely-Visible Subtle Electric Blue Radial Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[650px] h-[350px] bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.08),_transparent_70%)] pointer-events-none select-none blur-3xl"
      />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        {/* Headline */}
        <motion.h2
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.1] mb-6"
        >
          <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Attendance should be verified, not assumed.
          </span>
        </motion.h2>

        {/* Supporting Text */}
        <motion.p
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.1}
          className="text-zinc-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed font-normal mb-10"
        >
          Build a campus attendance system that is fast for students and difficult to exploit.
        </motion.p>

        {/* Primary CTA */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.2}
        >
          <MagneticButton
            href={destinationHref}
            variant="primary"
            maxOffset={7}
            className="px-8 py-4 text-sm font-semibold tracking-wide"
            ariaLabel="Launch Command Center"
          >
            <span>Launch Command Center</span>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
