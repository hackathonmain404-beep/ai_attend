"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Smartphone } from "lucide-react";
import { StudentScanner } from "@/components/student/StudentScanner";

export default function StudentScannerPage() {
  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Command Center Page Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-zinc-800/60">
        <div className="space-y-3 max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              QR TELEMETRY
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              ATTENDANCE CHECK-IN
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Dynamic QR Scanner
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Align classroom display token inside targeting crosshairs to record verified hardware-coupled presence.
          </p>
        </div>

        {/* Right Breadcrumb & Compliance Tag */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO COMMAND CENTER</span>
          </Link>

          <div className="px-3 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>HMAC-SHA256 SECURED</span>
          </div>
        </div>
      </div>

      {/* 2. Main Scanner Body */}
      <section className="flex flex-col items-center justify-center">
        <StudentScanner />
      </section>

      {/* 3. Security Perimeter Guidance Strip */}
      <div className="max-w-2xl mx-auto w-full p-4 rounded-xl border border-zinc-800/80 bg-[#0B0D10] text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2 transition-all duration-300 hover:border-blue-500/30 shadow-lg">
        <Smartphone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
        <span>Hardware bound to student profile • Ensure active institutional perimeter connection</span>
      </div>
    </div>
  );
}
