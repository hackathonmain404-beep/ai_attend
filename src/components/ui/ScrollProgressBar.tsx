"use client";

import * as React from "react";

interface ScrollProgressBarProps {
  className?: string;
  showVelocityGlow?: boolean;
}

export function ScrollProgressBar({
  className = "",
  showVelocityGlow = true,
}: ScrollProgressBarProps) {
  const [scrollProgress, setScrollProgress] = React.useState<number>(0);
  const [isScrollingFast, setIsScrollingFast] = React.useState<boolean>(false);
  const lastScrollYRef = React.useRef<number>(0);
  const lastScrollTimeRef = React.useRef<number>(0);
  const velocityTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      const now = performance.now();
      const currentScroll = window.scrollY;
      const totalScroll =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;

      const progress = totalScroll > 0 ? Math.min(Math.max(currentScroll / totalScroll, 0), 1) : 0;
      setScrollProgress(progress);

      // Measure scroll velocity for dynamic cyber flare
      if (showVelocityGlow) {
        const deltaY = Math.abs(currentScroll - lastScrollYRef.current);
        const deltaTime = Math.max(now - lastScrollTimeRef.current, 1);
        const speed = deltaY / deltaTime; // px per ms

        if (speed > 1.2) {
          setIsScrollingFast(true);
          if (velocityTimeoutRef.current) clearTimeout(velocityTimeoutRef.current);
          velocityTimeoutRef.current = setTimeout(() => {
            setIsScrollingFast(false);
          }, 240);
        }
      }

      lastScrollYRef.current = currentScroll;
      lastScrollTimeRef.current = now;
    };

    const onScrollThrottled = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScrollThrottled, { passive: true });
    window.addEventListener("resize", onScrollThrottled, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScrollThrottled);
      window.removeEventListener("resize", onScrollThrottled);
      cancelAnimationFrame(animationFrameId);
      if (velocityTimeoutRef.current) clearTimeout(velocityTimeoutRef.current);
    };
  }, [showVelocityGlow]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 h-[3px] sm:h-[3.5px] pointer-events-none bg-transparent ${className}`}
      aria-hidden="true"
    >
      {/* Background track subtle guide */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />

      {/* Primary animated gradient line */}
      <div
        className={`h-full scroll-progress-line origin-left transition-transform duration-75 ease-out ${
          isScrollingFast ? "brightness-125 filter drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]" : ""
        }`}
        style={{
          transform: `scaleX(${scrollProgress})`,
        }}
      />

      {/* Leading Edge Laser Comet Spark */}
      {scrollProgress > 0.005 && scrollProgress < 0.995 && (
        <div
          className="absolute top-0 h-full w-12 -ml-12 pointer-events-none transition-all duration-75 ease-out flex items-center justify-end"
          style={{
            left: `${scrollProgress * 100}%`,
          }}
        >
          <div
            className={`w-3 h-3 rounded-full bg-white shadow-[0_0_12px_#34d399,0_0_24px_#06b6d4] -mr-1.5 transition-transform duration-150 ${
              isScrollingFast ? "scale-150" : "scale-100"
            }`}
          />
        </div>
      )}
    </div>
  );
}
