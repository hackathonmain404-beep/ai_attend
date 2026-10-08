"use client";

import * as React from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function ScrollProgressBar() {
  const lineRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (lineRef.current) {
        gsap.to(lineRef.current, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-center gap-2 pointer-events-none"
    >
      {/* Track */}
      <div className="w-[2px] h-28 sm:h-36 rounded-full bg-white/[0.06] overflow-hidden relative backdrop-blur-sm">
        {/* Fill Indicator */}
        <div
          ref={lineRef}
          className="w-full h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-500 origin-top shadow-[0_0_8px_rgba(56,189,248,0.6)]"
          style={{ transform: "scaleY(0)" }}
        />
      </div>
    </div>
  );
}
