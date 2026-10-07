"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  scale?: number;
  perspective?: number;
  glareEnable?: boolean;
  glareMaxOpacity?: number;
  glareColor?: string;
  className?: string;
  glowOnHover?: boolean;
  glowColor?: "emerald" | "teal" | "amber" | "rose" | "cyan";
}

export function TiltCard({
  children,
  maxTilt = 10,
  scale = 1.02,
  perspective = 1000,
  glareEnable = true,
  glareMaxOpacity = 0.15,
  glareColor = "rgba(255, 255, 255, 0.3)",
  className,
  glowOnHover = true,
  glowColor = "emerald",
  style,
  ...props
}: TiltCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState<boolean>(false);
  const [glarePos, setGlarePos] = React.useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Cursor position relative to card: -0.5 to 0.5
      const mouseX = (e.clientX - rect.left) / width - 0.5;
      const mouseY = (e.clientY - rect.top) / height - 0.5;

      // Invert Y for natural tilt
      const rotateX = -mouseY * maxTilt * 2;
      const rotateY = mouseX * maxTilt * 2;

      setTilt({ x: rotateX, y: rotateY });
      setGlarePos({
        x: ((e.clientX - rect.left) / width) * 100,
        y: ((e.clientY - rect.top) / height) * 100,
      });
    },
    [maxTilt]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const glowShadowMap = {
    emerald: "hover:shadow-[0_20px_50px_-10px_rgba(5,150,105,0.35)] hover:border-emerald-500/50",
    teal: "hover:shadow-[0_20px_50px_-10px_rgba(20,184,166,0.35)] hover:border-teal-500/50",
    amber: "hover:shadow-[0_20px_50px_-10px_rgba(245,158,11,0.35)] hover:border-amber-500/50",
    rose: "hover:shadow-[0_20px_50px_-10px_rgba(244,63,94,0.35)] hover:border-rose-500/50",
    cyan: "hover:shadow-[0_20px_50px_-10px_rgba(6,182,212,0.35)] hover:border-cyan-500/50",
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative transform-gpu rounded-2xl transition-all will-change-transform select-none",
        isHovered
          ? "duration-75 ease-out"
          : "duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        glowOnHover && glowShadowMap[glowColor],
        className
      )}
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
        transform: isHovered
          ? `perspective(${perspective}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${scale}, ${scale}, ${scale})`
          : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        ...style,
      }}
      {...props}
    >
      {/* 3D Depth Content Wrapper */}
      <div
        className="w-full h-full rounded-2xl relative overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}

        {/* Dynamic Light Sheen / Glare Reflection */}
        {glareEnable && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
            style={{
              opacity: isHovered ? glareMaxOpacity : 0,
              background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, ${glareColor}, transparent 70%)`,
              mixBlendMode: "overlay",
            }}
          />
        )}
      </div>
    </div>
  );
}
