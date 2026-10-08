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
    <section className="relative py-36 px-6 overflow-hidden flex flex-col items-center justify-center text-center z-10">
      {/* Soft Center Atmospheric Light */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-gradient-to-r from-blue-600/20 via-indigo-500/15 to-cyan-500/20 rounded-full pointer-events-none blur-3xl opacity-60"
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Large Statement Headline */}
        <motion.h2
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-[-0.03em] text-white leading-[1.05] mb-6"
        >
          <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
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
          className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-10"
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
            className="px-8 py-4 text-sm font-semibold tracking-wide shadow-[0_0_32px_rgba(37,99,235,0.4)]"
            ariaLabel="Launch Command Center"
          >
            <span>Launch Command Center</span>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
