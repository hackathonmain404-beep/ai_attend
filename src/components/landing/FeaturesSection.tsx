"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Calculator, Sparkles, FileSpreadsheet, Lock } from "lucide-react";
import { fadeUpVariants } from "@/lib/motion";

interface Feature {
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FEATURES: Feature[] = [
  {
    title: "Random In-Class Re-Verification",
    tagline: "Defeats 'Scan & Ditch' Fraud",
    description: "Faculty can trigger an unannounced 60-second presence challenge mid-lecture. Absent students who scanned and left are flagged automatically.",
    icon: ShieldAlert,
  },
  {
    title: "Deterministic 75% Margin Engine",
    tagline: "Zero Hallucination Buffer",
    description: "Precise mathematical margin tracking computes exactly how many classes students can safely miss or must attend to meet academic regulations.",
    icon: Calculator,
  },
  {
    title: "Grounded AI Attendance Advisor",
    tagline: "Academic Policy Intelligence",
    description: "Deterministic calculations ground our Gemini AI advisor, providing certified policy explanations without risk of computational hallucination.",
    icon: Sparkles,
  },
  {
    title: "RFC-4180 Audit-Ready Exports",
    tagline: "Administrative Compliance",
    description: "Generate timestamped, tamper-evident attendance ledger exports ready for university registrars and academic accreditation bodies.",
    icon: FileSpreadsheet,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 px-6 max-w-6xl mx-auto scroll-mt-20">
      {/* Section Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="max-w-2xl mb-16 text-left"
      >
        <p className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold mb-3">
          CAMPUS PLATFORM CAPABILITIES
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
          Engineered for Academic Integrity.
        </h2>
        <p className="text-zinc-400 text-base leading-relaxed font-normal">
          Built to scale effortlessly across lecture halls, laboratory sections, and multi-department university faculties.
        </p>
      </motion.div>

      {/* Grid of 4 Minimalist Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {FEATURES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="p-6 sm:p-7 rounded-2xl bg-zinc-950/70 border border-zinc-850 hover:border-zinc-750 transition-colors group text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 border border-zinc-850 px-2 py-0.5 rounded-full">
                  {item.tagline}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white tracking-tight mb-2 group-hover:text-zinc-100 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
