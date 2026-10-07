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
      {/* Floating HUD Launcher */}
      <aside aria-label="Demo tour launcher" className="fixed bottom-5 right-5 z-40 group">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-slate-900/95 border border-emerald-500/40 text-slate-100 shadow-2xl shadow-emerald-950/60 hover:bg-slate-800 hover:border-emerald-400/70 hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-md"
          title="Open Hackathon Demo Tour Guide (Shift + D)"
          aria-label="Open Hackathon Judge Demo Tour"
        >
          <div className="relative">
            <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Compass className="h-4 w-4 animate-spin-slow" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Judge Demo Tour
              </span>
              <Sparkles className="h-3 w-3 text-emerald-400" />
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
