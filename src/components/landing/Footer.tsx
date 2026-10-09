"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, ArrowUpRight, Github, Mail } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Command Center", href: "/login" },
  { label: "Security", href: "#security" },
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "Documentation", href: "/login" },
  { label: "API Reference", href: "/api/health", isExternal: true },
  { label: "Security Overview", href: "#security" },
  { label: "System Status", href: "/api/health", isExternal: true },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: "About", href: "#security" },
  { label: "Contact", href: "mailto:contact@attendguard.edu" },
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
];

export function Footer() {
  const footerRef = React.useRef<HTMLElement>(null);
  const glowRef = React.useRef<HTMLDivElement>(null);
  const brandColRef = React.useRef<HTMLDivElement>(null);
  const navColRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const bottomBarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Glow intensifies as user scrolls toward footer
      if (glowRef.current && footerRef.current) {
        gsap.fromTo(
          glowRef.current,
          { opacity: 0.1, scale: 0.8 },
          {
            opacity: 0.45,
            scale: 1.1,
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 92%",
              end: "bottom bottom",
              scrub: 1,
            },
          }
        );
      }

      // Brand column & status indicator reveal
      if (brandColRef.current && footerRef.current) {
        gsap.fromTo(
          brandColRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 88%",
              once: true,
            },
          }
        );
      }

      // Staggered reveal of Product, Resources, and Company columns
      const navCols = navColRefs.current.filter(Boolean);
      if (navCols.length > 0 && footerRef.current) {
        gsap.fromTo(
          navCols,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            delay: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 88%",
              once: true,
            },
          }
        );
      }

      // Bottom bar reveal
      if (bottomBarRef.current && footerRef.current) {
        gsap.fromTo(
          bottomBarRef.current,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: 0.25,
            ease: "power2.out",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-transparent border-t border-white/[0.08] pt-16 sm:pt-24 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] overflow-hidden text-zinc-400 z-10"
    >
      {/* Restrained Ambient Radial Blue/Violet Glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute top-0 left-4 sm:left-12 w-[300px] sm:w-[600px] h-[200px] sm:h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.12)_0%,_rgba(37,99,235,0.08)_40%,_transparent_72%)] pointer-events-none select-none blur-2xl sm:blur-3xl will-change-transform"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 sm:pb-16">
          {/* Brand Column (Span 5 on Desktop) */}
          <div
            ref={brandColRef}
            className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-8 will-change-transform"
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 group-hover:text-blue-300 transition-colors shadow-sm">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                  AttendGuard
                </span>
                <span className="text-[10px] uppercase font-mono font-medium tracking-wider px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400 bg-zinc-900/60">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Tagline */}
            <p className="text-sm font-medium text-zinc-200 mt-3 sm:mt-4 tracking-tight">
              Secure attendance. Trusted presence.
            </p>

            {/* Platform Description */}
            <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed font-normal">
              A cryptographically secured attendance platform designed to make campus attendance verifiable, device-bound, and resistant to proxy submissions.
            </p>

            {/* Operational Status Indicator */}
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/70 border border-zinc-800/80 text-[11px] font-mono text-zinc-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-zinc-300">Systems Operational</span>
            </div>
          </div>

          {/* Navigation Categories Container (2 columns on mobile, 3 on tablet/desktop) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Product Column */}
            <div
              ref={(el) => {
                navColRefs.current[0] = el;
              }}
              className="flex flex-col gap-3 will-change-transform"
            >
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Product
              </h3>
              <ul className="flex flex-col gap-1.5">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 py-1.5 text-xs text-zinc-400 hover:text-white transition-all duration-150 focus:outline-none focus-visible:text-white focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && (
                        <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div
              ref={(el) => {
                navColRefs.current[1] = el;
              }}
              className="flex flex-col gap-3 will-change-transform"
            >
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Resources
              </h3>
              <ul className="flex flex-col gap-1.5">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 py-1.5 text-xs text-zinc-400 hover:text-white transition-all duration-150 focus:outline-none focus-visible:text-white focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && (
                        <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div
              ref={(el) => {
                navColRefs.current[2] = el;
              }}
              className="flex flex-col gap-3 col-span-2 sm:col-span-1 will-change-transform"
            >
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Company
              </h3>
              <ul className="flex flex-col gap-1.5">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 py-1.5 text-xs text-zinc-400 hover:text-white transition-all duration-150 focus:outline-none focus-visible:text-white focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && (
                        <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div
          ref={bottomBarRef}
          className="pt-6 sm:pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-zinc-500 will-change-transform text-center sm:text-left"
        >
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span>© 2026 AttendGuard</span>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <span className="font-mono text-[11px] text-zinc-400">
              Systems Operational
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 text-zinc-500">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub Repository"
              className="hover:text-zinc-300 transition-colors p-2 -m-1"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="mailto:security@attendguard.edu"
              aria-label="Security Contact Email"
              className="hover:text-zinc-300 transition-colors p-2 -m-1"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
