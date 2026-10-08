"use client";

import * as React from "react";

export type ScrollAnimationType =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "flip-up"
  | "blur-reveal";

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animation?: ScrollAnimationType;
  delay?: number; // milliseconds
  duration?: number; // milliseconds
  threshold?: number;
  once?: boolean;
  distance?: number; // px for translations
  className?: string;
}

export function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 650,
  threshold = 0.12,
  distance = 28,
  once = true,
  className = "",
  style,
  ...props
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const elementRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Respect user motion preferences
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const node = elementRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  // Compute CSS transform based on animation type
  const getInitialTransform = (): string => {
    switch (animation) {
      case "fade-up":
        return `translate3d(0, ${distance}px, 0)`;
      case "fade-down":
        return `translate3d(0, -${distance}px, 0)`;
      case "fade-left":
        return `translate3d(-${distance + 6}px, 0, 0)`;
      case "fade-right":
        return `translate3d(${distance + 6}px, 0, 0)`;
      case "zoom-in":
        return "scale3d(0.92, 0.92, 1) translate3d(0, 10px, 0)";
      case "flip-up":
        return "perspective(800px) rotateX(12deg) translate3d(0, 20px, 0)";
      case "blur-reveal":
        return `translate3d(0, ${distance / 2}px, 0) scale3d(0.98, 0.98, 1)`;
      default:
        return `translate3d(0, ${distance}px, 0)`;
    }
  };

  const currentTransform = isVisible
    ? "translate3d(0, 0, 0) scale3d(1, 1, 1) rotateX(0deg)"
    : getInitialTransform();

  const currentFilter =
    animation === "blur-reveal"
      ? isVisible
        ? "blur(0px)"
        : "blur(6px)"
      : undefined;

  const transitionStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: currentTransform,
    filter: currentFilter,
    transitionProperty: "opacity, transform, filter",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    transitionDelay: `${delay}ms`,
    willChange: isVisible ? "auto" : "opacity, transform, filter",
    ...style,
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={transitionStyle}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ScrollStagger wraps multiple children and renders them with cascaded ScrollReveal delays.
 */
interface ScrollStaggerProps {
  children: React.ReactNode[];
  animation?: ScrollAnimationType;
  staggerInterval?: number; // ms
  baseDelay?: number; // ms
  className?: string;
  itemClassName?: string;
}

export function ScrollStagger({
  children,
  animation = "fade-up",
  staggerInterval = 90,
  baseDelay = 0,
  className = "",
  itemClassName = "",
}: ScrollStaggerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <ScrollReveal
          animation={animation}
          delay={baseDelay + index * staggerInterval}
          className={itemClassName}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
