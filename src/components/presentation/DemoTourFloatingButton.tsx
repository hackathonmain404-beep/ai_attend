"use client";

import * as React from "react";
import { Compass, Sparkles } from "lucide-react";
import { DemoTourGuideModal } from "./DemoTourGuideModal";

export function DemoTourFloatingButton() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  // Shortcut listener: Shift + D opens the demo tour
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + D or Alt + D
      if ((e.shiftKey || e.altKey) && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating HUD Launcher with 3D Gyro Aura */}
      <aside aria-label="Demo tour launcher" className="fixed bottom-5 right-5 z-40 group" style={{ perspective: "600px" }}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 border border-emerald-500/40 text-slate-100 shadow-2xl shadow-emerald-950/70 hover:bg-slate-800/90 hover:border-emerald-400 hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-md transform-gpu"
          title="Open Hackathon Demo Tour Guide (Shift + D)"
          aria-label="Open Hackathon Judge Demo Tour"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* 3D Orbit Ring */}
          <div className="relative" style={{ transform: "translateZ(15px)" }}>
            <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all duration-300">
              <Compass className="h-4 w-4 animate-spin-slow group-hover:[animation-duration:6s]" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col text-left" style={{ transform: "translateZ(10px)" }}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Judge Demo Tour
              </span>
              <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              6-Step Walkthrough • Shift+D
            </span>
          </div>
        </button>
      </aside>

      {/* Tour Guide Modal */}
      <DemoTourGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
