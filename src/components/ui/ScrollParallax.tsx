"use client";

import * as React from "react";

interface ScrollParallaxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  speed?: number; // e.g. -0.2 (moves slower/opposite) or 0.2
  maxOffset?: number; // max px displacement
  className?: string;
}

export function ScrollParallax({
  children,
  speed = 0.15,
  maxOffset = 100,
  className = "",
  style,
  ...props
}: ScrollParallaxProps) {
  const [offsetY, setOffsetY] = React.useState<number>(0);
  const elementRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number;

    const onScroll = () => {
      const node = elementRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Only calculate if visible or near viewport
      if (rect.bottom >= -100 && rect.top <= viewportHeight + 100) {
        const centerDistance = rect.top + rect.height / 2 - viewportHeight / 2;
        const calculated = Math.min(
          Math.max(centerDistance * speed, -maxOffset),
          maxOffset
        );
        setOffsetY(calculated);
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(onScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [speed, maxOffset]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: `translate3d(0, ${offsetY}px, 0)`,
        transition: "transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
