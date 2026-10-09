"use client";

import * as React from "react";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  baseRadius: number;
  baseAlpha: number;
  currentOffsetX: number;
  currentOffsetY: number;
}

interface ParticleFieldProps {
  heroRef: React.RefObject<HTMLElement>;
}

export function ParticleField({ heroRef }: ParticleFieldProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const heroEl = heroRef.current;
    if (!canvas || !heroEl) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;

    // Mouse tracking variables (relative to Hero container)
    let mouseTargetX = -1000;
    let mouseTargetY = -1000;
    let mouseCurrentX = -1000;
    let mouseCurrentY = -1000;
    let mouseTargetActive = false;
    let mouseInfluence = 0; // Smooth 0 -> 1 fade

    const particles: Particle[] = [];

    const initDimensions = () => {
      const rect = heroEl.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      createParticles();
    };

    const createParticles = () => {
      particles.length = 0;
      if (width === 0 || height === 0) return;

      const isMobile = width < 768;
      // Dense on desktop, featherlight on mobile
      const count = isMobile ? 18 : Math.min(Math.floor((width * height) / 8500), 140);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxDistFromCenter = Math.hypot(centerX, centerY);

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;

        // Particles near the center are slightly more prominent
        const distCenter = Math.hypot(x - centerX, y - centerY);
        const centerFactor = 1 - Math.min(distCenter / maxDistFromCenter, 0.85);

        particles.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          baseRadius: isMobile ? 1.0 : 1.1 + Math.random() * 0.7,
          baseAlpha: 0.12 + centerFactor * 0.22 + Math.random() * 0.1,
          currentOffsetX: 0,
          currentOffsetY: 0,
        });
      }
    };

    const hasFineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Pointer events scoped directly to the Hero section (desktop fine pointer only)
    const handlePointerMove = (e: PointerEvent) => {
      const rect = heroEl.getBoundingClientRect();
      mouseTargetX = e.clientX - rect.left;
      mouseTargetY = e.clientY - rect.top;
      mouseTargetActive = true;
    };

    const handlePointerEnter = () => {
      mouseTargetActive = true;
    };

    const handlePointerLeave = () => {
      mouseTargetActive = false;
    };

    if (hasFineHover) {
      heroEl.addEventListener("pointermove", handlePointerMove, { passive: true });
      heroEl.addEventListener("pointerenter", handlePointerEnter, { passive: true });
      heroEl.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }

    // Intersection observer to pause rendering when hero is scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !prefersReducedMotion) {
            cancelAnimationFrame(animationFrameId);
            render();
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(heroEl);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      initDimensions();
    });
    resizeObserver.observe(heroEl);

    initDimensions();

    const render = () => {
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerping
      if (mouseTargetActive) {
        if (mouseCurrentX === -1000) {
          mouseCurrentX = mouseTargetX;
          mouseCurrentY = mouseTargetY;
        } else {
          mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.14;
          mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.14;
        }
        mouseInfluence += (1 - mouseInfluence) * 0.1;
      } else {
        mouseInfluence += (0 - mouseInfluence) * 0.08;
      }

      const interactionRadius = 165;
      const connectionDist = 62;

      // 1. Optional subtle cursor interaction aura
      if (mouseInfluence > 0.02) {
        const glowGradient = ctx.createRadialGradient(
          mouseCurrentX,
          mouseCurrentY,
          0,
          mouseCurrentX,
          mouseCurrentY,
          interactionRadius
        );
        glowGradient.addColorStop(0, `rgba(56, 189, 248, ${0.07 * mouseInfluence})`);
        glowGradient.addColorStop(0.5, `rgba(99, 102, 241, ${0.03 * mouseInfluence})`);
        glowGradient.addColorStop(1, "rgba(99, 102, 241, 0)");

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(mouseCurrentX, mouseCurrentY, interactionRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Update and draw particles
      const pLen = particles.length;

      for (let i = 0; i < pLen; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Gentle ambient drift around origin
          p.originX += p.vx;
          p.originY += p.vy;

          if (p.originX < 0) p.originX = width;
          if (p.originX > width) p.originX = 0;
          if (p.originY < 0) p.originY = height;
          if (p.originY > height) p.originY = 0;
        }

        // Calculate distance to mouse
        const dx = p.originX - mouseCurrentX;
        const dy = p.originY - mouseCurrentY;
        const dist = Math.hypot(dx, dy);

        let targetDispX = 0;
        let targetDispY = 0;
        let normFactor = 0;

        if (dist < interactionRadius && mouseInfluence > 0.01) {
          normFactor = (1 - dist / interactionRadius) * mouseInfluence;
          // Subtle gentle repulsion (max 14px)
          const force = normFactor * 14;
          const angle = Math.atan2(dy, dx);
          targetDispX = Math.cos(angle) * force;
          targetDispY = Math.sin(angle) * force;
        }

        // Lerp particle displacement
        p.currentOffsetX += (targetDispX - p.currentOffsetX) * 0.12;
        p.currentOffsetY += (targetDispY - p.currentOffsetY) * 0.12;

        p.x = p.originX + p.currentOffsetX;
        p.y = p.originY + p.currentOffsetY;

        // Smooth bottom fade-out to blend seamlessly with subsequent page sections
        const bottomFadeThreshold = height * 0.72;
        const bottomFade = p.y > bottomFadeThreshold
          ? Math.max(0, 1 - (p.y - bottomFadeThreshold) / (height - bottomFadeThreshold))
          : 1;

        // Dynamic brightness & size
        const radius = p.baseRadius + normFactor * 1.35;
        const alpha = Math.min(p.baseAlpha + normFactor * 0.55, 0.95) * bottomFade;

        if (alpha > 0.005) {
          // Draw particle dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
          ctx.fill();
        }

        // 3. Connect nearby particles with faint lines (futuristic technical mesh)
        for (let j = i + 1; j < pLen; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cDist = Math.hypot(cdx, cdy);

          if (cDist < connectionDist) {
            const p2BottomFade = p2.y > bottomFadeThreshold
              ? Math.max(0, 1 - (p2.y - bottomFadeThreshold) / (height - bottomFadeThreshold))
              : 1;
            const lineBottomFade = Math.min(bottomFade, p2BottomFade);

            const lineFactor = 1 - cDist / connectionDist;
            let lineAlpha = lineFactor * 0.055;

            // Brighten connecting lines if within mouse influence
            if (normFactor > 0.1) {
              lineAlpha += normFactor * 0.18;
            }

            const finalLineAlpha = Math.min(lineAlpha, 0.45) * lineBottomFade;
            if (finalLineAlpha > 0.005) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(147, 197, 253, ${finalLineAlpha})`;
              ctx.lineWidth = 0.75;
              ctx.stroke();
            }
          }
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render();
    } else {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      heroEl.removeEventListener("pointermove", handlePointerMove);
      heroEl.removeEventListener("pointerenter", handlePointerEnter);
      heroEl.removeEventListener("pointerleave", handlePointerLeave);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [heroRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 [mask-image:linear-gradient(to_bottom,black_65%,transparent_98%)]"
      aria-hidden="true"
    />
  );
}
