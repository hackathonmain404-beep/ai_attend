"use client";

import * as React from "react";
import {
  CheckCircle2,
  Scan,
  AlertTriangle,
  Users,
  Sun,
  Maximize,
  Minimize,
} from "lucide-react";
import { FramingEvaluation, FaceFramingStatus } from "./types";

interface FaceGuideProps {
  evaluation: FramingEvaluation;
  isStreaming: boolean;
  className?: string;
}

export function FaceGuide({ evaluation, isStreaming, className = "" }: FaceGuideProps) {
  const { status, message, score } = evaluation;

  // Determine accent color theme based on framing status
  const getTheme = (st: FaceFramingStatus) => {
    switch (st) {
      case "good":
        return {
          stroke: "#00F0FF",
          border: "border-cyan-400",
          glow: "shadow-[0_0_25px_rgba(0,240,255,0.35)]",
          badgeBg: "bg-cyan-500/10 border-cyan-500/40 text-cyan-300",
          icon: CheckCircle2,
          iconColor: "text-cyan-400",
        };
      case "too_close":
        return {
          stroke: "#F59E0B",
          border: "border-amber-400",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
          badgeBg: "bg-amber-500/10 border-amber-500/40 text-amber-300",
          icon: Minimize,
          iconColor: "text-amber-400",
        };
      case "too_far":
        return {
          stroke: "#F59E0B",
          border: "border-amber-400",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
          badgeBg: "bg-amber-500/10 border-amber-500/40 text-amber-300",
          icon: Maximize,
          iconColor: "text-amber-400",
        };
      case "poor_lighting":
        return {
          stroke: "#F59E0B",
          border: "border-amber-400",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
          badgeBg: "bg-amber-500/10 border-amber-500/40 text-amber-300",
          icon: Sun,
          iconColor: "text-amber-400",
        };
      case "multiple_faces":
        return {
          stroke: "#EF4444",
          border: "border-rose-400",
          glow: "shadow-[0_0_25px_rgba(239,68,68,0.35)]",
          badgeBg: "bg-rose-500/10 border-rose-500/40 text-rose-300",
          icon: Users,
          iconColor: "text-rose-400",
        };
      case "no_face":
      default:
        return {
          stroke: "#38BDF8",
          border: "border-sky-400/50",
          glow: "shadow-[0_0_15px_rgba(56,189,248,0.15)]",
          badgeBg: "bg-slate-900/80 border-slate-700/60 text-slate-300",
          icon: Scan,
          iconColor: "text-sky-400",
        };
    }
  };

  const theme = getTheme(status);
  const StatusIcon = theme.icon;

  if (!isStreaming) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none ${className}`}
      aria-live="polite"
    >
      {/* 1. Top HUD Telemetry Marquee */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-400/80">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "good" ? "bg-cyan-400" : "bg-sky-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status === "good" ? "bg-cyan-500" : "bg-sky-500"
              }`}
            />
          </span>
          <span className="uppercase text-[10px] text-slate-300 font-semibold">
            {status === "good" ? "Target Locked" : "Optical Tracking"}
          </span>
        </div>

        {score > 0 && (
          <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">QUALITY</span>
            <span
              className={`text-[10px] font-bold ${
                score >= 75 ? "text-cyan-400" : score >= 50 ? "text-amber-400" : "text-slate-400"
              }`}
            >
              {score}%
            </span>
          </div>
        )}
      </div>

      {/* 2. Biometric Facial Oval Reticle & Corner Brackets */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] my-auto flex items-center justify-center">
        {/* Corner Targeting Brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm transition-colors duration-300" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm transition-colors duration-300" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm transition-colors duration-300" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm transition-colors duration-300" />

        {/* SVG Oval Guide with Dynamic Scanner Line */}
        <svg
          viewBox="0 0 240 320"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Outer Frame Ring */}
          <ellipse
            cx="120"
            cy="160"
            rx="98"
            ry="132"
            stroke={theme.stroke}
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="opacity-40 transition-colors duration-300"
          />

          {/* Primary Biometric Target Oval */}
          <ellipse
            cx="120"
            cy="160"
            rx="90"
            ry="120"
            stroke={theme.stroke}
            strokeWidth="2.5"
            className={`transition-colors duration-300 ${
              status === "good" ? "animate-pulse" : ""
            }`}
          />

          {/* Subtle Facial Proportion Landmarks Guide */}
          <g opacity="0.35" stroke={theme.stroke} strokeWidth="1">
            {/* Eye Line Guide */}
            <line x1="75" y1="135" x2="165" y2="135" strokeDasharray="3 3" />
            {/* Center Vertical Axis */}
            <line x1="120" y1="80" x2="120" y2="240" strokeDasharray="3 3" />
            {/* Mouth / Chin Baseline */}
            <line x1="90" y1="210" x2="150" y2="210" strokeDasharray="2 2" />
          </g>

          {/* Animated Scanning Laser Beam */}
          {status !== "good" && (
            <line
              x1="35"
              y1="160"
              x2="205"
              y2="160"
              stroke="#00F0FF"
              strokeWidth="1.5"
              className="animate-[pulse_1.5s_ease-in-out_infinite]"
              opacity="0.8"
            />
          )}
        </svg>
      </div>

      {/* 3. Bottom Live Guidance Telemetry Banner */}
      <div className="w-full flex justify-center pb-2">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border text-xs sm:text-sm font-medium transition-all duration-300 shadow-lg ${theme.badgeBg}`}
        >
          <StatusIcon className={`w-4 h-4 shrink-0 ${theme.iconColor}`} />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
