"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "subtle";
  maxOffset?: number; // max displacement in px (4-8px)
  ariaLabel?: string;
}

export function MagneticButton({
  children,
  href,
  onClick,
  className = "",
  variant = "primary",
  maxOffset = 6,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 18, stiffness: 180, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Constrain to maximum offset of 4-8px
    const offsetX = Math.max(Math.min((distanceX / (rect.width / 2)) * maxOffset, maxOffset), -maxOffset);
    const offsetY = Math.max(Math.min((distanceY / (rect.height / 2)) * maxOffset, maxOffset), -maxOffset);

    x.set(offsetX);
    y.set(offsetY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variantStyles = {
    primary:
      "bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_24px_-4px_rgba(37,99,235,0.45)] hover:shadow-[0_0_36px_-2px_rgba(37,99,235,0.65)] border border-blue-400/30",
    secondary:
      "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 shadow-sm",
    subtle:
      "bg-transparent text-zinc-400 hover:text-zinc-200 border-transparent",
  };

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center select-none transition-colors duration-200 cursor-pointer rounded-xl ${variantStyles[variant]} ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
    >
      {content}
    </button>
  );
}
