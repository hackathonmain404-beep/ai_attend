"use client";

import * as React from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface CyberNetworkCanvasProps {
  isLoaded?: boolean;
  className?: string;
}

/**
 * Tunable Network Animation Configuration
 * Adjust parameters here to control density, connection limits, and pacing.
 */
const CONFIG = {
  // Density per viewport profile
  nodeCountDesktop: 70,
  nodeCountTablet: 44,
  nodeCountMobile: 26,

  // Floating particles (dust/ambient depth)
  particleCountDesktop: 28,
  particleCountMobile: 12,

  // Connection distances (px)
  maxDistanceDesktop: 140,
  maxDistanceTablet: 120,
  maxDistanceMobile: 90,

  // Pacing
  baseSpeed: 0.28,
  packetSpeed: 0.012,

  // Opacity & colors
  lineBaseAlpha: 0.16,
  nodeGlowColor: "rgba(56, 189, 248, 0.45)", // Sky/cyan glow
  lineColorPrimary: "59, 130, 246", // Blue rgb
  lineColorCyan: "6, 182, 212", // Cyan rgb
};

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  glowColor: string;
  isFocal: boolean;
  pulsePhase: number;
  pulseSpeed: number;
  depth: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

export function CyberNetworkCanvas({ isLoaded = true, className = "" }: CyberNetworkCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll-reactive controller values tweened by GSAP ScrollTrigger
    const controller = {
      entranceAlpha: 0,
      scrollAlpha: 1,
      lineBrightness: 1,
      packetActivity: 1,
      parallaxOffset: 0,
      focalGlowMultiplier: 1,
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animFrameId: number | null = null;
    let isVisible = true;

    let nodes: NetworkNode[] = [];
    let particles: AmbientParticle[] = [];
    let packets: DataPacket[] = [];
    let activeConnections: [number, number, number][] = []; // [i, j, dist]

    // Determine counts based on viewport
    function getCounts() {
      const w = window.innerWidth;
      if (w < 768) {
        return {
          nodeCount: CONFIG.nodeCountMobile,
          particleCount: CONFIG.particleCountMobile,
          maxDist: CONFIG.maxDistanceMobile,
          packetLimit: 3,
        };
      }
      if (w < 1024) {
        return {
          nodeCount: CONFIG.nodeCountTablet,
          particleCount: Math.round(CONFIG.particleCountDesktop * 0.6),
          maxDist: CONFIG.maxDistanceTablet,
          packetLimit: 4,
        };
      }
      return {
        nodeCount: CONFIG.nodeCountDesktop,
        particleCount: CONFIG.particleCountDesktop,
        maxDist: CONFIG.maxDistanceDesktop,
        packetLimit: 6,
      };
    }

    // Color choices for nodes
    const nodePalette = [
      { color: "#e0f2fe", glow: "rgba(56, 189, 248, 0.75)" }, // Ice cyan
      { color: "#93c5fd", glow: "rgba(59, 130, 246, 0.65)" }, // Electric blue
      { color: "#60a5fa", glow: "rgba(37, 99, 235, 0.55)" }, // Deep blue
      { color: "#ffffff", glow: "rgba(255, 255, 255, 0.85)" }, // Pure white spark
    ];

    function initNetwork() {
      const rect = containerRef.current?.getBoundingClientRect();
      width = Math.ceil(rect?.width || window.innerWidth);
      height = Math.ceil(rect?.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = "100%";
      canvas!.style.height = "100%";

      if (ctx) {
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }

      const { nodeCount, particleCount, packetLimit } = getCounts();

      // Initialize Nodes
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const isFocal = i % 7 === 0;
        const palette = nodePalette[i % nodePalette.length];
        const depth = isFocal ? 1.15 : 0.7 + Math.random() * 0.5;
        const baseRadius = isFocal ? 2.6 : 1.2 + Math.random() * 1.2;
        const baseAlpha = isFocal ? 0.85 : 0.4 + Math.random() * 0.4;

        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * CONFIG.baseSpeed * (depth * 0.8),
          vy: (Math.random() - 0.5) * CONFIG.baseSpeed * (depth * 0.8),
          baseRadius,
          radius: baseRadius,
          baseAlpha,
          alpha: baseAlpha,
          color: palette.color,
          glowColor: palette.glow,
          isFocal,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          depth,
        });
      }

      // Initialize Ambient Floating Dust Particles
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.15 - Math.random() * 0.2, // Slow upward drift
          radius: 0.6 + Math.random() * 0.8,
          alpha: 0.12 + Math.random() * 0.25,
        });
      }

      // Initialize Data Packets
      packets = [];
      for (let i = 0; i < packetLimit; i++) {
        const from = Math.floor(Math.random() * nodeCount);
        let to = (from + 1) % nodeCount;
        packets.push({
          fromNode: from,
          toNode: to,
          progress: Math.random(),
          speed: CONFIG.packetSpeed * (0.8 + Math.random() * 0.5),
          color: i % 2 === 0 ? "#38bdf8" : "#93c5fd",
          size: 1.8 + Math.random() * 1.2,
        });
      }
    }

    initNetwork();

    // Resize handler
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initNetwork();
      }, 150);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Tab visibility handler to avoid battery drain when tab is hidden
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !animFrameId && !prefersReducedMotion) {
        renderLoop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // =========================================================================
    // GSAP ScrollTrigger Section Integration
    // Coordinates network illumination and parallax with landing page sections
    // =========================================================================
    gsap.registerPlugin(ScrollTrigger);

    const gsapCtx = gsap.context(() => {
      // 1. Entrance fade-in when loader finishes (affects entranceAlpha only)
      gsap.to(controller, {
        entranceAlpha: 1,
        duration: 1.2,
        ease: "power2.out",
        delay: isLoaded ? 0.1 : 0.4,
      });

      if (!prefersReducedMotion) {
        // 2. Deterministic, unified scroll reactivity across the entire page
        const updateScrollState = (progress: number) => {
          const p = Math.max(0, Math.min(1, progress));
          controller.parallaxOffset = p * 60;

          // Technical data packet & brightness peak in middle sections
          const mid = Math.sin(p * Math.PI);
          controller.lineBrightness = 1 + mid * 0.35;
          controller.packetActivity = 1 + mid * 0.6;
          controller.focalGlowMultiplier = 1 + mid * 0.3;

          // Subtly soften network into the deep background only near footer
          // Crucially: for all p <= 0.88 (and strictly at top p === 0), scrollAlpha is 1.0!
          if (p > 0.88) {
            controller.scrollAlpha = 1 - ((p - 0.88) / 0.12) * 0.45;
          } else {
            controller.scrollAlpha = 1.0;
          }
        };

        ScrollTrigger.create({
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => updateScrollState(self.progress),
          onRefresh: (self) => updateScrollState(self.progress),
        });

        // Initialize state for current scroll position
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        updateScrollState(currentProgress);
      }
    }, containerRef);

    if (isLoaded) {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }

    // =========================================================================
    // Core HTML Canvas Rendering Engine
    // =========================================================================
    function drawFrame() {
      if (!ctx) return;

      ctx.clearRect(0, 0, width + 2, height + 2);

      const currentGlobalAlpha = controller.entranceAlpha * controller.scrollAlpha;
      if (currentGlobalAlpha <= 0.01) return;

      const { maxDist } = getCounts();
      const parallaxY = controller.parallaxOffset;

      // 1. Draw Subtle Multi-Point Ambient Nebula Blooms behind clusters (pure circular arcs, no sharp rectangular edges)
      if (nodes.length > 5) {
        const focal1 = nodes[0];
        const focal2 = nodes[Math.floor(nodes.length / 2)];

        if (focal1) {
          const fy1 = focal1.y + parallaxY * 0.4;
          const grad1 = ctx.createRadialGradient(
            focal1.x,
            fy1,
            0,
            focal1.x,
            fy1,
            240
          );
          grad1.addColorStop(0, `rgba(37, 99, 235, ${0.12 * currentGlobalAlpha * controller.focalGlowMultiplier})`);
          grad1.addColorStop(0.6, `rgba(6, 182, 212, ${0.04 * currentGlobalAlpha})`);
          grad1.addColorStop(1, "rgba(2, 4, 10, 0)");
          ctx.fillStyle = grad1;
          ctx.beginPath();
          ctx.arc(focal1.x, fy1, 240, 0, Math.PI * 2);
          ctx.fill();
        }

        if (focal2) {
          const fy2 = focal2.y + parallaxY * 0.5;
          const grad2 = ctx.createRadialGradient(
            focal2.x,
            fy2,
            0,
            focal2.x,
            fy2,
            280
          );
          grad2.addColorStop(0, `rgba(59, 130, 246, ${0.09 * currentGlobalAlpha})`);
          grad2.addColorStop(0.7, `rgba(99, 102, 241, ${0.03 * currentGlobalAlpha})`);
          grad2.addColorStop(1, "rgba(2, 4, 10, 0)");
          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(focal2.x, fy2, 280, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw Ambient Floating Dust Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const renderY = p.y + parallaxY * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, renderY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.alpha * currentGlobalAlpha})`;
        ctx.fill();
      }

      // 3. Update Nodes & Calculate Connections
      activeConnections = [];
      const nodeCount = nodes.length;

      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          // Bounce gently within borders
          if (node.x <= 0 || node.x >= width) node.vx *= -1;
          if (node.y <= 0 || node.y >= height) node.vy *= -1;

          // Periodic gentle pulse
          node.pulsePhase += node.pulseSpeed;
          node.alpha =
            node.baseAlpha + Math.sin(node.pulsePhase) * (node.isFocal ? 0.22 : 0.12);
        }

        // Test connections against later nodes
        for (let j = i + 1; j < nodeCount; j++) {
          const other = nodes[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            activeConnections.push([i, j, dist]);

            const factor = 1 - dist / maxDist;
            const lineAlpha =
              factor *
              CONFIG.lineBaseAlpha *
              currentGlobalAlpha *
              controller.lineBrightness;

            const renderY1 = node.y + parallaxY * node.depth * 0.4;
            const renderY2 = other.y + parallaxY * other.depth * 0.4;

            ctx.beginPath();
            ctx.moveTo(node.x, renderY1);
            ctx.lineTo(other.x, renderY2);

            const isCyanConnection = (i + j) % 3 === 0;
            const colorRgb = isCyanConnection ? CONFIG.lineColorCyan : CONFIG.lineColorPrimary;

            ctx.strokeStyle = `rgba(${colorRgb}, ${lineAlpha})`;
            ctx.lineWidth = factor > 0.6 ? 1.0 : 0.65;
            ctx.stroke();
          }
        }
      }

      // 4. Draw Traveling Data Packets along active edges
      if (!prefersReducedMotion && activeConnections.length > 0) {
        for (let k = 0; k < packets.length; k++) {
          const pkt = packets[k];
          pkt.progress += pkt.speed * controller.packetActivity;

          // If finished, pick a new connected edge
          if (pkt.progress >= 1) {
            pkt.progress = 0;
            const randomConn =
              activeConnections[Math.floor(Math.random() * activeConnections.length)];
            if (randomConn) {
              pkt.fromNode = randomConn[0];
              pkt.toNode = randomConn[1];
            }
          }

          const from = nodes[pkt.fromNode];
          const to = nodes[pkt.toNode];

          if (from && to) {
            const curX = from.x + (to.x - from.x) * pkt.progress;
            const curY =
              from.y +
              (to.y - from.y) * pkt.progress +
              parallaxY * ((from.depth + to.depth) / 2) * 0.4;

            // Packet glow head
            ctx.beginPath();
            ctx.arc(curX, curY, pkt.size, 0, Math.PI * 2);
            ctx.fillStyle = pkt.color;
            ctx.shadowColor = pkt.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for performance
          }
        }
      }

      // 5. Draw Glowing Nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];
        const renderY = node.y + parallaxY * node.depth * 0.4;
        const finalAlpha = Math.max(0, Math.min(1, node.alpha * currentGlobalAlpha));

        // Focal Halo Glow
        if (node.isFocal) {
          ctx.beginPath();
          ctx.arc(node.x, renderY, node.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${0.18 * finalAlpha * controller.focalGlowMultiplier})`;
          ctx.fill();
        }

        // Inner Sharp Node Core
        ctx.beginPath();
        ctx.arc(node.x, renderY, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = finalAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Animation Loop
    function renderLoop() {
      if (!isVisible) {
        animFrameId = null;
        return;
      }

      drawFrame();

      if (!prefersReducedMotion) {
        animFrameId = requestAnimationFrame(renderLoop);
      }
    }

    // Start rendering
    if (prefersReducedMotion) {
      controller.entranceAlpha = 1;
      controller.scrollAlpha = 1;
      drawFrame();
    } else {
      renderLoop();
    }

    // Cleanup on unmount
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      gsapCtx.revert();
    };
  }, [isLoaded]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#02040a] ${className}`}
    >
      {/* 1. Underlying Radial Gradient Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none block will-change-transform"
      />

      {/* 2. Stitch-Inspired Technical Matrix Texture Overlay */}
      <div
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-40 mix-blend-screen"
      />

      {/* 3. Perimeter Cinematic Vignette Framing */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,_transparent_45%,_rgba(2,4,10,0.75)_100%)]"
      />
    </div>
  );
}
