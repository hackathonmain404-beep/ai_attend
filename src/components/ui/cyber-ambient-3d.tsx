"use client";

import * as React from "react";

export function CyberAmbient3D() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 3D Perspective Plane Grid */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          perspective: "800px",
          perspectiveOrigin: "50% 20%",
        }}
      >
        <div
          className="absolute inset-x-[-50%] top-0 h-[180%] animate-grid-flow"
          style={{
            transform: "rotateX(68deg) translateZ(-60px)",
            transformOrigin: "50% 0%",
            backgroundImage: `
              linear-gradient(to right, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 80%)",
          }}
        />
      </div>

      {/* Floating 3D Holographic Orbs & Gyro Rings */}
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-glow" />
      <div className="absolute top-40 right-[12%] w-96 h-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse-glow [animation-delay:1.5s]" />
      <div className="absolute bottom-10 left-[25%] w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-glow [animation-delay:3s]" />

      {/* Floating Geometric Wireframe Cube 1 */}
      <div
        className="hidden lg:block absolute top-28 right-[8%] w-24 h-24 opacity-40 animate-float-3d"
        style={{
          perspective: "600px",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="w-full h-full border border-emerald-400/40 rounded-xl animate-spin-3d shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(45deg) rotateY(45deg)",
          }}
        />
      </div>

      {/* Floating Geometric Wireframe Cube 2 */}
      <div
        className="hidden lg:block absolute top-64 left-[5%] w-16 h-16 opacity-30 animate-float-3d [animation-delay:2s]"
        style={{
          perspective: "600px",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="w-full h-full border border-teal-400/40 rounded-lg animate-spin-3d-reverse shadow-[0_0_15px_rgba(20,184,166,0.2)]"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(30deg) rotateY(60deg)",
          }}
        />
      </div>
    </div>
  );
}

export function HolographicHeroShield() {
  return (
    <div
      className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-6 flex items-center justify-center cursor-pointer group"
      style={{ perspective: "1000px" }}
    >
      {/* Outer 3D Gyro Orbit Ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin-slow group-hover:border-emerald-400 transition-colors"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(65deg) rotateZ(0deg)",
        }}
      />

      {/* Counter-rotating Gyro Orbit Ring */}
      <div
        className="absolute inset-1 rounded-full border border-teal-400/40 animate-spin-reverse [animation-duration:14s] group-hover:border-teal-300 transition-colors"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateY(65deg) rotateZ(0deg)",
        }}
      />

      {/* Center 3D Floating Shield Core */}
      <div
        className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[2px] shadow-2xl shadow-emerald-500/30 group-hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:-translate-y-1"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(8deg) rotateY(-8deg) translateZ(15px)",
        }}
      >
        <div className="w-full h-full bg-slate-950/90 rounded-2xl backdrop-blur-md flex items-center justify-center relative overflow-hidden">
          {/* Laser Sheen Sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

          {/* Shield Icon */}
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 group-hover:text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-transform duration-500 group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* Floating 3D Corner Sparks */}
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-60" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75 [animation-delay:1s]" />
    </div>
  );
}
