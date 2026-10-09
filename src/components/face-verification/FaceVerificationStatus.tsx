"use client";

import * as React from "react";
import {
  ShieldCheck,
  Lock,
  Sun,
  Eye,
  ScanFace,
  Info,
} from "lucide-react";
import { FramingEvaluation } from "./types";

interface FaceVerificationStatusProps {
  evaluation?: FramingEvaluation;
  isCaptured?: boolean;
  className?: string;
}

export function FaceVerificationStatus({
  evaluation,
  isCaptured = false,
  className = "",
}: FaceVerificationStatusProps) {
  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* 1. Privacy Guarantee Badge */}
      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
        <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="leading-tight">
          <strong className="text-slate-200 font-medium">Privacy Guaranteed:</strong> Zero raw images stored on server. Captured frames are processed in-memory and never saved to disk or permanent storage.
        </span>
      </div>

      {/* 2. Three Step Framing Checkpoints */}
      {!isCaptured && (
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <ScanFace className="w-4 h-4 text-cyan-400/80" />
            <span className="leading-tight">Center Face in Oval</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <Sun className="w-4 h-4 text-cyan-400/80" />
            <span className="leading-tight">Adequate Lighting</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <Eye className="w-4 h-4 text-cyan-400/80" />
            <span className="leading-tight">Eyes Visible</span>
          </div>
        </div>
      )}
    </div>
  );
}
