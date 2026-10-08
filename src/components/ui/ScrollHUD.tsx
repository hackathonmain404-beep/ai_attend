"use client";

import * as React from "react";
import { ArrowUp, Navigation2, Compass, Layers, ShieldCheck, ChevronUp } from "lucide-react";

interface SectionInfo {
  id: string;
  label: string;
  badge: string;
}

const SECTIONS: SectionInfo[] = [
  { id: "hero", label: "Overview", badge: "01" },
  { id: "personas", label: "Roles", badge: "02" },
  { id: "pillars", label: "4 Pillars", badge: "03" },
  { id: "lifecycle", label: "Defense Flow", badge: "04" },
  { id: "features", label: "Portal Hub", badge: "05" },
];

export function ScrollHUD() {
  const [scrollProgress, setScrollProgress] = React.useState<number>(0);
  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const [activeSection, setActiveSection] = React.useState<string>("hero");
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [scrollDirection, setScrollDirection] = React.useState<"up" | "down">("up");

  const lastScrollYRef = React.useRef<number>(0);

  React.useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalScroll =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = totalScroll > 0 ? Math.min(Math.max(scrollY / totalScroll, 0), 1) : 0;

      setScrollProgress(progress);
      setIsVisible(scrollY > 140);

      // Track scroll direction
      if (Math.abs(scrollY - lastScrollYRef.current) > 8) {
        setScrollDirection(scrollY > lastScrollYRef.current ? "down" : "up");
        lastScrollYRef.current = scrollY;
      }

      // Detect active section
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.42) {
            setActiveSection(SECTIONS[i].id);
            break;
          }
        }
      }
    };

    const throttledScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 75;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  // SVG Circular Gauge
  const size = 46;
  const strokeWidth = 3.2;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - scrollProgress * circumference;
  const percentText = Math.round(scrollProgress * 100);

  const activeSectionLabel =
    SECTIONS.find((s) => s.id === activeSection)?.label || "Overview";

  return (
    <aside
      aria-label="Scroll navigation HUD and section telemetry"
      className="fixed bottom-6 right-5 sm:bottom-8 sm:right-7 z-40 flex flex-col items-end gap-2.5"
    >
      {/* Quick Section Jump Navigator Popover */}
      <div
        className={`flex flex-col items-end gap-1.5 transition-all duration-300 origin-bottom-right ${
          isExpanded
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none translate-y-2 h-0 overflow-hidden"
        }`}
      >
        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 p-2.5 rounded-2xl shadow-2xl shadow-slate-950/80 flex flex-col gap-1 min-w-[170px] hud-border-emerald">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 pb-1.5 border-b border-slate-800/80 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Compass className="h-3 w-3 text-emerald-400 animate-spin-slow" />
              <span>Scroll Teleport</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono">{percentText}%</span>
          </div>

          <div className="space-y-0.5 pt-1">
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    scrollToSection(sec.id);
                    setIsExpanded(false);
                  }}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between font-medium group ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/90"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-400">
                      {sec.badge}
                    </span>
                    <span>{sec.label}</span>
                  </span>
                  {isActive ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ) : (
                    <Navigation2 className="h-2.5 w-2.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main HUD Dock Bar */}
      <div
        className={`flex items-center gap-2 transition-transform duration-300 ${
          scrollDirection === "down" && !isExpanded ? "translate-y-1 opacity-90 hover:opacity-100 hover:translate-y-0" : ""
        }`}
      >
        {/* Active Section Telemetry Capsule */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-slate-800/90 hover:border-emerald-500/50 text-[11px] font-medium text-slate-300 hover:text-emerald-300 transition-all backdrop-blur-xl shadow-xl shadow-slate-950/60 group"
          title="Toggle Quick Navigation Teleport"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="font-semibold text-slate-200">{activeSectionLabel}</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-emerald-400 font-bold">{percentText}%</span>
          <ChevronUp
            className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180 text-emerald-400" : ""
            }`}
          />
        </button>

        {/* Circular Progress Meter & Smooth Back-To-Top Trigger */}
        <button
          onClick={scrollToTop}
          onMouseEnter={() => setIsExpanded(true)}
          className="relative h-11 w-11 rounded-full bg-slate-950/90 border border-slate-800 flex items-center justify-center text-slate-200 hover:text-emerald-300 shadow-2xl shadow-slate-950/70 hover:border-emerald-500/60 hover:scale-105 active:scale-95 transition-all backdrop-blur-xl group"
          title="Smooth Scroll Back to Top"
          aria-label="Scroll back to top"
        >
          {/* Circular SVG Ring */}
          <svg
            className="absolute inset-0 -rotate-90 pointer-events-none"
            width={size}
            height={size}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(51, 65, 85, 0.4)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#hudNeonGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-75 ease-out"
            />
            <defs>
              <linearGradient id="hudNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="60%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Upward Arrow Icon */}
          <ArrowUp className="h-4 w-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </button>
      </div>
    </aside>
  );
}
